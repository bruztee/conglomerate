import useSWR from 'swr'
import { api } from '@/lib/api'

export function useAdminInvestments() {
  const { data, error, isLoading, mutate } = useSWR(
    '/admin/investments',
    async () => {
      const response = await api.adminGetInvestments()
      if (response.success && response.data) {
        return (response.data as any).investments || []
      }
      return []
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      shouldRetryOnError: false,
      onError: (err) => {
        console.error('useAdminInvestments error:', err)
      },
    }
  )

  return {
    investments: data || [],
    isLoading,
    error,
    refresh: mutate,
  }
}
