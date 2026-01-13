"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/lib/api"
import Header from "@/components/Header"
import Loading from "@/components/Loading"
import WarningIcon from "@/components/icons/WarningIcon"

interface WithdrawalRequest {
  id: string
  depositId: string
  amount: number
  percentage: number
  method: string
  status: "pending" | "completed" | "rejected"
  createdDate: string
  withdrawDate: string | null
}

interface Deposit {
  id: string
  amount: number
  percentage: number
  profit: number
  createdDate: string
  selected: boolean
}

export default function WithdrawPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  const [walletAddress, setWalletAddress] = useState("")
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [userBalance, setUserBalance] = useState(0)
  const [userProfit, setUserProfit] = useState(0)
  const [loading, setLoading] = useState(true)

  // Show loading while checking auth
  if (authLoading) {
    return <Loading fullScreen size="lg" />
  }

  // Redirect if not authenticated
  if (!user) {
    router.push('/auth/login')
    return <Loading fullScreen size="lg" />
  }
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [activeDeposits, setActiveDeposits] = useState<Deposit[]>([])
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalRequest[]>([])

  // Завантаження даних при mount
  useEffect(() => {
    async function fetchData() {
      if (!user) {
        router.push('/auth/login')
        return
      }

      setLoading(true)
      try {
        // Отримати wallet balance
        const walletResult = await api.getWallet()
        if (walletResult.success && walletResult.data) {
          setUserBalance(walletResult.data.balance || 0)
        }

        // Отримати deposits (активні)
        const depositsResult = await api.getDeposits()
        if (depositsResult.success && depositsResult.data) {
          const activeDepositsData = depositsResult.data.filter((d: any) => d.status === 'confirmed').map((d: any) => ({
            id: d.id,
            amount: d.amount,
            percentage: 5, // або з плану
            profit: 0, // TODO: розрахувати на основі часу
            createdDate: d.created_at,
            selected: false,
          }))
          setActiveDeposits(activeDepositsData)
        }

        // Отримати withdrawal history
        const withdrawalsResult = await api.getWithdrawals()
        if (withdrawalsResult.success && withdrawalsResult.data) {
          const historyData = withdrawalsResult.data.withdrawals?.map((w: any) => ({
            id: w.id,
            depositId: w.account_id,
            amount: w.amount,
            percentage: 0,
            method: w.method || 'USDT',
            status: w.status === 'approved' ? 'completed' : w.status === 'requested' ? 'pending' : 'rejected',
            createdDate: w.created_at,
            withdrawDate: w.processed_at,
          })) || []
          setWithdrawalHistory(historyData)
        }
      } catch (err) {
        // Silent fail
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, router])

  const methods = [
    { id: "usdt-trc20", name: "USDT (TRC20)", fee: "1%", minAmount: 50 },
    { id: "usdt-erc20", name: "USDT (ERC20)", fee: "2%", minAmount: 100 },
    { id: "btc", name: "Bitcoin (BTC)", fee: "1.5%", minAmount: 100 },
  ]

  const toggleDepositSelection = (id: string) => {
    setActiveDeposits((prev) =>
      prev.map((deposit) => (deposit.id === id ? { ...deposit, selected: !deposit.selected } : deposit)),
    )
  }

  const selectedTotal = activeDeposits.filter((d) => d.selected).reduce((sum, d) => sum + d.amount + d.profit, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setMessage('')

    try {
      if (selectedTotal === 0) {
        setError('Оберіть депозити для виводу')
        setSubmitting(false)
        return
      }

      if (!walletAddress) {
        setError('Введіть адресу гаманця')
        setSubmitting(false)
        return
      }

      if (!selectedMethod) {
        setError('Оберіть метод виводу')
        setSubmitting(false)
        return
      }

      // Створити withdrawal request
      const result = await api.createWithdrawal(selectedTotal, selectedMethod, {
        wallet_address: walletAddress,
      })

      if (result.success) {
        setMessage('Заявка на вивід успішно створена! Очікуйте обробки протягом 24-48 годин.')
        setWalletAddress('')
        setSelectedMethod(null)
        setActiveDeposits(prev => prev.map(d => ({ ...d, selected: false })))
        
        // Перезавантажити withdrawal history
        const withdrawalsResult = await api.getWithdrawals()
        if (withdrawalsResult.success && withdrawalsResult.data) {
          const historyData = withdrawalsResult.data.withdrawals?.map((w: any) => ({
            id: w.id,
            depositId: w.account_id,
            amount: w.amount,
            percentage: 0,
            method: w.method || 'USDT',
            status: w.status === 'approved' ? 'completed' : w.status === 'requested' ? 'pending' : 'rejected',
            createdDate: w.created_at,
            withdrawDate: w.processed_at,
          })) || []
          setWithdrawalHistory(historyData)
        }
      } else {
        setError(result.error?.message || 'Помилка створення заявки на вивід')
      }
    } catch (err) {
      setError('Помилка створення заявки на вивід')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <Loading fullScreen size="lg" />
  }

  if (!user) {
    return null
  }

  return (
    <>
      <Header isAuthenticated={true} userBalance={userBalance} userProfit={userProfit} />

      {/* Success/Error Messages */}
      {message && (
        <div className="fixed top-4 right-4 z-50 bg-green-900/90 border border-green-500 text-green-400 px-6 py-4 rounded-lg shadow-lg max-w-md">
          {message}
        </div>
      )}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-900/90 border border-red-500 text-red-400 px-6 py-4 rounded-lg shadow-lg max-w-md">
          {error}
        </div>
      )}

      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Вивід коштів</h1>
            <p className="text-gray-light">Виведіть свій прибуток на криптогаманець</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-dark border border-gray-medium rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Створити заявку на вивід</h2>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">Виберіть депозити для виводу</label>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {activeDeposits.map((deposit) => (
                    <div
                      key={deposit.id}
                      onClick={() => toggleDepositSelection(deposit.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        deposit.selected ? "border-silver bg-silver/5" : "border-gray-medium hover:border-gray-light"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium font-sans">
                            ${deposit.amount.toFixed(2)} + ${deposit.profit.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-light">
                            Процент: <span className="font-sans text-silver">{deposit.percentage}%</span>
                          </div>
                          <div className="text-xs text-gray-light mt-1">
                            Створено: {new Date(deposit.createdDate).toLocaleDateString("uk-UA")}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-silver font-sans">
                            ${(deposit.amount + deposit.profit).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-light">всього</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {activeDeposits.length === 0 && (
                  <div className="text-center py-8 text-gray-light">Немає активних депозитів</div>
                )}
              </div>

              <div className="bg-background border border-gray-medium rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-light">Обрано для виводу</span>
                  <span className="text-2xl font-bold text-silver font-sans">${selectedTotal.toFixed(2)}</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-3">Метод виводу</label>
                  <div className="space-y-2">
                    {methods.map((method) => (
                      <div
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedMethod === method.id
                            ? "border-silver bg-silver/5"
                            : "border-gray-medium hover:border-gray-light"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium font-sans">{method.name}</div>
                            <div className="text-xs text-gray-light">
                              Мінімум: <span className="font-sans">${method.minAmount}</span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-light">
                            Комісія: <span className="font-sans">{method.fee}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedTotal > 0 && selectedMethod && (
                  <div className="bg-background border border-gray-medium rounded-lg p-4">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-light">Сума:</span>
                        <span className="font-sans font-medium">${selectedTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-light">Комісія (1%):</span>
                        <span className="font-sans font-medium text-silver">-${(selectedTotal * 0.01).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-medium">
                        <span className="font-medium">До отримання:</span>
                        <span className="font-sans font-bold text-silver">${(selectedTotal * 0.99).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="wallet" className="block text-sm font-medium mb-2">
                    Адреса гаманця
                  </label>
                  <input
                    type="text"
                    id="wallet"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-gray-medium rounded-lg focus:outline-none focus:border-silver transition-colors font-sans"
                    placeholder="Введіть адресу вашого криптогаманця"
                  />
                </div>

                <div className="bg-silver/10 border border-silver/30 rounded-lg p-4">
                  <div className="flex gap-2 text-xs">
                    <WarningIcon className="w-4 h-4 text-silver flex-shrink-0 mt-0.5" />
                    <p className="text-gray-light">
                      Перевірте правильність адреси гаманця. Кошти, відправлені на невірну адресу, не можуть бути
                      повернені.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={selectedTotal === 0 || !walletAddress || !selectedMethod || submitting}
                  className="btn-gradient-primary w-full px-4 py-3 disabled:bg-gray-medium disabled:cursor-not-allowed disabled:border-gray-medium disabled:shadow-none text-foreground font-bold rounded-lg transition-all font-sans"
                >
                  {submitting ? 'Створення заявки...' : 'Подати заявку на вивід'}
                </button>
              </form>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-dark border border-gray-medium rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Умови виводу</h2>

                <div className="space-y-4 text-sm">
                  <div className="flex gap-3">
                    <span className="text-silver">✓</span>
                    <div>
                      <div className="font-medium mb-1">Мінімальна сума виводу</div>
                      <div className="text-gray-light">
                        <span className="font-sans">$50</span> для <span className="font-sans">USDT (TRC20)</span>,{" "}
                        <span className="font-sans">$100</span> для інших методів
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="text-silver">✓</span>
                    <div>
                      <div className="font-medium mb-1">Комісія</div>
                      <div className="text-gray-light">
                        <span className="font-sans">1-2%</span> в залежності від методу виводу
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="text-silver">✓</span>
                    <div>
                      <div className="font-medium mb-1">Час обробки</div>
                      <div className="text-gray-light">
                        <span className="font-sans">24-48</span> годин для перевірки заявки
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="text-silver">✓</span>
                    <div>
                      <div className="font-medium mb-1">Доступність</div>
                      <div className="text-gray-light">
                        Виводи доступні <span className="font-sans">24/7</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-dark border border-gray-medium rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Історія виводів</h2>

                {withdrawalHistory.length > 0 ? (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {withdrawalHistory.map((request) => (
                      <div key={request.id} className="bg-background border border-gray-medium rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-medium font-sans">${request.amount.toFixed(2)}</div>
                            <div className="text-xs text-gray-light">
                              Процент: <span className="font-sans text-silver">{request.percentage}%</span>
                            </div>
                            <div className="text-xs text-gray-light font-sans mt-1">{request.method}</div>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-sans ${
                              request.status === "completed"
                                ? "bg-green-500/20 text-green-500"
                                : request.status === "pending"
                                  ? "bg-yellow-500/20 text-yellow-500"
                                  : "bg-red-500/20 text-red-500"
                            }`}
                          >
                            {request.status === "completed"
                              ? "Виконано"
                              : request.status === "pending"
                                ? "В обробці"
                                : "Відхилено"}
                          </span>
                        </div>
                        <div className="text-xs text-gray-light space-y-1">
                          <div>Створено: {new Date(request.createdDate).toLocaleDateString("uk-UA")}</div>
                          {request.withdrawDate && (
                            <div>Виведено: {new Date(request.withdrawDate).toLocaleDateString("uk-UA")}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-light">Історія виводів порожня</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
