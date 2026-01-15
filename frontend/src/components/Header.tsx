"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { api } from '@/lib/api';

interface HeaderProps {
  isAuthenticated?: boolean
}

export default function Header({ isAuthenticated = false }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userBalance, setUserBalance] = useState(0)
  const [userProfit, setUserProfit] = useState(0)
  const router = useRouter()
  const { logout, user } = useAuth()

  useEffect(() => {
    if (user) {
      const fetchWallet = async () => {
        const result = await api.getWallet()
        if (result.success && result.data) {
          const data = result.data as any
          setUserBalance(data.total_invested || 0)  // Тільки principal
          setUserProfit(data.total_profit || 0)      // Тільки accrued_interest
        }
      }
      fetchWallet()
    }
  }, [user])
  
  const handleLogout = async () => {
    await logout()
    router.push('/')
  }
  
  const isLoggedIn = isAuthenticated || !!user

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-dark/30 backdrop-blur-md">
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-transparent pointer-events-none"></div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Image src="/logo.png" alt="Conglomerate Group" width={40} height={40} className="rounded" />
              <span className="text-xl font-bold tracking-tight hidden sm:inline font-sans">CONGLOMERATE GROUP</span>
            </Link>
          </div>

          {isLoggedIn && (
            <>
              <div className="hidden md:flex items-center gap-6">
                <div className="flex items-center gap-4 px-4 py-2 bg-gray-dark rounded-lg">
                  <div className="text-sm font-sans">
                    <div className="text-gray-light text-xs">Інвестиції</div>
                    <div className="font-bold text-foreground">${userBalance.toFixed(2)}</div>
                  </div>
                  <div className="w-px h-8 bg-gray-medium"></div>
                  <div className="text-sm font-sans">
                    <div className="text-gray-light text-xs">Профіт</div>
                    <div className="font-bold text-silver">${userProfit.toFixed(2)}</div>
                  </div>
                </div>

                <nav className="flex items-center gap-2">
                  <Link
                    href="/dashboard"
                    className="btn-gradient-primary px-4 py-2 text-foreground font-medium rounded transition-colors font-sans"
                  >
                    Депозити
                  </Link>
                  <Link
                    href="/withdraw"
                    className="btn-gradient-secondary px-4 py-2 text-foreground font-medium rounded transition-colors font-sans"
                  >
                    Вивід
                  </Link>
                  <Link
                    href="/referral"
                    className="btn-gradient-secondary px-4 py-2 text-foreground font-medium rounded transition-colors font-sans"
                  >
                    Рефералка
                  </Link>
                  {user?.role === 'admin' && (
                    <Link
                      href="/admin"
                      className="btn-gradient-primary px-4 py-2 text-foreground font-medium rounded transition-colors font-sans"
                    >
                      CRM
                    </Link>
                  )}
                  <Link
                    href="/dashboard/settings"
                    className="btn-gradient-secondary px-4 py-2 text-foreground font-medium rounded transition-colors font-sans"
                  >
                    Налаштування
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="btn-gradient-secondary px-4 py-2 text-foreground font-medium rounded transition-all font-sans cursor-pointer"
                  >
                    Вихід
                  </button>
                </nav>
              </div>

              <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </>
          )}

          {!isLoggedIn && (
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="px-4 py-2 text-foreground font-medium hover:text-gray-light transition-colors font-sans"
              >
                Вхід
              </Link>
              <Link
                href="/auth/register"
                className="btn-gradient-primary px-4 py-2 text-foreground font-medium rounded transition-colors font-sans"
              >
                Реєстрація
              </Link>
            </div>
          )}
        </div>

        {mobileMenuOpen && isLoggedIn && (
          <div className="md:hidden py-4 border-t border-gray-dark">
            <div className="flex items-center gap-4 mb-4 p-3 bg-gray-dark rounded-lg font-sans">
              <div className="text-sm">
                <div className="text-gray-light text-xs">Інвестиції</div>
                <div className="font-bold text-foreground">${userBalance.toFixed(2)}</div>
              </div>
              <div className="w-px h-8 bg-gray-medium"></div>
              <div className="text-sm">
                <div className="text-gray-light text-xs">Профіт</div>
                <div className="font-bold text-silver">${userProfit.toFixed(2)}</div>
              </div>
            </div>
            <nav className="flex flex-col gap-2">
              <Link
                href="/dashboard"
                className="btn-gradient-primary px-4 py-2 text-foreground font-medium rounded transition-colors text-center font-sans"
              >
                Депозити
              </Link>
              <Link
                href="/withdraw"
                className="btn-gradient-secondary px-4 py-2 text-foreground font-medium rounded transition-colors text-center font-sans"
              >
                Вивід
              </Link>
              <Link
                href="/referral"
                className="btn-gradient-secondary px-4 py-2 text-foreground font-medium rounded transition-colors text-center font-sans"
              >
                Рефералка
              </Link>
              {user?.role === 'admin' && (
                <Link
                  href="/admin"
                  className="btn-gradient-primary px-4 py-2 text-foreground font-medium rounded transition-colors text-center font-sans"
                >
                  CRM
                </Link>
              )}
              <Link
                href="/dashboard/settings"
                className="btn-gradient-secondary px-4 py-2 text-foreground font-medium rounded transition-colors text-center font-sans"
              >
                Налаштування
              </Link>
              <button
                onClick={handleLogout}
                className="btn-gradient-secondary px-4 py-2 text-foreground font-medium rounded transition-all text-center font-sans cursor-pointer"
              >
                Вихід
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
