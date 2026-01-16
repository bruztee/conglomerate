import useSWR from 'swr'
import { api } from '@/lib/api'

interface Deposit {
  id: string
  amount: number
  frozen: number
  percentage: number
  profit: number
  available?: number
  date: string
  withdrawDate?: string
  status: string
  withdrawn?: number
  locked?: number
  network?: string
  coin?: string
}

export function useDeposits() {
  const { data, error, isLoading, mutate } = useSWR<{
    active: Deposit[]
    history: Deposit[]
  }>(
    '/deposits',
    async () => {
      const [depositsResult, investmentsResult] = await Promise.all([
        api.getDeposits(),
        api.getInvestments(),
      ])

      if (!depositsResult.success || !investmentsResult.success) {
        throw new Error('Failed to fetch deposits')
      }

      const deposits = (depositsResult.data as any)?.deposits || []
      const investments = (investmentsResult.data as any)?.investments || []

      // Create investments map
      const investmentsMap = new Map()
      investments.forEach((inv: any) => {
        if (inv.deposit_id) {
          investmentsMap.set(inv.deposit_id, inv)
        }
      })

      // Active deposits (investment.status === 'active')
      const active = deposits
        .filter((d: any) => {
          const investment = investmentsMap.get(d.id)
          return investment && investment.status === 'active'
        })
        .map((d: any) => {
          const investment = investmentsMap.get(d.id)
          const paymentDetails = d.payment_details || {}
          const lockedAmount = investment ? parseFloat(investment.locked_amount || 0) : 0
          const totalAmount = investment ? parseFloat(investment.principal || d.amount) : parseFloat(d.amount)
          const profit = investment ? parseFloat(investment.accrued_interest || 0) : 0
          const available = totalAmount + profit - lockedAmount

          return {
            id: d.id,
            amount: totalAmount,
            frozen: lockedAmount,
            percentage: d.monthly_percentage || 5,
            profit: profit,
            available: available,
            date: d.created_at,
            status: investment.status,
            network: paymentDetails.network || 'TRC20',
            coin: paymentDetails.coin || 'USDT',
          }
        })

      // History (closed investments)
      const history = deposits
        .filter((d: any) => {
          const investment = investmentsMap.get(d.id)
          return investment && investment.status === 'closed'
        })
        .map((d: any) => {
          const investment = investmentsMap.get(d.id)
          const totalAmount = investment ? parseFloat(investment.principal || d.amount) : parseFloat(d.amount)
          const withdrawn = investment ? parseFloat(investment.withdrawn_amount || 0) : 0
          const locked = investment ? parseFloat(investment.locked_amount || 0) : 0
          const profit = investment ? parseFloat(investment.accrued_interest || 0) : 0

          return {
            id: d.id,
            amount: totalAmount,
            percentage: d.monthly_percentage || 5,
            profit: profit,
            withdrawn: withdrawn,
            locked: locked,
            date: d.created_at,
            withdrawDate: investment?.closed_at,
            status: investment.status,
          }
        })

      return { active, history }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  )

  return {
    activeDeposits: data?.active || [],
    depositHistory: data?.history || [],
    isLoading,
    isError: error,
    refresh: mutate,
  }
}
