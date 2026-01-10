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
    
    const { data: accounts } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);
    
    if (!accounts || accounts.length === 0) {
      return errorResponse('NOT_FOUND', 'No account found', 404);
    }
    
    const { data: deposit, error } = await supabase
      .from('deposits')
      .insert({
        user_id: user.id,
        account_id: accounts[0].id,
        amount: body.amount,
        provider: body.provider || 'manual',
        payment_details: body.payment_details || {},
        status: 'pending',
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
      { amount: body.amount, provider: body.provider },
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
  
  const { error: updateError } = await supabase
    .from('deposits')
    .update({ 
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', depositId);
  
  if (updateError) {
    return errorResponse('UPDATE_FAILED', 'Failed to confirm deposit', 500);
  }
  
  const idempotencyKey = `deposit_${depositId}`;
  
  const { error: ledgerError } = await supabase
    .from('ledger_entries')
    .insert({
      account_id: deposit.account_id,
      type: 'deposit',
      amount: deposit.amount,
      direction: 'credit',
      status: 'posted',
      ref_table: 'deposits',
      ref_id: depositId,
      idempotency_key: idempotencyKey,
      description: `Deposit confirmed - ${deposit.provider}`,
    });
  
  if (ledgerError && !ledgerError.message.includes('duplicate')) {
    return errorResponse('LEDGER_ERROR', 'Failed to create ledger entry', 500);
  }
  
  const { data: depositUser } = await supabase
    .from('profiles')
    .select('referred_by')
    .eq('id', deposit.user_id)
    .single();
  
    if (depositUser?.referred_by) {
      await supabase.rpc('apply_referral_bonus', {
        referrer_user_id: depositUser.referred_by,
        referee_user_id: deposit.user_id,
        deposit_amount: deposit.amount,
      });
    }
    
    await logAudit(
      env,
      user.id,
      'deposit.confirm',
      'deposits',
      depositId,
      { amount: deposit.amount },
      request
    );
    
    return jsonResponse({ message: 'Deposit confirmed successfully' });
  } catch (error) {
    if (error instanceof Error && error.message === 'FORBIDDEN') {
      return errorResponse('FORBIDDEN', 'Admin access required', 403);
    }
    return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
  }
}
