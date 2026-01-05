'use client'

import { useState } from 'react'
import Header from '@/components/Header'

interface WithdrawalRequest {
  id: string
  amount: number
  method: string
  status: 'pending' | 'completed' | 'rejected'
  date: string
}

export default function WithdrawPage() {
  const [amount, setAmount] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [userBalance] = useState(15000)
  const [userProfit] = useState(3250.50)
  const [availableBalance] = useState(12750.50)

  const [withdrawalHistory] = useState<WithdrawalRequest[]>([
    { id: '1', amount: 1000, method: 'USDT (TRC20)', status: 'completed', date: '2026-01-03' },
    { id: '2', amount: 500, method: 'BTC', status: 'pending', date: '2026-01-04' }
  ])

  const methods = [
    { id: 'usdt-trc20', name: 'USDT (TRC20)', fee: '1%', minAmount: 50 },
    { id: 'usdt-erc20', name: 'USDT (ERC20)', fee: '2%', minAmount: 100 },
    { id: 'btc', name: 'Bitcoin (BTC)', fee: '1.5%', minAmount: 100 }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
  }

  return (
    <>
      <Header isAuthenticated={true} userBalance={userBalance} userProfit={userProfit} />
      
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Вивід коштів</h1>
            <p className="text-gray-light">Виведіть свій прибуток на криптогаманець</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-dark border border-gray-medium rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Створити заявку на вивід</h2>
              
              <div className="bg-background border border-gray-medium rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-light">Доступно для виводу</span>
                  <span className="text-2xl font-bold text-accent">${availableBalance.toFixed(2)}</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Метод виводу
                  </label>
                  <div className="space-y-2">
                    {methods.map((method) => (
                      <div
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedMethod === method.id ? 'border-accent bg-accent/5' : 'border-gray-medium hover:border-gray-light'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{method.name}</div>
                            <div className="text-xs text-gray-light">Мінімум: ${method.minAmount}</div>
                          </div>
                          <div className="text-sm text-gray-light">
                            Комісія: {method.fee}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="amount" className="block text-sm font-medium mb-2">
                    Сума виводу
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
                      min="50"
                      max={availableBalance}
                    />
                  </div>
                  {amount && selectedMethod && (
                    <div className="mt-2 text-xs text-gray-light">
                      Комісія: ${(parseFloat(amount) * 0.01).toFixed(2)} | 
                      До отримання: ${(parseFloat(amount) * 0.99).toFixed(2)}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="wallet" className="block text-sm font-medium mb-2">
                    Адреса гаманця
                  </label>
                  <input
                    type="text"
                    id="wallet"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-gray-medium rounded-lg focus:outline-none focus:border-accent transition-colors"
                    placeholder="Введіть адресу вашого криптогаманця"
                  />
                </div>

                <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
                  <div className="flex gap-2 text-xs">
                    <span className="text-accent">⚠️</span>
                    <p className="text-gray-light">
                      Перевірте правильність адреси гаманця. Кошти, відправлені на невірну адресу, не можуть бути повернені.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!amount || !walletAddress || !selectedMethod}
                  className="w-full px-4 py-3 bg-accent hover:bg-accent-hover disabled:bg-gray-medium disabled:cursor-not-allowed text-foreground font-bold rounded-lg transition-colors"
                >
                  Подати заявку на вивід
                </button>
              </form>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-dark border border-gray-medium rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Умови виводу</h2>
                
                <div className="space-y-4 text-sm">
                  <div className="flex gap-3">
                    <span className="text-accent">✓</span>
                    <div>
                      <div className="font-medium mb-1">Мінімальна сума виводу</div>
                      <div className="text-gray-light">$50 для USDT (TRC20), $100 для інших методів</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <span className="text-accent">✓</span>
                    <div>
                      <div className="font-medium mb-1">Комісія</div>
                      <div className="text-gray-light">1-2% в залежності від методу виводу</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <span className="text-accent">✓</span>
                    <div>
                      <div className="font-medium mb-1">Час обробки</div>
                      <div className="text-gray-light">24-48 годин для перевірки заявки</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <span className="text-accent">✓</span>
                    <div>
                      <div className="font-medium mb-1">Доступність</div>
                      <div className="text-gray-light">Виводи доступні 24/7</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-dark border border-gray-medium rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Історія виводів</h2>
                
                {withdrawalHistory.length > 0 ? (
                  <div className="space-y-3">
                    {withdrawalHistory.map((request) => (
                      <div key={request.id} className="bg-background border border-gray-medium rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-medium">${request.amount.toFixed(2)}</div>
                            <div className="text-xs text-gray-light">{request.method}</div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            request.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                            request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                            'bg-red-500/20 text-red-500'
                          }`}>
                            {request.status === 'completed' ? 'Виконано' :
                             request.status === 'pending' ? 'В обробці' : 'Відхилено'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-light">
                          {new Date(request.date).toLocaleDateString('uk-UA')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-light">
                    Історія виводів порожня
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
