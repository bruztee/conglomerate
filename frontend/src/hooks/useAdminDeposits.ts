import useSWR from 'swr'
import { api } from '@/lib/api'

export function useAdminDeposits() {
  const { data, error, isLoading, mutate } = useSWR(
    '/admin/deposits',
    async () => {
      const response = await api.adminGetDeposits()
      if (response.success && response.data) {
        return (response.data as any).deposits || []
      }
      return []
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      shouldRetryOnError: false,
      onError: (err) => {
        console.error('useAdminDeposits error:', err)
      },
    }
  )

  return {
    deposits: data || [],
    isLoading,
    error,
    refresh: mutate,
  }
}
