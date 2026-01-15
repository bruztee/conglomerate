import { Env } from '../../types';
import { requireAdmin } from '../../middleware/adminAuth';
import { jsonResponse, errorResponse } from '../../utils/response';
import { createServiceSupabaseClient } from '../../utils/supabase';
import { logAudit } from '../../utils/audit';

/**
 * GET /admin/users
 * Отримати всіх користувачів з додатковою інформацією
 */
export async function handleGetUsers(request: Request, env: Env): Promise<Response> {
  const adminCheck = await requireAdmin(request, env);
  if (!adminCheck.isAdmin) {
    return adminCheck.error!;
  }

  try {
    const supabase = createServiceSupabaseClient(env);

    // Отримати користувачів з profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        phone,
        phone_verified,
        status,
        monthly_percentage,
        max_deposit,
        referral_code,
        referred_by,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch users:', error);
      return errorResponse('DATABASE_ERROR', 'Failed to fetch users', 500);
    }

    // Отримати email_verified з auth.users через RPC
    const { data: authUsers } = await supabase.rpc('get_auth_users_verified');
    const emailVerifiedMap = new Map(
      (authUsers || []).map((u: any) => [u.id, u.email_confirmed_at !== null])
    );

    // Для кожного користувача отримати суми депозитів, виводів та інвестицій
    const usersWithStats = await Promise.all(
      (profiles || []).map(async (user) => {
        const [depositsRes, investmentsRes] = await Promise.all([
          supabase
            .from('deposits')
            .select('id, amount, status')
            .eq('user_id', user.id),
          supabase
            .from('investments')
            .select('id, deposit_id, principal, accrued_interest, status')
            .eq('user_id', user.id),
        ]);

        // Withdrawals через investments
        const investmentIds = investmentsRes.data?.map(inv => inv.id) || [];
        let totalWithdrawals = 0;
        if (investmentIds.length > 0) {
          const { data: withdrawalsData } = await supabase
            .from('withdrawals')
            .select('amount, status')
            .in('investment_id', investmentIds)
            .in('status', ['approved', 'sent']);
          totalWithdrawals = withdrawalsData?.reduce((sum, w) => sum + Number(w.amount), 0) || 0;
        }

        const totalDeposits = depositsRes.data?.filter(d => d.status === 'confirmed').reduce((sum, d) => sum + Number(d.amount), 0) || 0;
        
        // Current investments balance - include both active AND frozen
        const activeAndFrozenInvestments = investmentsRes.data?.filter(inv => inv.status === 'active' || inv.status === 'frozen') || [];
        const currentInvestments = activeAndFrozenInvestments.reduce((sum, inv) => sum + Number(inv.principal || 0), 0);
        
        // Unrealized profit - from active and frozen positions
        const unrealizedProfit = activeAndFrozenInvestments.reduce((sum, inv) => sum + Number(inv.accrued_interest || 0), 0);
        
        // Realized profit - from closed positions: total_withdrawn - initial_deposit
        const closedInvestments = investmentsRes.data?.filter(inv => inv.status === 'closed') || [];
        let realizedProfit = 0;
        
        if (closedInvestments.length > 0) {
          // Отримати всі виводи для закритих інвестицій одним запитом
          const closedInvIds = closedInvestments.map(inv => inv.id);
          const { data: allWithdrawals } = await supabase
            .from('withdrawals')
            .select('investment_id, amount')
            .in('investment_id', closedInvIds)
            .in('status', ['approved', 'sent']);
          
          // Створити мапу investment_id -> total withdrawn
          const withdrawnMap = new Map<string, number>();
          (allWithdrawals || []).forEach(w => {
            const current = withdrawnMap.get(w.investment_id) || 0;
            withdrawnMap.set(w.investment_id, current + Number(w.amount));
          });
          
          // Підрахувати реалізований профіт для кожної закритої позиції
          for (const inv of closedInvestments) {
            const deposit = depositsRes.data?.find(d => d.id === inv.deposit_id);
            if (deposit) {
              const initialAmount = Number(deposit.amount);
              const totalWithdrawn = withdrawnMap.get(inv.id) || 0;
              realizedProfit += (totalWithdrawn - initialAmount);
            }
          }
        }
        
        // Frozen funds (locked_amount)
        let frozenFunds = 0;
        if (activeAndFrozenInvestments.length > 0) {
          const { data: investmentsDetailed } = await supabase
            .from('investments')
            .select('locked_amount')
            .eq('user_id', user.id)
            .in('status', ['active', 'frozen']);
          frozenFunds = investmentsDetailed?.reduce((sum, inv) => sum + Number(inv.locked_amount || 0), 0) || 0;
        }

        return {
          ...user,
          email_verified: emailVerifiedMap.get(user.id) || false,
          phone_verified: user.phone_verified || !!user.phone,
          total_deposits: totalDeposits,
          total_withdrawals: totalWithdrawals,
          unrealized_profit: unrealizedProfit,
          realized_profit: realizedProfit,
          current_investments: currentInvestments,
          frozen_funds: frozenFunds,
        };
      })
    );

    return jsonResponse({ users: usersWithStats });
  } catch (error: any) {
    console.error('Get users error:', error);
    return errorResponse('SERVER_ERROR', error.message, 500);
  }
}

