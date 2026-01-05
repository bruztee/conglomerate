'use client'

import { useState } from 'react'
import Link from 'next/link'

interface User {
  id: string
  name: string
  email: string
  balance: number
  totalDeposits: number
  totalWithdrawals: number
  profit: number
  registeredAt: string
  status: 'active' | 'blocked'
}

interface WithdrawalRequest {
  id: string
  userId: string
  userName: string
  amount: number
  method: string
  wallet: string
  status: 'pending' | 'approved' | 'rejected'
  date: string
}

interface DepositHistory {
  id: string
  userId: string
  userName: string
  amount: number
  profit: number
  date: string
  status: 'active' | 'completed'
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'users' | 'withdrawals' | 'deposits' | 'settings'>('users')
  const [profitPercentage, setProfitPercentage] = useState(5)
  const [minDeposit, setMinDeposit] = useState(100)
  const [maxDeposit, setMaxDeposit] = useState(100000)

  const [users] = useState<User[]>([
    {
      id: '1',
      name: 'Іван Петренко',
      email: 'ivan@example.com',
      balance: 15000,
      totalDeposits: 20000,
      totalWithdrawals: 5000,
      profit: 3250,
      registeredAt: '2025-12-01',
      status: 'active'
    },
    {
      id: '2',
      name: 'Олена Сидоренко',
      email: 'olena@example.com',
      balance: 8500,
      totalDeposits: 10000,
      totalWithdrawals: 1500,
      profit: 1850,
      registeredAt: '2025-11-15',
      status: 'active'
    }
  ])

  const [withdrawalRequests] = useState<WithdrawalRequest[]>([
    {
      id: '1',
      userId: '1',
      userName: 'Іван Петренко',
      amount: 1000,
      method: 'USDT (TRC20)',
      wallet: 'TXyz...abc123',
      status: 'pending',
      date: '2026-01-05'
    },
    {
      id: '2',
      userId: '2',
      userName: 'Олена Сидоренко',
      amount: 500,
      method: 'BTC',
      wallet: '1A1z...def456',
      status: 'pending',
      date: '2026-01-04'
    }
  ])

  const [depositHistory] = useState<DepositHistory[]>([
    {
      id: '1',
      userId: '1',
      userName: 'Іван Петренко',
      amount: 5000,
      profit: 1250,
      date: '2026-01-01',
      status: 'active'
    },
    {
      id: '2',
      userId: '1',
      userName: 'Іван Петренко',
      amount: 7500,
      profit: 2000,
      date: '2025-12-15',
      status: 'active'
    },
    {
      id: '3',
      userId: '2',
      userName: 'Олена Сидоренко',
      amount: 3000,
      profit: 850,
      date: '2025-12-20',
      status: 'completed'
    }
  ])

