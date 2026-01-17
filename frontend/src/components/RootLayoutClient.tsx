"use client"

import { useAuth } from "@/context/AuthContext"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import Loading from "./Loading"
import AnimatedBackground from '@/components/AnimatedBackground'
import Footer from '@/components/Footer'
import PhoneVerificationWrapper from '@/components/PhoneVerificationWrapper'

const publicPaths = ['/auth/login', '/auth/register', '/auth/verify-email', '/auth/forgot-password', '/auth/reset-password', '/auth/callback']

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const isAdminPage = pathname.startsWith('/admin')

  useEffect(() => {
    if (!initialized) return

    const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
    const isSetNamePage = pathname === '/auth/set-name'

    // Якщо це публічний шлях - не редиректимо
    if (isPublicPath) {
      return
    }

    // Якщо користувач залогінений але не встановив ім'я - редірект на set-name
    if (user && !user.full_name && !isSetNamePage) {
      router.replace('/auth/set-name')
      return
    }

    const isProtectedPage = pathname.startsWith('/dashboard') || 
                           pathname.startsWith('/admin') ||
                           pathname.startsWith('/withdraw') ||
                           pathname.startsWith('/referral')

    if (!isProtectedPage) return; // Не protected - нічого не робимо

    // Якщо немає user після loading - значить немає валідної сесії
    if (!user) {
      const returnUrl = encodeURIComponent(pathname)
      router.replace(`/auth/login?returnUrl=${returnUrl}`)
    }
  }, [initialized, user, pathname, router])

  if (!initialized) {
    return <Loading fullScreen />
  }

  // Для admin сторінок - тільки children (admin/layout вже має фон)
  if (isAdminPage) {
    return <>{children}</>
  }

  // Для звичайних сторінок - фон + footer
  return (
    <>
      <AnimatedBackground />
      <div className="flex flex-col min-h-screen">
        <div className="flex-1">
          <PhoneVerificationWrapper>
            {children}
          </PhoneVerificationWrapper>
        </div>
        <Footer />
      </div>
    </>
  )
}
