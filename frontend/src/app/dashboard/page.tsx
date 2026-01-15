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

interface Deposit {
  id: string
  amount: number
  frozen: number
  profit: number
  percentage: number
  date: string
  withdrawDate?: string
  status: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  // ВСІ useState МАЮТЬ БУТИ НА ПОЧАТКУ
  const [amount, setAmount] = useState("")
  const [userBalance, setUserBalance] = useState(0)
  const [frozenAmount, setFrozenAmount] = useState(0)
  const [userProfit, setUserProfit] = useState(0)
  const [totalInvestments, setTotalInvestments] = useState(0)
  const [loading, setLoading] = useState(true)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [selectedMethod, setSelectedMethod] = useState<any>(null)
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

  const quickAmounts = [100, 500, 1000, 5000, 10000]

  const plan = {
    profit: `${profitPercentage}%`,
    minAmount: 100,
    maxAmount: 100000,
    duration: "30 днів",
  }

  const handleWithdraw = (depositId: string) => {
    // Withdraw logic
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
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

      // Fetch active payment methods (PUBLIC endpoint)
      const paymentMethodsResponse = await api.getActivePaymentMethods()
      if (paymentMethodsResponse.success && paymentMethodsResponse.data?.payment_methods) {
        const activeMethods = paymentMethodsResponse.data.payment_methods
        setPaymentMethods(activeMethods)
        if (activeMethods.length > 0) {
          // Рандомно вибрати один метод
          const randomIndex = Math.floor(Math.random() * activeMethods.length)
          setSelectedMethod(activeMethods[randomIndex])
        }
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
        
        // Активні: confirmed + pending + withdrawal_pending
        const active = deposits.filter((d: any) => d.status === 'confirmed' || d.status === 'pending' || d.status === 'withdrawal_pending')
        setActiveDeposits(active.map((d: any) => {
          const investment = investmentsMap.get(d.id)
          const lockedAmount = investment ? parseFloat(investment.locked_amount || 0) : 0
          // Показуємо investment.principal (поточна сума після виводів), а не deposit.amount (початкова)
          const currentAmount = investment ? parseFloat(investment.principal || 0) : parseFloat(d.amount)
          return {
            id: d.id,
            amount: currentAmount,
            frozen: lockedAmount,
            profit: investment ? parseFloat(investment.accrued_interest || 0) : 0,
            percentage: d.monthly_percentage || profitPercentage,
            date: d.created_at,
            status: d.status,
          }
        }))
        
        // Історія - ВСІ deposits для повного перегляду
        setDepositHistory(deposits.map((d: any) => {
          const investment = investmentsMap.get(d.id)
          const originalAmount = parseFloat(d.amount) // Початкова сума депозиту
          const currentAmount = investment ? parseFloat(investment.principal || 0) : originalAmount
          const withdrawnAmount = originalAmount - currentAmount // Виведено = початкова - поточна
          return {
            id: d.id,
            amount: originalAmount, // Показуємо початкову суму
            currentAmount: currentAmount, // Поточна сума (якщо потрібно)
            withdrawn: withdrawnAmount, // Виведено
            profit: investment ? parseFloat(investment.accrued_interest || 0) : 0,
            percentage: d.monthly_percentage || profitPercentage,
            date: d.created_at,
            withdrawDate: d.confirmed_at || d.updated_at,
            status: d.status,
          }
        }))
      }

      setLoading(false)
    }

    fetchData()
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const result = await api.createDeposit(parseFloat(amount))
    if (result.success) {
      // Refresh deposits list
      const depositsResult = await api.getDeposits()
      if (depositsResult.success && depositsResult.data) {
        const data = depositsResult.data as any
        const deposits = data.deposits || []
        const active = deposits.filter((d: any) => d.status === 'confirmed' || d.status === 'pending' || d.status === 'withdrawal_pending')
        
        setActiveDeposits(active.map((d: any) => ({
          id: d.id,
          amount: parseFloat(d.amount),
          profit: 0,
          percentage: d.monthly_percentage || profitPercentage,
          date: d.created_at,
          status: d.status,
        })))
      }
      setAmount('')
    }
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
            <div className="bg-gray-dark/20 border border-gray-medium/30 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Створити депозит</h2>

