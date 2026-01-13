"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/lib/api"
import Loading from "@/components/Loading"
import Link from "next/link"
import { WalletIcon, UsersIcon, SecurityIcon, DepositIcon, WithdrawIcon } from "@/components/icons/AdminIcons"

interface User {
  id: string
  name: string
  email: string
  balance: number
  totalDeposits: number
  totalWithdrawals: number
  profit: number
  registeredAt: string
  status: "active" | "blocked"
}

interface WithdrawalRequest {
  id: string
  userId: string
  userName: string
  amount: number
  method: string
  wallet: string
  status: "pending" | "approved" | "rejected"
  date: string
}

interface DepositHistory {
  id: string
  userId: string
  userName: string
  amount: number
  profit: number
  date: string
  status: "active" | "completed"
}

export default function AdminDashboard() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  // Show loading while checking auth
  if (authLoading) {
    return <Loading />
  }

  // Redirect if not authenticated
  if (!user) {
    router.push('/auth/login')
    return <Loading />
  }

  // Redirect if not admin (backend also enforces this)
  if (user.role !== 'admin') {
    router.push('/dashboard')
    return <Loading />
  }

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    activePaymentMethods: 0,
  })

  useEffect(() => {
    async function fetchStats() {
      setLoading(true)
      try {
        const [usersRes, depositsRes, withdrawalsRes, methodsRes] = await Promise.all([
          api.adminGetUsers(),
          api.adminGetDeposits('pending'),
          api.adminGetWithdrawals('requested'),
          api.adminGetPaymentMethods(),
        ])

        setStats({
          totalUsers: usersRes.data?.users?.length || 0,
          pendingDeposits: depositsRes.data?.deposits?.length || 0,
          pendingWithdrawals: withdrawalsRes.data?.withdrawals?.length || 0,
          activePaymentMethods: methodsRes.data?.payment_methods?.filter((m: any) => m.is_active).length || 0,
        })
      } catch (error) {
        // Silent fail
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return <Loading fullScreen size="lg" />
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Адмін-панель</h1>
        <p className="text-gray-light">Огляд та управління платформою</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link href="/admin/users" className="bg-gray-dark border border-gray-medium rounded-lg p-6 hover:border-silver/30 transition-all cursor-pointer">
          <div className="text-sm text-gray-light mb-2">Всього користувачів</div>
          <div className="text-3xl font-bold text-foreground font-sans">{stats.totalUsers}</div>
        </Link>

        <Link href="/admin/deposits" className="bg-gray-dark border border-gray-medium rounded-lg p-6 hover:border-silver/30 transition-all cursor-pointer">
          <div className="text-sm text-gray-light mb-2">Депозити на підтвердженні</div>
          <div className="text-3xl font-bold text-yellow-500 font-sans">{stats.pendingDeposits}</div>
        </Link>

        <Link href="/admin/withdrawals" className="bg-gray-dark border border-gray-medium rounded-lg p-6 hover:border-silver/30 transition-all cursor-pointer">
          <div className="text-sm text-gray-light mb-2">Виводи на підтвердженні</div>
          <div className="text-3xl font-bold text-yellow-500 font-sans">{stats.pendingWithdrawals}</div>
        </Link>

        <Link href="/admin/payment-methods" className="bg-gray-dark border border-gray-medium rounded-lg p-6 hover:border-silver/30 transition-all cursor-pointer">
          <div className="text-sm text-gray-light mb-2">Активні реквізити</div>
          <div className="text-3xl font-bold text-silver font-sans">{stats.activePaymentMethods}</div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-dark border border-gray-medium rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Швидкі дії</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/users"
            className="flex items-center gap-3 p-4 bg-background border border-gray-medium rounded-lg hover:border-silver/30 transition-all cursor-pointer"
          >
            <div className="text-silver"><UsersIcon /></div>
            <div>
              <div className="font-medium">Користувачі</div>
              <div className="text-xs text-gray-light">Перегляд та управління</div>
            </div>
          </Link>

          <Link
            href="/admin/payment-methods"
            className="flex items-center gap-3 p-4 bg-background border border-gray-medium rounded-lg hover:border-silver/30 transition-all cursor-pointer"
          >
            <div className="text-silver"><WalletIcon /></div>
            <div>
              <div className="font-medium">Реквізити</div>
              <div className="text-xs text-gray-light">Управління гаманцями</div>
            </div>
          </Link>

          <Link
            href="/admin/deposits"
            className="flex items-center gap-3 p-4 bg-background border border-gray-medium rounded-lg hover:border-silver/30 transition-all cursor-pointer"
          >
            <div className="text-silver"><DepositIcon /></div>
            <div>
              <div className="font-medium">Депозити</div>
              <div className="text-xs text-gray-light">Підтвердження та історія</div>
            </div>
          </Link>

          <Link
            href="/admin/withdrawals"
            className="flex items-center gap-3 p-4 bg-background border border-gray-medium rounded-lg hover:border-silver/30 transition-all cursor-pointer"
          >
            <div className="text-silver"><WithdrawIcon /></div>
            <div>
              <div className="font-medium">Виводи</div>
              <div className="text-xs text-gray-light">Обробка запитів</div>
            </div>
          </Link>

          <Link
            href="/admin/security"
            className="flex items-center gap-3 p-4 bg-background border border-gray-medium rounded-lg hover:border-silver/30 transition-all cursor-pointer"
          >
            <div className="text-silver"><SecurityIcon /></div>
            <div>
              <div className="font-medium">Безпека</div>
              <div className="text-xs text-gray-light">Audit log</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
