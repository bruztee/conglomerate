import { Env } from '../../types';
import { requireAdmin } from '../../middleware/adminAuth';
import { jsonResponse, errorResponse } from '../../utils/response';
import { createServiceSupabaseClient } from '../../utils/supabase';
import { logAudit } from '../../utils/audit';

/**
 * GET /admin/withdrawals
 * Отримати всі виводи (pending першими, потім історія)
 */
export async function handleGetWithdrawals(request: Request, env: Env): Promise<Response> {
  const adminCheck = await requireAdmin(request, env);
  if (!adminCheck.isAdmin) {
    return adminCheck.error!;
  }

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status'); // requested, approved, sent, rejected, all

    const supabase = createServiceSupabaseClient(env);

    let query = supabase
      .from('withdrawals')
      .select(`
        *,
        investments!inner(
          user_id,
          deposit_id,
          principal,
          accrued_interest,
          locked_amount,
          profiles!investments_user_id_fkey(id, email, full_name, phone)
        )
      `);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Requested першими, потім по даті
    const { data: withdrawals, error } = await query
      .order('status', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch withdrawals:', error);
      return errorResponse('DATABASE_ERROR', 'Failed to fetch withdrawals', 500);
    }

    return jsonResponse({ withdrawals: withdrawals || [] });
  } catch (error: any) {
    console.error('Get withdrawals error:', error);
    return errorResponse('SERVER_ERROR', error.message, 500);
  }
}

/**
 * POST /admin/withdrawals/:withdrawalId/approve
 * Підтвердити вивід (тільки комісія мережі, без мінімальної суми)
 */
