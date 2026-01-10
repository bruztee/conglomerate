import type { Env } from '../types';
import { createServiceSupabaseClient } from '../utils/supabase';
import { jsonResponse, errorResponse } from '../utils/response';
import { requireAuth } from '../utils/auth';

export async function handleGetWallet(request: Request, env: Env): Promise<Response> {
  try {
    const user = await requireAuth(request, env);
    const supabase = createServiceSupabaseClient(env);
    
    const { data: accounts } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', user.id);
    
    if (!accounts || accounts.length === 0) {
      return errorResponse('NOT_FOUND', 'No account found', 404);
    }
    
    const accountId = accounts[0].id;
    
    const { data: balanceResult, error: balanceError } = await supabase
      .rpc('get_account_balance', { account_uuid: accountId });
    
    if (balanceError) {
      return errorResponse('SERVER_ERROR', 'Failed to fetch balance', 500);
    }
    
    const { data: stats } = await supabase
      .rpc('get_investment_stats', { user_uuid: user.id });
    
    const { data: investments } = await supabase
      .from('user_investments')
      .select(`
        id,
        principal,
        started_at,
        last_accrual_at,
        status,
        investment_plans (
          name,
          daily_rate
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active');
    
    return jsonResponse({
      balance: balanceResult || 0,
      currency: 'USD',
      stats: stats?.[0] || {
        total_principal: 0,
        total_earned: 0,
        active_investments: 0,
      },
      active_investments: investments || [],
    });
  } catch (error) {
    return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
  }
}

export async function handleGetTransactions(request: Request, env: Env): Promise<Response> {
  try {
    const user = await requireAuth(request, env);
    const supabase = createServiceSupabaseClient(env);
  
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    const { data: accounts } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', user.id);
    
    if (!accounts || accounts.length === 0) {
      return jsonResponse({ transactions: [], total: 0 });
    }
    
    const accountIds = accounts.map((a: any) => a.id);
    
    const { data: transactions, count } = await supabase
      .from('ledger_entries')
      .select('*', { count: 'exact' })
      .in('account_id', accountIds)
      .eq('status', 'posted')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    return jsonResponse({
      transactions: transactions || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
  }
}
