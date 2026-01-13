"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import Header from "@/components/Header"
import { useAuth } from "@/context/AuthContext"
import EmailIcon from "@/components/icons/EmailIcon"
import Loading from "@/components/Loading"

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { register, user, loading: authLoading } = useAuth()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    referralCode: searchParams.get('ref') || "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showVerificationMessage, setShowVerificationMessage] = useState(false)

  // Show loading while checking auth  
  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </main>
    )
  }

  // Redirect to dashboard if already logged in
  if (user) {
    router.push('/dashboard')
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loading size="lg" />
      </main>
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      setError("Паролі не співпадають")
      return
    }
    
    if (formData.password.length < 8) {
      setError("Пароль має містити мінімум 8 символів")
      return
    }
    
    setLoading(true)
    setError("")
    
    const result = await register(formData.email, formData.password, formData.referralCode || undefined)
    
    if (result.success) {
      setShowVerificationMessage(true)
    } else {
      setError(result.error?.message || "Помилка реєстрації")
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Реєстрація</h1>
            <p className="text-gray-light">Приєднуйтесь до Conglomerate Group</p>
          </div>

          {showVerificationMessage ? (
            <div className="bg-gray-dark border border-gray-medium rounded-lg p-6 space-y-4">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <EmailIcon className="w-16 h-16 text-silver" />
                </div>
                <h2 className="text-xl font-bold mb-2">Перевірте email</h2>
                <p className="text-gray-light text-sm mb-4">
                  Ми відправили листа з підтвердженням на {formData.email}
                </p>
                <p className="text-gray-light text-xs mb-6">
                  Після підтвердження email ви зможете увійти в систему
                </p>
                <Link 
                  href="/auth/login"
                  className="btn-gradient-primary inline-block px-6 py-3 text-foreground font-bold rounded-lg transition-all"
                >
                  Перейти до входу
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-gray-dark border border-gray-medium rounded-lg p-6 space-y-4">
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
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-background border border-gray-medium rounded-lg focus:outline-none focus:border-silver transition-colors font-sans"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="referralCode" className="block text-sm font-medium mb-2">
                  Реферальний код (опціонально)
                </label>
                <input
                  type="text"
                  id="referralCode"
                  name="referralCode"
                  value={formData.referralCode}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-background border border-gray-medium rounded-lg focus:outline-none focus:border-silver transition-colors"
                  placeholder="Введіть код, якщо маєте"
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
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-background border border-gray-medium rounded-lg focus:outline-none focus:border-silver transition-colors"
                  placeholder="Мінімум 8 символів"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                  Підтвердіть пароль
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-background border border-gray-medium rounded-lg focus:outline-none focus:border-silver transition-colors"
                  placeholder="Повторіть пароль"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-gradient-primary w-full px-4 py-3 text-foreground font-bold rounded-lg transition-all font-sans disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Реєстрація..." : "Зареєструватися"}
              </button>

              <p className="text-center text-sm text-gray-light mt-4">
                Вже є акаунт?{" "}
                <Link href="/auth/login" className="text-silver hover:text-foreground transition-colors font-sans">
                  Увійти
                </Link>
              </p>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-gray-light">
            Реєструючись, ви погоджуєтесь з{" "}
            <Link href="/rules" className="text-silver hover:text-foreground transition-colors font-sans">
              правилами та умовами
            </Link>
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