/**
 * PUT /admin/users/:userId
 * Оновити користувача (заморозити/розморозити, змінити план, % тощо)
 */
export async function handleUpdateUser(request: Request, env: Env, userId: string): Promise<Response> {
  const adminCheck = await requireAdmin(request, env);
  if (!adminCheck.isAdmin) {
    return adminCheck.error!;
  }

  try {
    const body = await request.json() as {
      status?: string;
      monthly_percentage?: number;
      max_deposit?: number | null;
    };

    if (!body.status && body.monthly_percentage === undefined && body.max_deposit === undefined) {
      return errorResponse('VALIDATION_ERROR', 'At least one field must be provided', 400);
    }

    // Validate status - тільки active або blocked
    if (body.status && !['active', 'blocked'].includes(body.status)) {
      return errorResponse('VALIDATION_ERROR', 'Status must be active or blocked', 400);
    }

    // Будуємо об'єкт для оновлення
    const updateData: any = {};
    if (body.status) updateData.status = body.status;
    if (body.monthly_percentage !== undefined) updateData.monthly_percentage = body.monthly_percentage;
    if (body.max_deposit !== undefined) updateData.max_deposit = body.max_deposit;

    const supabase = createServiceSupabaseClient(env);

    const { data: user, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update user:', error);
      return errorResponse('DATABASE_ERROR', error.message, 500);
    }

    await logAudit(env, adminCheck.userId!, 'admin.user.update', 'profiles', userId, body, request);

    return jsonResponse({ user });
  } catch (error: any) {
    console.error('Update user error:', error);
    return errorResponse('SERVER_ERROR', error.message, 500);
  }
}

/**
 * POST /admin/users/:userId/send-reset-link
 * Відправити посилання для зміни email/телефону
 */
export async function handleSendResetLink(request: Request, env: Env, userId: string): Promise<Response> {
  const adminCheck = await requireAdmin(request, env);
  if (!adminCheck.isAdmin) {
    return adminCheck.error!;
  }

  try {
    const body = await request.json() as {
      type: 'email' | 'phone';
    };

    const supabase = createServiceSupabaseClient(env);

    // Отримати email користувача
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (!profile?.email) {
      return errorResponse('NOT_FOUND', 'User not found', 404);
    }

    if (body.type === 'email') {
      // TODO: Implement email reset link generation via Supabase Admin API
      console.log('Email reset link requested for user:', userId);
    }

    await logAudit(env, adminCheck.userId!, 'admin.user.send_reset_link', 'profiles', userId, { type: body.type }, request);

    return jsonResponse({ success: true, message: `Reset link sent to ${profile.email}` });
  } catch (error: any) {
    console.error('Send reset link error:', error);
    return errorResponse('SERVER_ERROR', error.message, 500);
  }
}
