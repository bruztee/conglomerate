"use client"

import type React from "react"
import ChartIcon from "@/components/icons/ChartIcon"
import UserIcon from "@/components/icons/UserIcon"
import NetworkIcon from "@/components/icons/NetworkIcon"
import BoltIcon from "@/components/icons/BoltIcon"
import WarningIcon from "@/components/icons/WarningIcon"
import CopyIcon from "@/components/icons/CopyIcon"
import Pagination from "@/components/Pagination"
import DepositFlow from "@/components/DepositFlow"

import { useState, useEffect } from "react"
import Link from "next/link"
import Header from "@/components/Header"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"
import Loading from "@/components/Loading"

interface Deposit {
  id: string
  amount: number
  frozen: number
  profit: number
  percentage: number
  date: string
  withdrawDate?: string
  status: string
  withdrawn?: number
  locked?: number
  available?: number
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
  
  // Pagination states
  const [historyPage, setHistoryPage] = useState(1)
  const [activeDepositsPage, setActiveDepositsPage] = useState(1)
  const itemsPerPage = 10

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
    router.push(`/withdraw?deposit_id=${depositId}`)
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Активний"
      case "frozen":
        return "Заморожено"
      case "closed":
        return "Закрито"
      case "pending":
        return "Очікує"
      case "rejected":
        return "Відхилено"
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400"
      case "frozen":
        return "bg-orange-500/20 text-orange-400"
      case "closed":
        return "bg-gray-500/20 text-gray-400"
      case "pending":
        return "bg-yellow-500/20 text-yellow-400"
      case "rejected":
        return "bg-red-500/20 text-red-400"
      default:
        return "bg-gray-medium/30 text-gray-light"
    }
  }

  useEffect(() => {
    // Не запускати fetchData поки authLoading
    if (authLoading) return
    
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
            // Показувати якщо є investment І він active або frozen
            return investment && (investment.status === 'active' || investment.status === 'frozen')
          })
        
        setActiveDeposits(active.map((d: any) => {
          const investment = investmentsMap.get(d.id)
          const lockedAmount = investment ? parseFloat(investment.locked_amount || 0) : 0
          // Показуємо investment.principal (поточна сума після виводів), а не deposit.amount (початкова)
          const currentAmount = investment ? parseFloat(investment.principal || 0) : parseFloat(d.amount)
          const available = investment ? parseFloat(investment.available || 0) : 0
          return {
            id: d.id,
            amount: currentAmount,
            frozen: lockedAmount,
            profit: investment ? parseFloat(investment.accrued_interest || 0) : 0,
            percentage: investment ? parseFloat(investment.rate_monthly) : parseFloat(d.monthly_percentage || 5),
            date: d.created_at,
            status: investment?.status || d.status,
            available: available,
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
          
          // СТАТУС: якщо є investment - його статус, інакше deposit.status (pending/rejected)
          let displayStatus = investment?.status || d.status
          
          // ДАТА ВИВОДУ: якщо позиція закрита - показувати investment.closed_at
          const withdrawDate = investment?.closed_at || null
          
          // PROFIT: з API
          // Для закритих: виведено - початкова сума
          // Для активних: current accrued_interest з API
          let generatedProfit = 0
          if (displayStatus === 'closed') {
            generatedProfit = withdrawnAmount - originalAmount
          } else {
            generatedProfit = currentAccrued
          }
          
          // ЗАМОРОЖЕНО: locked_amount з investment
          const lockedAmount = investment ? parseFloat(investment.locked_amount || 0) : 0
          
          return {
            id: d.id,
            amount: originalAmount, // Початкова сума депозиту
            currentAmount: investment?.total_value || (currentPrincipal + currentAccrued), // Поточна сума з API
            withdrawn: withdrawnAmount, // Реальна виведена сума з withdrawals
            profit: generatedProfit, // Згенерований профіт
            locked: lockedAmount, // Заморожено
            percentage: investment ? parseFloat(investment.rate_monthly) : parseFloat(d.monthly_percentage || 5),
            date: d.created_at, // Дата створення депозиту
            withdrawDate: withdrawDate, // Дата закриття позиції (якщо є)
            status: displayStatus, // investment.status (active/closed)
          }
        }))
      }

      setLoading(false)
    }

    fetchData()
  }, [user, router, authLoading])

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
        return investment && (investment.status === 'active' || investment.status === 'frozen')
      })
      
      setActiveDeposits(active.map((d: any) => {
        const investment = investmentsMap.get(d.id)
        return {
          id: d.id,
          amount: parseFloat(d.amount),
          frozen: investment ? parseFloat(investment.locked_amount || 0) : 0,
          profit: investment ? parseFloat(investment.accrued_interest || 0) : 0,
          percentage: investment ? parseFloat(investment.rate_monthly) : parseFloat(d.monthly_percentage || 5),
          date: d.created_at,
          status: investment?.status || d.status,
        }
      }))
      
      // Update deposit history
      setDepositHistory(deposits.map((d: any) => {
        const investment = investmentsMap.get(d.id)
        const originalAmount = parseFloat(d.amount)
        const currentPrincipal = investment ? parseFloat(investment.principal || 0) : originalAmount
        const currentAccrued = investment ? parseFloat(investment.accrued_interest || 0) : 0
        const withdrawnAmount = investment?.total_withdrawn ? parseFloat(investment.total_withdrawn) : 0
        const displayStatus = investment?.status || d.status
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
          percentage: investment ? parseFloat(investment.rate_monthly) : parseFloat(d.monthly_percentage || 5),
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
          <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-gray-dark/20 border border-gray-medium/30 rounded-lg p-4 md:p-6 flex flex-col items-center text-center">
              <div className="mb-2 md:mb-4 text-silver">
                <BoltIcon className="w-8 md:w-10 h-8 md:h-10" />
              </div>
              <div className="text-gray-light text-xs md:text-sm mb-1 md:mb-2">Інвестиції</div>
              <div className="text-xl md:text-3xl font-bold text-foreground font-sans">${totalInvestments.toFixed(2)}</div>
            </div>

            <div className="bg-gray-dark/20 border border-gray-medium/30 rounded-lg p-4 md:p-6 flex flex-col items-center text-center">
              <div className="mb-2 md:mb-4 text-silver">
                <ChartIcon className="w-8 md:w-10 h-8 md:h-10" />
              </div>
              <div className="text-gray-light text-xs md:text-sm mb-1 md:mb-2">Профіт</div>
              <div className="text-xl md:text-3xl font-bold text-silver font-sans">${userProfit.toFixed(2)}</div>
            </div>

            <div className="bg-gray-dark/20 border border-gray-medium/30 rounded-lg p-4 md:p-6 flex flex-col items-center text-center">
              <div className="mb-2 md:mb-4 text-silver">
                <UserIcon className="w-8 md:w-10 h-8 md:h-10" />
              </div>
              <div className="text-gray-light text-xs md:text-sm mb-1 md:mb-2">Загальний баланс</div>
              <div className="text-xl md:text-3xl font-bold text-foreground font-sans">${userBalance.toFixed(2)}</div>
              {frozenAmount > 0 && (
                <div className="text-xs text-orange-400 mt-1 md:mt-2">Заморожено: ${frozenAmount.toFixed(2)}</div>
              )}
            </div>

            <div className="bg-gray-dark/20 border border-gray-medium/30 rounded-lg p-4 md:p-6 flex flex-col items-center text-center">
              <div className="mb-2 md:mb-4 text-silver">
                <NetworkIcon className="w-8 md:w-10 h-8 md:h-10" />
              </div>
              <div className="text-gray-light text-xs md:text-sm mb-1 md:mb-2">Активні депозити</div>
              <div className="text-xl md:text-3xl font-bold text-silver font-sans">{activeDeposits.length}</div>
            </div>
          </div>

          {/* Deposit Creation and Active Deposits */}
          <div className="grid lg:grid-cols-2 gap-4 md:gap-6 mb-8">
            <DepositFlow onSuccess={handleDepositSuccess} userRate={profitPercentage} />

            <div className="bg-gray-dark/20 border border-gray-medium/30 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Активні депозити</h2>

              {activeDeposits.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {activeDeposits
                      .slice((activeDepositsPage - 1) * itemsPerPage, activeDepositsPage * itemsPerPage)
                      .map((deposit) => (
                    <div
                      key={deposit.id}
                      className="bg-blur/50 border border-gray-medium/50 rounded-lg p-3 sm:p-4 hover:border-silver/50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-light mb-1">Депозит</div>
                          <div className="text-xl sm:text-2xl font-bold text-silver font-sans break-words">${deposit.amount.toFixed(2)}</div>
                          {deposit.frozen > 0 && (
                            <div className="text-xs text-gray-light mt-1">
                              Заморожено: ${deposit.frozen.toFixed(2)}
                            </div>
                          )}
                          {deposit.frozen > 0 && (
                            <div className="text-xs text-white mt-1">
                              Доступно: ${(deposit.available || 0).toFixed(2)}
                            </div>
                          )}
                        </div>
                        <div className="text-left sm:text-right">
                          <div className="text-xs text-gray-light mb-1">Прибуток</div>
                          <div className="text-lg font-bold text-foreground font-sans break-words">+${deposit.profit.toFixed(2)}</div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-3 border-t border-gray-medium/30">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs sm:text-sm text-gray-light whitespace-nowrap">
                            {new Date(deposit.date).toLocaleDateString("uk-UA")}
                          </span>
                          <span className={`inline-block px-2 py-1 rounded text-xs whitespace-nowrap ${getStatusColor(deposit.status)}`}>
                            {getStatusLabel(deposit.status)}
                          </span>
                        </div>
                        {deposit.status === 'active' && (
                          <button
                            onClick={() => handleWithdraw(deposit.id)}
                            className="btn-gradient-primary w-full sm:w-auto px-4 py-2 text-foreground font-bold text-sm rounded-lg transition-colors font-sans whitespace-nowrap"
                          >
                            Вивести
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  </div>
                  
                  <Pagination
                    currentPage={activeDepositsPage}
                    totalPages={Math.ceil(activeDeposits.length / itemsPerPage)}
                    onPageChange={setActiveDepositsPage}
                  />
                </>
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
                  {/* Mobile & Tablet Cards */}
                  <div className="lg:hidden space-y-4">
                    {depositHistory
                      .slice((historyPage - 1) * itemsPerPage, historyPage * itemsPerPage)
                      .map((deposit) => (
                      <div
                        key={deposit.id}
                        className="bg-blur/50 border border-gray-medium/50 rounded-lg p-3 sm:p-4"
                      >
                        <div className="flex justify-between items-center gap-2 mb-3 pb-3 border-b border-gray-medium/30">
                          <span className="text-xs sm:text-sm font-sans text-gray-light truncate flex-1 min-w-0">
                            Deposit #{deposit.id.slice(0, 8)}...
                          </span>
                          <span
                            className={`px-2 py-1 ${getStatusColor(deposit.status)} rounded-full text-xs font-sans whitespace-nowrap flex-shrink-0`}
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
                              <div className="font-medium font-sans">${(deposit.available || 0).toFixed(2)}</div>
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
                  <div className="hidden lg:block overflow-x-auto">
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
                          <th className="text-center py-3 px-4 text-sm font-medium text-gray-light">Статус</th>
                        </tr>
                      </thead>
                      <tbody>
                        {depositHistory
                          .slice((historyPage - 1) * itemsPerPage, historyPage * itemsPerPage)
                          .map((deposit) => (
                          <tr
                            key={deposit.id}
                            className="border-b border-gray-medium/20 hover:bg-blur/30 transition-colors"
                          >
                            <td className="py-3 px-4 text-sm font-sans">#{deposit.id.slice(0, 8)}...</td>
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
                            <td className="py-3 px-4 text-center">
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
                  
                  <Pagination
                    currentPage={historyPage}
                    totalPages={Math.ceil(depositHistory.length / itemsPerPage)}
                    onPageChange={setHistoryPage}
                  />
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
