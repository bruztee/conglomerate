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
    
    return jsonResponse({ investments: investments || [] });
  } catch (error: any) {
    console.error('Get investments error:', error);
    return errorResponse('UNAUTHORIZED', error?.message || 'Not authenticated', 401);
  }
}