              <div className="bg-background/50 border border-silver/30 rounded-lg p-4 mb-6">
                <h3 className="font-bold mb-3 text-silver">Інвестиційний план</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-light text-xs mb-1">Прибуток</div>
                    <div className="font-bold text-silver font-sans">{plan.profit}</div>
                  </div>
                  <div>
                    <div className="text-gray-light text-xs mb-1">Мінімум</div>
                    <div className="font-bold font-sans">${plan.minAmount}</div>
                  </div>
                  <div>
                    <div className="text-gray-light text-xs mb-1">Максимум</div>
                    <div className="font-bold font-sans">${plan.maxAmount}</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-medium/30">
                  <div className="text-xs text-gray-light">Термін: {plan.duration}</div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Payment Method Info */}
                {selectedMethod && (
                  <div className="bg-silver/10 border border-silver/30 rounded-lg p-4">
                    <div className="text-xs text-gray-light mb-2">Реквізити для депозиту:</div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-light">Валюта:</span>
                        <span className="font-bold text-silver font-sans">{selectedMethod.currency}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-light">Мережа:</span>
                        <span className="font-medium font-sans">{selectedMethod.network}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-medium/30">
                        <div className="text-xs text-gray-light mb-1">Адреса гаманця:</div>
                        <div className="font-mono text-sm bg-background p-2 rounded break-all">
                          {selectedMethod.wallet_address}
                        </div>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(selectedMethod.wallet_address)}
                          className="flex items-center gap-1 text-xs text-silver hover:text-foreground mt-2"
                        >
                          <CopyIcon className="w-4 h-4" />
                          Копіювати адресу
                        </button>
                      </div>
                      {selectedMethod.min_amount > 0 && (
                        <div className="flex items-center gap-1 text-xs text-yellow-500">
                          <WarningIcon className="w-4 h-4" />
                          Мінімальна сума: ${selectedMethod.min_amount}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="amount" className="block text-sm font-medium mb-2">
                    Сума депозиту
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-light font-sans">$</span>
                    <input
                      type="number"
                      id="amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 bg-background border border-gray-medium rounded-lg focus:outline-none focus:border-silver transition-colors font-sans"
                      placeholder="0.00"
                      min={plan.minAmount}
                      max={plan.maxAmount}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {quickAmounts.map((quickAmount) => (
                      <button
                        key={quickAmount}
                        type="button"
                        onClick={() => setAmount(quickAmount.toString())}
                        className="px-3 py-1.5 bg-gray-dark/50 hover:bg-silver/20 border border-gray-medium hover:border-silver text-sm rounded-lg transition-colors font-sans"
                      >
                        ${quickAmount}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-light mt-2">
                    Від <span className="font-sans">${plan.minAmount}</span> до{" "}
                    <span className="font-sans">${plan.maxAmount}</span>
                  </p>
                </div>

                <div className="bg-background border border-gray-medium rounded-lg p-4">
                  <div className="text-sm text-gray-light mb-2">
                    Очікуваний прибуток (<span className="font-sans">{profitPercentage}%</span> місячних)
                  </div>
                  <div className="text-2xl font-bold text-silver font-sans">
                    {amount ? `$${((Number.parseFloat(amount) * profitPercentage) / 100).toFixed(2)}` : "$0.00"}
                  </div>
                  <div className="text-xs text-gray-light mt-1">за {plan.duration}</div>
                </div>

                <button
                  type="submit"
                  disabled={!amount || Number.parseFloat(amount) < plan.minAmount || !selectedMethod}
                  className="btn-gradient-primary w-full px-4 py-3 disabled:bg-gray-medium disabled:cursor-not-allowed text-foreground font-bold rounded-lg transition-colors font-sans"
                >
                  {selectedMethod ? 'Я оплатив - Підтвердити' : 'Немає доступних методів оплати'}
                </button>

                {selectedMethod && (
                  <p className="flex items-center justify-center gap-1 text-xs text-gray-light">
                    <WarningIcon className="w-4 h-4" />
                    Натисніть кнопку ТІЛЬКИ після відправки коштів на вказану адресу
                  </p>
                )}
              </form>
            </div>

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
                            <div className="text-xs text-orange-400 mt-1">
                              Заморожено: ${deposit.frozen.toFixed(2)}
                            </div>
                          )}
                          {deposit.frozen > 0 && (
                            <div className="text-xs text-green-400 mt-1">
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
                          <span className={`inline-block px-2 py-1 rounded text-xs ${getStatusColor(deposit.status)}`}>
                            {getStatusLabel(deposit.status)}
                          </span>
                        </div>
                        {deposit.status !== 'withdrawal_pending' && (
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
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-medium/30">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-light font-sans">ID</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-light">Початкова сума</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-light">Виведено</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-light">Процент</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-light">Профіт</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-light">Дата створення</th>
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
                            {deposit.withdrawn > 0 ? `-$${deposit.withdrawn.toFixed(2)}` : '—'}
                          </td>
                          <td className="py-3 px-4 text-sm font-sans text-silver">{deposit.percentage}%</td>
                          <td className="py-3 px-4 text-sm font-medium text-silver font-sans">
                            +${deposit.profit.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-light">
                            {new Date(deposit.date).toLocaleDateString("uk-UA")}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-3 py-1 ${getStatusColor(deposit.status)} rounded-full text-xs font-sans`}
                            >
                              {getStatusLabel(deposit.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
