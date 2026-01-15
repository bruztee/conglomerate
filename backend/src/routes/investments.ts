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
    
    // Check if admin - if yes, get all investments, if no, only user's
    let query = supabase
      .from('investments')
      .select(`
        id,
        user_id,
        deposit_id,
        status,
        opened_at,
        closed_at,
        last_accrued_at,
        created_at,
        updated_at,
        rate_monthly,
        principal,
        accrued_interest,
        locked_amount,
        referral_earnings,
        profiles!investments_user_id_fkey(id, email, full_name, phone)
      `)
    
    if (user.role !== 'admin') {
      query = query.eq('user_id', user.id)
    }
    
    const { data: investments, error } = await query.order('opened_at', { ascending: false });
    
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
    
    // Додати обчислені поля - округлення робиться тут один раз
    const investmentsWithCalculated = (investments || []).map((inv: any) => {
      const principal = Number(inv.principal || 0);
      const accruedInterest = Number(inv.accrued_interest || 0);
      const lockedAmount = Number(inv.locked_amount || 0);
      const referralEarnings = Number(inv.referral_earnings || 0);
      const totalWithdrawn = withdrawalsMap.get(inv.id) || 0;
      
      // Округлюємо ОДИН РАЗ після обчислення
      const totalValue = Math.round((principal + accruedInterest) * 100) / 100;
      const available = Math.round((totalValue - lockedAmount) * 100) / 100;
      
      return {
        ...inv,
        // Округлені значення для фінансів
        principal: Math.round(principal * 100) / 100,
        accrued_interest: Math.round(accruedInterest * 100) / 100,
        locked_amount: Math.round(lockedAmount * 100) / 100,
        referral_earnings: Math.round(referralEarnings * 100) / 100,
        total_value: totalValue,
        available: available,
        total_withdrawn: Math.round(totalWithdrawn * 100) / 100,
      };
    });
    
    return jsonResponse({ investments: investmentsWithCalculated });
  } catch (error: any) {
    console.error('Get investments error:', error);
    return errorResponse('UNAUTHORIZED', error?.message || 'Not authenticated', 401);
  }
}
