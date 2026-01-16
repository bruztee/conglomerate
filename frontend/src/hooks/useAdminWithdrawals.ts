import useSWR from 'swr'
import { api } from '@/lib/api'

export function useAdminWithdrawals() {
  const { data, error, isLoading, mutate } = useSWR(
    '/admin/withdrawals',
    async () => {
      const response = await api.adminGetWithdrawals()
      if (response.success && response.data) {
        return (response.data as any).withdrawals || []
      }
      return []
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      shouldRetryOnError: false,
      onError: (err) => {
        console.error('useAdminWithdrawals error:', err)
      },
    }
  )

  return {
    withdrawals: data || [],
    isLoading,
    error,
    refresh: mutate,
  }
}
