import { Env } from '../types';
import { jsonResponse, errorResponse } from '../utils/response';
import { createServiceSupabaseClient } from '../utils/supabase';

/**
 * GET /api/payment-methods
 * Публічний endpoint для отримання ТІЛЬКИ активних payment methods
 * Використовується користувачами для вибору методу депозиту
 */
export async function handleGetActivePaymentMethods(request: Request, env: Env): Promise<Response> {
  try {
    const supabase = createServiceSupabaseClient(env);

    // Отримати ТІЛЬКИ активні методи
    const { data: methods, error } = await supabase
      .from('payment_methods')
      .select('id, currency, network, wallet_address, min_amount')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch active payment methods:', error);
      return errorResponse('DATABASE_ERROR', 'Failed to fetch payment methods', 500);
    }

    return jsonResponse({ payment_methods: methods || [] });
  } catch (error: any) {
    console.error('Get active payment methods error:', error);
    return errorResponse('SERVER_ERROR', error.message, 500);
  }
}
