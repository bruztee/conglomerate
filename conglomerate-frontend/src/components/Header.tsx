'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

interface HeaderProps {
  isAuthenticated?: boolean
  userBalance?: number
  userProfit?: number
}

export default function Header({ 
  isAuthenticated = false, 
  userBalance = 0, 
  userProfit = 0 
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-dark/30 backdrop-blur-md">
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-transparent pointer-events-none"></div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Image 
                src="/logo.jpg" 
                alt="Conglomerate Group" 
                width={40} 
                height={40}
                className="rounded"
              />
              <span className="text-xl font-bold tracking-tight hidden sm:inline">
                CONGLOMERATE GROUP
              </span>
            </Link>
          </div>

          {isAuthenticated && (
            <>
              <div className="hidden md:flex items-center gap-6">
                <div className="flex items-center gap-4 px-4 py-2 bg-gray-dark rounded-lg">
                  <div className="text-sm">
                    <div className="text-gray-light text-xs">Інвестиції</div>
                    <div className="font-bold text-foreground">${userBalance.toFixed(2)}</div>
                  </div>
                  <div className="w-px h-8 bg-gray-medium"></div>
                  <div className="text-sm">
                    <div className="text-gray-light text-xs">Профіт</div>
                    <div className="font-bold text-accent">${userProfit.toFixed(2)}</div>
                  </div>
                </div>

                <nav className="flex items-center gap-2">
                  <Link 
                    href="/deposit" 
                    className="px-4 py-2 bg-accent hover:bg-accent-hover text-foreground font-medium rounded transition-colors"
                  >
                    Депозит
                  </Link>
                  <Link 
                    href="/withdraw" 
                    className="px-4 py-2 bg-gray-dark hover:bg-gray-medium text-foreground font-medium rounded transition-colors"
                  >
                    Вивід
                  </Link>
                  <Link 
                    href="/referral" 
                    className="px-4 py-2 bg-gray-dark hover:bg-gray-medium text-foreground font-medium rounded transition-colors"
                  >
                    Рефералка
                  </Link>
                  <Link 
                    href="/dashboard" 
                    className="px-4 py-2 bg-gray-dark hover:bg-gray-medium text-foreground font-medium rounded transition-colors"
                  >
                    Профіль
                  </Link>
                </nav>
              </div>

              <button 
                className="md:hidden p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </>
          )}

          {!isAuthenticated && (
            <div className="flex items-center gap-3">
              <Link 
                href="/auth/login" 
                className="px-4 py-2 text-foreground font-medium hover:text-gray-light transition-colors"
              >
                Вхід
              </Link>
              <Link 
                href="/auth/register" 
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-foreground font-medium rounded transition-colors"
              >
                Реєстрація
              </Link>
            </div>
          )}
        </div>

        {mobileMenuOpen && isAuthenticated && (
          <div className="md:hidden py-4 border-t border-gray-dark">
            <div className="flex items-center gap-4 mb-4 p-3 bg-gray-dark rounded-lg">
              <div className="text-sm">
                <div className="text-gray-light text-xs">Інвестиції</div>
                <div className="font-bold text-foreground">${userBalance.toFixed(2)}</div>
              </div>
              <div className="w-px h-8 bg-gray-medium"></div>
              <div className="text-sm">
                <div className="text-gray-light text-xs">Профіт</div>
                <div className="font-bold text-accent">${userProfit.toFixed(2)}</div>
              </div>
            </div>
            <nav className="flex flex-col gap-2">
              <Link 
                href="/deposit" 
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-foreground font-medium rounded transition-colors text-center"
              >
                Депозит
              </Link>
              <Link 
                href="/withdraw" 
                className="px-4 py-2 bg-gray-dark hover:bg-gray-medium text-foreground font-medium rounded transition-colors text-center"
              >
                Вивід
              </Link>
              <Link 
                href="/referral" 
                className="px-4 py-2 bg-gray-dark hover:bg-gray-medium text-foreground font-medium rounded transition-colors text-center"
              >
                Рефералка
              </Link>
              <Link 
                href="/dashboard" 
                className="px-4 py-2 bg-gray-dark hover:bg-gray-medium text-foreground font-medium rounded transition-colors text-center"
              >
                Профіль
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
