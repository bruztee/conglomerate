'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import CopyIcon from '@/components/icons/CopyIcon'
import ArrowLeftIcon from '@/components/icons/ArrowLeftIcon'
import WarningIcon from '@/components/icons/WarningIcon'

interface PaymentMethod {
  id: string
  currency: string
  network: string
  wallet_address: string
  min_amount: number
}

interface DepositFlowProps {
  onSuccess: () => void
  userRate: number
}

type Step = 'amount' | 'currency' | 'network' | 'wallet' | 'confirm' | 'success'

export default function DepositFlow({ onSuccess, userRate }: DepositFlowProps) {
  const [step, setStep] = useState<Step>('amount')
  const [amount, setAmount] = useState('')
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null)
  const [selectedWallet, setSelectedWallet] = useState<PaymentMethod | null>(null)
  const [loading, setLoading] = useState(false)

  const minAmount = 10
  const maxAmount = 100000
  const quickAmounts = [100, 500, 1000, 5000, 10000]

  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  const fetchPaymentMethods = async () => {
    const result = await api.getActivePaymentMethods()
    if (result.success && result.data) {
      setPaymentMethods(result.data.payment_methods || [])
    }
  }

  const availableCurrencies = [...new Set(paymentMethods.map(m => m.currency))]
  
  const availableNetworks = selectedCurrency
    ? [...new Set(paymentMethods.filter(m => m.currency === selectedCurrency).map(m => m.network))]
    : []

  const availableWallets = selectedCurrency && selectedNetwork
    ? paymentMethods.filter(m => m.currency === selectedCurrency && m.network === selectedNetwork)
    : []

  const handleAmountNext = () => {
    if (!amount || parseFloat(amount) < minAmount || parseFloat(amount) > maxAmount) return
    setStep('currency')
  }

  const handleCurrencySelect = (currency: string) => {
    setSelectedCurrency(currency)
    setSelectedNetwork(null)
    setSelectedWallet(null)
    setStep('network')
  }

  const handleNetworkSelect = (network: string) => {
    setSelectedNetwork(network)
    setSelectedWallet(null)
    setStep('wallet')
  }

  const handleWalletSelect = (wallet: PaymentMethod) => {
    setSelectedWallet(wallet)
    setStep('confirm')
  }

  const handleConfirm = async () => {
    if (!selectedWallet || !amount) return
    
    setLoading(true)
    const result = await api.createDeposit(parseFloat(amount))
    setLoading(false)
    
    if (result.success) {
      setStep('success')
      // Trigger data refresh in parent
      await onSuccess()
    }
  }

  const resetFlow = () => {
    setStep('amount')
    setAmount('')
    setSelectedCurrency(null)
    setSelectedNetwork(null)
    setSelectedWallet(null)
  }

  const goBack = () => {
    if (step === 'currency') setStep('amount')
    else if (step === 'network') setStep('currency')
    else if (step === 'wallet') setStep('network')
    else if (step === 'confirm') setStep('wallet')
  }

  return (
    <div className="bg-gray-dark/20 border border-gray-medium/30 rounded-lg p-6 h-fit">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Створити депозит</h2>
        {step !== 'amount' && (
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-sm text-gray-light hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Назад
          </button>
        )}
      </div>

      {step === 'amount' && (
        <div className="max-w-md mx-auto">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Сума депозиту</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-light font-sans">$</span>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-3 bg-background border border-gray-medium rounded-lg focus:outline-none focus:border-silver transition-colors font-sans"
                placeholder="0.00"
                min={minAmount}
                max={maxAmount}
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
              Від <span className="font-sans">${minAmount}</span> до <span className="font-sans">${maxAmount}</span>
            </p>
          </div>

          <button
            onClick={handleAmountNext}
            disabled={!amount || parseFloat(amount) < minAmount || parseFloat(amount) > maxAmount}
            className="btn-gradient-primary w-full px-4 py-3 disabled:bg-gray-medium disabled:cursor-not-allowed text-foreground font-bold rounded-lg transition-colors font-sans"
          >
            Продовжити
          </button>
          
          <div className="text-center mt-4 pt-4 border-t border-gray-medium/30">
            <p className="text-sm text-gray-light mb-1">Ваша місячна ставка</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-[#C0A062] to-[#E8D4A0] bg-clip-text text-transparent">{userRate}%</p>
          </div>
        </div>
      )}

      {step === 'currency' && (
        <div className="space-y-4">
          <div>
            <p className="text-base font-medium text-center mb-6">Оберіть криптовалюту для депозиту</p>
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              {availableCurrencies.map((currency) => (
                <button
                  key={currency}
                  onClick={() => handleCurrencySelect(currency)}
                  className="btn-gradient-primary px-4 py-4 text-foreground font-bold rounded-lg transition-colors font-sans hover:opacity-90"
                >
                  {currency}
                </button>
              ))}
            </div>
            {availableCurrencies.length === 0 && (
              <p className="text-sm text-gray-light text-center py-4">Немає доступних методів оплати</p>
            )}
          </div>
        </div>
      )}

      {step === 'network' && selectedCurrency && (
        <div className="space-y-4">
          <div>
            <p className="text-base font-medium text-center mb-6">Оберіть мережу для {selectedCurrency}</p>
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              {availableNetworks.map((network) => (
                <button
                  key={network}
                  onClick={() => handleNetworkSelect(network)}
                  className="btn-gradient-primary px-4 py-4 text-foreground font-bold rounded-lg transition-colors font-sans hover:opacity-90"
                >
                  {network}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 'wallet' && selectedCurrency && selectedNetwork && (
        <div className="space-y-4">
          <div>
            <p className="text-base font-medium text-center mb-6">Підтвердіть вибір гаманця</p>
            <div className="space-y-3 max-w-md mx-auto">
              {availableWallets.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => handleWalletSelect(wallet)}
                  className="btn-gradient-primary w-full px-4 py-4 text-foreground font-bold rounded-lg transition-colors font-sans hover:opacity-90 text-left"
                >
                  <div className="flex justify-between items-center">
                    <span>{wallet.currency} ({wallet.network})</span>
                    {wallet.min_amount > 0 && (
                      <span className="text-xs">Мін: ${wallet.min_amount}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 'confirm' && selectedWallet && (
        <div className="space-y-4 max-w-md mx-auto">
          <p className="text-base font-medium text-center mb-4">Реквізити для оплати</p>
          <div className="bg-silver/10 border border-silver/30 rounded-lg p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-light">Сума:</span>
                <span className="font-bold text-silver font-sans">${amount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-light">Валюта:</span>
                <span className="font-bold text-silver font-sans">{selectedWallet.currency}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-light">Мережа:</span>
                <span className="font-medium font-sans">{selectedWallet.network}</span>
              </div>
              <div className="pt-3 border-t border-gray-medium/30">
                <div className="text-xs text-gray-light mb-2">Адреса гаманця:</div>
                <div className="font-mono text-sm bg-background p-3 rounded break-all text-white">
                  {selectedWallet.wallet_address}
                </div>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(selectedWallet.wallet_address)}
                  className="flex items-center gap-1 text-xs text-silver hover:text-foreground mt-2"
                >
                  <CopyIcon className="w-4 h-4" />
                  Копіювати адресу
                </button>
              </div>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <WarningIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-500">
                <p className="font-bold mb-1">Важливо!</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Відправляйте кошти СТРОГО в мережі {selectedWallet.network}</li>
                  <li>Перевірте адресу перед відправкою</li>
                  <li>Мінімальна сума: ${selectedWallet.min_amount || minAmount}</li>
                  <li>Депозит буде зараховано після підтвердження транзакції</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={loading}
            className="btn-gradient-primary w-full px-4 py-3 disabled:bg-gray-medium disabled:cursor-not-allowed text-foreground font-bold rounded-lg transition-colors font-sans"
          >
            {loading ? 'Обробка...' : 'Я оплатив - Підтвердити'}
          </button>

          <p className="flex items-center justify-center gap-1 text-xs text-gray-light">
            <WarningIcon className="w-4 h-4" />
            Натисніть кнопку ТІЛЬКИ після відправки коштів на вказану адресу
          </p>
        </div>
      )}

      {step === 'success' && (
        <div className="space-y-6 max-w-md mx-auto text-center">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
            <div className="flex items-center justify-center mx-auto mb-4">
              <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-green-500 mb-2">Депозит створено</h3>
            <p className="text-gray-light">
              Ваш депозит очікує підтвердження адміністратором. Ви отримаєте повідомлення після обробки.
            </p>
          </div>

          <button
            onClick={resetFlow}
            className="btn-gradient-primary w-full px-4 py-3 text-foreground font-bold rounded-lg transition-colors font-sans"
          >
            OK
          </button>
        </div>
      )}
    </div>
  )
}
