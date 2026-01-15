import type { Env } from '../types';
import { createServiceSupabaseClient } from '../utils/supabase';
import { jsonResponse, errorResponse } from '../utils/response';
import { requireAuth } from '../utils/auth';

/**
 * GET /wallet
 * Отримати баланс та статистику користувача
 */
export async function handleGetWallet(request: Request, env: Env): Promise<Response> {
  try {
    const user = await requireAuth(request, env);
    const supabase = createServiceSupabaseClient(env);
    
    // Отримати всі активні investments
    const { data: investments } = await supabase
      .from('investments')
      .select('principal, accrued_interest')
      .eq('user_id', user.id)
      .eq('status', 'active');

    // Розрахувати поточний баланс (principal + accrued_interest)
    const balance = (investments || []).reduce((sum, inv) => {
      return sum + Number(inv.principal) + Number(inv.accrued_interest);
    }, 0);

    // Розрахувати тільки principal (без процентів)
    const totalInvested = (investments || []).reduce((sum, inv) => {
      return sum + Number(inv.principal);
    }, 0);

    // Розрахувати загальний прибуток
    const totalProfit = (investments || []).reduce((sum, inv) => {
      return sum + Number(inv.accrued_interest);
    }, 0);

    // Отримати загальні депозити
    const { data: deposits } = await supabase
      .from('deposits')
      .select('amount')
      .eq('user_id', user.id)
      .eq('status', 'confirmed');

    const totalDeposits = (deposits || []).reduce((sum, d) => sum + Number(d.amount), 0);

    // Отримати загальні виводи
    const { data: withdrawals } = await supabase
      .from('withdrawals')
      .select('amount')
      .eq('user_id', user.id)
      .in('status', ['approved', 'sent']);

    const totalWithdrawals = (withdrawals || []).reduce((sum, w) => sum + Number(w.amount), 0);

    return jsonResponse({
      balance: balance,
      total_invested: totalInvested,
      total_profit: totalProfit,
      total_deposits: totalDeposits,
      total_withdrawals: totalWithdrawals,
      currency: 'USD',
    });
  } catch (error: any) {
    console.error('Get wallet error:', error);
    return errorResponse('UNAUTHORIZED', error?.message || 'Not authenticated', 401);
  }
}
