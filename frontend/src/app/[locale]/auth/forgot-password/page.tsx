"use client"

import { useState, useEffect } from "react"
import LocaleLink from "@/components/LocaleLink"
import { useRouter } from "@/lib/navigation"
import Header from "@/components/Header"
import { api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import Loading from "@/components/Loading"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { user, initialized } = useAuth()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  // Show loading while initializing
  if (!initialized) {
    return <Loading fullScreen size="lg" />
  }

  // Redirect to dashboard if already logged in
  if (user) {
    router.push('/dashboard')
    return <Loading fullScreen size="lg" />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    if (!email) {
      setError("Email обов'язковий")
      setLoading(false)
      return
    }

    const result = await api.forgotPassword(email)

    if (result.success) {
      setMessage("Лист для скидання пароля відправлено! Перевірте свою пошту.")
    } else {
      setError(result.error?.message || "Помилка відправки")
    }

    setLoading(false)
  }

  return (
    <>
      <Header isAuthenticated={false} />
      
      <main className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-blur-dark border border-gray-medium rounded-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Відновлення пароля</h1>
              <p className="text-gray-light text-sm">
                Введіть свій email і ми відправимо посилання для скидання пароля
              </p>
            </div>

            {message && (
              <div className="bg-green-900/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg text-sm mb-6">
                {message}
              </div>
            )}

            {error && (
              <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-blur border border-gray-medium rounded-lg focus:outline-none focus:border-silver transition-colors"
                  placeholder="your@email.com"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-gradient-primary w-full px-6 py-3 text-foreground font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Відправка..." : "Відправити посилання"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <LocaleLink href="/auth/login" className="text-sm text-gray-light hover:text-silver transition-colors">
                Повернутися до входу
              </LocaleLink>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
