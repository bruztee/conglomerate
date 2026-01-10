import type { Env } from '../types';
import { createServiceSupabaseClient } from '../utils/supabase';
import { jsonResponse, errorResponse } from '../utils/response';
import { requireAuth } from '../utils/auth';
import { logAudit } from '../utils/audit';

export async function handleGetPlans(request: Request, env: Env): Promise<Response> {
  const supabase = createServiceSupabaseClient(env);
  
  const { data: plans } = await supabase
    .from('investment_plans')
    .select('*')
    .eq('is_active', true)
    .order('min_amount', { ascending: true });
  
  return jsonResponse({ plans: plans || [] });
}

export async function handleCreateInvestment(request: Request, env: Env): Promise<Response> {
  try {
    const user = await requireAuth(request, env);
    const body = await request.json() as { 
      plan_id: string; 
      amount: number;
    };
    
    if (!body.plan_id || !body.amount || body.amount <= 0) {
      return errorResponse('VALIDATION_ERROR', 'Invalid plan or amount', 400);
    }
    
    const supabase = createServiceSupabaseClient(env);
    
    const { data: plan } = await supabase
      .from('investment_plans')
      .select('*')
      .eq('id', body.plan_id)
      .eq('is_active', true)
      .single();
    
    if (!plan) {
      return errorResponse('NOT_FOUND', 'Investment plan not found', 404);
    }
    
    if (body.amount < plan.min_amount) {
      return errorResponse('VALIDATION_ERROR', `Minimum amount is ${plan.min_amount}`, 400);
    }
    
    if (plan.max_amount && body.amount > plan.max_amount) {
      return errorResponse('VALIDATION_ERROR', `Maximum amount is ${plan.max_amount}`, 400);
    }
    
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
    
    const { data: investment, error } = await supabase
      .from('user_investments')
      .insert({
        user_id: user.id,
        account_id: accountId,
        plan_id: body.plan_id,
        principal: body.amount,
        status: 'active',
      })
      .select()
      .single();
    
    if (error || !investment) {
      return errorResponse('CREATE_FAILED', 'Failed to create investment', 500);
    }
    
    await logAudit(
      env,
      user.id,
      'investment.create',
      'user_investments',
      investment.id,
      { plan_id: body.plan_id, amount: body.amount },
      request
    );
    
    return jsonResponse(
      {
        investment,
        message: 'Investment created successfully',
      },
      201
    );
  } catch (error) {
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

export async function handleGetInvestments(request: Request, env: Env): Promise<Response> {
  try {
    const user = await requireAuth(request, env);
    const supabase = createServiceSupabaseClient(env);
    
    const { data: investments } = await supabase
      .from('user_investments')
      .select(`
        *,
        investment_plans (
          name,
          daily_rate,
          description
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    return jsonResponse({ investments: investments || [] });
  } catch (error) {
    return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
  }
}
