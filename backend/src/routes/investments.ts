import type { Env } from '../types';
import { createServiceSupabaseClient } from '../utils/supabase';
import { jsonResponse, errorResponse } from '../utils/response';
import { requireAuth } from '../utils/auth';

/**
 * GET /investments
 * Отримати всі investments користувача
 */
export async function handleGetInvestments(request: Request, env: Env): Promise<Response> {
  try {
    const user = await requireAuth(request, env);
    const supabase = createServiceSupabaseClient(env);
    
    const { data: investments, error } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', user.id)
      .order('opened_at', { ascending: false });
    
    if (error) {
      console.error('Failed to fetch investments:', error);
      return errorResponse('DATABASE_ERROR', 'Failed to fetch investments', 500);
    }
    
    // Отримати total_withdrawn для кожного investment
    const investmentIds = (investments || []).map((inv: any) => inv.id);
    const { data: withdrawals } = await supabase
      .from('withdrawals')
      .select('investment_id, amount')
      .in('investment_id', investmentIds)
      .eq('status', 'approved');
    
    // Створити мапу investment_id -> total_withdrawn
    const withdrawalsMap = new Map();
    (withdrawals || []).forEach((w: any) => {
      const current = withdrawalsMap.get(w.investment_id) || 0;
      withdrawalsMap.set(w.investment_id, current + Number(w.amount));
    });
    
    // Додати обчислені поля для кожного investment
    const investmentsWithCalculated = (investments || []).map((inv: any) => {
      const principal = Number(inv.principal || 0);
      const accruedInterest = Number(inv.accrued_interest || 0);
      const lockedAmount = Number(inv.locked_amount || 0);
      const totalWithdrawn = withdrawalsMap.get(inv.id) || 0;
      
      const totalValue = principal + accruedInterest;
      const available = totalValue - lockedAmount;
      const isFrozen = available <= 0.01;
      
      return {
        ...inv,
        total_value: totalValue,
        available: available,
        is_frozen: isFrozen,
        total_withdrawn: totalWithdrawn, // Реальна виведена сума з withdrawals
      };
    });
    
    return jsonResponse({ investments: investmentsWithCalculated });
  } catch (error: any) {
    console.error('Get investments error:', error);
    return errorResponse('UNAUTHORIZED', error?.message || 'Not authenticated', 401);
  }
}
