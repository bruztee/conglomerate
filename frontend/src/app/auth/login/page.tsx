"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import Header from "@/components/Header"
import Loading from "@/components/Loading"
import { useAuth } from "@/context/AuthContext"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, user, loading: authLoading, refreshUser } = useAuth()
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
      setVerificationMessage('Ваш email підтверджено. Тепер ви можете увійти.')
    }
  }, [searchParams])

  // Show loading while checking auth
  if (authLoading) {
    return <Loading fullScreen size="lg" />
  }

  // Redirect to dashboard if already logged in
  if (user) {
    router.push('/dashboard')
    return null
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === 'email') {
      setEmail(e.target.value)
    } else if (e.target.name === 'password') {
      setPassword(e.target.value)
    }
    setError("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result = await login(email, password)
    
    if (result.success) {
      await refreshUser()
      router.push('/dashboard')
    } else {
      if (result.error?.code === 'EMAIL_NOT_VERIFIED') {
        router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`)
        return
      }
      
      setError(result.error?.message || "Помилка входу")
      setLoading(false)
    }
  }

  // Показати fullscreen loading під час логіну
  if (loading) {
    return <Loading fullScreen size="lg" />
  }

  return (
    <>
      <Header isAuthenticated={false} />

      <main className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Вхід</h1>
            <p className="text-gray-light">Увійдіть до свого акаунту</p>
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
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-blur border border-gray-medium rounded-lg focus:outline-none focus:border-silver transition-colors font-sans"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Пароль
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-blur border border-gray-medium rounded-lg focus:outline-none focus:border-silver transition-colors"
                placeholder="Введіть пароль"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 bg-blur border border-gray-medium rounded" />
                <span className="text-gray-light">Запам'ятати мене</span>
              </label>
              <Link href="/auth/forgot-password" className="text-silver hover:text-foreground transition-colors">
                Забули пароль?
              </Link>
            </div>

            <button
              type="submit"
              className="btn-gradient-primary w-full px-4 py-3 text-foreground font-bold rounded-lg transition-colors font-sans"
            >
              Увійти
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-light">Немає акаунту? </span>
            <Link href="/auth/register" className="text-silver hover:text-foreground transition-colors font-medium">
              Зареєструватися
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
