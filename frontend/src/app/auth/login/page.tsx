"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Header from "@/components/Header"

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    router.push("/dashboard")
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

          <form onSubmit={handleSubmit} className="bg-gray-dark border border-gray-medium rounded-lg p-6 space-y-4">
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
                placeholder="Введіть пароль"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 bg-background border border-gray-medium rounded" />
                <span className="text-gray-light">Запам'ятати мене</span>
              </label>
              <Link href="/auth/forgot-password" className="text-silver hover:text-foreground transition-colors">
                Забули пароль?
              </Link>
            </div>

            <button
              type="submit"
              className="btn-gradient-primary w-full px-4 py-3 text-foreground font-bold rounded-lg transition-all font-sans"
            >
              Увійти
            </button>

            <p className="text-center text-sm text-gray-light mt-4">
              Немає акаунту?{" "}
              <Link href="/auth/register" className="text-silver hover:text-foreground transition-colors font-sans">
                Зареєструватися
              </Link>
            </p>
          </form>
        </div>
      </main>
    </>
  )
}
