"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Header from "@/components/Header"
import Link from "next/link"
import { api } from "@/lib/api"
import EmailIcon from "@/components/icons/EmailIcon"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleResend = async () => {
    if (!email) {
      setError('Email не вказано')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    const response = await api.resendVerification(email)

    if (response.success) {
      setMessage('Email відправлено! Перевірте свою пошту.')
    } else {
      setError(response.error?.message || 'Помилка відправки')
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-blur-dark border border-gray-medium rounded-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <EmailIcon className="w-16 h-16 text-silver" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Підтвердіть email</h1>
          <p className="text-gray-light mb-6">
            Ми відправили листа з підтвердженням на <strong>{email}</strong>
          </p>
          <p className="text-sm text-gray-light mb-6">
            Натисніть на посилання в листі, щоб активувати акаунт.
          </p>

          {message && (
            <div className="bg-green-900/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg text-sm mb-4">
              {message}
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <button
            onClick={handleResend}
            disabled={loading}
            className="btn-gradient-primary w-full px-6 py-3 text-foreground font-bold rounded-lg transition-all mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Відправка...' : 'Відправити знову'}
          </button>

          <Link 
            href="/auth/login"
            className="btn-gradient-secondary inline-block w-full px-6 py-3 text-foreground font-medium rounded-lg transition-all"
          >
            Перейти до входу
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function VerifyEmailPage() {
  return (
    <>
      <Header isAuthenticated={false} />
      <Suspense fallback={
        <main className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-silver"></div>
        </main>
      }>
        <VerifyEmailContent />
      </Suspense>
    </>
  )
}