export async function handleApproveWithdrawal(request: Request, env: Env, withdrawalId: string): Promise<Response> {
  console.log('[APPROVE_WITHDRAWAL] Starting for withdrawal:', withdrawalId);
  const adminCheck = await requireAdmin(request, env);
  if (!adminCheck.isAdmin) {
    return adminCheck.error!;
  }

  try {
    const body = await request.json() as {
      admin_note?: string;
      network_fee?: number;
    };
    console.log('[APPROVE_WITHDRAWAL] Request body:', JSON.stringify(body));

    const supabase = createServiceSupabaseClient(env);

    console.log('[APPROVE_WITHDRAWAL] Fetching withdrawal...');
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('id', withdrawalId)
      .single();

    if (fetchError || !withdrawal) {
      console.error('[APPROVE_WITHDRAWAL] Withdrawal not found:', fetchError);
      return errorResponse('NOT_FOUND', 'Withdrawal not found', 404);
    }
    console.log('[APPROVE_WITHDRAWAL] Withdrawal found, investment_id:', withdrawal.investment_id, 'status:', withdrawal.status);

    if (withdrawal.status !== 'requested') {
      console.log('[APPROVE_WITHDRAWAL] Invalid status:', withdrawal.status);
      return errorResponse('VALIDATION_ERROR', 'Withdrawal is not pending approval', 400);
    }

    if (!withdrawal.investment_id) {
      console.error('[APPROVE_WITHDRAWAL] No investment_id in withdrawal');
      return errorResponse('VALIDATION_ERROR', 'Withdrawal has no investment_id', 400);
    }

    console.log('[APPROVE_WITHDRAWAL] Fetching investment with id:', withdrawal.investment_id);
    const { data: investment, error: invError } = await supabase
      .from('investments')
      .select('id, principal, accrued_interest, locked_amount, status, deposit_id')
      .eq('id', withdrawal.investment_id)
      .single();

    if (invError || !investment) {
      console.error('[APPROVE_WITHDRAWAL] Investment not found, error:', invError);
      return errorResponse('NOT_FOUND', 'Investment not found', 404);
    }
    console.log('[APPROVE_WITHDRAWAL] Investment found:', investment.id, 'principal:', investment.principal, 'locked:', investment.locked_amount);

    const withdrawalAmount = Number(withdrawal.amount);
    const currentPrincipal = Number(investment.principal);
    const currentAccrued = Number(investment.accrued_interest);
    const currentLocked = Number(investment.locked_amount);

    console.log('[APPROVE_WITHDRAWAL] Amounts - withdrawal:', withdrawalAmount, 'principal:', currentPrincipal, 'accrued:', currentAccrued, 'locked:', currentLocked);

    // 3. Перевірка: locked_amount >= withdrawal.amount
    if (currentLocked < withdrawalAmount) {
      console.error('[APPROVE_WITHDRAWAL] Insufficient locked amount');
      return errorResponse('VALIDATION_ERROR', `Locked amount (${currentLocked}) is less than withdrawal amount (${withdrawalAmount})`, 400);
    }
    
    // 4. СПОЧАТКУ знімаємо з accrued_interest (профіт), ПОТІМ з principal (тіло)
    let remainingToWithdraw = withdrawalAmount;
    let newAccrued = currentAccrued;
    let newPrincipal = currentPrincipal;
    
    // 4.1. Знімаємо з profit
    let withdrawnProfit = 0;
    if (remainingToWithdraw > 0 && newAccrued > 0) {
      withdrawnProfit = Math.min(remainingToWithdraw, newAccrued);
      newAccrued -= withdrawnProfit;
      remainingToWithdraw -= withdrawnProfit;
      console.log('[APPROVE_WITHDRAWAL] Deducted from profit:', withdrawnProfit, 'remaining:', remainingToWithdraw);
    }
    
    // 4.2. Знімаємо з principal
    let withdrawnPrincipal = 0;
    if (remainingToWithdraw > 0 && newPrincipal > 0) {
      withdrawnPrincipal = Math.min(remainingToWithdraw, newPrincipal);
      newPrincipal -= withdrawnPrincipal;
      remainingToWithdraw -= withdrawnPrincipal;
      console.log('[APPROVE_WITHDRAWAL] Deducted from principal:', withdrawnPrincipal, 'remaining:', remainingToWithdraw);
    }
    
    // 4.3. Перевірка що вистачило коштів
    if (remainingToWithdraw > 0.01) {
      console.error('[APPROVE_WITHDRAWAL] Insufficient funds: still need', remainingToWithdraw);
      return errorResponse('VALIDATION_ERROR', `Insufficient funds in investment. Available: ${currentPrincipal + currentAccrued}, Requested: ${withdrawalAmount}`, 400);
    }

    // 5. Зменшити locked_amount
    const newLocked = Math.max(0, currentLocked - withdrawalAmount);

    // 6. Визначити новий статус investment
    let newStatus: string = investment.status;
    if (newPrincipal <= 0.01 && newAccrued <= 0.01) {
      newStatus = 'closed';
    } else if (investment.status === 'closing' && newLocked === 0) {
      // Якщо був closing але вивід не повний - повернути в active
      newStatus = 'active';
    }

    // 7. Оновити investment
    const investmentUpdate: any = {
      principal: newPrincipal,
      accrued_interest: newAccrued,
      locked_amount: newLocked,
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === 'closed') {
      investmentUpdate.closed_at = new Date().toISOString();
    }

    const { error: updateInvError } = await supabase
      .from('investments')
      .update(investmentUpdate)
      .eq('id', investment.id);

    if (updateInvError) {
      console.error('Failed to update investment:', updateInvError);
      return errorResponse('DATABASE_ERROR', 'Failed to update investment', 500);
    }

    // 7.5. Якщо investment закрито, оновити deposit status на 'withdrawn'
    if (newStatus === 'closed' && investment.deposit_id) {
      console.log('[APPROVE_WITHDRAWAL] Investment closed, updating deposit status to withdrawn');
      const { error: depositUpdateError } = await supabase
        .from('deposits')
        .update({ status: 'withdrawn', updated_at: new Date().toISOString() })
        .eq('id', investment.deposit_id);
      
      if (depositUpdateError) {
        console.error('[APPROVE_WITHDRAWAL] Failed to update deposit status:', depositUpdateError);
        // Не фейлимо весь процес, тільки логуємо
      } else {
        console.log('[APPROVE_WITHDRAWAL] Deposit status updated to withdrawn');
      }
    }

    // 8. Оновити withdrawal status
    const { error: updateError } = await supabase
      .from('withdrawals')
      .update({
        status: 'approved',
        processed_at: new Date().toISOString(),
        admin_id: adminCheck.userId,
        admin_note: body.admin_note || null,
        network_fee: body.network_fee || 0,
      })
      .eq('id', withdrawalId);

    if (updateError) {
      console.error('Failed to approve withdrawal:', updateError);
      return errorResponse('DATABASE_ERROR', 'Failed to approve withdrawal', 500);
    }

    await logAudit(env, adminCheck.userId!, 'admin.withdrawal.approve', 'withdrawals', withdrawalId, { 
      ...body,
      withdrawn_principal: withdrawnPrincipal,
      withdrawn_profit: withdrawnProfit,
      investment_closed: newStatus === 'closed',
    }, request);

    console.log('[APPROVE_WITHDRAWAL] Success - withdrawn profit:', withdrawnProfit, 'principal:', withdrawnPrincipal, 'new status:', newStatus);
    return jsonResponse({ success: true, message: 'Withdrawal approved' });
  } catch (error: any) {
    console.error('Approve withdrawal error:', error);
    return errorResponse('SERVER_ERROR', error.message, 500);
  }
}

