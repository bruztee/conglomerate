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
    
    // Перевірити доступну суму в investments (principal + accrued_interest)
    const { data: investments, error: investmentsError } = await supabase
      .from('investments')
      .select('id, principal, accrued_interest')
      .eq('user_id', user.id)
      .eq('status', 'active');
    
    if (investmentsError) {
      return errorResponse('DATABASE_ERROR', 'Failed to check investments', 500);
    }
    
    // Розрахувати загальну доступну суму
    const availableAmount = (investments || []).reduce((sum, inv) => {
      return sum + Number(inv.principal) + Number(inv.accrued_interest);
    }, 0);
    
    if (availableAmount < body.amount) {
      return errorResponse('INSUFFICIENT_FUNDS', `Insufficient balance. Available: ${availableAmount.toFixed(2)}`, 400);
    }
    
    const { data: withdrawal, error } = await supabase
      .from('withdrawals')
      .insert({
        user_id: user.id,
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
  
  // Оновити статус withdrawal
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
  
  // Зменшити баланс користувача в profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', withdrawal.user_id)
    .single();
  
  if (profile) {
    const newBalance = Number(profile.balance || 0) - Number(withdrawal.amount);
    await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', withdrawal.user_id);
  }
  
  await logAudit(
    env,
    user.id,
    'withdrawal.approve',
    'withdrawals',
    withdrawalId,
    { amount: withdrawal.amount, user_id: withdrawal.user_id },
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
