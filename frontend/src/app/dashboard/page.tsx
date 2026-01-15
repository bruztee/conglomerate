"use client"

import type React from "react"
import ChartIcon from "@/components/icons/ChartIcon"
import UserIcon from "@/components/icons/UserIcon"
import NetworkIcon from "@/components/icons/NetworkIcon"
import BoltIcon from "@/components/icons/BoltIcon"
import WarningIcon from "@/components/icons/WarningIcon"
import CopyIcon from "@/components/icons/CopyIcon"

import { useState, useEffect } from "react"
import Link from "next/link"
import Header from "@/components/Header"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"
import Loading from "@/components/Loading"
import DepositFlow from "@/components/DepositFlow"

interface Deposit {
  id: string
  amount: number
  frozen: number
  profit: number
  percentage: number
  date: string
  withdrawDate?: string
  status: string
  isFrozen?: boolean
  withdrawn?: number
  locked?: number
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  // ВСІ useState МАЮТЬ БУТИ НА ПОЧАТКУ
  const [userBalance, setUserBalance] = useState(0)
  const [frozenAmount, setFrozenAmount] = useState(0)
  const [userProfit, setUserProfit] = useState(0)
  const [totalInvestments, setTotalInvestments] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeDeposits, setActiveDeposits] = useState<Deposit[]>([])
  const [depositHistory, setDepositHistory] = useState<Deposit[]>([])
  const [profitPercentage, setProfitPercentage] = useState(5) // Актуальний % користувача з БД

  // Show loading while checking auth
  if (authLoading) {
    return <Loading fullScreen size="lg" />
  }

  // Redirect if not authenticated
  if (!user) {
    router.push('/auth/login')
    return null
  }

  const handleWithdraw = (depositId: string) => {
    // Withdraw logic
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Активний"
      case "closed":
        return "Виведено"
      case "pending":
        return "Очікує підтвердження"
      case "confirmed":
        return "Активний"
      case "rejected":
        return "Відхилено"
      case "withdrawal_pending":
        return "Очікує виводу"
      case "withdrawn":
        return "Виведено"
      case "cancelled":
        return "Скасовано"
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400"
      case "closed":
        return "bg-gray-500/20 text-gray-400"
      case "pending":
        return "bg-yellow-500/20 text-yellow-400"
      case "confirmed":
        return "bg-green-500/20 text-green-400"
      case "rejected":
        return "bg-red-500/20 text-red-400"
      case "withdrawal_pending":
        return "bg-orange-500/20 text-orange-400"
      case "withdrawn":
        return "bg-gray-500/20 text-gray-400"
      case "cancelled":
        return "bg-red-500/20 text-red-400"
      default:
        return "bg-gray-medium/30 text-gray-light"
    }
  }

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    const fetchData = async () => {
      setLoading(true)
      
      // Fetch wallet data - тепер включає balance та profit з investments
      const walletResult = await api.getWallet()
      
      if (walletResult.success && walletResult.data) {
        const data = walletResult.data as any
        setUserBalance(data.balance || 0)
        setFrozenAmount(data.locked_amount || 0)
        setUserProfit(data.total_profit || 0)
        setTotalInvestments(data.total_invested || 0)
      }

      // Отримати актуальний monthly_percentage користувача
      const meResult = await api.me()
      if (meResult.success && meResult.data) {
        const userData = (meResult.data as any).user
        setProfitPercentage(userData?.monthly_percentage || 5)
      }

      // Fetch investments для отримання accrued_interest
      const investmentsResult = await api.getInvestments()
      const investmentsMap = new Map()
      
      if (investmentsResult.success && investmentsResult.data) {
        const invData = investmentsResult.data as any
        const investments = invData.investments || []
        // Створюємо мапу deposit_id -> investment для швидкого пошуку
        investments.forEach((inv: any) => {
          if (inv.deposit_id) {
            investmentsMap.set(inv.deposit_id, inv)
          }
        })
      }

      // Fetch deposits
      const depositsResult = await api.getDeposits()
      if (depositsResult.success && depositsResult.data) {
        const data = depositsResult.data as any
        const deposits = data.deposits || []
        
        // АКТИВНІ ПОЗИЦІЇ: фільтруємо по investment.status === 'active'
        // deposit.status може бути 'confirmed' навіть коли позиція закрита!
        const active = deposits
          .filter((d: any) => {
            const investment = investmentsMap.get(d.id)
            // Показувати тільки якщо є investment І він active
            return investment && investment.status === 'active'
          })
        
        setActiveDeposits(active.map((d: any) => {
          const investment = investmentsMap.get(d.id)
          const lockedAmount = investment ? parseFloat(investment.locked_amount || 0) : 0
          // Показуємо investment.principal (поточна сума після виводів), а не deposit.amount (початкова)
          const currentAmount = investment ? parseFloat(investment.principal || 0) : parseFloat(d.amount)
          const isFrozen = investment?.is_frozen || false
          return {
            id: d.id,
            amount: currentAmount,
            frozen: lockedAmount,
            profit: investment ? parseFloat(investment.accrued_interest || 0) : 0,
            percentage: d.monthly_percentage || profitPercentage,
            date: d.created_at,
            status: d.status,
            isFrozen: isFrozen,
          }
        }))
        
        // Історія - ВСІ deposits для повного перегляду
        setDepositHistory(deposits.map((d: any) => {
          const investment = investmentsMap.get(d.id)
          const originalAmount = parseFloat(d.amount) // Початкова сума депозиту
          const currentPrincipal = investment ? parseFloat(investment.principal || 0) : originalAmount
          const currentAccrued = investment ? parseFloat(investment.accrued_interest || 0) : 0
          
          // ВИВЕДЕНО: брати з investment.total_withdrawn (реальна сума з withdrawals)
          const withdrawnAmount = investment?.total_withdrawn ? parseFloat(investment.total_withdrawn) : 0
          
          // СТАТУС: показувати investment.status (active/closed), а не deposit.status
          const displayStatus = investment?.status || 'pending'
          
          // ДАТА ВИВОДУ: якщо позиція закрита - показувати investment.closed_at
          const withdrawDate = investment?.closed_at || null
          
          // PROFIT: ВЕСЬ згенерований профіт
          // Якщо закрито: withdrawn - original (бо всі кошти виведено)
          // Якщо активно: current_accrued (поточний нарахований)
          let generatedProfit = 0
          if (displayStatus === 'closed') {
            // Закрита позиція: профіт = виведено - початкова сума
            generatedProfit = withdrawnAmount - originalAmount
          } else {
            // Активна позиція: поточний accrued_interest
            generatedProfit = currentAccrued
          }
          
          // ЗАМОРОЖЕНО: locked_amount з investment
          const lockedAmount = investment ? parseFloat(investment.locked_amount || 0) : 0
          
          return {
            id: d.id,
            amount: originalAmount, // Початкова сума депозиту
            currentAmount: currentPrincipal + currentAccrued, // Поточна сума
            withdrawn: withdrawnAmount, // Реальна виведена сума з withdrawals
            profit: generatedProfit, // Згенерований профіт
            locked: lockedAmount, // Заморожено
            percentage: investment ? parseFloat(investment.rate_monthly || profitPercentage) : profitPercentage,
            date: d.created_at, // Дата створення депозиту
            withdrawDate: withdrawDate, // Дата закриття позиції (якщо є)
            status: displayStatus, // investment.status (active/closed)
          }
        }))
      }

      setLoading(false)
    }

    fetchData()
  }, [user, router])

  const handleDepositSuccess = async () => {
    setLoading(true)
    
    // Refresh data after successful deposit
    const walletResult = await api.getWallet()
    if (walletResult.success && walletResult.data) {
      const data = walletResult.data as any
      setUserBalance(data.balance || 0)
      setFrozenAmount(data.locked_amount || 0)
      setUserProfit(data.total_profit || 0)
      setTotalInvestments(data.total_invested || 0)
    }
    
    // Refresh deposits and investments
    const depositsResult = await api.getDeposits()
    const investmentsResult = await api.getInvestments()
    
    if (depositsResult.success && investmentsResult.success) {
      const deposits = (depositsResult.data as any)?.deposits || []
      const investments = (investmentsResult.data as any)?.investments || []
      
      const investmentsMap = new Map()
      investments.forEach((inv: any) => {
        if (inv.deposit_id) {
          investmentsMap.set(inv.deposit_id, inv)
        }
      })
      
      const active = deposits.filter((d: any) => {
        const investment = investmentsMap.get(d.id)
        return investment && investment.status === 'active'
      })
      
      setActiveDeposits(active.map((d: any) => {
        const investment = investmentsMap.get(d.id)
        return {
          id: d.id,
          amount: parseFloat(d.amount),
          frozen: investment ? parseFloat(investment.locked_amount || 0) : 0,
          profit: investment ? parseFloat(investment.accrued_interest || 0) : 0,
          percentage: d.monthly_percentage || profitPercentage,
          date: d.created_at,
          status: d.status,
          isFrozen: investment?.is_frozen || false,
        }
      }))
      
      // Update deposit history
      setDepositHistory(deposits.map((d: any) => {
        const investment = investmentsMap.get(d.id)
        const originalAmount = parseFloat(d.amount)
        const currentPrincipal = investment ? parseFloat(investment.principal || 0) : originalAmount
        const currentAccrued = investment ? parseFloat(investment.accrued_interest || 0) : 0
        const withdrawnAmount = investment?.total_withdrawn ? parseFloat(investment.total_withdrawn) : 0
        const displayStatus = investment?.status || 'pending'
        const withdrawDate = investment?.closed_at || null
        
        let generatedProfit = 0
        if (displayStatus === 'closed') {
          generatedProfit = withdrawnAmount - originalAmount
        } else {
          generatedProfit = currentAccrued
        }
        
        const lockedAmount = investment ? parseFloat(investment.locked_amount || 0) : 0
        
        return {
          id: d.id,
          amount: originalAmount,
          currentAmount: currentPrincipal + currentAccrued,
          withdrawn: withdrawnAmount,
          profit: generatedProfit,
          locked: lockedAmount,
          percentage: investment ? parseFloat(investment.rate_monthly || profitPercentage) : profitPercentage,
          date: d.created_at,
          withdrawDate: withdrawDate,
          status: displayStatus,
        }
      }))
    }
    
    setLoading(false)
  }

  if (loading) {
    return <Loading fullScreen size="lg" />
  }

  return (
    <>
      <Header isAuthenticated={true} />

      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Особистий кабінет</h1>
            <p className="text-gray-light">Керуйте своїми інвестиціями та депозитами</p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-gray-dark/20 border border-gray-medium/30 rounded-lg p-6 flex flex-col items-center text-center">
              <div className="mb-4 text-silver">
                <BoltIcon className="w-10 h-10" />
              </div>
              <div className="text-gray-light text-sm mb-2">Інвестиції</div>
              <div className="text-3xl font-bold text-foreground font-sans">${totalInvestments.toFixed(2)}</div>
            </div>

            <div className="bg-gray-dark/20 border border-gray-medium/30 rounded-lg p-6 flex flex-col items-center text-center">
              <div className="mb-4 text-silver">
                <ChartIcon className="w-10 h-10" />
              </div>
              <div className="text-gray-light text-sm mb-2">Профіт</div>
              <div className="text-3xl font-bold text-silver font-sans">${userProfit.toFixed(2)}</div>
            </div>

            <div className="bg-gray-dark/20 border border-gray-medium/30 rounded-lg p-6 flex flex-col items-center text-center">
              <div className="mb-4 text-silver">
                <UserIcon className="w-10 h-10" />
              </div>
              <div className="text-gray-light text-sm mb-2">Загальний баланс</div>
              <div className="text-3xl font-bold text-silver font-sans">${userBalance.toFixed(2)}</div>
              {frozenAmount > 0 && (
                <div className="text-xs text-orange-400 mt-1">
                  Заморожено: ${frozenAmount.toFixed(2)}
                </div>
              )}
            </div>

            <div className="bg-gray-dark/20 border border-gray-medium/30 rounded-lg p-6 flex flex-col items-center text-center">
              <div className="mb-4 text-silver">
                <NetworkIcon className="w-10 h-10" />
              </div>
              <div className="text-gray-light text-sm mb-2">Активні депозити</div>
              <div className="text-3xl font-bold text-silver font-sans">{activeDeposits.length}</div>
            </div>
          </div>

          {/* Deposit Creation and Active Deposits */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <DepositFlow onSuccess={handleDepositSuccess} />

            <div className="bg-gray-dark/20 border border-gray-medium/30 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Активні депозити</h2>

              {activeDeposits.length > 0 ? (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {activeDeposits.map((deposit) => (
                    <div
                      key={deposit.id}
                      className="bg-background/50 border border-gray-medium/50 rounded-lg p-4 hover:border-silver/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="text-xs text-gray-light mb-1">Депозит</div>
                          <div className="text-2xl font-bold text-silver font-sans">${deposit.amount.toFixed(2)}</div>
                          {deposit.frozen > 0 && (
                            <div className="text-xs text-gray-light mt-1">
                              Заморожено: ${deposit.frozen.toFixed(2)}
                            </div>
                          )}
                          {deposit.frozen > 0 && (
                            <div className="text-xs text-white mt-1">
                              Доступно: ${Math.max(0, deposit.amount - deposit.frozen).toFixed(2)}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-light mb-1">Прибуток</div>
                          <div className="text-lg font-bold text-foreground font-sans">+${deposit.profit.toFixed(2)}</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-gray-medium/30">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-light">
                            {new Date(deposit.date).toLocaleDateString("uk-UA")}
                          </span>
                          {deposit.isFrozen ? (
                            <span className="inline-block px-2 py-1 rounded text-xs bg-orange-500/20 text-orange-400">
                              Заморожен
                            </span>
                          ) : (
                            <span className={`inline-block px-2 py-1 rounded text-xs whitespace-nowrap ${getStatusColor(deposit.status)}`}>
                              {getStatusLabel(deposit.status)}
                            </span>
                          )}
                        </div>
                        {deposit.status !== 'withdrawal_pending' && !deposit.isFrozen && (
                          <button
                            onClick={() => handleWithdraw(deposit.id)}
                            className="btn-gradient-primary px-4 py-2 text-foreground font-bold text-sm rounded-lg transition-colors font-sans"
                          >
                            Вивести
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-light">
                  <div className="mb-4">
                    <ChartIcon className="w-16 h-16 mx-auto opacity-50" />
                  </div>
                  <p className="mb-2 font-medium">У вас поки немає активних депозитів</p>
                  <p className="text-sm">Створіть перший депозит для початку інвестування</p>
                </div>
              )}
            </div>
          </div>

          <div className="mb-8">
            <div className="bg-gray-dark/20 border border-gray-medium/30 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Історія депозитів</h2>

              {depositHistory.length > 0 ? (
                <>
                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-4">
                    {depositHistory.map((deposit) => (
                      <div
                        key={deposit.id}
                        className="bg-background/50 border border-gray-medium/50 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-medium/30">
                          <span className="text-sm font-sans text-gray-light">Deposit #{deposit.id}</span>
                          <span
                            className={`px-2 py-1 ${getStatusColor(deposit.status)} rounded-full text-xs font-sans whitespace-nowrap`}
                          >
                            {getStatusLabel(deposit.status)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-xs text-gray-light mb-1">Сума</div>
                            <div className="font-medium font-sans">${deposit.amount.toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-light mb-1">Профіт</div>
                            <div className="font-medium text-silver font-sans">+${deposit.profit.toFixed(2)}</div>
                          </div>
                          {(deposit.locked || 0) > 0 && (
                            <div>
                              <div className="text-xs text-gray-light mb-1">Заморожено</div>
                              <div className="font-medium font-sans text-gray-light">${(deposit.locked || 0).toFixed(2)}</div>
                            </div>
                          )}
                          {(deposit.locked || 0) > 0 && (
                            <div>
                              <div className="text-xs text-gray-light mb-1">Доступно</div>
                              <div className="font-medium font-sans">${Math.max(0, deposit.amount - (deposit.locked || 0)).toFixed(2)}</div>
                            </div>
                          )}
                          <div>
                            <div className="text-xs text-gray-light mb-1">Процент</div>
                            <div className="font-medium text-silver font-sans">{deposit.percentage}%</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-light mb-1">Дата</div>
                            <div className="font-medium text-gray-light">{new Date(deposit.date).toLocaleDateString("uk-UA")}</div>
                          </div>
                          {(deposit.withdrawn || 0) > 0 && (
                            <div className="col-span-2">
                              <div className="text-xs text-gray-light mb-1">Виведено</div>
                              <div className="font-medium font-sans text-orange-400">-${(deposit.withdrawn || 0).toFixed(2)}</div>
                            </div>
                          )}
                          {deposit.withdrawDate && (
                            <div className="col-span-2">
                              <div className="text-xs text-gray-light mb-1">Дата виводу</div>
                              <div className="font-medium text-gray-light">{new Date(deposit.withdrawDate).toLocaleDateString("uk-UA")}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-medium/30">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-light font-sans">ID</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-light">Початкова сума</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-light">Виведено</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-light">Заморожено</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-light">Процент</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-light">Профіт</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-light">Дата створення</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-light">Дата виводу</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-light">Статус</th>
                        </tr>
                      </thead>
                      <tbody>
                        {depositHistory.map((deposit) => (
                          <tr
                            key={deposit.id}
                            className="border-b border-gray-medium/20 hover:bg-background/30 transition-colors"
                          >
                            <td className="py-3 px-4 text-sm font-sans">#{deposit.id}</td>
                            <td className="py-3 px-4 text-sm font-medium font-sans">${deposit.amount.toFixed(2)}</td>
                            <td className="py-3 px-4 text-sm font-medium font-sans text-orange-400">
                              {(deposit.withdrawn || 0) > 0 ? `-$${(deposit.withdrawn || 0).toFixed(2)}` : '—'}
                            </td>
                            <td className="py-3 px-4 text-sm font-medium font-sans text-gray-light">
                              {(deposit.locked || 0) > 0 ? `$${(deposit.locked || 0).toFixed(2)}` : '—'}
                            </td>
                            <td className="py-3 px-4 text-sm font-sans text-silver">{deposit.percentage}%</td>
                            <td className="py-3 px-4 text-sm font-medium text-silver font-sans">
                              +${deposit.profit.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-light">
                              {new Date(deposit.date).toLocaleDateString("uk-UA")}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-light">
                              {deposit.withdrawDate ? new Date(deposit.withdrawDate).toLocaleDateString("uk-UA") : '—'}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-3 py-1 ${getStatusColor(deposit.status)} rounded-full text-xs font-sans whitespace-nowrap`}
                              >
                                {getStatusLabel(deposit.status)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-light">
                  <p>Історія депозитів пуста</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6">
            <Link
              href="/withdraw"
              className="p-6 bg-gray-dark/20 hover:bg-gray-dark/30 border border-gray-medium/30 hover:border-silver/50 rounded-lg transition-all text-center group flex flex-col items-center"
            >
              <div className="text-silver mb-4 group-hover:scale-110 transition-transform">
                <BoltIcon className="w-10 h-10" />
              </div>
              <div className="font-bold mb-1">Вивести кошти</div>
              <div className="text-sm text-gray-light">Зняти прибуток на гаманець</div>
            </Link>

            <Link
              href="/referral"
              className="p-6 bg-gray-dark/20 hover:bg-gray-dark/30 border border-gray-medium/30 hover:border-silver/50 rounded-lg transition-all text-center group flex flex-col items-center"
            >
              <div className="text-silver mb-4 group-hover:scale-110 transition-transform">
                <NetworkIcon className="w-10 h-10" />
              </div>
              <div className="font-bold mb-1">Реферальна програма</div>
              <div className="text-sm text-gray-light">Запросити друзів і отримати бонус</div>
            </Link>

            <Link
              href="/rules"
              className="p-6 bg-gray-dark/20 hover:bg-gray-dark/30 border border-gray-medium/30 hover:border-silver/50 rounded-lg transition-all text-center group flex flex-col items-center"
            >
              <div className="text-silver mb-4 group-hover:scale-110 transition-transform">
                <UserIcon className="w-10 h-10" />
              </div>
              <div className="font-bold mb-1">Правила платформи</div>
              <div className="text-sm text-gray-light">Ознайомтесь з умовами</div>
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
