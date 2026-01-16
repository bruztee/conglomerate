import useSWR from 'swr'
import { api } from '@/lib/api'

interface WalletData {
  balance: number
  locked_amount: number
  total_profit: number
  total_invested: number
}

export function useWallet() {
  const { data, error, isLoading, mutate } = useSWR<WalletData>(
    '/wallet',
    async () => {
      const result = await api.getWallet()
      if (result.success && result.data) {
        const data = result.data as any
        return {
          balance: data.balance || 0,
          locked_amount: data.locked_amount || 0,
          total_profit: data.total_profit || 0,
          total_invested: data.total_invested || 0,
        }
      }
      throw new Error('Failed to fetch wallet')
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // 5 seconds
    }
  )

  return {
    wallet: data,
    isLoading,
    isError: error,
    refresh: mutate,
  }
}
