import { Env } from '../types';
import { createServiceSupabaseClient } from '../utils/supabase';
import { jsonResponse, errorResponse } from '../utils/response';
import { getUserFromRequest } from '../utils/auth';

export async function handleGetReferralStats(request: Request, env: Env): Promise<Response> {
  try {
    const user = await getUserFromRequest(request, env);
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Not authenticated', 401);
    }

    const supabase = createServiceSupabaseClient(env);

    // Отримати профіль користувача з referral_code
    let { data: profile } = await supabase
      .from('profiles')
      .select('referral_code')
      .eq('id', user.id)
      .single();

    // КРИТИЧНО: Якщо немає referral_code - створюємо його
    if (!profile?.referral_code) {
      console.log('⚠️ User', user.id, 'has no referral_code, generating...');
      
      const generateReferralCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };
      
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
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ referral_code: newReferralCode })
        .eq('id', user.id)
        .select('referral_code')
        .single();
      
      if (updateError || !updatedProfile) {
        console.error('❌ Failed to create referral_code:', updateError);
        return errorResponse('SERVER_ERROR', 'Failed to generate referral code', 500);
      }
      
      profile = updatedProfile;
      console.log('✅ Generated referral_code:', newReferralCode, 'for user:', user.id);
    }

    // Отримати всіх рефералів
    const { data: referrals } = await supabase
      .from('profiles')
      .select('id, full_name, email, created_at')
      .eq('referred_by', profile.referral_code)
      .order('created_at', { ascending: false });

    // Отримати статистику бонусів
    const { data: bonuses } = await supabase
      .from('ledger_entries')
      .select('amount, created_at, description')
      .eq('ref_table', 'profiles')
      .eq('type', 'referral_bonus')
      .like('description', `%${profile.referral_code}%`)
      .order('created_at', { ascending: false });

    const totalEarned = bonuses?.reduce((sum, b) => sum + b.amount, 0) || 0;

    return jsonResponse({
      referral_code: profile.referral_code,
      referral_link: `https://conglomerate-eight.vercel.app/?ref=${profile.referral_code}`,
      stats: {
        total_referrals: referrals?.length || 0,
        total_earned: totalEarned,
      },
      referrals: referrals || [],
      bonuses: bonuses || [],
    });
  } catch (error) {
    console.error('❌ handleGetReferralStats error:', error);
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}

export async function handleSetReferralCookie(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const refCode = url.searchParams.get('ref');

    if (!refCode) {
      return errorResponse('VALIDATION_ERROR', 'Referral code is required', 400);
    }

    // Перевірити чи існує такий referral code
    const supabase = createServiceSupabaseClient(env);
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, referral_code')
      .eq('referral_code', refCode)
      .single();

    if (!profile) {
      return errorResponse('NOT_FOUND', 'Referral code not found', 404);
    }

    console.log('✅ Setting referral cookie for code:', refCode);

    const response = jsonResponse({ 
      message: 'Referral code saved',
      referral_code: refCode,
    });

    // Встановити httpOnly cookie на 30 днів
    response.headers.set(
      'Set-Cookie',
      `referral_code=${refCode}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`
    );

    return response;
  } catch (error) {
    console.error('❌ handleSetReferralCookie error:', error);
    return errorResponse('SERVER_ERROR', 'Internal server error', 500);
  }
}
