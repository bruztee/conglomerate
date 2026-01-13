import { Env } from '../../types';
import { requireAdmin } from '../../middleware/adminAuth';
import { jsonResponse, errorResponse } from '../../utils/response';
import { createServiceSupabaseClient } from '../../utils/supabase';
import { logAudit } from '../../utils/audit';

/**
 * GET /api/admin/withdrawals
 * Отримати всі виводи (pending першими, потім історія)
 */
export async function handleGetWithdrawals(request: Request, env: Env): Promise<Response> {
  const adminCheck = await requireAdmin(request, env);
  if (!adminCheck.isAdmin) {
    return adminCheck.error!;
  }

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status'); // requested, approved, sent, rejected, all

    const supabase = createServiceSupabaseClient(env);

    let query = supabase
      .from('withdrawals')
      .select(`
        *,
        user:profiles!withdrawals_user_id_fkey(id, email, full_name, phone),
        admin:profiles!withdrawals_admin_id_fkey(id, email, full_name)
      `);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Requested першими, потім по даті
    const { data: withdrawals, error } = await query
      .order('status', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch withdrawals:', error);
      return errorResponse('DATABASE_ERROR', 'Failed to fetch withdrawals', 500);
    }

    return jsonResponse({ withdrawals: withdrawals || [] });
  } catch (error: any) {
    console.error('Get withdrawals error:', error);
    return errorResponse('SERVER_ERROR', error.message, 500);
  }
}

/**
 * POST /api/admin/withdrawals/:withdrawalId/approve
 * Підтвердити вивід (тільки комісія мережі, без мінімальної суми)
 */
export async function handleApproveWithdrawal(request: Request, env: Env, withdrawalId: string): Promise<Response> {
  const adminCheck = await requireAdmin(request, env);
  if (!adminCheck.isAdmin) {
    return adminCheck.error!;
  }

  try {
    const body = await request.json() as {
      admin_note?: string;
      network_fee?: number; // Комісія мережі
    };

    const supabase = createServiceSupabaseClient(env);

    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawals')
      .select('*, user:profiles!withdrawals_user_id_fkey(id, email)')
      .eq('id', withdrawalId)
      .single();

    if (fetchError || !withdrawal) {
      return errorResponse('NOT_FOUND', 'Withdrawal not found', 404);
    }

    if (withdrawal.status !== 'requested') {
      return errorResponse('VALIDATION_ERROR', 'Withdrawal is not pending approval', 400);
    }

    // Оновити статус
    const { error: updateError } = await supabase
      .from('withdrawals')
      .update({
        status: 'approved',
        processed_at: new Date().toISOString(),
        admin_id: adminCheck.userId,
        admin_note: body.admin_note || null,
        network_fee: body.network_fee || 0,
      })
      .eq('id', withdrawalId);

    if (updateError) {
      console.error('Failed to approve withdrawal:', updateError);
      return errorResponse('DATABASE_ERROR', 'Failed to approve withdrawal', 500);
    }

    await logAudit(env, adminCheck.userId!, 'admin.withdrawal.approve', 'withdrawals', withdrawalId, body, request);

    return jsonResponse({ success: true, message: 'Withdrawal approved' });
  } catch (error: any) {
    console.error('Approve withdrawal error:', error);
    return errorResponse('SERVER_ERROR', error.message, 500);
  }
}

/**
 * POST /api/admin/withdrawals/:withdrawalId/reject
 * Відхилити вивід
 */
export async function handleRejectWithdrawal(request: Request, env: Env, withdrawalId: string): Promise<Response> {
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

    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawals')
      .select('status')
      .eq('id', withdrawalId)
      .single();

    if (fetchError || !withdrawal) {
      return errorResponse('NOT_FOUND', 'Withdrawal not found', 404);
    }

    if (withdrawal.status !== 'requested') {
      return errorResponse('VALIDATION_ERROR', 'Withdrawal is not pending approval', 400);
    }

    const { error: updateError } = await supabase
      .from('withdrawals')
      .update({
        status: 'rejected',
        processed_at: new Date().toISOString(),
        admin_id: adminCheck.userId,
        admin_note: body.admin_note,
      })
      .eq('id', withdrawalId);

    if (updateError) {
      console.error('Failed to reject withdrawal:', updateError);
      return errorResponse('DATABASE_ERROR', 'Failed to reject withdrawal', 500);
    }

    await logAudit(env, adminCheck.userId!, 'admin.withdrawal.reject', 'withdrawals', withdrawalId, body, request);

    return jsonResponse({ success: true, message: 'Withdrawal rejected' });
  } catch (error: any) {
    console.error('Reject withdrawal error:', error);
    return errorResponse('SERVER_ERROR', error.message, 500);
  }
}

/**
 * POST /api/admin/withdrawals/:withdrawalId/mark-sent
 * Позначити вивід як відправлений
 */
export async function handleMarkWithdrawalSent(request: Request, env: Env, withdrawalId: string): Promise<Response> {
  const adminCheck = await requireAdmin(request, env);
  if (!adminCheck.isAdmin) {
    return adminCheck.error!;
  }

  try {
    const body = await request.json() as {
      tx_hash?: string; // Transaction hash
      admin_note?: string;
    };

    const supabase = createServiceSupabaseClient(env);

    const { error: updateError } = await supabase
      .from('withdrawals')
      .update({
        status: 'sent',
        admin_note: body.admin_note || null,
      })
      .eq('id', withdrawalId)
      .eq('status', 'approved');

    if (updateError) {
      console.error('Failed to mark withdrawal as sent:', updateError);
      return errorResponse('DATABASE_ERROR', 'Failed to update withdrawal', 500);
    }

    await logAudit(env, adminCheck.userId!, 'admin.withdrawal.mark_sent', 'withdrawals', withdrawalId, body, request);

    return jsonResponse({ success: true, message: 'Withdrawal marked as sent' });
  } catch (error: any) {
    console.error('Mark withdrawal sent error:', error);
    return errorResponse('SERVER_ERROR', error.message, 500);
  }
}
