"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import AdminSidebar from "@/components/AdminSidebar"
import Loading from "@/components/Loading"
import AnimatedBackground from "@/components/AnimatedBackground"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkAdminAccess() {
      if (!initialized) return

      if (!user) {
        router.push('/auth/login')
        return
      }

      // Перевірити чи користувач admin через роль
      if (user.role === 'admin') {
        setIsAdmin(true)
      } else {
        router.push('/dashboard')
      }
      
      setChecking(false)
    }

    checkAdminAccess()
  }, [initialized, user, router])

  if (!initialized || checking) {
    return <Loading fullScreen size="lg" />
  }

  if (!isAdmin) {
    return null
  }

  return (
    <>
      <AnimatedBackground />
      <div className="flex min-h-screen relative">
        <AdminSidebar />
        <main className="flex-1 overflow-auto md:ml-0">
          {children}
        </main>
      </div>
    </>
  )
}
