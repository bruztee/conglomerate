"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Header from "@/components/Header"

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })
  const [step, setStep] = useState(1)
  const [verificationCode, setVerificationCode] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStep(2)
  }

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    router.push("/dashboard")
  }

  return (
    <>
      <Header isAuthenticated={false} />

      <main className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Реєстрація</h1>
            <p className="text-gray-light">Приєднуйтесь до Conglomerate Group</p>
          </div>

          {step === 1 && (
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
                <label htmlFor="phone" className="block text-sm font-medium mb-2">
                  Номер телефону
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-background border border-gray-medium rounded-lg focus:outline-none focus:border-silver transition-colors"
                  placeholder="+380123456789"
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
                className="btn-gradient-primary w-full px-4 py-3 text-foreground font-bold rounded-lg transition-all font-sans"
              >
                Продовжити
              </button>

              <p className="text-center text-sm text-gray-light mt-4">
                Вже є акаунт?{" "}
                <Link href="/auth/login" className="text-silver hover:text-foreground transition-colors font-sans">
                  Увійти
                </Link>
              </p>
            </form>
          )}

          {step === 2 && (
            <form
              onSubmit={handleVerification}
              className="bg-gray-dark border border-gray-medium rounded-lg p-6 space-y-4"
            >
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">✉️</div>
                <h2 className="text-xl font-bold mb-2">Верифікація</h2>
                <p className="text-gray-light text-sm">
                  Ми відправили коди верифікації на {formData.email} та {formData.phone}
                </p>
              </div>

              <div>
                <label htmlFor="verification" className="block text-sm font-medium mb-2">
                  Код верифікації
                </label>
                <input
                  type="text"
                  id="verification"
                  name="verification"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-gray-medium rounded-lg focus:outline-none focus:border-silver transition-colors text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              <button
                type="submit"
                className="btn-gradient-primary w-full px-4 py-3 text-foreground font-bold rounded-lg transition-all font-sans"
              >
                Підтвердити
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-gradient-secondary w-full px-4 py-3 text-foreground font-medium rounded-lg transition-all font-sans"
              >
                Назад
              </button>

              <p className="text-center text-sm text-gray-light mt-4">
                Не отримали код?{" "}
                <button type="button" className="text-silver hover:text-foreground transition-colors font-sans">
                  Надіслати знову
                </button>
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
    </>
  )
}
