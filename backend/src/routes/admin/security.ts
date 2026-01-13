import { Env } from '../../types';
import { requireAdmin } from '../../middleware/adminAuth';
import { jsonResponse, errorResponse } from '../../utils/response';
import { createServiceSupabaseClient } from '../../utils/supabase';

/**
 * GET /admin/security/audit-logs
 * Отримати audit logs з обох таблиць: auth.audit_log_entries + public.audit_log
 */
export async function handleGetAuditLogs(request: Request, env: Env): Promise<Response> {
  const adminCheck = await requireAdmin(request, env);
  if (!adminCheck.isAdmin) {
    return adminCheck.error!;
  }

  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    
    const supabase = createServiceSupabaseClient(env);

    // Отримати public.audit_log
    const { data: publicLogs, error: publicError } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (publicError) {
      console.error('Failed to fetch public audit_log:', publicError);
    }

    // Отримати auth.audit_log_entries через raw SQL (auth schema не доступний через .from())
    const { data: authLogs, error: authError } = await supabase.rpc('get_auth_audit_logs', { 
      log_limit: limit 
    });

    if (authError) {
      console.error('Failed to fetch auth audit logs:', authError);
    }

    // Об'єднати логи
    const combinedLogs = [
      ...(publicLogs || []).map(log => ({
        id: `public-${log.id}`,
        source: 'public',
        action: log.action,
        actor_user_id: log.actor_user_id,
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        meta: log.meta,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        created_at: log.created_at,
      })),
      ...(authLogs || []).map((log: any) => ({
        id: `auth-${log.id}`,
        source: 'auth',
        action: log.payload?.action || 'unknown',
        actor_user_id: log.payload?.actor_id || null,
        entity_type: 'auth',
        entity_id: log.payload?.traits?.user_id || null,
        meta: log.payload,
        ip_address: log.ip_address,
        user_agent: log.payload?.traits?.user_agent || null,
        created_at: log.created_at,
      })),
    ];

    // Сортувати за датою
    combinedLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return jsonResponse({ 
      logs: combinedLogs.slice(0, limit),
      total: combinedLogs.length 
    });
  } catch (error: any) {
    console.error('Get audit logs error:', error);
    return errorResponse('SERVER_ERROR', error.message, 500);
  }
}
