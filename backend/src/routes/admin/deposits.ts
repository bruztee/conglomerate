import { Env } from '../../types';
import { requireAdmin } from '../../middleware/adminAuth';
import { jsonResponse, errorResponse } from '../../utils/response';
import { createServiceSupabaseClient } from '../../utils/supabase';
import { logAudit } from '../../utils/audit';

/**
 * GET /admin/deposits
 * Отримати всі депозити (pending першими, потім історія)
 */
export async function handleGetDeposits(request: Request, env: Env): Promise<Response> {
  const adminCheck = await requireAdmin(request, env);
  if (!adminCheck.isAdmin) {
    return adminCheck.error!;
  }

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status'); // pending, confirmed, rejected, all

    const supabase = createServiceSupabaseClient(env);

    let query = supabase
      .from('deposits')
      .select(`
        *,
        user:profiles!deposits_user_id_fkey(id, email, full_name, phone),
        payment_method:payment_methods(id, currency, network, wallet_address),
        admin:profiles!deposits_admin_id_fkey(id, email, full_name)
      `);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Pending першими, потім по даті
    const { data: deposits, error } = await query.order('status', { ascending: false }).order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch deposits:', error);
      return errorResponse('DATABASE_ERROR', 'Failed to fetch deposits', 500);
    }

    return jsonResponse({ deposits: deposits || [] });
  } catch (error: any) {
    console.error('Get deposits error:', error);
    return errorResponse('SERVER_ERROR', error.message, 500);
  }
}

/**
 * POST /admin/deposits/:depositId/approve
 * Підтвердити депозит (зарахувати кошти)
 */
export async function handleApproveDeposit(request: Request, env: Env, depositId: string): Promise<Response> {
  const adminCheck = await requireAdmin(request, env);
  if (!adminCheck.isAdmin) {
    return adminCheck.error!;
  }

  try {
    const body = await request.json() as {
      admin_note?: string;
    };

    const supabase = createServiceSupabaseClient(env);

    // Отримати депозит
    const { data: deposit, error: fetchError } = await supabase
      .from('deposits')
      .select('*, user:profiles!deposits_user_id_fkey(id, email, full_name)')
      .eq('id', depositId)
      .single();

    if (fetchError || !deposit) {
      return errorResponse('NOT_FOUND', 'Deposit not found', 404);
    }

    if (deposit.status !== 'pending') {
      return errorResponse('VALIDATION_ERROR', 'Deposit is not pending', 400);
    }

    // Оновити статус депозиту
    const { error: updateError } = await supabase
      .from('deposits')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        admin_id: adminCheck.userId,
        admin_note: body.admin_note || null,
      })
      .eq('id', depositId);

    if (updateError) {
      console.error('Failed to approve deposit:', updateError);
      return errorResponse('DATABASE_ERROR', 'Failed to approve deposit', 500);
    }

    // Отримати monthly_percentage користувача для створення investment
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('monthly_percentage')
      .eq('id', deposit.user_id)
      .single();

    if (profileError || !profile) {
      console.error('Failed to fetch profile:', profileError);
      return errorResponse('USER_NOT_FOUND', 'User profile not found', 404);
    }

    const monthlyPercentage = profile.monthly_percentage || 5.0;

    // Створити investment замість прямого додавання до balance
    const { error: investmentError } = await supabase
      .from('investments')
      .insert({
        user_id: deposit.user_id,
        principal: deposit.amount,
        rate_monthly: monthlyPercentage,
        deposit_id: depositId,
        opened_at: new Date().toISOString(),
        last_accrued_at: new Date().toISOString(),
        status: 'active',
      });

    if (investmentError) {
      console.error('Failed to create investment:', investmentError);
      return errorResponse('DATABASE_ERROR', 'Deposit approved but failed to create investment', 500);
    }

    await logAudit(env, adminCheck.userId!, 'admin.deposit.approve', 'deposits', depositId, body, request);

    return jsonResponse({ success: true, message: 'Deposit approved and funds credited' });
  } catch (error: any) {
    console.error('Approve deposit error:', error);
    return errorResponse('SERVER_ERROR', error.message, 500);
  }
}

/**
 * POST /admin/deposits/:depositId/reject
 * Відхилити депозит
 */
export async function handleRejectDeposit(request: Request, env: Env, depositId: string): Promise<Response> {
  const adminCheck = await requireAdmin(request, env);
  if (!adminCheck.isAdmin) {
    return adminCheck.error!;
  }

  try {
    const body = await request.json() as {
      admin_note: string;
    };

    if (!body.admin_note) {
      return errorResponse('VALIDATION_ERROR', 'Admin note is required for rejection', 400);
    }

    const supabase = createServiceSupabaseClient(env);

    const { data: deposit, error: fetchError } = await supabase
      .from('deposits')
      .select('status')
      .eq('id', depositId)
      .single();

    if (fetchError || !deposit) {
      return errorResponse('NOT_FOUND', 'Deposit not found', 404);
    }

    if (deposit.status !== 'pending') {
      return errorResponse('VALIDATION_ERROR', 'Deposit is not pending', 400);
    }

    const { error: updateError } = await supabase
      .from('deposits')
      .update({
        status: 'rejected',
        admin_id: adminCheck.userId,
        admin_note: body.admin_note,
      })
      .eq('id', depositId);

    if (updateError) {
      console.error('Failed to reject deposit:', updateError);
      return errorResponse('DATABASE_ERROR', 'Failed to reject deposit', 500);
    }

    await logAudit(env, adminCheck.userId!, 'admin.deposit.reject', 'deposits', depositId, body, request);

    return jsonResponse({ success: true, message: 'Deposit rejected' });
  } catch (error: any) {
    console.error('Reject deposit error:', error);
    return errorResponse('SERVER_ERROR', error.message, 500);
  }
}
