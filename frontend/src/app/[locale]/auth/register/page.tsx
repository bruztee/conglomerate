"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import LocaleLink from "@/components/LocaleLink"
import { useSearchParams } from "next/navigation"
import { useRouter } from "@/lib/navigation"
import Header from "@/components/Header"
import { useAuth } from "@/context/AuthContext"
import EmailIcon from "@/components/icons/EmailIcon"
import Loading from "@/components/Loading"
import { useTranslations } from 'next-intl'

function RegisterForm() {
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { register, user, initialized } = useAuth()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    referralCode: searchParams.get('ref') || "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showVerificationMessage, setShowVerificationMessage] = useState(false)

  // Redirect to dashboard if already logged in (useEffect, not render)
  useEffect(() => {
    if (initialized && user) {
      router.push('/dashboard');
    }
  }, [initialized, user, router])

  // Show loading while initializing
  if (!initialized) {
    return <div suppressHydrationWarning><Loading fullScreen size="lg" /></div>
  }

  // Don't show register form if user exists (will redirect via useEffect)
  if (user) {
    return <div suppressHydrationWarning><Loading fullScreen size="lg" /></div>
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    // НЕ очищаємо error тут - це з'їдає повідомлення про помилку
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      setError(t('passwordsNotMatch'))
      return
    }
    
    if (formData.password.length < 8) {
      setError(t('passwordTooShort'))
      return
    }
    
    setLoading(true)
    setError("")
    
    try {
      const result = await register(formData.email, formData.password, formData.referralCode || undefined)
      
      if (result.success) {
        router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`)
      } else {
        const errMsg = result.error?.message || t('errorRegister')
        setError(errMsg)
      }
    } catch (err: any) {
      const errMsg = err?.message || t('errorConnection')
      setError(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">{t('registerTitle')}</h1>
            <p className="text-gray-light">{t('registerSubtitle')}</p>
          </div>

          {showVerificationMessage ? (
            <div className="bg-blur-dark border border-gray-medium rounded-lg p-6 space-y-4">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <EmailIcon className="w-16 h-16 text-silver" />
                </div>
                <h2 className="text-xl font-bold mb-2">{t('verifyEmail')}</h2>
                <p className="text-gray-light text-sm mb-4">
                  {t('verifyEmailText', { email: formData.email })}
                </p>
                <p className="text-gray-light text-xs mb-6">
                  {t('verifyEmailInfo')}
                </p>
                <LocaleLink 
                  href="/auth/login"
                  className="btn-gradient-primary inline-block px-6 py-3 text-foreground font-bold rounded-lg transition-all"
                >
                  {t('goToLogin')}
                </LocaleLink>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-blur-dark border border-gray-medium rounded-lg p-6 space-y-4">
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
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-blur border border-gray-medium rounded-lg focus:outline-none focus:border-silver transition-colors font-sans"
                  placeholder={t('emailPlaceholder')}
                />
              </div>

              <div>
                <label htmlFor="referralCode" className="block text-sm font-medium mb-2">
                  {t('referralCode')}
                </label>
                <input
                  type="text"
                  id="referralCode"
                  name="referralCode"
                  value={formData.referralCode}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-blur border border-gray-medium rounded-lg focus:outline-none focus:border-silver transition-colors"
                  placeholder={t('referralCodePlaceholder')}
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
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-blur border border-gray-medium rounded-lg focus:outline-none focus:border-silver transition-colors"
                  placeholder={t('minCharacters')}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                  {t('confirmPassword')}
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-blur border border-gray-medium rounded-lg focus:outline-none focus:border-silver transition-colors"
                  placeholder={t('confirmPasswordPlaceholder')}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-gradient-primary w-full px-4 py-3 text-foreground font-bold rounded-lg transition-all font-sans disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('registering') : t('registerButton')}
              </button>

              <p className="text-center text-sm text-gray-light mt-4">
                {t('haveAccount')}{" "}
                <LocaleLink href="/auth/login" className="text-silver hover:text-foreground transition-colors font-sans">
                  {t('loginButton')}
                </LocaleLink>
              </p>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-gray-light">
            {t('agreeToTerms')}{" "}
            <LocaleLink href="/rules" className="text-silver hover:text-foreground transition-colors font-sans">
              {t('termsAndConditions')}
            </LocaleLink>
          </div>
        </div>
      </main>
  )
}

export default function RegisterPage() {
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
        <RegisterForm />
      </Suspense>
    </>
  )
}
