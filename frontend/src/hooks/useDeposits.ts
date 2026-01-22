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

      // Active deposits (investment.status === 'active' OR 'frozen')
      const active = deposits
        .filter((d: any) => {
          const investment = investmentsMap.get(d.id)
          return investment && (investment.status === 'active' || investment.status === 'frozen')
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
            initialAmount: parseFloat(d.amount),
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

      // History (all deposits including pending)
      const history = deposits
        .map((d: any) => {
          const investment = investmentsMap.get(d.id)
          
          // Pending deposits don't have investment yet
          if (!investment) {
            return {
              id: d.id,
              amount: parseFloat(d.amount),
              percentage: d.monthly_percentage || 5,
              profit: 0,
              withdrawn: 0,
              locked: 0,
              date: d.created_at,
              withdrawDate: undefined,
              status: d.status, // 'pending', 'confirmed', 'rejected'
            }
          }

          const initialAmount = parseFloat(d.amount)
          const principal = parseFloat(investment.principal || 0)
          const withdrawn = parseFloat(investment.total_withdrawn || 0)
          const locked = parseFloat(investment.locked_amount || 0)
          const accruedInterest = parseFloat(investment.accrued_interest || 0)
          
          // Для закритих позицій available = 0, для активних = principal - locked
          const available = investment.status === 'closed' ? 0 : principal - locked
          
          // Для закритих позицій: якщо виведено більше ніж початкова сума, профіт = різниця
          // Для активних: профіт = accrued_interest
          let profit = accruedInterest
          if (investment.status === 'closed' && withdrawn > initialAmount) {
            profit = withdrawn - initialAmount
          }

          return {
            id: d.id,
            amount: initialAmount,
            principal: principal,
            available: available,
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
      shouldRetryOnError: false,
      onError: (err) => {
        console.error('useDeposits error:', err)
      },
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
