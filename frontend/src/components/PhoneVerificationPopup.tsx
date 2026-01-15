"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api"

interface PhoneVerificationPopupProps {
  onVerified: () => void
  onClose?: () => void
}

export default function PhoneVerificationPopup({ onVerified, onClose }: PhoneVerificationPopupProps) {
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  // Cooldown timer effect
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleSendOTP = async (e?: React.FormEvent, isResend = false) => {
    e?.preventDefault()
    setLoading(true)
    setError('')

    if (!phone.trim()) {
      setError('Введіть номер телефону')
      setLoading(false)
      return
    }

    const result = await api.sendPhoneOTP(phone.trim())

    if (result.success) {
      setStep('code')
      setCode('') // Очищуємо попередній код
      setResendCooldown(60) // Встановлюємо cooldown 60 секунд
      if (isResend) {
        setError('') // Очищуємо помилку при переотправці
      }
    } else {
      setError(result.error?.message || 'Помилка відправки коду')
    }

    setLoading(false)
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (code.length !== 6) {
      setError('Код має містити 6 цифр')
      setLoading(false)
      return
    }

    const result = await api.verifyPhoneOTP(phone, code)

    if (result.success) {
      onVerified()
    } else {
      const errorMessage = result.error?.message || 'Невірний код'
      
      // Обробка expired token
      if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
        setError('Код застарів або недійсний. Натисніть "Переотправити код"')
      } else {
        setError(errorMessage)
      }
      
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    await handleSendOTP(undefined, true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4">
        <div className="bg-gray-dark border border-gray-medium rounded-lg p-8 shadow-2xl relative">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-light hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Верифікація телефону</h2>
            <p className="text-gray-light text-sm">
              Для безпеки вашого акаунту підтвердіть номер телефону
            </p>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-2">
                  Номер телефону
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-gray-medium rounded-lg focus:outline-none focus:border-silver transition-colors"
                  placeholder="+380123456789"
                  disabled={loading}
                  autoFocus
                />
                <p className="text-xs text-gray-light mt-2">
                  Введіть номер у форматі: +380XXXXXXXXX
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-gradient-primary w-full px-6 py-3 text-foreground font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Відправка..." : "Надіслати код"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label htmlFor="code" className="block text-sm font-medium mb-2">
                  Код підтвердження
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setCode(value)
                  }}
                  className="w-full px-4 py-3 bg-background border border-gray-medium rounded-lg focus:outline-none focus:border-silver transition-colors text-center text-2xl tracking-widest font-mono"
                  placeholder="000000"
                  disabled={loading}
                  autoFocus
                  maxLength={6}
                />
                <p className="text-xs text-gray-light mt-2 text-center">
                  Введіть 6-значний код з SMS на номер {phone}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone')
                      setCode('')
                      setError('')
                    }}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gray-medium text-foreground font-bold rounded-lg transition-all hover:bg-gray-medium/80 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Назад
                  </button>
                  <button
                    type="submit"
                    disabled={loading || code.length !== 6}
                    className="flex-1 btn-gradient-primary px-6 py-3 text-foreground font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Перевірка..." : "Підтвердити"}
                  </button>
                </div>

                {/* Кнопка переотправки коду */}
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading || resendCooldown > 0}
                  className="w-full px-6 py-2 text-sm text-silver hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 
                    ? `Переотправити код (${resendCooldown} сек)` 
                    : 'Переотправити код'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
