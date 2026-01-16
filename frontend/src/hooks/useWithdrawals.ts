import useSWR from 'swr'
import { api } from '@/lib/api'

interface Withdrawal {
  id: string
  depositId: string
  amount: number
  percentage: number
  method: string
  status: string
  createdDate: string
  withdrawDate?: string
}

export function useWithdrawals() {
  const { data, error, isLoading, mutate } = useSWR<Withdrawal[]>(
    '/withdrawals',
    async () => {
      const result = await api.getWithdrawals()
      if (result.success && result.data) {
        const withdrawals = (result.data as any).withdrawals || []
        return withdrawals.map((w: any) => ({
          id: w.id,
          depositId: w.account_id,
          amount: w.amount,
          percentage: 0,
          method: w.method || 'USDT',
          status: w.status === 'approved' ? 'completed' : w.status === 'requested' ? 'pending' : 'rejected',
          createdDate: w.created_at,
          withdrawDate: w.processed_at,
        }))
      }
      throw new Error('Failed to fetch withdrawals')
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      shouldRetryOnError: false,
      onError: (err) => {
        console.error('useWithdrawals error:', err)
      },
    }
  )

  return {
    withdrawals: data || [],
    isLoading,
    isError: error,
    refresh: mutate,
  }
}
