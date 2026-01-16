import useSWR from 'swr'
import { api } from '@/lib/api'

export function useReferralStats() {
  const { data, error, isLoading, mutate } = useSWR(
    '/referrals/stats',
    async () => {
      const response = await api.getReferralStats()
      if (response.success && response.data) {
        return response.data
      }
      return {
        total_referrals: 0,
        total_earnings: 0,
        referral_link: '',
        referral_code: '',
        referrals: []
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  )

  return {
    stats: data || {
      total_referrals: 0,
      total_earnings: 0,
      referral_link: '',
      referral_code: '',
      referrals: []
    },
    isLoading,
    error,
    refresh: mutate,
  }
}