  const handleSaveSettings = () => {
    console.log('Settings saved:', { profitPercentage, minDeposit, maxDeposit })
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-gray-dark/95 backdrop-blur border-b border-gray-medium/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-xl font-bold text-accent">ADMIN PANEL</h1>
            <Link href="/" className="text-sm text-gray-light hover:text-foreground transition-colors">
              ← На головну
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex gap-2 border-b border-gray-medium/30">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'users'
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-gray-light hover:text-foreground'
              }`}
            >
              Користувачі
            </button>
            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'withdrawals'
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-gray-light hover:text-foreground'
              }`}
            >
              Заявки на вивід
            </button>
            <button
              onClick={() => setActiveTab('deposits')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'deposits'
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-gray-light hover:text-foreground'
              }`}
            >
              Історія депозитів
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-gray-light hover:text-foreground'
              }`}
            >
              Налаштування
            </button>
          </div>
        </div>

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Користувачі ({users.length})</h2>
            </div>

            <div className="bg-gray-dark/20 border border-gray-medium/30 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-dark/50">
                    <tr>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-light">Користувач</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-light">Баланс</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-light">Депозити</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-light">Виводи</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-light">Профіт</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-light">Реєстрація</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-light">Статус</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-light">Дії</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-t border-gray-medium/30 hover:bg-gray-dark/30">
                        <td className="py-4 px-6">
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-light">{user.email}</div>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-medium">${user.balance.toLocaleString()}</td>
                        <td className="py-4 px-6 font-medium">${user.totalDeposits.toLocaleString()}</td>
                        <td className="py-4 px-6 font-medium">${user.totalWithdrawals.toLocaleString()}</td>
                        <td className="py-4 px-6 font-medium text-accent">${user.profit.toLocaleString()}</td>
                        <td className="py-4 px-6 text-sm text-gray-light">
                          {new Date(user.registeredAt).toLocaleDateString('uk-UA')}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-1 rounded text-xs ${
                            user.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                          }`}>
                            {user.status === 'active' ? 'Активний' : 'Заблокований'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <button className="text-accent hover:text-accent-hover text-sm">
                            Деталі
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Заявки на вивід ({withdrawalRequests.filter(r => r.status === 'pending').length})</h2>
            </div>

            <div className="grid gap-4">
              {withdrawalRequests.map((request) => (
                <div key={request.id} className="bg-gray-dark/20 border border-gray-medium/30 rounded-lg p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-gray-light">Користувач</div>
                        <div className="font-medium">{request.userName}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-light">Сума</div>
                        <div className="text-2xl font-bold text-accent">${request.amount.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-light">Дата</div>
                        <div>{new Date(request.date).toLocaleDateString('uk-UA')}</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-gray-light">Метод</div>
                        <div className="font-medium">{request.method}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-light">Гаманець</div>
                        <div className="font-mono text-sm">{request.wallet}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-light">Статус</div>
                        <span className={`inline-block px-2 py-1 rounded text-xs ${
                          request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                          request.status === 'approved' ? 'bg-green-500/20 text-green-500' :
                          'bg-red-500/20 text-red-500'
                        }`}>
                          {request.status === 'pending' ? 'Очікує' :
                           request.status === 'approved' ? 'Схвалено' : 'Відхилено'}
                        </span>
                      </div>
                    </div>
                  </div>
                  {request.status === 'pending' && (
                    <div className="flex gap-3 mt-6 pt-6 border-t border-gray-medium/30">
                      <button className="flex-1 px-4 py-2 bg-accent hover:bg-accent-hover text-foreground font-medium rounded-lg transition-colors">
                        Схвалити
                      </button>
                      <button className="flex-1 px-4 py-2 bg-gray-medium hover:bg-gray-light text-foreground font-medium rounded-lg transition-colors">
                        Відхилити
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'deposits' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Історія депозитів ({depositHistory.length})</h2>
            </div>

            <div className="bg-gray-dark/20 border border-gray-medium/30 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-dark/50">
                    <tr>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-light">Користувач</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-light">Сума</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-light">Профіт</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-light">Дата</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-light">Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {depositHistory.map((deposit) => (
                      <tr key={deposit.id} className="border-t border-gray-medium/30 hover:bg-gray-dark/30">
                        <td className="py-4 px-6 font-medium">{deposit.userName}</td>
                        <td className="py-4 px-6 font-medium">${deposit.amount.toLocaleString()}</td>
                        <td className="py-4 px-6 font-medium text-accent">${deposit.profit.toLocaleString()}</td>
                        <td className="py-4 px-6 text-sm text-gray-light">
                          {new Date(deposit.date).toLocaleDateString('uk-UA')}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-1 rounded text-xs ${
                            deposit.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {deposit.status === 'active' ? 'Активний' : 'Завершений'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Налаштування платформи</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-dark/20 border border-gray-medium/30 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-6">Прибутковість</h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="profitPercentage" className="block text-sm font-medium mb-2">
                      Відсоток прибутку (місячний)
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="number"
                        id="profitPercentage"
                        value={profitPercentage}
                        onChange={(e) => setProfitPercentage(parseFloat(e.target.value))}
                        className="flex-1 px-4 py-3 bg-background border border-gray-medium rounded-lg focus:outline-none focus:border-accent transition-colors"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                      <span className="text-2xl font-bold text-accent">{profitPercentage}%</span>
                    </div>
                    <p className="text-xs text-gray-light mt-2">
                      Базовий відсоток прибутку для всіх депозитів
                    </p>
                  </div>

                  <div className="bg-background/50 border border-accent/30 rounded-lg p-4">
                    <div className="text-sm text-gray-light mb-2">Приклад розрахунку</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Депозит $1,000:</span>
                        <span className="font-bold text-accent">${(1000 * profitPercentage / 100).toFixed(2)}/міс</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Депозит $10,000:</span>
                        <span className="font-bold text-accent">${(10000 * profitPercentage / 100).toFixed(2)}/міс</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-dark/20 border border-gray-medium/30 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-6">Ліміти депозитів</h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="minDeposit" className="block text-sm font-medium mb-2">
                      Мінімальний депозит
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-light">$</span>
                      <input
                        type="number"
                        id="minDeposit"
                        value={minDeposit}
                        onChange={(e) => setMinDeposit(parseFloat(e.target.value))}
                        className="w-full pl-8 pr-4 py-3 bg-background border border-gray-medium rounded-lg focus:outline-none focus:border-accent transition-colors"
                        min="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="maxDeposit" className="block text-sm font-medium mb-2">
                      Максимальний депозит
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-light">$</span>
                      <input
                        type="number"
                        id="maxDeposit"
                        value={maxDeposit}
                        onChange={(e) => setMaxDeposit(parseFloat(e.target.value))}
                        className="w-full pl-8 pr-4 py-3 bg-background border border-gray-medium rounded-lg focus:outline-none focus:border-accent transition-colors"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveSettings}
                className="px-8 py-3 bg-accent hover:bg-accent-hover text-foreground font-bold rounded-lg transition-colors"
              >
                Зберегти налаштування
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
