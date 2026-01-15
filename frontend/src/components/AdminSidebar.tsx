"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { 
  DashboardIcon, 
  WalletIcon, 
  UsersIcon, 
  DepositIcon, 
  WithdrawIcon, 
  SecurityIcon,
  HomeIcon,
  LogoutIcon
} from "@/components/icons/AdminIcons"

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { href: "/admin", label: "Огляд", icon: DashboardIcon },
    { href: "/admin/payment-methods", label: "Реквізити", icon: WalletIcon },
    { href: "/admin/users", label: "Користувачі", icon: UsersIcon },
    { href: "/admin/deposits", label: "Депозити", icon: DepositIcon },
    { href: "/admin/investments", label: "Інвестиції", icon: DashboardIcon },
    { href: "/admin/withdrawals", label: "Виводи", icon: WithdrawIcon },
    { href: "/admin/security", label: "Безпека", icon: SecurityIcon },
  ]

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-blur-dark border border-gray-medium rounded-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`w-64 bg-background md:bg-blur-dark border-r border-gray-medium min-h-screen flex flex-col fixed md:sticky top-0 z-40 transition-transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="p-6">
          <h1 className="text-xl font-bold text-silver mb-1">Адмін-панель</h1>
        </div>

        <nav className="px-3 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const IconComponent = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 mb-1 rounded-lg transition-all
                  ${isActive 
                    ? 'bg-silver/10 text-silver border border-silver/20' 
                    : 'text-gray-light hover:bg-gray-medium/30 hover:text-foreground'
                  }
                `}
              >
                <IconComponent />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-gray-medium">
          {/* User email */}
          <div className="px-4 py-2 mb-3 text-xs text-gray-light truncate">
            {user?.email || 'Loading...'}
          </div>
          
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 mb-2 rounded-lg text-gray-light hover:bg-gray-medium/30 hover:text-foreground transition-all"
          >
            <HomeIcon />
            <span className="text-sm font-medium">На сайт</span>
          </Link>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-light hover:bg-red-500/10 hover:text-red-500 transition-all cursor-pointer"
          >
            <LogoutIcon />
            <span className="text-sm font-medium">Вихід</span>
          </button>
        </div>
      </div>
    </>
  )
}
