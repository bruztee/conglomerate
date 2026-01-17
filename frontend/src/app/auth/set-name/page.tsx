"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/Header"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/lib/api"

export default function SetNamePage() {
  const router = useRouter()
  const { user, refreshUser } = useAuth()
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    // Якщо користувач не залогінений, редірект на логін
    if (!user) {
      router.push('/auth/login')
      return
    }
    
    // Якщо ім'я вже встановлено, редірект на dashboard
    // Це спрацює після того як refreshUser оновить user.full_name
    if (user.full_name) {
      router.push('/dashboard')
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!fullName.trim()) {
      setError("Будь ласка, введіть ваше повне ім'я")
      setLoading(false)
      return
    }

    const result = await api.setName(fullName.trim())

    if (result.success) {
      // Видалити флаг редіректу
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('name_redirect_pending')
      }
      // Reload page - RootLayoutClient побачить що user.full_name є і редірект на dashboard
      window.location.reload()
    } else {
      setError(result.error?.message || "Помилка збереження імені")
      setLoading(false)
    }
  }

  if (!user || user.full_name) {
    return null
  }

  return (
    <>
      <Header isAuthenticated={true} />
      
      <main className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-blur-dark border border-gray-medium rounded-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Вітаємо!</h1>
              <p className="text-gray-light text-sm">
                Для завершення реєстрації, будь ласка, введіть ваше повне ім'я
              </p>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium mb-2">
                  Повне ім'я
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-blur border border-gray-medium rounded-lg focus:outline-none focus:border-silver transition-colors"
                  placeholder="Іван Петренко"
                  disabled={loading}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-gradient-primary w-full px-6 py-3 text-foreground font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Збереження..." : "Продовжити"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  )
}
