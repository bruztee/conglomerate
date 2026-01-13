"use client"

import { useAuth } from "@/context/AuthContext"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import Loading from "./Loading"

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  // Перевіряємо авторизацію ПІСЛЯ завершення loading
  useEffect(() => {
    if (loading) return; // Чекаємо завершення loading

    const isProtectedPage = pathname.startsWith('/dashboard') || 
                           pathname.startsWith('/admin') ||
                           pathname.startsWith('/withdraw') ||
                           pathname.startsWith('/referral')

    if (!isProtectedPage) return; // Не protected - нічого не робимо

    // ПРОСТІШЕ: httpOnly cookie перевіряється автоматично middleware + API
    // Якщо немає user після loading - значить немає валідної сесії
    if (!user) {
      console.log('❌ No user after loading, redirecting to login');
      router.replace('/auth/login')
    } else {
      console.log('✅ User authenticated, staying on page');
    }
  }, [loading, user, pathname, router])

  if (loading) {
    return <Loading fullScreen text="Завантаження..." />
  }

  return <>{children}</>
}
