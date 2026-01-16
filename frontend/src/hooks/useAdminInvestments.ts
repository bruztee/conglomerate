import useSWR from 'swr'
import { api } from '@/lib/api'

export function useAdminInvestments() {
  const { data, error, isLoading, mutate } = useSWR(
    '/admin/investments',
    async () => {
      // Використовуємо deposits endpoint який повертає investments через deposits
      const response = await api.adminGetDeposits()
      if (response.success && response.data) {
        const deposits = (response.data as any).deposits || []
        // Витягуємо всі investments з deposits
        const investments: any[] = []
        deposits.forEach((d: any) => {
          if (d.investments && Array.isArray(d.investments)) {
            investments.push(...d.investments)
          }
        })
        return investments
      }
      return []
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  )

  return {
    investments: data || [],
    isLoading,
    error,
    refresh: mutate,
  }
}
