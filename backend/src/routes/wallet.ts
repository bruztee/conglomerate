import type { Env } from '../types';
import { createServiceSupabaseClient } from '../utils/supabase';
import { jsonResponse, errorResponse } from '../utils/response';
import { requireAuth } from '../utils/auth';

/**
 * GET /wallet
 * Отримати баланс та статистику користувача
 */
export async function handleGetWallet(request: Request, env: Env): Promise<Response> {
  console.log('[GET_WALLET] Starting...');
  try {
    const user = await requireAuth(request, env);
    console.log('[GET_WALLET] User authenticated:', user.id);
    const supabase = createServiceSupabaseClient(env);
    
    console.log('[GET_WALLET] Fetching active investments...');
    const { data: investments } = await supabase
      .from('investments')
      .select('principal, accrued_interest, locked_amount')
      .eq('user_id', user.id)
      .eq('status', 'active');

    console.log('[GET_WALLET] Found', investments?.length || 0, 'active investments');

    let totalPrincipal = 0;
    let totalAccrued = 0;
    let totalLocked = 0;

    (investments || []).forEach((inv, idx) => {
      const principal = Number(inv.principal);
      const accrued = Number(inv.accrued_interest);
      const locked = Number(inv.locked_amount || 0);
      
      console.log(`[GET_WALLET] Investment ${idx}: principal=${principal}, accrued=${accrued}, locked_amount=${inv.locked_amount}, locked=${locked}`);
      
      totalPrincipal += principal;
      totalAccrued += accrued;
      totalLocked += locked;
    });

    const balance = totalPrincipal + totalAccrued - totalLocked;
    console.log('[GET_WALLET] Calculated - principal:', totalPrincipal, 'accrued:', totalAccrued, 'locked:', totalLocked, 'balance:', balance);

    console.log('[GET_WALLET] Fetching confirmed deposits...');
    const { data: deposits } = await supabase
      .from('deposits')
      .select('amount')
      .eq('user_id', user.id)
      .eq('status', 'confirmed');

    const totalDeposits = (deposits || []).reduce((sum, d) => sum + Number(d.amount), 0);
    console.log('[GET_WALLET] Total deposits:', totalDeposits);

    console.log('[GET_WALLET] Fetching approved withdrawals...');
    const { data: withdrawals } = await supabase
      .from('withdrawals')
      .select('amount, investments!inner(user_id)')
      .eq('investments.user_id', user.id)
      .in('status', ['approved']);

    const totalWithdrawals = (withdrawals || []).reduce((sum, w) => sum + Number(w.amount), 0);
    console.log('[GET_WALLET] Total withdrawals:', totalWithdrawals);

    console.log('[GET_WALLET] Success, returning wallet data');
    return jsonResponse({
      balance: balance,
      locked_amount: totalLocked,
      total_invested: totalPrincipal,
      total_profit: totalAccrued,
      total_deposits: totalDeposits,
      total_withdrawals: totalWithdrawals,
      currency: 'USD',
    });
  } catch (error: any) {
    console.error('[GET_WALLET] Exception:', error);
    return errorResponse('UNAUTHORIZED', error?.message || 'Not authenticated', 401);
  }
}
