import { Env } from '../../types';
import { requireAdmin } from '../../middleware/adminAuth';
import { jsonResponse, errorResponse } from '../../utils/response';
import { createServiceSupabaseClient } from '../../utils/supabase';
import { logAudit } from '../../utils/audit';

/**
 * GET /admin/payment-methods
 * Отримати всі payment methods (для адміна)
 */
export async function handleGetPaymentMethods(request: Request, env: Env): Promise<Response> {
  const adminCheck = await requireAdmin(request, env);
  if (!adminCheck.isAdmin) {
    return adminCheck.error!;
  }

  try {
    const supabase = createServiceSupabaseClient(env);

    const { data: methods, error } = await supabase
      .from('payment_methods')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch payment methods:', error);
      return errorResponse('DATABASE_ERROR', 'Failed to fetch payment methods', 500);
    }

    return jsonResponse({ payment_methods: methods || [] });
  } catch (error: any) {
    console.error('Get payment methods error:', error);
    return errorResponse('SERVER_ERROR', error.message, 500);
  }
}

/**
 * POST /admin/payment-methods
 * Створити новий payment method
 */
export async function handleCreatePaymentMethod(request: Request, env: Env): Promise<Response> {
  const adminCheck = await requireAdmin(request, env);
  if (!adminCheck.isAdmin) {
    return adminCheck.error!;
  }

  try {
    const body = await request.json() as {
      currency: string;
      network: string;
      wallet_address: string;
      is_active?: boolean;
      min_amount?: number;
    };

    if (!body.currency || !body.network || !body.wallet_address) {
      return errorResponse('VALIDATION_ERROR', 'Currency, network, and wallet_address are required', 400);
    }

    const supabase = createServiceSupabaseClient(env);

    const { data: method, error } = await supabase
      .from('payment_methods')
      .insert({
        currency: body.currency.toUpperCase(),
        network: body.network.toUpperCase(),
        wallet_address: body.wallet_address,
        is_active: body.is_active ?? true,
        min_amount: body.min_amount || 0,
        created_by: adminCheck.userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create payment method:', error);
      return errorResponse('DATABASE_ERROR', error.message, 500);
    }

    await logAudit(env, adminCheck.userId!, 'admin.payment_method.create', 'payment_methods', method.id, body, request);

    return jsonResponse({ payment_method: method }, 201);
  } catch (error: any) {
    console.error('Create payment method error:', error);
    return errorResponse('SERVER_ERROR', error.message, 500);
  }
}

/**
 * PUT /admin/payment-methods/:id
 * Оновити payment method
 */
export async function handleUpdatePaymentMethod(request: Request, env: Env, methodId: string): Promise<Response> {
  const adminCheck = await requireAdmin(request, env);
  if (!adminCheck.isAdmin) {
    return adminCheck.error!;
  }

  try {
    const body = await request.json() as {
      currency?: string;
      network?: string;
      wallet_address?: string;
      is_active?: boolean;
      min_amount?: number;
    };

    const supabase = createServiceSupabaseClient(env);

    const updateData: any = {};
    if (body.currency) updateData.currency = body.currency.toUpperCase();
    if (body.network) updateData.network = body.network.toUpperCase();
    if (body.wallet_address) updateData.wallet_address = body.wallet_address;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.min_amount !== undefined) updateData.min_amount = body.min_amount;

    const { data: method, error } = await supabase
      .from('payment_methods')
      .update(updateData)
      .eq('id', methodId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update payment method:', error);
      return errorResponse('DATABASE_ERROR', error.message, 500);
    }

    await logAudit(env, adminCheck.userId!, 'admin.payment_method.update', 'payment_methods', methodId, body, request);

    return jsonResponse({ payment_method: method });
  } catch (error: any) {
    console.error('Update payment method error:', error);
    return errorResponse('SERVER_ERROR', error.message, 500);
  }
}

/**
 * DELETE /admin/payment-methods/:id
 * Видалити payment method
 */
export async function handleDeletePaymentMethod(request: Request, env: Env, methodId: string): Promise<Response> {
  const adminCheck = await requireAdmin(request, env);
  if (!adminCheck.isAdmin) {
    return adminCheck.error!;
  }

  try {
    const supabase = createServiceSupabaseClient(env);

    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', methodId);

    if (error) {
      console.error('Failed to delete payment method:', error);
      return errorResponse('DATABASE_ERROR', error.message, 500);
    }

    await logAudit(env, adminCheck.userId!, 'admin.payment_method.delete', 'payment_methods', methodId, {}, request);

    return jsonResponse({ success: true, message: 'Payment method deleted' });
  } catch (error: any) {
    console.error('Delete payment method error:', error);
    return errorResponse('SERVER_ERROR', error.message, 500);
  }
}
