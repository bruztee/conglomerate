import useSWR from 'swr'
import { api } from '@/lib/api'

export function useAdminUsers() {
  const { data, error, isLoading, mutate } = useSWR(
    '/admin/users',
    async () => {
      const response = await api.adminGetUsers()
      if (response.success && response.data) {
        return (response.data as any).users || []
      }
      return []
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      shouldRetryOnError: false,
      onError: (err) => {
        console.error('useAdminUsers error:', err)
      },
    }
  )

  return {
    users: data || [],
    isLoading,
    error,
    refresh: mutate,
  }
}
