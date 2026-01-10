import { createClient } from '@supabase/supabase-js';
import type { Env } from '../types';

export function createUserSupabaseClient(env: Env, userJwt?: string) {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: {
      headers: userJwt ? { Authorization: `Bearer ${userJwt}` } : {},
    },
  });
  return supabase;
}

export function createServiceSupabaseClient(env: Env) {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  return supabase;
}
