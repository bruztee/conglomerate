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
      amount?: number;
      close?: boolean;
      destination: any;
      selected_deposit_id?: string;
    };
    console.log('[CREATE_WITHDRAWAL] Request body:', JSON.stringify(body));
    
    if (!body.destination) {
      console.log('[CREATE_WITHDRAWAL] Validation error: Destination required');
      return errorResponse('VALIDATION_ERROR', 'Destination is required', 400);
    }
    
    const supabase = createServiceSupabaseClient(env);
    
    // Знайти investment_id
    console.log('[CREATE_WITHDRAWAL] Finding investment...');
    let investmentQuery = supabase
      .from('investments')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (body.selected_deposit_id) {
      console.log('[CREATE_WITHDRAWAL] Filtering by deposit_id:', body.selected_deposit_id);
      investmentQuery = investmentQuery.eq('deposit_id', body.selected_deposit_id);
    }

    const { data: investments } = await investmentQuery;
    
    if (!investments || investments.length === 0) {
      console.log('[CREATE_WITHDRAWAL] No active investment found');
      return errorResponse('NO_ACTIVE_INVESTMENT', 'No active investment found', 404);
    }
    
    const investmentId = investments[0].id;
    console.log('[CREATE_WITHDRAWAL] Investment found:', investmentId);
    
    // БЕТОН: Викликати SQL функцію - вона зробить ВСЕ атомарно
    // lock, accrue, calculate, reserve, create withdrawal
    const requestedAmount = body.close ? null : body.amount; // NULL = withdraw ALL
    console.log('[CREATE_WITHDRAWAL] Calling request_withdrawal RPC, amount:', requestedAmount, 'close:', body.close);
    
    const { data, error } = await supabase.rpc('request_withdrawal', {
      p_user_id: user.id,
      p_investment_id: investmentId,
      p_requested_amount: requestedAmount,
      p_destination: body.destination,
    });
    
    if (error) {
      console.error('[CREATE_WITHDRAWAL] RPC error:', JSON.stringify(error));
      return errorResponse('RPC_FAILED', `Failed to create withdrawal: ${error.message}`, 500);
    }
    
    if (!data || data.length === 0) {
      console.error('[CREATE_WITHDRAWAL] No data returned from RPC');
      return errorResponse('UNKNOWN_ERROR', 'No data returned from withdrawal function', 500);
    }
    
    const result = data[0];
    console.log('[CREATE_WITHDRAWAL] RPC result:', JSON.stringify(result));
    
    // Перевірити чи є помилка від SQL функції
    if (result.error_code) {
      console.error('[CREATE_WITHDRAWAL] SQL function error:', result.error_code, result.error_message);
      return errorResponse(result.error_code, result.error_message, 400);
    }
    
    console.log('[CREATE_WITHDRAWAL] SUCCESS - withdrawal_id:', result.withdrawal_id, 'amount:', result.actual_amount, 'kind:', result.withdrawal_kind);
    
    await logAudit(
      env,
      user.id,
      'withdrawal.create',
      'withdrawals',
      result.withdrawal_id,
      { 
        amount: result.actual_amount,
        kind: result.withdrawal_kind,
        investment_id: investmentId,
      },
      request
    );
    console.log('[CREATE_WITHDRAWAL] Audit logged');

    console.log('[CREATE_WITHDRAWAL] Success, returning response');
    return jsonResponse({
      success: true,
      withdrawal_id: result.withdrawal_id,
      amount: result.actual_amount,
      kind: result.withdrawal_kind,
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
  console.log('[APPROVE_WITHDRAWAL] Withdrawal found, investment_id:', withdrawal.investment_id, 'status:', withdrawal.status);
  
  const userId = (withdrawal.investments as any)?.user_id;
  if (!userId) {
    console.error('[APPROVE_WITHDRAWAL] Could not find user_id from investment');
    return errorResponse('INVALID_DATA', 'Could not find user for withdrawal', 500);
  }
  
  if (withdrawal.status !== 'requested') {
    console.log('[APPROVE_WITHDRAWAL] Invalid status, already processed');
    return errorResponse('INVALID_STATUS', 'Withdrawal already processed', 400);
  }
  
  // Отримати investment для оновлення
  console.log('[APPROVE_WITHDRAWAL] Fetching investment with id:', withdrawal.investment_id);
  const { data: investment, error: invError } = await supabase
    .from('investments')
    .select('*')
    .eq('id', withdrawal.investment_id)
    .single();
  
  if (invError || !investment) {
    console.error('[APPROVE_WITHDRAWAL] Investment not found:', invError);
    return errorResponse('NOT_FOUND', 'Investment not found', 404);
  }
  
  const withdrawalAmount = Number(withdrawal.amount);
  const principal = Number(investment.principal || 0);
  const accruedInterest = Number(investment.accrued_interest || 0);
  const lockedAmount = Number(investment.locked_amount || 0);
  
  console.log('[APPROVE_WITHDRAWAL] Investment found:', investment.id, 'principal:', principal, 'locked:', lockedAmount);
  console.log('[APPROVE_WITHDRAWAL] Amounts - withdrawal:', withdrawalAmount, 'principal:', principal, 'accrued:', accruedInterest, 'locked:', lockedAmount);
  
  // СПОЧАТКУ знімаємо з accrued_interest (профіт), ПОТІМ з principal (тіло)
  let remainingToWithdraw = withdrawalAmount;
  let newAccruedInterest = accruedInterest;
  let newPrincipal = principal;
  
  // 1. Знімаємо з profit
  if (remainingToWithdraw > 0 && newAccruedInterest > 0) {
    const fromProfit = Math.min(remainingToWithdraw, newAccruedInterest);
    newAccruedInterest -= fromProfit;
    remainingToWithdraw -= fromProfit;
    console.log('[APPROVE_WITHDRAWAL] Deducted from profit:', fromProfit, 'remaining:', remainingToWithdraw);
  }
  
  // 2. Знімаємо з principal
  if (remainingToWithdraw > 0 && newPrincipal > 0) {
    const fromPrincipal = Math.min(remainingToWithdraw, newPrincipal);
    newPrincipal -= fromPrincipal;
    remainingToWithdraw -= fromPrincipal;
    console.log('[APPROVE_WITHDRAWAL] Deducted from principal:', fromPrincipal, 'remaining:', remainingToWithdraw);
  }
  
  // 3. Зменшуємо locked_amount
  const newLockedAmount = Math.max(0, lockedAmount - withdrawalAmount);
  
  // 4. Визначити новий статус investment
  let newStatus = investment.status;
  if (withdrawal.kind === 'close' || (newPrincipal <= 0.01 && newAccruedInterest <= 0.01)) {
    newStatus = 'closed';
    console.log('[APPROVE_WITHDRAWAL] Setting investment status to closed');
  }
  
  if (remainingToWithdraw > 0.01) {
    console.error('[APPROVE_WITHDRAWAL] Insufficient funds: still need', remainingToWithdraw);
    return errorResponse('INSUFFICIENT_FUNDS', 'Insufficient funds in investment', 400);
  }
  
  console.log('[APPROVE_WITHDRAWAL] New values - principal:', newPrincipal, 'accrued:', newAccruedInterest, 'locked:', newLockedAmount, 'status:', newStatus);
  
  // Оновити investment
  const { error: invUpdateError } = await supabase
    .from('investments')
    .update({
      principal: newPrincipal,
      accrued_interest: newAccruedInterest,
      locked_amount: newLockedAmount,
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', withdrawal.investment_id);
  
  if (invUpdateError) {
    console.error('[APPROVE_WITHDRAWAL] Investment update error:', invUpdateError);
    return errorResponse('UPDATE_FAILED', 'Failed to update investment', 500);
  }
  console.log('[APPROVE_WITHDRAWAL] Investment updated successfully');
  
  // Оновити withdrawal статус
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
