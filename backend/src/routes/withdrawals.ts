import type { Env } from '../types';
import { createServiceSupabaseClient } from '../utils/supabase';
import { jsonResponse, errorResponse } from '../utils/response';
import { requireAuth, requireAdmin } from '../utils/auth';
import { logAudit } from '../utils/audit';

export async function handleCreateWithdrawal(request: Request, env: Env): Promise<Response> {
  console.log('[CREATE_WITHDRAWAL] Starting...');
  try {
    const user = await requireAuth(request, env);
    console.log('[CREATE_WITHDRAWAL] User authenticated:', user.id);
    
    const body = await request.json() as { 
      amount: number; 
      destination: any;
      selected_deposit_id?: string;
    };
    console.log('[CREATE_WITHDRAWAL] Request body:', JSON.stringify({ amount: body.amount, has_destination: !!body.destination, selected_deposit_id: body.selected_deposit_id }));
    
    if (!body.amount || body.amount <= 0) {
      console.log('[CREATE_WITHDRAWAL] Validation error: Invalid amount');
      return errorResponse('VALIDATION_ERROR', 'Invalid amount', 400);
    }
    
    if (!body.destination) {
      console.log('[CREATE_WITHDRAWAL] Validation error: Destination required');
      return errorResponse('VALIDATION_ERROR', 'Destination is required', 400);
    }
    
    const supabase = createServiceSupabaseClient(env);
    
    console.log('[CREATE_WITHDRAWAL] Fetching active investment...');
    let investmentQuery = supabase
      .from('investments')
      .select('id, principal, accrued_interest, locked_amount, deposit_id')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (body.selected_deposit_id) {
      console.log('[CREATE_WITHDRAWAL] Filtering by deposit_id:', body.selected_deposit_id);
      investmentQuery = investmentQuery.eq('deposit_id', body.selected_deposit_id);
    }

    const { data: investments, error: investmentsError } = await investmentQuery;
    
    if (investmentsError || !investments || investments.length === 0) {
      console.log('[CREATE_WITHDRAWAL] No active investment found, error:', investmentsError);
      return errorResponse('NO_ACTIVE_INVESTMENT', 'No active investment found', 404);
    }
    
    const investment = investments[0];
    console.log('[CREATE_WITHDRAWAL] Investment found:', investment.id);
    
    const principal = Number(investment.principal);
    const accruedInterest = Number(investment.accrued_interest);
    const currentLocked = Number(investment.locked_amount || 0);
    const totalValue = principal + accruedInterest;
    const availableAmount = totalValue - currentLocked;
    
    console.log('[CREATE_WITHDRAWAL] Balances - principal:', principal, 'accrued:', accruedInterest, 'locked:', currentLocked, 'available:', availableAmount);
    
    // Якщо користувач хоче full withdrawal - берем ВСЮ доступну суму незалежно від amount з фронту
    // Це уникає race condition коли між відкриттям сторінки і submit крон нарахував проценти
    const requestedAmount = body.amount;
    const isFullWithdrawalRequest = Math.abs(requestedAmount - availableAmount) < 0.02; // Tolerance для round-off errors
    const actualAmount = isFullWithdrawalRequest ? availableAmount : requestedAmount;
    
    console.log('[CREATE_WITHDRAWAL] Requested:', requestedAmount, 'Available:', availableAmount, 'Is full:', isFullWithdrawalRequest, 'Actual:', actualAmount);
    
    if (availableAmount < actualAmount) {
      console.log('[CREATE_WITHDRAWAL] Insufficient funds - requested:', actualAmount, 'available:', availableAmount);
      return errorResponse('INSUFFICIENT_FUNDS', `Insufficient balance. Available: ${availableAmount.toFixed(2)}`, 400);
    }
    
    const newLocked = currentLocked + actualAmount;
    const isFullWithdrawal = newLocked >= totalValue - 0.01; // Small tolerance
    const withdrawalKind = isFullWithdrawal ? 'close' : 'partial';
    console.log('[CREATE_WITHDRAWAL] Withdrawal type:', withdrawalKind, '- new locked amount:', newLocked);

    console.log('[CREATE_WITHDRAWAL] Creating withdrawal record...');
    const { data: withdrawal, error } = await supabase
      .from('withdrawals')
      .insert({
        amount: actualAmount, // Використовуємо розрахунок сервера, не фронту
        destination: body.destination,
        status: 'requested',
        investment_id: investment.id,
        kind: withdrawalKind,
      })
      .select()
      .single();
    
    if (error || !withdrawal) {
      console.error('[CREATE_WITHDRAWAL] Failed to create withdrawal:', error);
      return errorResponse('CREATE_FAILED', 'Failed to create withdrawal', 500);
    }
    console.log('[CREATE_WITHDRAWAL] Withdrawal created:', withdrawal.id);

    const updateData: any = {
      locked_amount: newLocked,
      updated_at: new Date().toISOString(),
    };
    
    if (isFullWithdrawal) {
      updateData.status = 'closing';
      console.log('[CREATE_WITHDRAWAL] Full withdrawal - setting investment status to closing');
    }
    
    console.log('[CREATE_WITHDRAWAL] Updating investment locked_amount...', JSON.stringify(updateData));
    const { error: updateError } = await supabase
      .from('investments')
      .update(updateData)
      .eq('id', investment.id);
    
    if (updateError) {
      console.error('[CREATE_WITHDRAWAL] Failed to lock investment amount:', JSON.stringify(updateError));
      console.error('[CREATE_WITHDRAWAL] Update data was:', JSON.stringify(updateData));
      console.error('[CREATE_WITHDRAWAL] Investment ID:', investment.id);
      console.log('[CREATE_WITHDRAWAL] Rolling back - deleting withdrawal');
      await supabase.from('withdrawals').delete().eq('id', withdrawal.id);
      return errorResponse('LOCK_FAILED', `Failed to lock investment amount: ${updateError.message || updateError.code}`, 500);
    }
    console.log('[CREATE_WITHDRAWAL] Investment updated successfully');
    
    await logAudit(
      env,
      user.id,
      'withdrawal.create',
      'withdrawals',
      withdrawal.id,
      { 
        amount: actualAmount,
        requested_amount: requestedAmount,
        kind: withdrawalKind,
        investment_id: investment.id,
      },
      request
    );
    console.log('[CREATE_WITHDRAWAL] Audit logged');

    console.log('[CREATE_WITHDRAWAL] Success, returning response');
    return jsonResponse({
      success: true,
      withdrawal_id: withdrawal.id,
      kind: withdrawalKind,
      message: 'Withdrawal request created successfully',
    }, 201);
  } catch (error) {
    console.error('[CREATE_WITHDRAWAL] Exception:', error);
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

export async function handleGetWithdrawals(request: Request, env: Env): Promise<Response> {
  console.log('[GET_WITHDRAWALS] Starting...');
  try {
    const user = await requireAuth(request, env);
    console.log('[GET_WITHDRAWALS] User authenticated:', user.id);
    const supabase = createServiceSupabaseClient(env);
    
    console.log('[GET_WITHDRAWALS] Fetching withdrawals from DB via investments JOIN...');
    const { data: withdrawals, error } = await supabase
      .from('withdrawals')
      .select('*, investments!inner(user_id)')
      .eq('investments.user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[GET_WITHDRAWALS] DB error:', error);
      return errorResponse('FETCH_FAILED', 'Failed to fetch withdrawals', 500);
    }
    
    console.log('[GET_WITHDRAWALS] Found', withdrawals?.length || 0, 'withdrawals');
    return jsonResponse({ withdrawals: withdrawals || [] });
  } catch (error) {
    console.error('[GET_WITHDRAWALS] Exception:', error);
    return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
  }
}

export async function handleApproveWithdrawal(request: Request, env: Env, withdrawalId: string): Promise<Response> {
  console.log('[APPROVE_WITHDRAWAL] Starting for withdrawal:', withdrawalId);
  try {
    const user = await requireAdmin(request, env);
    console.log('[APPROVE_WITHDRAWAL] Admin authenticated:', user.id);
    const supabase = createServiceSupabaseClient(env);
    
    console.log('[APPROVE_WITHDRAWAL] Fetching withdrawal from DB...');
    const { data: withdrawal } = await supabase
    .from('withdrawals')
    .select('*, investments!inner(user_id)')
    .eq('id', withdrawalId)
    .single();
  
  if (!withdrawal) {
    console.log('[APPROVE_WITHDRAWAL] Withdrawal not found:', withdrawalId);
    return errorResponse('NOT_FOUND', 'Withdrawal not found', 404);
  }
  console.log('[APPROVE_WITHDRAWAL] Withdrawal found, status:', withdrawal.status, 'amount:', withdrawal.amount);
  
  const userId = (withdrawal.investments as any)?.user_id;
  if (!userId) {
    console.error('[APPROVE_WITHDRAWAL] Could not find user_id from investment');
    return errorResponse('INVALID_DATA', 'Could not find user for withdrawal', 500);
  }
  
  if (withdrawal.status !== 'requested') {
    console.log('[APPROVE_WITHDRAWAL] Invalid status, already processed');
    return errorResponse('INVALID_STATUS', 'Withdrawal already processed', 400);
  }
  
  console.log('[APPROVE_WITHDRAWAL] Updating withdrawal status to approved...');
  const { error: updateError } = await supabase
    .from('withdrawals')
    .update({ 
      status: 'approved',
      admin_id: user.id,
      processed_at: new Date().toISOString(),
    })
    .eq('id', withdrawalId);
  
  if (updateError) {
    console.error('[APPROVE_WITHDRAWAL] Update error:', updateError);
    return errorResponse('UPDATE_FAILED', 'Failed to approve withdrawal', 500);
  }
  console.log('[APPROVE_WITHDRAWAL] Withdrawal updated successfully');
  
  console.log('[APPROVE_WITHDRAWAL] Fetching user profile...');
  const { data: profile } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', userId)
    .single();
  
  if (profile) {
    const newBalance = Number(profile.balance || 0) - Number(withdrawal.amount);
    console.log('[APPROVE_WITHDRAWAL] Updating balance from', profile.balance, 'to', newBalance);
    await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', userId);
  }
  
  await logAudit(
    env,
    user.id,
    'withdrawal.approve',
    'withdrawals',
    withdrawalId,
    { amount: withdrawal.amount, user_id: userId },
    request
  );
  console.log('[APPROVE_WITHDRAWAL] Success, returning response');
  
  return jsonResponse({ message: 'Withdrawal approved successfully' });
  } catch (error) {
    console.error('[APPROVE_WITHDRAWAL] Exception:', error);
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse('FORBIDDEN', 'Admin access required', 403);
    }
    return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
  }
}
