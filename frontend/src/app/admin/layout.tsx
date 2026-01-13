"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/lib/api"
import AdminSidebar from "@/components/AdminSidebar"
import Loading from "@/components/Loading"
import AnimatedBackground from "@/components/AnimatedBackground"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function checkAdminAccess() {
      if (authLoading) return

      if (!user) {
        router.push('/auth/login')
        return
      }

      // Перевірити чи користувач admin через роль
      try {
        if (user.role === 'admin') {
          setIsAdmin(true)
        } else {
          router.push('/dashboard')
        }
      } catch (error) {
        router.push('/dashboard')
      } finally {
        setChecking(false)
      }
    }

    checkAdminAccess()
  }, [authLoading, router])

  if (authLoading || checking) {
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
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </>
  )
}
