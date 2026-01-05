'use client'

import { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'

interface Deposit {
  id: string
  amount: number
  profit: number
  date: string
  status: 'active' | 'completed'
}

export default function DepositPage() {
  const [amount, setAmount] = useState('')
  const [userBalance] = useState(15000)
  const [userProfit] = useState(3250.50)
  const [totalInvestments] = useState(12500)
  
  const [activeDeposits] = useState<Deposit[]>([
    { id: '1', amount: 5000, profit: 1250, date: '2026-01-01', status: 'active' },
    { id: '2', amount: 7500, profit: 2000.50, date: '2025-12-15', status: 'active' }
  ])

  const profitPercentage = 5
  
  const plan = {
    profit: `${profitPercentage}%`,
    minAmount: 100,
    maxAmount: 100000,
    duration: '30 днів'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <>
      <Header isAuthenticated={true} userBalance={userBalance} userProfit={userProfit} />
      
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Головна</h1>
            <p className="text-gray-light">Керуйте своїми інвестиціями</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-gray-dark/20 border border-gray-medium/30 rounded-lg p-6">
              <div className="text-gray-light text-sm mb-2">Загальний баланс</div>
              <div className="text-3xl font-bold text-foreground">${userBalance.toFixed(2)}</div>
            </div>
            
            <div className="bg-gray-dark/20 border border-gray-medium/30 rounded-lg p-6">
              <div className="text-gray-light text-sm mb-2">Загальний профіт</div>
              <div className="text-3xl font-bold text-accent">${userProfit.toFixed(2)}</div>
            </div>
            
            <div className="bg-gray-dark/20 border border-gray-medium/30 rounded-lg p-6">
              <div className="text-gray-light text-sm mb-2">Інвестовано</div>
              <div className="text-3xl font-bold text-foreground">${totalInvestments.toFixed(2)}</div>
            </div>
            
            <div className="bg-gray-dark/20 border border-gray-medium/30 rounded-lg p-6">
              <div className="text-gray-light text-sm mb-2">Активні депозити</div>
              <div className="text-3xl font-bold text-accent">{activeDeposits.length}</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-dark/20 border border-gray-medium/30 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Створити депозит</h2>
              
              <div className="bg-background/50 border border-accent/30 rounded-lg p-4 mb-6">
                <h3 className="font-bold mb-3 text-accent">Ваш план</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-light text-xs mb-1">Прибуток</div>
                    <div className="font-bold text-accent">{plan.profit}</div>
                  </div>
                  <div>
                    <div className="text-gray-light text-xs mb-1">Мінімум</div>
                    <div className="font-bold">${plan.minAmount}</div>
                  </div>
                  <div>
                    <div className="text-gray-light text-xs mb-1">Максимум</div>
                    <div className="font-bold">${plan.maxAmount}</div>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium mb-2">
                    Сума депозиту
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-light">$</span>
                    <input
                      type="number"
                      id="amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 bg-background border border-gray-medium rounded-lg focus:outline-none focus:border-accent transition-colors"
                      placeholder="0.00"
                      min={plan.minAmount}
                      max={plan.maxAmount}
                    />
                  </div>
                  <p className="text-xs text-gray-light mt-2">
                    Від ${plan.minAmount} до ${plan.maxAmount}
                  </p>
                </div>

                <div className="bg-background border border-gray-medium rounded-lg p-4">
                  <div className="text-sm text-gray-light mb-2">Очікуваний прибуток ({profitPercentage}% місячних)</div>
                  <div className="text-2xl font-bold text-accent">
                    {amount ? 
                      `$${(parseFloat(amount) * profitPercentage / 100).toFixed(2)}` 
                      : '$0.00'}
                  </div>
                  <div className="text-xs text-gray-light mt-1">за {plan.duration}</div>
                </div>

                <button
                  type="submit"
                  disabled={!amount}
                  className="w-full px-4 py-3 bg-accent hover:bg-accent-hover disabled:bg-gray-medium disabled:cursor-not-allowed text-foreground font-bold rounded-lg transition-colors"
                >
                  Створити депозит
                </button>
              </form>
            </div>

            <div className="bg-gray-dark/20 border border-gray-medium/30 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Активні депозити</h2>
                <Link href="/dashboard" className="text-accent hover:text-accent-hover text-sm">
                  Детальніше →
                </Link>
              </div>
              
              {activeDeposits.length > 0 ? (
                <div className="space-y-4">
                  {activeDeposits.map((deposit) => (
                    <div key={deposit.id} className="bg-background/50 border border-gray-medium/50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-sm text-gray-light">Сума депозиту</div>
                          <div className="text-xl font-bold">${deposit.amount.toFixed(2)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-light">Профіт</div>
                          <div className="text-xl font-bold text-accent">${deposit.profit.toFixed(2)}</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-light">
                        <span>{new Date(deposit.date).toLocaleDateString('uk-UA')}</span>
                        <span className="px-2 py-1 bg-accent/20 text-accent rounded text-xs">Активний</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-light">
                  <p className="mb-2">У вас поки немає активних депозитів</p>
                  <p className="text-sm">Створіть перший депозит зліва</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Link 
              href="/withdraw"
              className="p-6 bg-gray-dark/20 hover:bg-gray-dark/30 border border-gray-medium/30 hover:border-accent/50 rounded-lg transition-all text-center"
            >
              <div className="text-2xl mb-2">💸</div>
              <div className="font-bold mb-1">Вивести кошти</div>
              <div className="text-sm text-gray-light">Зняти прибуток</div>
            </Link>
            
            <Link 
              href="/referral"
              className="p-6 bg-gray-dark/20 hover:bg-gray-dark/30 border border-gray-medium/30 hover:border-accent/50 rounded-lg transition-all text-center"
            >
              <div className="text-2xl mb-2">🔗</div>
              <div className="font-bold mb-1">Реферальна програма</div>
              <div className="text-sm text-gray-light">Запросити друзів</div>
            </Link>

            <Link 
              href="/dashboard"
              className="p-6 bg-gray-dark/20 hover:bg-gray-dark/30 border border-gray-medium/30 hover:border-accent/50 rounded-lg transition-all text-center"
            >
              <div className="text-2xl mb-2">📊</div>
              <div className="font-bold mb-1">Повна статистика</div>
              <div className="text-sm text-gray-light">Детальний огляд</div>
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
