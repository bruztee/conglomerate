"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Header from "@/components/Header"
import Link from "next/link"

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    const type = searchParams.get('type')

    if (!token || type !== 'signup') {
      setStatus('error')
      setMessage('Невалідне посилання верифікації')
      return
    }

    // Supabase automatically verifies the email via the magic link
    setStatus('success')
    setMessage('Email успішно підтверджено!')
  }, [searchParams])

  return (
      <main className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-gray-dark border border-gray-medium rounded-lg p-8 text-center">
            {status === 'loading' && (
              <>
                <div className="text-4xl mb-4">⏳</div>
                <h1 className="text-2xl font-bold mb-2">Верифікація...</h1>
                <p className="text-gray-light">Зачекайте, будь ласка</p>
              </>
            )}
            
            {status === 'success' && (
              <>
                <div className="text-4xl mb-4">✅</div>
                <h1 className="text-2xl font-bold mb-2 text-green-400">Успішно!</h1>
                <p className="text-gray-light mb-6">{message}</p>
                <p className="text-sm text-gray-light mb-6">
                  Тепер ви можете увійти в систему
                </p>
                <Link 
                  href="/auth/login"
                  className="btn-gradient-primary inline-block px-6 py-3 text-foreground font-bold rounded-lg transition-all"
                >
                  Перейти до входу
                </Link>
              </>
            )}
            
            {status === 'error' && (
              <>
                <div className="text-4xl mb-4">❌</div>
                <h1 className="text-2xl font-bold mb-2 text-red-400">Помилка</h1>
                <p className="text-gray-light mb-6">{message}</p>
                <Link 
                  href="/auth/register"
                  className="btn-gradient-secondary inline-block px-6 py-3 text-foreground font-medium rounded-lg transition-all"
                >
                  Повернутися до реєстрації
                </Link>
              </>
            )}
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
        <main className="min-h-screen flex items-center justify-center px-4 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-silver mx-auto"></div>
          </div>
        </main>
      }>
        <VerifyContent />
      </Suspense>
    </>
  )
}
