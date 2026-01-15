import type { Env } from '../types';
import { createServiceSupabaseClient } from '../utils/supabase';
import { jsonResponse, errorResponse } from '../utils/response';
import { requireAuth, requireAdmin } from '../utils/auth';
import { logAudit } from '../utils/audit';

export async function handleCreateDeposit(request: Request, env: Env): Promise<Response> {
  console.log('[CREATE_DEPOSIT] Starting...');
  try {
    const user = await requireAuth(request, env);
    console.log('[CREATE_DEPOSIT] User authenticated:', user.id);
    
    const body = await request.json() as { 
      amount: number; 
      provider?: string;
      payment_details?: any;
    };
    console.log('[CREATE_DEPOSIT] Request body:', JSON.stringify(body));
    
    if (!body.amount || body.amount <= 0) {
      console.log('[CREATE_DEPOSIT] Validation error: Invalid amount');
      return errorResponse('VALIDATION_ERROR', 'Invalid amount', 400);
    }
    
    const supabase = createServiceSupabaseClient(env);
    
    // Отримати monthly_percentage користувача
    console.log('[CREATE_DEPOSIT] Fetching user monthly_percentage...');
    const { data: profile } = await supabase
      .from('profiles')
      .select('monthly_percentage')
      .eq('id', user.id)
      .single();
    
    const monthlyPercentage = profile?.monthly_percentage || 5;
    console.log('[CREATE_DEPOSIT] User monthly_percentage:', monthlyPercentage);
    
    console.log('[CREATE_DEPOSIT] Inserting deposit into DB...');
    const { data: deposit, error } = await supabase
      .from('deposits')
      .insert({
        user_id: user.id,
        amount: body.amount,
        payment_details: body.payment_details || {},
        monthly_percentage: monthlyPercentage,
        status: 'pending',
      })
      .select()
      .single();
    
    if (error || !deposit) {
      console.error('[CREATE_DEPOSIT] DB error:', error);
      return errorResponse('CREATE_FAILED', 'Failed to create deposit', 500);
    }
    console.log('[CREATE_DEPOSIT] Deposit created:', deposit.id);
    
    await logAudit(
      env,
      user.id,
      'deposit.create',
      'deposits',
      deposit.id,
      { amount: body.amount },
      request
    );
    console.log('[CREATE_DEPOSIT] Audit logged');
    
    console.log('[CREATE_DEPOSIT] Success, returning response');
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
    console.error('[CREATE_DEPOSIT] Exception:', error);
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

export async function handleGetDeposits(request: Request, env: Env): Promise<Response> {
  console.log('[GET_DEPOSITS] Starting...');
  try {
    const user = await requireAuth(request, env);
    console.log('[GET_DEPOSITS] User authenticated:', user.id);
    const supabase = createServiceSupabaseClient(env);
    
    console.log('[GET_DEPOSITS] Fetching deposits from DB...');
    const { data: deposits } = await supabase
      .from('deposits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    console.log('[GET_DEPOSITS] Found', deposits?.length || 0, 'deposits');
    return jsonResponse({ deposits: deposits || [] });
  } catch (error) {
    console.error('[GET_DEPOSITS] Exception:', error);
    return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
  }
}

export async function handleConfirmDeposit(request: Request, env: Env, depositId: string): Promise<Response> {
  console.log('[CONFIRM_DEPOSIT] Starting for deposit:', depositId);
  try {
    const user = await requireAdmin(request, env);
    console.log('[CONFIRM_DEPOSIT] Admin authenticated:', user.id);
    const supabase = createServiceSupabaseClient(env);
    
    console.log('[CONFIRM_DEPOSIT] Fetching deposit from DB...');
    const { data: deposit } = await supabase
    .from('deposits')
    .select('*')
    .eq('id', depositId)
    .single();
  
  if (!deposit) {
    console.log('[CONFIRM_DEPOSIT] Deposit not found:', depositId);
    return errorResponse('NOT_FOUND', 'Deposit not found', 404);
  }
  console.log('[CONFIRM_DEPOSIT] Deposit found, status:', deposit.status);
  
  if (deposit.status !== 'pending') {
    console.log('[CONFIRM_DEPOSIT] Invalid status, already processed');
    return errorResponse('INVALID_STATUS', 'Deposit already processed', 400);
  }
  
  // Оновити статус депозиту
  console.log('[CONFIRM_DEPOSIT] Updating deposit status to confirmed...');
  const { error: updateError } = await supabase
    .from('deposits')
    .update({ 
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      admin_id: user.id,
    })
    .eq('id', depositId);
  
  if (updateError) {
    console.error('[CONFIRM_DEPOSIT] Update error:', updateError);
    return errorResponse('UPDATE_FAILED', 'Failed to confirm deposit', 500);
  }
  console.log('[CONFIRM_DEPOSIT] Deposit updated successfully');
  
  // Баланс більше не зберігається в profiles - розраховується через investments
  console.log('[CONFIRM_DEPOSIT] Skipping balance update - calculated from investments');
  
  await logAudit(
    env,
    user.id,
    'deposit.confirm',
    'deposits',
    depositId,
    { amount: deposit.amount, user_id: deposit.user_id },
    request
  );
  console.log('[CONFIRM_DEPOSIT] Success, returning response');
  
  return jsonResponse({ deposit });
  } catch (error) {
    console.error('[CONFIRM_DEPOSIT] Exception:', error);
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse('FORBIDDEN', 'Admin access required', 403);
    }
    return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
  }
}
