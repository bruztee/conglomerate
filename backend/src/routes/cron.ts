import type { Env } from '../types';
import { createServiceSupabaseClient } from '../utils/supabase';

/**
 * Cron job для нарахування процентів
 * Викликається автоматично кожної хвилини
 * 
 * БЕТОННА АРХІТЕКТУРА:
 * - Вся логіка в SQL функції accrue_investments(v_now)
 * - Advisory lock + FOR UPDATE SKIP LOCKED + optimistic lock
 * - Атомарне оновлення accrued_interest = accrued_interest + v_interest
 * - last_accrued_at = old + повні_хвилини (зберігаємо дробову частину)
 * - Розрахунок в numeric (без JS float помилок)
 */
export async function handleAccrueInterest(env: Env): Promise<void> {
  console.log('[CRON_ACCRUE] Starting interest accrual job...');
  const supabase = createServiceSupabaseClient(env);
  const now = new Date();
  
  try {
    console.log('[CRON_ACCRUE] Calling accrue_investments RPC...');
    const { data, error } = await supabase.rpc('accrue_investments', {
      v_now: now.toISOString()
    });

    if (error) {
      console.error('[CRON_ACCRUE] RPC error:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('[CRON_ACCRUE] No accrual data returned');
      return;
    }

    const result = data[0];
    const processedCount = result.processed_count || 0;
    const totalAccrued = Number(result.total_accrued || 0);

    if (processedCount === 0) {
      console.log('[CRON_ACCRUE] No active investments (or job already running)');
      return;
    }

    console.log(`[CRON_ACCRUE] SUCCESS - Processed: ${processedCount} investments, Total accrued: ${totalAccrued.toFixed(8)} USD`);
  } catch (error) {
    console.error('[CRON_ACCRUE] Exception:', error);
  }
}
