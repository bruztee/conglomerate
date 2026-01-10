import type { Env } from '../types';
import { createServiceSupabaseClient } from '../utils/supabase';
import { jsonResponse, errorResponse } from '../utils/response';
import { logAudit } from '../utils/audit';
import { getUserFromRequest } from '../utils/auth';

export async function handleRegister(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as { email: string; password: string; referral_code?: string };
    
    if (!body.email || !body.password) {
      return errorResponse('VALIDATION_ERROR', 'Email and password are required', 400);
    }
    
    if (body.password.length < 8) {
      return errorResponse('VALIDATION_ERROR', 'Password must be at least 8 characters', 400);
    }
    
    const supabase = createServiceSupabaseClient(env);
    
    let referrerId: string | null = null;
    if (body.referral_code) {
      const { data: referrer } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', body.referral_code)
        .single();
      
      if (referrer) {
        referrerId = referrer.id;
      }
    }
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        emailRedirectTo: 'https://conglomerate-group.com/auth/login',
      },
    });
    
    if (authError || !authData.user) {
      return errorResponse('REGISTRATION_FAILED', authError?.message || 'Registration failed', 400);
    }
    
    if (referrerId) {
      await supabase
        .from('profiles')
        .update({ referred_by: referrerId })
        .eq('id', authData.user.id);
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (!profile) {
      return errorResponse('PROFILE_ERROR', 'Failed to create profile', 500);
    }
    
    await logAudit(env, authData.user.id, 'user.register', 'profiles', authData.user.id, { email: body.email }, request);
    
    return jsonResponse(
      {
        user: {
          id: authData.user.id,
          email: body.email,
          role: profile.role,
          referral_code: profile.referral_code,
        },
        session: authData.session,
      },
      201
    );
  } catch (error) {
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

export async function handleLogin(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as { email: string; password: string };
    
    if (!body.email || !body.password) {
      return errorResponse('VALIDATION_ERROR', 'Email and password are required', 400);
    }
    
    const supabase = createServiceSupabaseClient(env);
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });
    
    // Якщо помилка - перевірити чи це через неверифікований email
    if (authError) {
      // Спробувати знайти користувача по email
      const { data: users } = await supabase.auth.admin.listUsers();
      const user = users?.users?.find(u => u.email === body.email);
      
      if (user && !user.email_confirmed_at) {
        return errorResponse('EMAIL_NOT_VERIFIED', 'Please verify your email before logging in', 403);
      }
      
      return errorResponse('LOGIN_FAILED', 'Invalid credentials', 401);
    }
    
    if (!authData.user || !authData.session) {
      return errorResponse('LOGIN_FAILED', 'Invalid credentials', 401);
    }
    
    if (!authData.user.email_confirmed_at) {
      return errorResponse('EMAIL_NOT_VERIFIED', 'Please verify your email before logging in', 403);
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (!profile) {
      return errorResponse('PROFILE_ERROR', 'Profile not found', 404);
    }
    
    if (profile.status !== 'active') {
      return errorResponse('ACCOUNT_BLOCKED', 'Account is not active', 403);
    }
    
    await logAudit(env, authData.user.id, 'user.login', 'profiles', authData.user.id, { email: body.email }, request);
    
    return jsonResponse({
      user: {
        id: authData.user.id,
        email: body.email,
        role: profile.role,
        referral_code: profile.referral_code,
      },
      session: authData.session,
    });
  } catch (error) {
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

export async function handleLogout(request: Request, env: Env): Promise<Response> {
  try {
    const user = await getUserFromRequest(request, env);
    
    if (user) {
      await logAudit(env, user.id, 'user.logout', 'profiles', user.id, {}, request);
    }
    
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.substring(7);
      const supabase = createServiceSupabaseClient(env);
      await supabase.auth.admin.signOut(token);
    }
    
    return jsonResponse({ message: 'Logged out successfully' });
  } catch (error) {
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

export async function handleMe(request: Request, env: Env): Promise<Response> {
  try {
    const user = await getUserFromRequest(request, env);
    
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
    }
    
    return jsonResponse({ user });
  } catch (error) {
    return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
  }
}

export async function handleResendVerification(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as { email: string };
    
    if (!body.email) {
      return errorResponse('VALIDATION_ERROR', 'Email is required', 400);
    }
    
    const supabase = createServiceSupabaseClient(env);
    
    // Resend verification email
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: body.email,
      options: {
        emailRedirectTo: 'https://conglomerate-group.com/auth/login',
      },
    });
    
    if (error) {
      return errorResponse('RESEND_FAILED', error.message, 400);
    }
    
    return jsonResponse({ message: 'Verification email sent' });
  } catch (error) {
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

export async function handleForgotPassword(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as { email: string };
    
    if (!body.email) {
      return errorResponse('VALIDATION_ERROR', 'Email is required', 400);
    }
    
    const supabase = createServiceSupabaseClient(env);
    
    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(body.email, {
      redirectTo: 'https://conglomerate-eight.vercel.app/auth/reset-password',
    });
    
    if (error) {
      return errorResponse('RESET_FAILED', error.message, 400);
    }
    
    return jsonResponse({ message: 'Password reset email sent' });
  } catch (error) {
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

export async function handleResetPassword(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as { password: string; access_token: string };
    
    if (!body.password) {
      return errorResponse('VALIDATION_ERROR', 'Password is required', 400);
    }
    
    if (!body.access_token) {
      return errorResponse('VALIDATION_ERROR', 'Access token is required', 400);
    }
    
    const supabase = createServiceSupabaseClient(env);
    
    // Встановити сесію з access_token з reset link
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: body.access_token,
      refresh_token: body.access_token, // Для reset flow використовуємо той самий токен
    });
    
    if (sessionError) {
      return errorResponse('SESSION_ERROR', 'Invalid or expired reset link', 400);
    }
    
    // Оновити пароль користувача
    const { error } = await supabase.auth.updateUser({
      password: body.password,
    });
    
    if (error) {
      return errorResponse('UPDATE_FAILED', error.message, 400);
    }
    
    return jsonResponse({ message: 'Password updated successfully' });
  } catch (error) {
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

export async function handleRefreshToken(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as { refresh_token: string };
    
    if (!body.refresh_token) {
      return errorResponse('VALIDATION_ERROR', 'Refresh token is required', 400);
    }
    
    const supabase = createServiceSupabaseClient(env);
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: body.refresh_token,
    });
    
    if (error || !data.session) {
      return errorResponse('REFRESH_FAILED', 'Failed to refresh token', 401);
    }
    
    return jsonResponse({ session: data.session });
  } catch (error) {
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}
