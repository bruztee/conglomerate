import type { Env } from '../types';
import { createServiceSupabaseClient } from '../utils/supabase';
import { jsonResponse, errorResponse } from '../utils/response';
import { logAudit } from '../utils/audit';
import { getUserFromRequest } from '../utils/auth';

export async function handleRegister(request: Request, env: Env): Promise<Response> {
  console.log('[REGISTER] Starting registration...');
  try {
    const body = await request.json() as { email: string; password: string; referral_code?: string };
    console.log('[REGISTER] Request:', { email: body.email, has_password: !!body.password, referral_code: body.referral_code });
    
    if (!body.email || !body.password) {
      console.log('[REGISTER] Validation error: Missing email or password');
      return errorResponse('VALIDATION_ERROR', 'Email and password are required', 400);
    }
    
    if (body.password.length < 8) {
      console.log('[REGISTER] Validation error: Password too short');
      return errorResponse('VALIDATION_ERROR', 'Password must be at least 8 characters', 400);
    }
    
    let finalReferralCode = body.referral_code;
    const cookieHeader = request.headers.get('Cookie');
    if (cookieHeader) {
      const cookiePairs = cookieHeader.split(';').map(c => c.trim());
      const refCookie = cookiePairs.find(c => c.startsWith('referral_code='));
      if (refCookie) {
        const cookieRefCode = refCookie.split('=')[1];
        if (cookieRefCode) {
          finalReferralCode = cookieRefCode;
          console.log('[REGISTER] Using referral code from cookie:', finalReferralCode);
        }
      }
    }
    
    const supabase = createServiceSupabaseClient(env);
    
    let referrerId: string | null = null;
    if (finalReferralCode) {
      console.log('[REGISTER] Verifying referral code:', finalReferralCode);
      const { data: referrer } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', finalReferralCode)
        .single();
      
      if (referrer) {
        referrerId = referrer.id;
        console.log('[REGISTER] Referral verified, referrer_id:', referrerId);
      } else {
        console.log('[REGISTER] Invalid referral code:', finalReferralCode);
      }
    }
    
    console.log('[REGISTER] Calling supabase.auth.signUp...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: {
          referred_by: referrerId,
        },
        emailRedirectTo: 'https://conglomerate-g.com/auth/callback',
      },
    });
    
    if (authError || !authData.user) {
      console.error('[REGISTER] Auth signup failed:', JSON.stringify(authError));
      return errorResponse('REGISTRATION_FAILED', authError?.message || 'Registration failed', 400);
    }
    console.log('[REGISTER] Auth signup successful, user_id:', authData.user.id);
    console.log('[REGISTER] User email_confirmed_at:', authData.user.email_confirmed_at);
    console.log('[REGISTER] Session exists:', !!authData.session);
    console.log('[REGISTER] User confirmation_sent_at:', authData.user.confirmation_sent_at);
    
    // Генерація унікального referral_code для нового користувача
    const generateReferralCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    // Перевірка чи профіль вже існує і має referral_code
    console.log('[REGISTER] Fetching profile for user:', authData.user.id);
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (profileError || !profile) {
      console.error('[REGISTER] Profile fetch error:', JSON.stringify(profileError));
      console.error('[REGISTER] Profile data:', profile);
      return errorResponse('PROFILE_ERROR', `Failed to fetch profile: ${profileError?.message || 'Unknown error'}`, 500);
    }
    console.log('[REGISTER] Profile found, has referral_code:', !!profile.referral_code);

    // Якщо немає referral_code - створюємо його
    if (!profile.referral_code) {
      let newReferralCode = generateReferralCode();
      let isUnique = false;
      let attempts = 0;
      
      // Перевіряємо унікальність (максимум 5 спроб)
      while (!isUnique && attempts < 5) {
        const { data: existingCode } = await supabase
          .from('profiles')
          .select('id')
          .eq('referral_code', newReferralCode)
          .single();
        
        if (!existingCode) {
          isUnique = true;
        } else {
          newReferralCode = generateReferralCode();
          attempts++;
        }
      }
      
      // Оновлюємо профіль з новим referral_code
      const updates: any = { referral_code: newReferralCode };
      if (referrerId) {
        updates.referred_by = referrerId;
      }
      
      console.log('[REGISTER] Updating profile with:', JSON.stringify(updates));
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', authData.user.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('[REGISTER] Profile update error:', JSON.stringify(updateError));
        return errorResponse('PROFILE_UPDATE_ERROR', `Failed to update profile: ${updateError.message}`, 500);
      }
      
      if (updatedProfile) {
        profile = updatedProfile;
        console.log('[REGISTER] Generated referral_code:', newReferralCode, 'for user:', authData.user.id);
      }
    } else if (referrerId) {
      // Якщо referral_code вже є, просто оновлюємо referred_by
      console.log('[REGISTER] Updating referred_by:', referrerId);
      const { error: refUpdateError } = await supabase
        .from('profiles')
        .update({ referred_by: referrerId })
        .eq('id', authData.user.id);
      
      if (refUpdateError) {
        console.error('[REGISTER] Referred_by update error:', JSON.stringify(refUpdateError));
      } else {
        console.log('[REGISTER] User', authData.user.id, 'referred by', referrerId);
      }
    }
    
    console.log('[REGISTER] Logging audit...');
    await logAudit(env, authData.user.id, 'user.register', 'profiles', authData.user.id, { email: body.email }, request);
    
    console.log('[REGISTER] Registration successful for:', body.email);
    const response = jsonResponse(
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
    
    // Set httpOnly cookies for BOTH access and refresh tokens
    if (authData.session?.access_token) {
      response.headers.append('Set-Cookie', `access_token=${authData.session.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`);
    }
    if (authData.session?.refresh_token) {
      response.headers.append('Set-Cookie', `refresh_token=${authData.session.refresh_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`); // 30 days
    }
    
    return response;
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
    
    const response = jsonResponse({
      user: {
        id: authData.user.id,
        email: authData.user.email || '',
        role: profile?.role || 'user',
        referral_code: profile?.referral_code,
        full_name: profile?.full_name,
        phone_verified: !!authData.user.phone_confirmed_at,
        phone: authData.user.phone,
      },
      session: authData.session,
    });
    
    // Set httpOnly cookies for BOTH access and refresh tokens
    if (authData.session?.access_token) {
      response.headers.append('Set-Cookie', `access_token=${authData.session.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`);
    }
    if (authData.session?.refresh_token) {
      response.headers.append('Set-Cookie', `refresh_token=${authData.session.refresh_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`); // 30 days
    }
    
    return response;
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
    
    const response = jsonResponse({ message: 'Logged out successfully' });
    
    response.headers.append('Set-Cookie', 'access_token=; Domain=.conglomerate-g.com; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
    response.headers.append('Set-Cookie', 'refresh_token=; Domain=.conglomerate-g.com; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
    response.headers.append('Set-Cookie', 'auth_flow=; Domain=.conglomerate-g.com; Path=/; Secure; SameSite=Lax; Max-Age=0');
    
    return response;
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
    
    const supabase = createServiceSupabaseClient(env);
    
    // Отримати повний профіль з усіма даними
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (!profile) {
      return errorResponse('PROFILE_NOT_FOUND', 'Profile not found', 404);
    }
    
    // Отримати phone з auth.users через admin API
    const { data: authUserData } = await supabase.auth.admin.getUserById(user.id);
    const authUser = authUserData?.user;
    
    // Отримати глобальні ліміти депозитів
    const { data: settings } = await supabase
      .from('system_settings')
      .select('key, value')
      .in('key', ['min_deposit', 'max_deposit']);
    
    const settingsMap = new Map(settings?.map(s => [s.key, s.value]) || []);
    const globalMin = parseFloat(settingsMap.get('min_deposit') || '10');
    const globalMax = parseFloat(settingsMap.get('max_deposit') || '100000');
    
    // Якщо у користувача є індивідуальний ліміт - використати його
    const userMax = profile.max_deposit ? parseFloat(profile.max_deposit) : null;
    const maxDeposit = userMax !== null ? userMax : globalMax;
    
    return jsonResponse({
      user: {
        id: user.id,
        email: user.email || '',
        role: profile.role,
        referral_code: profile.referral_code,
        full_name: profile.full_name,
        phone: authUser?.phone || null,
        phone_verified: !!authUser?.phone_confirmed_at,
        // Додаткові дані з profiles
        plan: profile.plan || 'Стандарт',
        monthly_percentage: profile.monthly_percentage || 0,
        deposit_limits: {
          min_deposit: globalMin,
          max_deposit: maxDeposit,
          user_max_deposit: userMax,
          global_max_deposit: globalMax,
        },
      },
    });
  } catch (error) {
    console.error('❌ handleMe error:', error);
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
        emailRedirectTo: 'https://conglomerate-g.com/auth/callback',
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

export async function handleSetSession(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as { access_token: string; refresh_token: string; type?: string };
    
    if (!body.access_token || !body.refresh_token) {
      return errorResponse('VALIDATION_ERROR', 'Tokens are required', 400);
    }
    
    const supabase = createServiceSupabaseClient(env);
    
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: body.access_token,
      refresh_token: body.refresh_token,
    });
    
    if (sessionError || !sessionData.session || !sessionData.user) {
      return errorResponse('SESSION_ERROR', 'Invalid tokens', 400);
    }
    
    const origin = request.headers.get('Origin');
    const response = jsonResponse({ 
      message: 'Session established',
      user: {
        id: sessionData.user.id,
        email: sessionData.user.email,
        full_name: sessionData.user.user_metadata?.full_name,
      }
    });
    
    if (origin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    
    if (body.access_token) {
      response.headers.append('Set-Cookie', `access_token=${body.access_token}; Domain=.conglomerate-g.com; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`);
    }
    if (body.refresh_token) {
      response.headers.append('Set-Cookie', `refresh_token=${body.refresh_token}; Domain=.conglomerate-g.com; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`);
    }
    
    if (body.type === 'signup' || body.type === 'recovery') {
      response.headers.append('Set-Cookie', `auth_flow=${body.type}; Domain=.conglomerate-g.com; Path=/; Secure; SameSite=Lax; Max-Age=300`);
    }
    
    return response;
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
      redirectTo: 'https://conglomerate-g.com/auth/callback',
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
    const user = await getUserFromRequest(request, env);
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
    }
    
    const body = await request.json() as { password: string };
    
    if (!body.password) {
      return errorResponse('VALIDATION_ERROR', 'Password is required', 400);
    }
    
    const supabase = createServiceSupabaseClient(env);
    
    const cookieHeader = request.headers.get('Cookie');
    let accessToken: string | undefined;
    
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(c => c.trim());
      const tokenCookie = cookies.find(c => c.startsWith('access_token='));
      if (tokenCookie) {
        accessToken = tokenCookie.split('=')[1];
      }
    }
    
    if (!accessToken) {
      return errorResponse('UNAUTHORIZED', 'No session token', 401);
    }
    
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: accessToken,
    });
    
    if (sessionError) {
      return errorResponse('SESSION_ERROR', 'Invalid session', 400);
    }
    
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
    // Читаємо refresh_token з httpOnly cookie (пріоритет) або з body (fallback)
    let refreshToken: string | undefined;
    
    const cookieHeader = request.headers.get('Cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(c => c.trim());
      const refreshCookie = cookies.find(c => c.startsWith('refresh_token='));
      if (refreshCookie) {
        refreshToken = refreshCookie.split('=')[1];
      }
    }
    
    // Fallback: спробувати з body (для сумісності)
    if (!refreshToken) {
      try {
        const body = await request.json() as { refresh_token?: string };
        refreshToken = body.refresh_token;
      } catch (e) {
        // Body не JSON або порожнє
      }
    }
    
    if (!refreshToken) {
      return errorResponse('VALIDATION_ERROR', 'Refresh token is required', 400);
    }
    
    const supabase = createServiceSupabaseClient(env);
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });
    
    if (error || !data.session) {
      return errorResponse('REFRESH_FAILED', 'Failed to refresh token', 401);
    }
    
    const response = jsonResponse({ session: data.session });
    
    // Оновити httpOnly cookies з новими токенами
    if (data.session?.access_token) {
      response.headers.append('Set-Cookie', `access_token=${data.session.access_token}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=604800`);
    }
    if (data.session?.refresh_token) {
      response.headers.append('Set-Cookie', `refresh_token=${data.session.refresh_token}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=2592000`);
    }
    
    return response;
  } catch (error) {
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

export async function handleUpdateEmail(request: Request, env: Env): Promise<Response> {
  try {
    const user = await getUserFromRequest(request, env);
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const body = await request.json() as { email: string };
    
    if (!body.email) {
      return errorResponse('VALIDATION_ERROR', 'Email is required', 400);
    }
    
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return errorResponse('UNAUTHORIZED', 'No token provided', 401);
    }

    const supabase = createServiceSupabaseClient(env);
    await supabase.auth.setSession({ access_token: token, refresh_token: token });
    
    const { error } = await supabase.auth.updateUser({ email: body.email });
    
    if (error) {
      return errorResponse('UPDATE_FAILED', error.message, 400);
    }
    
    return jsonResponse({ message: 'Email update initiated. Please check your new email for confirmation.' });
  } catch (error) {
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

export async function handleUpdatePhone(request: Request, env: Env): Promise<Response> {
  try {
    const user = await getUserFromRequest(request, env);
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const body = await request.json() as { phone: string };
    
    if (!body.phone) {
      return errorResponse('VALIDATION_ERROR', 'Phone is required', 400);
    }
    
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return errorResponse('UNAUTHORIZED', 'No token provided', 401);
    }

    const supabase = createServiceSupabaseClient(env);
    await supabase.auth.setSession({ access_token: token, refresh_token: token });
    
    const { error } = await supabase.auth.updateUser({ phone: body.phone });
    
    if (error) {
      return errorResponse('UPDATE_FAILED', error.message, 400);
    }
    
    return jsonResponse({ message: 'Phone updated successfully' });
  } catch (error) {
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

export async function handleUpdatePassword(request: Request, env: Env): Promise<Response> {
  try {
    const user = await getUserFromRequest(request, env);
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const body = await request.json() as { password: string };
    
    if (!body.password) {
      return errorResponse('VALIDATION_ERROR', 'Password is required', 400);
    }

    if (body.password.length < 6) {
      return errorResponse('VALIDATION_ERROR', 'Password must be at least 6 characters', 400);
    }
    
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return errorResponse('UNAUTHORIZED', 'No token provided', 401);
    }

    const supabase = createServiceSupabaseClient(env);
    await supabase.auth.setSession({ access_token: token, refresh_token: token });
    
    const { error } = await supabase.auth.updateUser({ password: body.password });
    
    if (error) {
      return errorResponse('UPDATE_FAILED', error.message, 400);
    }
    
    return jsonResponse({ message: 'Password updated successfully' });
  } catch (error) {
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

export async function handleSetName(request: Request, env: Env): Promise<Response> {
  try {
    const user = await getUserFromRequest(request, env);
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
    }
    const body = await request.json() as { full_name: string };
    
    if (!body.full_name || body.full_name.trim().length === 0) {
      return errorResponse('VALIDATION_ERROR', 'Full name is required', 400);
    }
    
    const supabase = createServiceSupabaseClient(env);
    
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: body.full_name.trim() })
      .eq('id', user.id);
    
    if (error) {
      return errorResponse('UPDATE_FAILED', error.message, 400);
    }
    
    await logAudit(env, user.id, 'user.set_name', 'profiles', user.id, { full_name: body.full_name }, request);
    
    return jsonResponse({ message: 'Name updated successfully' });
  } catch (error) {
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

export async function handleSendPhoneOTP(request: Request, env: Env): Promise<Response> {
  try {
    const user = await getUserFromRequest(request, env);
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
    }
    const body = await request.json() as { phone: string };
    
    if (!body.phone || body.phone.trim().length === 0) {
      return errorResponse('VALIDATION_ERROR', 'Phone number is required', 400);
    }
    
    console.log('📱 Sending OTP to phone:', body.phone.trim(), 'for user:', user.id);
    
    const supabase = createServiceSupabaseClient(env);
    
    // Використовуємо Admin API для оновлення phone і відправки OTP
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      phone: body.phone.trim(),
    });
    
    if (updateError) {
      console.error('❌ Update phone error:', updateError.message);
      return errorResponse('UPDATE_FAILED', `Failed to update phone: ${updateError.message}`, 400);
    }
    
    // Тепер відправляємо OTP на цей номер
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: body.phone.trim()
    });
    
    if (otpError) {
      console.error('❌ OTP send error:', otpError.message);
      return errorResponse('OTP_SEND_FAILED', `Failed to send OTP: ${otpError.message}`, 400);
    }
    
    console.log('✅ OTP sent successfully to:', body.phone.trim());
    
    await logAudit(env, user.id, 'phone.otp_sent', 'profiles', user.id, { phone: body.phone }, request);
    
    return jsonResponse({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('❌ handleSendPhoneOTP error:', error);
    return errorResponse('SERVER_ERROR', `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
  }
}

export async function handleVerifyEmail(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as { access_token: string; refresh_token: string };
    
    if (!body.access_token || !body.refresh_token) {
      return errorResponse('VALIDATION_ERROR', 'Tokens are required', 400);
    }
    
    const supabase = createServiceSupabaseClient(env);
    
    // Встановити сесію з токенами для верифікації
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: body.access_token,
      refresh_token: body.refresh_token,
    });
    
    if (sessionError || !sessionData.user) {
      console.error('❌ Session error:', sessionError?.message);
      return errorResponse('VERIFICATION_FAILED', 'Invalid verification link', 400);
    }
    
    // Перевірити чи email підтверджено
    if (!sessionData.user.email_confirmed_at) {
      console.log('⚠️ Email not yet confirmed:', sessionData.user.email);
      return errorResponse('EMAIL_NOT_CONFIRMED', 'Email not yet confirmed', 400);
    }
    
    console.log('✅ Email verified for user:', sessionData.user.id, sessionData.user.email);
    
    // Отримати профіль користувача
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sessionData.user.id)
      .single();
    
    if (!profile) {
      return errorResponse('PROFILE_ERROR', 'Profile not found', 404);
    }
    
    await logAudit(env, sessionData.user.id, 'user.email_verified', 'profiles', sessionData.user.id, { email: sessionData.user.email }, request);
    
    const response = jsonResponse({
      message: 'Email verified successfully',
      user: {
        id: sessionData.user.id,
        email: sessionData.user.email || '',
        role: profile.role,
        referral_code: profile.referral_code,
        full_name: profile.full_name,
      },
      session: sessionData.session,
    });
    
    // Set httpOnly cookies for session
    if (sessionData.session?.access_token) {
      response.headers.append('Set-Cookie', `access_token=${sessionData.session.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`);
    }
    if (sessionData.session?.refresh_token) {
      response.headers.append('Set-Cookie', `refresh_token=${sessionData.session.refresh_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`);
    }
    
    return response;
  } catch (error) {
    console.error('❌ handleVerifyEmail error:', error);
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

export async function handleVerifyPhoneOTP(request: Request, env: Env): Promise<Response> {
  try {
    const user = await getUserFromRequest(request, env);
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
    }
    const body = await request.json() as { phone: string; token: string };
    
    if (!body.phone || !body.token) {
      return errorResponse('VALIDATION_ERROR', 'Phone and token are required', 400);
    }
    
    console.log('🔐 Verifying OTP for phone:', body.phone, 'user:', user.id);
    
    const supabase = createServiceSupabaseClient(env);
    
    // СПОЧАТКУ верифікуємо OTP
    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone: body.phone,
      token: body.token,
      type: 'sms'
    });
    
    if (verifyError) {
      console.error('❌ OTP verification failed:', verifyError.message);
      return errorResponse('OTP_VERIFY_FAILED', verifyError.message, 400);
    }
    
    console.log('✅ OTP verified successfully');
    
    // ПІСЛЯ успішної верифікації - оновлюємо phone в auth.users
    // phone_confirmed_at встановлюється автоматично після verifyOtp
    const { error: updateAuthError } = await supabase.auth.admin.updateUserById(
      user.id,
      { 
        phone: body.phone
      }
    );
    
    if (updateAuthError) {
      console.error('⚠️ Could not update phone in auth.users:', updateAuthError.message);
    } else {
      console.log('✅ Phone updated in auth.users');
    }
    
    // ТАКОЖ оновлюємо phone в profiles для відображення в налаштуваннях
    const { error: updateProfileError } = await supabase
      .from('profiles')
      .update({ phone: body.phone, phone_verified: true })
      .eq('id', user.id);
    
    if (updateProfileError) {
      console.warn('⚠️ Could not update phone in profiles:', updateProfileError.message);
    } else {
      console.log('✅ Phone updated in profiles');
    }
    
    await logAudit(env, user.id, 'phone.verified', 'profiles', user.id, { phone: body.phone }, request);
    
    return jsonResponse({ message: 'Phone verified successfully' });
  } catch (error) {
    console.error('❌ handleVerifyPhoneOTP error:', error);
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}
