import { Env } from '../types';
import { getUserFromRequest } from '../utils/auth';
import { errorResponse } from '../utils/response';
import { createServiceSupabaseClient } from '../utils/supabase';

/**
 * Middleware для перевірки прав адміністратора
 * Використовується для захисту admin endpoints
 */
export async function requireAdmin(request: Request, env: Env): Promise<{ isAdmin: boolean; userId?: string; error?: Response }> {
  try {
    // Перевірити аутентифікацію
    const user = await getUserFromRequest(request, env);
    if (!user) {
      return {
        isAdmin: false,
        error: errorResponse('UNAUTHORIZED', 'Not authenticated', 401)
      };
    }

    // Перевірити роль в profiles
    const supabase = createServiceSupabaseClient(env);
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      console.error('Failed to fetch profile for admin check:', error);
      return {
        isAdmin: false,
        error: errorResponse('FORBIDDEN', 'Access denied', 403)
      };
    }

    if (profile.role !== 'admin') {
      console.warn('Non-admin user attempted to access admin endpoint:', user.id);
      return {
        isAdmin: false,
        error: errorResponse('FORBIDDEN', 'Admin access required', 403)
      };
    }

    return {
      isAdmin: true,
      userId: user.id
    };
  } catch (error) {
    console.error('Admin auth check error:', error);
    return {
      isAdmin: false,
      error: errorResponse('SERVER_ERROR', 'Authentication error', 500)
    };
  }
}