/**
 * POST /admin/withdrawals/:withdrawalId/reject
 * Відхилити вивід
 */
export async function handleRejectWithdrawal(request: Request, env: Env, withdrawalId: string): Promise<Response> {
  const adminCheck = await requireAdmin(request, env);
  if (!adminCheck.isAdmin) {
    return adminCheck.error!;
  }

  try {
    const body = await request.json() as {
      admin_note: string;
    };

    if (!body.admin_note) {
      return errorResponse('VALIDATION_ERROR', 'Admin note is required for rejection', 400);
    }

    const supabase = createServiceSupabaseClient(env);

    // 1. Отримати withdrawal
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('id', withdrawalId)
      .single();

    if (fetchError || !withdrawal) {
      return errorResponse('NOT_FOUND', 'Withdrawal not found', 404);
    }

    if (withdrawal.status !== 'requested') {
      return errorResponse('VALIDATION_ERROR', 'Withdrawal is not pending approval', 400);
    }

    if (!withdrawal.investment_id) {
      return errorResponse('VALIDATION_ERROR', 'Withdrawal has no investment_id', 400);
    }

    // 2. Отримати investment
    const { data: investment, error: invError } = await supabase
      .from('investments')
      .select('id, locked_amount, status')
      .eq('id', withdrawal.investment_id)
      .single();

    if (invError || !investment) {
      return errorResponse('NOT_FOUND', 'Investment not found', 404);
    }

    // 3. Зменшити locked_amount
    const currentLocked = Number(investment.locked_amount);
    const newLocked = Math.max(0, currentLocked - Number(withdrawal.amount));

    // 4. Визначити новий статус: якщо був closing і locked=0 -> повернути в active
    let newStatus = investment.status;
    if (investment.status === 'closing' && newLocked === 0) {
      newStatus = 'active';
    }

    // 5. Оновити investment
    const { error: updateInvError } = await supabase
      .from('investments')
      .update({
        locked_amount: newLocked,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', investment.id);

    if (updateInvError) {
      console.error('Failed to update investment:', updateInvError);
      return errorResponse('DATABASE_ERROR', 'Failed to unlock investment', 500);
    }

    const { error: updateError } = await supabase
      .from('withdrawals')
      .update({
        status: 'rejected',
        processed_at: new Date().toISOString(),
        admin_id: adminCheck.userId,
        admin_note: body.admin_note,
      })
      .eq('id', withdrawalId);

    if (updateError) {
      console.error('Failed to reject withdrawal:', updateError);
      return errorResponse('DATABASE_ERROR', 'Failed to reject withdrawal', 500);
    }

    await logAudit(env, adminCheck.userId!, 'admin.withdrawal.reject', 'withdrawals', withdrawalId, body, request);

    return jsonResponse({ success: true, message: 'Withdrawal rejected' });
  } catch (error: any) {
    console.error('Reject withdrawal error:', error);
    return errorResponse('SERVER_ERROR', error.message, 500);
  }
}

/**
 * POST /admin/withdrawals/:withdrawalId/mark-sent
 * Позначити вивід як відправлений
 */
export async function handleMarkWithdrawalSent(request: Request, env: Env, withdrawalId: string): Promise<Response> {
  const adminCheck = await requireAdmin(request, env);
  if (!adminCheck.isAdmin) {
    return adminCheck.error!;
  }

  try {
    const body = await request.json() as {
      tx_hash?: string; // Transaction hash
      admin_note?: string;
    };

    const supabase = createServiceSupabaseClient(env);

    const { error: updateError } = await supabase
      .from('withdrawals')
      .update({
        status: 'sent',
        admin_note: body.admin_note || null,
      })
      .eq('id', withdrawalId)
      .eq('status', 'approved');

    if (updateError) {
      console.error('Failed to mark withdrawal as sent:', updateError);
      return errorResponse('DATABASE_ERROR', 'Failed to update withdrawal', 500);
    }

    await logAudit(env, adminCheck.userId!, 'admin.withdrawal.mark_sent', 'withdrawals', withdrawalId, body, request);

    return jsonResponse({ success: true, message: 'Withdrawal marked as sent' });
  } catch (error: any) {
    console.error('Mark withdrawal sent error:', error);
    return errorResponse('SERVER_ERROR', error.message, 500);
  }
}
