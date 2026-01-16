import useSWR from 'swr'
import { api } from '@/lib/api'

export function useAdminPaymentMethods() {
  const { data, error, isLoading, mutate } = useSWR(
    '/admin/payment-methods',
    async () => {
      const response = await api.adminGetPaymentMethods()
      if (response.success && response.data) {
        return (response.data as any).payment_methods || []
      }
      return []
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      shouldRetryOnError: false,
      onError: (err) => {
        console.error('useAdminPaymentMethods error:', err)
      },
    }
  )

  return {
    paymentMethods: data || [],
    isLoading,
    error,
    refresh: mutate,
  }
}
