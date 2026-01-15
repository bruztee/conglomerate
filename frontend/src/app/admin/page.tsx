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
  
  // ВСІ useState МАЮТЬ БУТИ НА ПОЧАТКУ
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    activePaymentMethods: 0,
    totalInvestments: 0,
    totalInvested: 0,
    totalEarned: 0,
    currentBalances: 0,
    lockedFunds: 0,
    totalWithdrawn: 0,
  })

  // Show loading while checking auth
  if (authLoading) {
    return <Loading />
  }

  // Redirect if not authenticated
  if (!user) {
    router.push('/auth/login')
    return null
  }

  // Redirect if not admin (backend also enforces this)
  if (user.role !== 'admin') {
    router.push('/dashboard')
    return null
  }

  useEffect(() => {
    async function fetchStats() {
      setLoading(true)
      try {
        const [usersRes, depositsRes, withdrawalsRes, methodsRes, investmentsRes, allDepositsRes] = await Promise.all([
          api.adminGetUsers(),
          api.adminGetDeposits('pending'),
          api.adminGetWithdrawals('requested'),
          api.adminGetPaymentMethods(),
          api.getInvestments(),
          api.adminGetDeposits('all'),
        ])

        const investments = investmentsRes.data?.investments || []
        const allDeposits = allDepositsRes.data?.deposits || []
        
        // Поточна сума балансів користувачів (тільки активні/frozen: principal + accrued_interest)
        const currentBalances = investments
          .filter((inv: any) => inv.status === 'active' || inv.status === 'frozen')
          .reduce((sum: number, inv: any) => {
            return sum + parseFloat(inv.principal || 0) + parseFloat(inv.accrued_interest || 0)
          }, 0)
        
        // Всього користувачі проінвестували = всі підтверджені депозити
        const totalUserInvested = allDeposits
          .filter((d: any) => d.status === 'confirmed')
          .reduce((sum: number, d: any) => sum + parseFloat(d.amount || 0), 0)
        
        // Створити мапу deposit_id -> amount для пошуку початкових сум
        const depositsMap = new Map()
        allDeposits.forEach((d: any) => {
          depositsMap.set(d.id, parseFloat(d.amount || 0))
        })
        
        // Всього заробили (прибуток) = по всім позиціям (активним і закритим)
        const totalEarned = investments.reduce((sum: number, inv: any) => {
          if (inv.status === 'closed') {
            // Для закритих: withdrawn - початкова сума з депозиту
            const withdrawn = parseFloat(inv.total_withdrawn || 0)
            const initialDeposit = depositsMap.get(inv.deposit_id) || 0
            return sum + (withdrawn - initialDeposit)
          } else {
            // Для активних/frozen: accrued_interest
            return sum + parseFloat(inv.accrued_interest || 0)
          }
        }, 0)
        
        // Заморожені кошти (на виводі)
        const lockedFunds = investments.reduce((sum: number, inv: any) => {
          return sum + parseFloat(inv.locked_amount || 0)
        }, 0)
        
        // Всього виведено
        const totalWithdrawn = investments.reduce((sum: number, inv: any) => {
          return sum + parseFloat(inv.total_withdrawn || 0)
        }, 0)

        setStats({
          totalUsers: usersRes.data?.users?.length || 0,
          pendingDeposits: depositsRes.data?.deposits?.length || 0,
          pendingWithdrawals: withdrawalsRes.data?.withdrawals?.length || 0,
          activePaymentMethods: methodsRes.data?.payment_methods?.filter((m: any) => m.is_active).length || 0,
          totalInvestments: investments.length,
          totalInvested: totalUserInvested,
          totalEarned: totalEarned,
          currentBalances: currentBalances,
          lockedFunds: lockedFunds,
          totalWithdrawn: totalWithdrawn,
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
    <div className="p-4 md:p-8 pt-16 md:pt-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Адмін-панель</h1>
        <p className="text-gray-light">Огляд та управління платформою</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link href="/admin/users" className="bg-blur-dark border border-gray-medium rounded-lg p-6 hover:border-silver/30 transition-all cursor-pointer">
          <div className="text-sm text-gray-light mb-2">Всього користувачів</div>
          <div className="text-3xl font-bold text-foreground font-sans">{stats.totalUsers}</div>
        </Link>

        <Link href="/admin/deposits" className="bg-blur-dark border border-gray-medium rounded-lg p-6 hover:border-silver/30 transition-all cursor-pointer">
          <div className="text-sm text-gray-light mb-2">Депозити на підтвердженні</div>
          <div className="text-3xl font-bold text-yellow-500 font-sans">{stats.pendingDeposits}</div>
        </Link>

        <Link href="/admin/withdrawals" className="bg-blur-dark border border-gray-medium rounded-lg p-6 hover:border-silver/30 transition-all cursor-pointer">
          <div className="text-sm text-gray-light mb-2">Виводи на підтвердженні</div>
          <div className="text-3xl font-bold text-yellow-500 font-sans">{stats.pendingWithdrawals}</div>
        </Link>

        <Link href="/admin/payment-methods" className="bg-blur-dark border border-gray-medium rounded-lg p-6 hover:border-silver/30 transition-all cursor-pointer">
          <div className="text-sm text-gray-light mb-2">Активні реквізити</div>
          <div className="text-3xl font-bold text-silver font-sans">{stats.activePaymentMethods}</div>
        </Link>

        <Link href="/admin/investments" className="bg-blur-dark border border-gray-medium rounded-lg p-6 hover:border-silver/30 transition-all cursor-pointer">
          <div className="text-sm text-gray-light mb-2">Всього інвестицій</div>
          <div className="text-3xl font-bold text-foreground font-sans">{stats.totalInvestments}</div>
        </Link>

        <Link href="/admin/investments" className="bg-blur-dark border border-gray-medium rounded-lg p-6 hover:border-silver/30 transition-all cursor-pointer">
          <div className="text-sm text-gray-light mb-2">Поточний баланс користувачів</div>
          <div className="text-3xl font-bold text-silver font-sans">${stats.currentBalances.toFixed(2)}</div>
          <div className="text-xs text-gray-light mt-1">Principal + нарахований прибуток</div>
        </Link>

        <Link href="/admin/investments" className="bg-blur-dark border border-gray-medium rounded-lg p-6 hover:border-silver/30 transition-all cursor-pointer">
          <div className="text-sm text-gray-light mb-2">Всього проінвестували користувачі</div>
          <div className="text-3xl font-bold text-foreground font-sans">${stats.totalInvested.toFixed(2)}</div>
          <div className="text-xs text-gray-light mt-1">Початкові депозити + виведені</div>
        </Link>

        <Link href="/admin/investments" className="bg-blur-dark border border-gray-medium rounded-lg p-6 hover:border-silver/30 transition-all cursor-pointer">
          <div className="text-sm text-gray-light mb-2">Всього заробили</div>
          <div className="text-3xl font-bold text-green-400 font-sans">+${stats.totalEarned.toFixed(2)}</div>
          <div className="text-xs text-gray-light mt-1">Нарахований прибуток</div>
        </Link>

        <Link href="/admin/withdrawals" className="bg-blur-dark border border-gray-medium rounded-lg p-6 hover:border-silver/30 transition-all cursor-pointer">
          <div className="text-sm text-gray-light mb-2">Заморожено на виводі</div>
          <div className="text-3xl font-bold text-orange-400 font-sans">${stats.lockedFunds.toFixed(2)}</div>
          <div className="text-xs text-gray-light mt-1">Очікують підтвердження</div>
        </Link>

        <Link href="/admin/withdrawals" className="bg-blur-dark border border-gray-medium rounded-lg p-6 hover:border-silver/30 transition-all cursor-pointer">
          <div className="text-sm text-gray-light mb-2">Всього виведено</div>
          <div className="text-3xl font-bold text-foreground font-sans">${stats.totalWithdrawn.toFixed(2)}</div>
          <div className="text-xs text-gray-light mt-1">Схвалені виводи</div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="bg-blur-dark border border-gray-medium rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Швидкі дії</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/users"
            className="flex items-center gap-3 p-4 bg-blur border border-gray-medium rounded-lg hover:border-silver/30 transition-all cursor-pointer"
          >
            <div className="text-silver"><UsersIcon /></div>
            <div>
              <div className="font-medium">Користувачі</div>
              <div className="text-xs text-gray-light">Перегляд та управління</div>
            </div>
          </Link>

          <Link
            href="/admin/payment-methods"
            className="flex items-center gap-3 p-4 bg-blur border border-gray-medium rounded-lg hover:border-silver/30 transition-all cursor-pointer"
          >
            <div className="text-silver"><WalletIcon /></div>
            <div>
              <div className="font-medium">Реквізити</div>
              <div className="text-xs text-gray-light">Управління гаманцями</div>
            </div>
          </Link>

          <Link
            href="/admin/deposits"
            className="flex items-center gap-3 p-4 bg-blur border border-gray-medium rounded-lg hover:border-silver/30 transition-all cursor-pointer"
          >
            <div className="text-silver"><DepositIcon /></div>
            <div>
              <div className="font-medium">Депозити</div>
              <div className="text-xs text-gray-light">Підтвердження та історія</div>
            </div>
          </Link>

          <Link
            href="/admin/withdrawals"
            className="flex items-center gap-3 p-4 bg-blur border border-gray-medium rounded-lg hover:border-silver/30 transition-all cursor-pointer"
          >
            <div className="text-silver"><WithdrawIcon /></div>
            <div>
              <div className="font-medium">Виводи</div>
              <div className="text-xs text-gray-light">Обробка запитів</div>
            </div>
          </Link>

          <Link
            href="/admin/investments"
            className="flex items-center gap-3 p-4 bg-blur border border-gray-medium rounded-lg hover:border-silver/30 transition-all cursor-pointer"
          >
            <div className="text-silver"><WalletIcon /></div>
            <div>
              <div className="font-medium">Інвестиції</div>
              <div className="text-xs text-gray-light">Огляд позицій</div>
            </div>
          </Link>

          <Link
            href="/admin/security"
            className="flex items-center gap-3 p-4 bg-blur border border-gray-medium rounded-lg hover:border-silver/30 transition-all cursor-pointer"
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
