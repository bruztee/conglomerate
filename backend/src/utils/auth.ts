import type { Env } from '../types';
import { createServiceSupabaseClient } from './supabase';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export async function getUserFromRequest(request: Request, env: Env): Promise<AuthUser | null> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  
  const supabase = createServiceSupabaseClient(env);
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return null;
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single();
  
  if (!profile || profile.status !== 'active') {
    return null;
  }
  
  return {
    id: user.id,
    email: user.email || '',
    role: profile.role,
  };
}

export async function requireAuth(request: Request, env: Env): Promise<AuthUser> {
  const user = await getUserFromRequest(request, env);
  
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  
  return user;
}

export async function requireAdmin(request: Request, env: Env): Promise<AuthUser> {
  const user = await requireAuth(request, env);
  
  if (user.role !== 'admin') {
    throw new Error('FORBIDDEN');
  }
  
  return user;
}
