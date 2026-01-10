"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams, notFound } from "next/navigation"
import Header from "@/components/Header"
import { api } from "@/lib/api"

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [accessToken, setAccessToken] = useState("")

  useEffect(() => {
    // Витягнути access_token з hash (Supabase відправляє його в #access_token=...)
    const hash = window.location.hash
    const params = new URLSearchParams(hash.substring(1))
    const token = params.get('access_token')
    const type = params.get('type')
    
    // Якщо немає токену або type !== recovery - показати 404
    if (!token || type !== 'recovery') {
      notFound()
    } else {
      setAccessToken(token)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!formData.password) {
      setError("Пароль обов'язковий")
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError("Пароль повинен бути мінімум 6 символів")
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Паролі не співпадають")
      setLoading(false)
      return
    }

    if (!accessToken) {
      notFound()
      return
    }

    const result = await api.resetPassword(formData.password, accessToken)

    if (result.success) {
      router.push("/auth/login?reset=success")
    } else {
      // Якщо токен невалідний або вже використаний - показати 404
      if (result.error?.code === 'SESSION_ERROR' || result.error?.code === 'UPDATE_FAILED') {
        notFound()
      }
      setError(result.error?.message || "Помилка скидання пароля")
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-gray-dark border border-gray-medium rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Новий пароль</h1>
            <p className="text-gray-light text-sm">
              Введіть новий пароль для вашого акаунту
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Новий пароль
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-background border border-gray-medium rounded-lg focus:outline-none focus:border-silver transition-colors"
                placeholder="Мінімум 6 символів"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                Підтвердіть пароль
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-background border border-gray-medium rounded-lg focus:outline-none focus:border-silver transition-colors"
                placeholder="Повторіть пароль"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !accessToken}
              className="btn-gradient-primary w-full px-6 py-3 text-foreground font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Збереження..." : "Скинути пароль"}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}

export default function ResetPasswordPage() {
  return (
    <>
      <Header isAuthenticated={false} />
      <Suspense fallback={
        <main className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-silver"></div>
        </main>
      }>
        <ResetPasswordContent />
      </Suspense>
    </>
  )
}
