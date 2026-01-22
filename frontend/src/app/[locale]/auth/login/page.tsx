"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import LocaleLink from "@/components/LocaleLink"
import { useSearchParams } from "next/navigation"
import { useRouter } from "@/lib/navigation"
import Header from "@/components/Header"
import Loading from "@/components/Loading"
import { useAuth } from "@/context/AuthContext"
import { useTranslations } from 'next-intl'

function LoginForm() {
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, user, initialized, refreshUser } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [returnUrl, setReturnUrl] = useState<string | null>(null)
  const [verificationMessage, setVerificationMessage] = useState("")

  useEffect(() => {
    // Отримати returnUrl з query параметрів
    const url = searchParams.get('returnUrl')
    if (url) {
      setReturnUrl(decodeURIComponent(url))
    }
    
    // Перевірити чи email верифікований
    const verified = searchParams.get('verified')
    if (verified === 'true') {
      setVerificationMessage(t('emailVerified'))
    }
  }, [searchParams])

  // Redirect if already logged in (in useEffect to avoid render error)
  useEffect(() => {
    if (initialized && user) {
      router.push('/dashboard');
    }
  }, [initialized, user, router])

  // Show loading while initializing (suppressHydrationWarning для уникнення hydration errors)
  if (!initialized) {
    return <div suppressHydrationWarning><Loading fullScreen size="lg" /></div>
  }

  // Don't show login form if user exists (will redirect via useEffect)
  if (user) {
    return <div suppressHydrationWarning><Loading fullScreen size="lg" /></div>
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === 'email') {
      setEmail(e.target.value)
    } else if (e.target.name === 'password') {
      setPassword(e.target.value)
    }
    // НЕ очищаємо error тут - це з'їдає повідомлення про помилку
    // Error очиститься в handleSubmit перед наступною спробою
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    e.stopPropagation()
    
    setError("")
    setLoading(true)

    try {
      const result = await login(email, password);
      
      if (result.success) {
        // useEffect зробить redirect коли user оновиться
        return;
      }
      
      // Check for email verification
      if (result.error?.code === 'EMAIL_NOT_VERIFIED') {
        router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`)
        return
      }
      
      // Handle error
      const errorMessage = result.error?.message || result.error?.error || t('errorLogin')
      setError(errorMessage)
    } catch (err: any) {
      const errMsg = err?.message || t('errorConnection')
      setError(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header isAuthenticated={false} />

      <main className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">{t('loginTitle')}</h1>
            <p className="text-gray-light">{t('loginSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-blur-dark border border-gray-medium rounded-lg p-6 space-y-4">
            {verificationMessage && (
              <div className="bg-green-900/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg text-sm">
                {verificationMessage}
              </div>
            )}
            
            {error && (
              <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2 font-sans">
                {tCommon('email')}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-blur border border-gray-medium rounded-lg focus:outline-none focus:border-silver transition-colors font-sans"
                placeholder={t('emailPlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                {tCommon('password')}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-blur border border-gray-medium rounded-lg focus:outline-none focus:border-silver transition-colors"
                placeholder={t('passwordPlaceholder')}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 bg-blur border border-gray-medium rounded" />
                <span className="text-gray-light">{t('rememberMe')}</span>
              </label>
              <LocaleLink href="/auth/forgot-password" className="text-silver hover:text-foreground transition-colors">
                {t('forgotPassword')}
              </LocaleLink>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gradient-primary w-full px-4 py-3 text-foreground font-bold rounded-lg transition-colors font-sans disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('loggingIn') : t('loginButton')}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-light">{t('noAccount')} </span>
            <LocaleLink href="/auth/register" className="text-silver hover:text-foreground transition-colors font-medium">
              {t('registerButton')}
            </LocaleLink>
          </div>
        </div>
      </main>
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Loading fullScreen size="lg" />}>
      <LoginForm />
    </Suspense>
  )
}
