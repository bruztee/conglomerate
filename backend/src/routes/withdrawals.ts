import type { Env } from '../types';
import { createServiceSupabaseClient } from '../utils/supabase';
import { jsonResponse, errorResponse } from '../utils/response';
import { requireAuth, requireAdmin } from '../utils/auth';
import { logAudit } from '../utils/audit';

export async function handleCreateWithdrawal(request: Request, env: Env): Promise<Response> {
  try {
    const user = await requireAuth(request, env);
    const body = await request.json() as { 
      amount: number; 
      destination: any;
    };
    
    if (!body.amount || body.amount <= 0) {
      return errorResponse('VALIDATION_ERROR', 'Invalid amount', 400);
    }
    
    if (!body.destination) {
      return errorResponse('VALIDATION_ERROR', 'Destination is required', 400);
    }
    
    const supabase = createServiceSupabaseClient(env);
    
    const { data: accounts } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);
    
    if (!accounts || accounts.length === 0) {
      return errorResponse('NOT_FOUND', 'No account found', 404);
    }
    
    const accountId = accounts[0].id;
    
    const { data: balanceResult } = await supabase
      .rpc('get_account_balance', { account_uuid: accountId });
    
    const balance = balanceResult || 0;
    
    if (balance < body.amount) {
      return errorResponse('INSUFFICIENT_FUNDS', 'Insufficient balance', 400);
    }
    
    const { data: withdrawal, error } = await supabase
      .from('withdrawals')
      .insert({
        user_id: user.id,
        account_id: accountId,
        amount: body.amount,
        destination: body.destination,
        status: 'requested',
      })
      .select()
      .single();
    
    if (error || !withdrawal) {
      return errorResponse('CREATE_FAILED', 'Failed to create withdrawal', 500);
    }
    
    await logAudit(
      env,
      user.id,
      'withdrawal.create',
      'withdrawals',
      withdrawal.id,
      { amount: body.amount },
      request
    );
    
    return jsonResponse(
      {
        withdrawal,
        message: 'Withdrawal request submitted for review',
      },
      201
    );
  } catch (error) {
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

export async function handleGetWithdrawals(request: Request, env: Env): Promise<Response> {
  try {
    const user = await requireAuth(request, env);
    const supabase = createServiceSupabaseClient(env);
    
    const { data: withdrawals } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    return jsonResponse({ withdrawals: withdrawals || [] });
  } catch (error) {
    return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
  }
}

export async function handleApproveWithdrawal(request: Request, env: Env, withdrawalId: string): Promise<Response> {
  try {
    const user = await requireAdmin(request, env);
    const supabase = createServiceSupabaseClient(env);
    
    const { data: withdrawal } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('id', withdrawalId)
    .single();
  
  if (!withdrawal) {
    return errorResponse('NOT_FOUND', 'Withdrawal not found', 404);
  }
  
  if (withdrawal.status !== 'requested') {
    return errorResponse('INVALID_STATUS', 'Withdrawal already processed', 400);
  }
  
  const { error: updateError } = await supabase
    .from('withdrawals')
    .update({ 
      status: 'approved',
      admin_id: user.id,
      processed_at: new Date().toISOString(),
    })
    .eq('id', withdrawalId);
  
  if (updateError) {
    return errorResponse('UPDATE_FAILED', 'Failed to approve withdrawal', 500);
  }
  
  await logAudit(
    env,
    user.id,
    'withdrawal.approve',
    'withdrawals',
    withdrawalId,
    { amount: withdrawal.amount },
    request
  );
  
  return jsonResponse({ message: 'Withdrawal approved successfully' });
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse('FORBIDDEN', 'Admin access required', 403);
    }
    return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
  }
}
