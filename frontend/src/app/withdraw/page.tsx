"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/lib/api"
import Header from "@/components/Header"
import Loading from "@/components/Loading"
import WarningIcon from "@/components/icons/WarningIcon"
import Pagination from "@/components/Pagination"

interface WithdrawalRequest {
  id: string
  depositId: string
  amount: number
  percentage: number
  method: string
  status: "pending" | "completed" | "rejected"
  createdDate: string
  withdrawDate: string | null
  balanceBefore?: number
  balanceAfter?: number
  depositBefore?: number
  depositAfter?: number
}

interface Deposit {
  id: string
  amount: number
  frozen?: number
  percentage: number
  profit: number
  available?: number
  createdDate: string
  network?: string
  coin?: string
}

export default function WithdrawPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  
  // ВСІ useState МАЮТЬ БУТИ НА ПОЧАТКУ
  const [walletAddress, setWalletAddress] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [withdrawalType, setWithdrawalType] = useState<'partial' | 'full' | null>(null)
  const [selectedDepositId, setSelectedDepositId] = useState<string>("")
  const [userBalance, setUserBalance] = useState(0)
  const [userProfit, setUserProfit] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [activeDeposits, setActiveDeposits] = useState<Deposit[]>([])
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalRequest[]>([])
  const [withdrawalPage, setWithdrawalPage] = useState(1)
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

  // Завантаження даних при mount
  useEffect(() => {
    // Не запускати fetchData поки authLoading
    if (authLoading) return
    
    async function fetchData() {
      if (!user) {
        router.push('/auth/login')
        return
      }

      setLoading(true)
      try {
        // Отримати wallet balance (total invested + profit)
        const walletResult = await api.getWallet()
        if (walletResult.success && walletResult.data) {
          const data = walletResult.data as any
          setUserBalance(data.balance || 0)
          setUserProfit(data.total_profit || 0)
        }

        // Отримати investments для profit
        const investmentsResult = await api.getInvestments()
        const investmentsMap = new Map()
        
        if (investmentsResult.success && investmentsResult.data) {
          const invData = investmentsResult.data as any
          const investments = invData.investments || []
          investments.forEach((inv: any) => {
            if (inv.deposit_id && inv.status === 'active') {
              investmentsMap.set(inv.deposit_id, inv)
            }
          })
        }

        // Отримати deposits (АКТИВНІ ПОЗИЦІЇ)
        const depositsResult = await api.getDeposits()
        if (depositsResult.success && depositsResult.data) {
          const data = depositsResult.data as any
          const deposits = data.deposits || []
          
          const activeDepositsData = deposits
            .filter((d: any) => {
              const investment = investmentsMap.get(d.id)
              // Показувати ТІЛЬКИ якщо investment.status === 'active'
              // deposit.status може бути 'confirmed' навіть коли позиція закрита!
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
                createdDate: d.created_at,
                network: paymentDetails.network || 'TRC20',
                coin: paymentDetails.coin || 'USDT',
              }
            })
            .filter((d: any) => d.available > 0.01) // НЕ показувати депозити без доступних коштів
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
  }, [user, router, authLoading])

  // Автоматичний вибір депозиту з URL параметра
  useEffect(() => {
    const depositIdFromUrl = searchParams.get('deposit_id')
    if (depositIdFromUrl && activeDeposits.length > 0) {
      const depositExists = activeDeposits.find(d => d.id === depositIdFromUrl)
      if (depositExists) {
        setSelectedDepositId(depositIdFromUrl)
      }
    }
  }, [searchParams, activeDeposits])

  const selectedDeposit = activeDeposits.find(d => d.id === selectedDepositId)
  const selectedNetwork = selectedDeposit?.network || ''
  const maxWithdrawAmount = selectedDeposit ? selectedDeposit.amount + selectedDeposit.profit - (selectedDeposit.frozen || 0) : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setMessage('')

    try {
      if (!selectedDepositId) {
        setError('Оберіть депозит для виводу')
        setSubmitting(false)
        return
      }

      if (!withdrawalType) {
        setError('Оберіть тип виводу')
        setSubmitting(false)
        return
      }

      const amount = withdrawalType === 'full' ? maxWithdrawAmount : parseFloat(withdrawAmount)
      
      if (withdrawalType === 'partial' && (!amount || amount <= 0)) {
        setError('Введіть суму для виводу')
        setSubmitting(false)
        return
      }

      if (!walletAddress) {
        setError('Введіть адресу гаманця')
        setSubmitting(false)
        return
      }

      // Створити withdrawal request - backend валідує доступну суму
      const result = await api.createWithdrawal({
        amount: amount,
        close: withdrawalType === 'full', // Якщо full withdrawal - сервер сам візьме всю суму
        destination: {
          wallet_address: walletAddress,
          network: selectedNetwork,
        },
        selected_deposit_id: selectedDepositId,
      })

      if (result.success) {
        setMessage('Заявка на вивід успішно створена! Очікуйте обробки протягом 24-48 годин.')
        setWalletAddress('')
        setWithdrawAmount('')
        setWithdrawalType(null)
        setSelectedDepositId('')
        
        // ВАЖЛИВО: Перезавантажити ВСІ дані - баланс, deposits, withdrawals
        setLoading(true)
        
        // Оновити баланс
        const walletResult = await api.getWallet()
        if (walletResult.success && walletResult.data) {
          const data = walletResult.data as any
          setUserBalance(data.balance || 0)
        }
        
        // Оновити investments
        const investmentsResult = await api.getInvestments()
        const investmentsMap = new Map()
        if (investmentsResult.success && investmentsResult.data) {
          const invData = investmentsResult.data as any
          const investments = invData.investments || []
          investments.forEach((inv: any) => {
            if (inv.deposit_id) {
              investmentsMap.set(inv.deposit_id, inv)
            }
          })
        }
        
        // Оновити deposits (АКТИВНІ ПОЗИЦІЇ)
        const depositsResult = await api.getDeposits()
        if (depositsResult.success && depositsResult.data) {
          const data = depositsResult.data as any
          const deposits = data.deposits || []
          
          const activeDepositsData = deposits
            .filter((d: any) => {
              const investment = investmentsMap.get(d.id)
              // Показувати ТІЛЬКИ якщо investment.status === 'active'
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
                createdDate: d.created_at,
                network: paymentDetails.network || 'TRC20',
                coin: paymentDetails.coin || 'USDT',
              }
            })
            .filter((d: any) => d.available > 0.01) // НЕ показувати депозити без доступних коштів
          setActiveDeposits(activeDepositsData)
        }
        
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
            balanceBefore: w.balance_before_withdrawal,
            balanceAfter: w.balance_after_withdrawal,
            depositBefore: w.deposit_amount_before,
            depositAfter: w.deposit_amount_after,
          })) || []
          setWithdrawalHistory(historyData)
        }
        
        setLoading(false)
      } else {
        const errorMsg = result.error?.message || 'Помилка при створенні заявки на вивід'
        setError(errorMsg)
        setLoading(false)
      }
    } catch (err: any) {
      setError(err?.message || 'Помилка при створенні заявки на вивід')
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
      <Header isAuthenticated={true} />

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
            <div className="bg-blur-dark border border-gray-medium rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Створити заявку на вивід</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-3">Оберіть депозит для виводу</label>
                  {activeDeposits.length > 0 ? (
                    <div className="space-y-2">
                      {activeDeposits.map((deposit) => (
                        <div
                          key={deposit.id}
                          onClick={() => setSelectedDepositId(deposit.id)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedDepositId === deposit.id
                              ? "border-silver bg-silver/5"
                              : "border-gray-medium hover:border-gray-light"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="font-medium font-sans">
                                ${deposit.amount.toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-light">
                                Профіт: <span className="font-sans text-silver">${deposit.profit.toFixed(2)}</span>
                              </div>
                              <div className="text-xs text-gray-light mt-1">
                                Мережа: <span className="font-sans text-silver">{deposit.coin} ({deposit.network})</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-silver font-sans">
                                ${(deposit.amount + deposit.profit - (deposit.frozen || 0)).toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-light">доступно</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-light">Немає активних депозитів</div>
                  )}
                  <p className="text-xs text-gray-light mt-2">
                    Вивід можливий тільки в тій же мережі, в якій був зроблений депозит
                  </p>
                </div>

                {selectedDeposit && (
                  <>
                    <div className="bg-blur border border-gray-medium rounded-lg p-4">
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-light">Обраний депозит:</span>
                          <span className="font-sans font-medium">${selectedDeposit.amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-light">Профіт:</span>
                          <span className="font-sans font-medium text-silver">${selectedDeposit.profit.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-medium">
                          <span className="font-medium">Доступно:</span>
                          <span className="font-sans font-bold text-silver">${maxWithdrawAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-light">Мережа виводу:</span>
                          <span className="font-sans font-medium text-silver">{selectedDeposit.coin} ({selectedDeposit.network})</span>
                        </div>
                      </div>
                    </div>

                    {/* Тип виводу */}
                    <div>
                      <label className="block text-sm font-medium mb-3">Оберіть тип виводу</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setWithdrawalType('partial')
                            setWithdrawAmount('')
                          }}
                          className={`px-4 py-3 border-2 rounded-lg font-medium transition-all ${
                            withdrawalType === 'partial'
                              ? 'border-silver bg-silver/10 text-silver'
                              : 'border-gray-medium hover:border-gray-light text-gray-light hover:text-foreground'
                          }`}
                        >
                          Зняти частину
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setWithdrawalType('full')
                            setWithdrawAmount(maxWithdrawAmount.toFixed(2))
                          }}
                          className={`px-4 py-3 border-2 rounded-lg font-medium transition-all ${
                            withdrawalType === 'full'
                              ? 'border-silver bg-silver/10 text-silver'
                              : 'border-gray-medium hover:border-gray-light text-gray-light hover:text-foreground'
                          }`}
                        >
                          Зняти все
                        </button>
                      </div>
                    </div>

                    {/* Показати input суми тільки якщо обрано partial */}
                    {withdrawalType === 'partial' && (
                      <div>
                        <label htmlFor="amount" className="block text-sm font-medium mb-2">
                          Сума виводу
                        </label>
                        <input
                          type="text"
                          id="amount"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          className="w-full px-4 py-3 bg-blur border border-gray-medium rounded-lg focus:outline-none focus:border-silver transition-colors font-sans"
                          placeholder="Введіть суму"
                        />
                        <p className="text-xs text-gray-light mt-1">
                          Можна вивести будь-яку суму до ${maxWithdrawAmount.toFixed(2)}
                        </p>
                      </div>
                    )}

                    {/* Показати повідомлення якщо обрано full */}
                    {withdrawalType === 'full' && (
                      <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                        <div className="flex gap-2">
                          <WarningIcon className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-orange-400 mb-1">Повний вивід</p>
                            <p className="text-sm text-gray-light">
                              Ваш депозит буде закритий і всі кошти (${maxWithdrawAmount.toFixed(2)}) будуть виведені на вказаний гаманець.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Показати wallet input тільки після вибору типу виводу */}
                {withdrawalType && (
                  <div>
                    <label htmlFor="wallet" className="block text-sm font-medium mb-2">
                      Адреса гаманця
                    </label>
                    <input
                      type="text"
                      id="wallet"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      className="w-full px-4 py-3 bg-blur border border-gray-medium rounded-lg focus:outline-none focus:border-silver transition-colors font-sans"
                      placeholder="Введіть адресу вашого криптогаманця"
                    />
                  </div>
                )}

                {withdrawalType && (
                  <>
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
                      disabled={!selectedDepositId || (withdrawalType === 'partial' && !withdrawAmount) || !walletAddress || submitting}
                      className="btn-gradient-primary w-full px-4 py-3 disabled:bg-gray-medium disabled:cursor-not-allowed disabled:border-gray-medium disabled:shadow-none text-foreground font-bold rounded-lg transition-all font-sans"
                    >
                      {submitting ? 'Створення заявки...' : 'Подати заявку на вивід'}
                    </button>
                  </>
                )}
              </form>
            </div>

            <div className="space-y-6">
              <div className="bg-blur-dark border border-gray-medium rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Умови виводу</h2>

                <div className="space-y-4 text-sm">
                  <div className="flex gap-3">
                    <span className="text-silver">✓</span>
                    <div>
                      <div className="font-medium mb-1">Без комісій</div>
                      <div className="text-gray-light">
                        Ми не стягуємо комісію за вивід коштів
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="text-silver">✓</span>
                    <div>
                      <div className="font-medium mb-1">Без мінімальної суми</div>
                      <div className="text-gray-light">
                        Виводьте будь-яку суму до вашого балансу
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

              <div className="bg-blur-dark border border-gray-medium rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Історія виводів</h2>

                {withdrawalHistory.length > 0 ? (
                  <>
                    <div className="space-y-3">
                      {withdrawalHistory
                        .slice((withdrawalPage - 1) * itemsPerPage, withdrawalPage * itemsPerPage)
                        .map((request) => (
                      <div key={request.id} className="bg-blur border border-gray-medium rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="text-sm font-bold font-sans">${request.amount.toFixed(2)}</div>
                            <div className="text-xs text-gray-light">{request.method}</div>
                          </div>
                          <div className={`px-2 py-1 rounded text-xs ${
                            request.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {request.status === 'completed' ? 'Виконано' :
                             request.status === 'pending' ? 'В обробці' :
                             'Відхилено'}
                          </div>
                        </div>
                        
                        {(request.balanceBefore || request.depositBefore) && (
                          <div className="text-xs mb-2 border-t border-gray-medium/30 pt-2 mt-2">
                            {request.balanceBefore && request.balanceAfter && (
                              <div className="mb-1 text-gray-light">
                                Баланс: <span className="font-sans">${request.balanceBefore.toFixed(2)} → ${request.balanceAfter.toFixed(2)}</span>
                              </div>
                            )}
                            {request.depositBefore && (
                              <div className="text-gray-light">
                                Депозит: <span className="font-sans">${request.depositBefore.toFixed(2)}</span>
                                {request.depositAfter !== null && (
                                  <> → <span className="font-sans">${request.depositAfter.toFixed(2)}</span></>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-light">
                          <div className="mb-1">Створено: {new Date(request.createdDate).toLocaleDateString('uk-UA')}</div>
                          {request.withdrawDate && (
                            <div>Виведено: {new Date(request.withdrawDate).toLocaleDateString('uk-UA')}</div>
                          )}
                        </div>
                      </div>
                    ))}
                    </div>
                    
                    <Pagination
                      currentPage={withdrawalPage}
                      totalPages={Math.ceil(withdrawalHistory.length / itemsPerPage)}
                      onPageChange={setWithdrawalPage}
                    />
                  </>
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
