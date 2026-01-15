import type { Env } from '../types';
import { createServiceSupabaseClient } from '../utils/supabase';
import { jsonResponse, errorResponse } from '../utils/response';
import { requireAuth, requireAdmin } from '../utils/auth';
import { logAudit } from '../utils/audit';

export async function handleCreateDeposit(request: Request, env: Env): Promise<Response> {
  try {
    const user = await requireAuth(request, env);
    const body = await request.json() as { 
      amount: number; 
      provider?: string;
      payment_details?: any;
    };
    
    if (!body.amount || body.amount <= 0) {
      return errorResponse('VALIDATION_ERROR', 'Invalid amount', 400);
    }
    
    const supabase = createServiceSupabaseClient(env);
    
    // Отримати monthly_percentage з профілю користувача
    const { data: profile } = await supabase
      .from('profiles')
      .select('monthly_percentage')
      .eq('id', user.id)
      .single();
    
    const monthlyPercentage = profile?.monthly_percentage || 5.0;
    
    const { data: deposit, error } = await supabase
      .from('deposits')
      .insert({
        user_id: user.id,
        amount: body.amount,
        payment_details: body.payment_details || {},
        status: 'pending',
        monthly_percentage: monthlyPercentage,
      })
      .select()
      .single();
    
    if (error || !deposit) {
      return errorResponse('CREATE_FAILED', 'Failed to create deposit', 500);
    }
    
    await logAudit(
      env,
      user.id,
      'deposit.create',
      'deposits',
      deposit.id,
      { amount: body.amount },
      request
    );
    
    return jsonResponse(
      {
        deposit,
        instructions: {
          message: 'Please transfer the funds to the provided address',
          amount: body.amount,
          currency: 'USD',
        },
      },
      201
    );
  } catch (error) {
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

export async function handleGetDeposits(request: Request, env: Env): Promise<Response> {
  try {
    const user = await requireAuth(request, env);
    const supabase = createServiceSupabaseClient(env);
    
    const { data: deposits } = await supabase
      .from('deposits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    return jsonResponse({ deposits: deposits || [] });
  } catch (error) {
    return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
  }
}

export async function handleConfirmDeposit(request: Request, env: Env, depositId: string): Promise<Response> {
  try {
    const user = await requireAdmin(request, env);
    const supabase = createServiceSupabaseClient(env);
    
    const { data: deposit } = await supabase
    .from('deposits')
    .select('*')
    .eq('id', depositId)
    .single();
  
  if (!deposit) {
    return errorResponse('NOT_FOUND', 'Deposit not found', 404);
  }
  
  if (deposit.status !== 'pending') {
    return errorResponse('INVALID_STATUS', 'Deposit already processed', 400);
  }
  
  // Оновити статус депозиту
  const { error: updateError } = await supabase
    .from('deposits')
    .update({ 
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      admin_id: user.id,
    })
    .eq('id', depositId);
  
  if (updateError) {
    return errorResponse('UPDATE_FAILED', 'Failed to confirm deposit', 500);
  }
  
  // Оновити баланс користувача в profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', deposit.user_id)
    .single();
  
  if (profile) {
    await supabase
      .from('profiles')
      .update({ balance: Number(profile.balance || 0) + Number(deposit.amount) })
      .eq('id', deposit.user_id);
  }
  
  await logAudit(
    env,
    user.id,
    'deposit.confirm',
    'deposits',
    depositId,
    { amount: deposit.amount, user_id: deposit.user_id },
    request
  );
  
  return jsonResponse({ deposit });
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse('FORBIDDEN', 'Admin access required', 403);
    }
    return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
  }
}
