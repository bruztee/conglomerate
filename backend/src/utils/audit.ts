import type { Env } from '../types';
import { createServiceSupabaseClient } from './supabase';

export async function logAudit(
  env: Env,
  actorUserId: string | null,
  action: string,
  entityType: string | null,
  entityId: string | null,
  meta: any,
  request: Request
) {
  const supabase = createServiceSupabaseClient(env);
  
  const cfData = (request as any).cf;
  const ipAddress = request.headers.get('CF-Connecting-IP') || 
                    request.headers.get('X-Forwarded-For')?.split(',')[0] ||
                    cfData?.colo || null;
  
  const userAgent = request.headers.get('User-Agent');
  
  await supabase.from('audit_log').insert({
    actor_user_id: actorUserId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    meta,
    ip_address: ipAddress,
    user_agent: userAgent,
  });
}
