"use client"

import type React from "react"
import ChartIcon from "@/components/icons/ChartIcon"
import UserIcon from "@/components/icons/UserIcon"
import NetworkIcon from "@/components/icons/NetworkIcon"
import BoltIcon from "@/components/icons/BoltIcon"
import WarningIcon from "@/components/icons/WarningIcon"
import CopyIcon from "@/components/icons/CopyIcon"
import Pagination from "@/components/Pagination"
import DepositFlow from "@/components/DepositFlow"

import { useState } from "react"
import LocaleLink from "@/components/LocaleLink"
import Header from "@/components/Header"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "@/lib/navigation"
import Loading from "@/components/Loading"
import { useWallet } from "@/hooks/useWallet"
import { useDeposits } from "@/hooks/useDeposits"
import { useTranslations } from 'next-intl'

interface Deposit {
  id: string
  amount: number
  frozen: number
  profit: number
  percentage: number
  date: string
  withdrawDate?: string
  status: string
  withdrawn?: number
  locked?: number
  available?: number
}

export default function DashboardPage() {
  const t = useTranslations('dashboard')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const { user } = useAuth()
  
  // SWR hooks - instant loading з кешу
  const { wallet, isLoading: walletLoading, refresh: refreshWallet } = useWallet()
  const { activeDeposits, depositHistory, isLoading: depositsLoading, refresh: refreshDeposits } = useDeposits()
  
  // Pagination states
  const [historyPage, setHistoryPage] = useState(1)
  const [activeDepositsPage, setActiveDepositsPage] = useState(1)
  const itemsPerPage = 10
  
  // Get data from SWR or defaults
  const loading = walletLoading || depositsLoading
  const userBalance = wallet?.balance || 0
  const frozenAmount = wallet?.locked_amount || 0
  const userProfit = wallet?.total_profit || 0
  const totalInvestments = wallet?.total_invested || 0
  const profitPercentage = (user as any)?.monthly_percentage || 5

  const handleWithdraw = (depositId: string) => {
    router.push(`/withdraw?deposit_id=${depositId}`)
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return tCommon('active')
      case "frozen":
        return tCommon('frozen')
      case "closed":
        return tCommon('closed')
      case "pending":
        return tCommon('pending')
      case "rejected":
        return tCommon('rejected')
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400"
      case "frozen":
        return "bg-orange-500/20 text-orange-400"
      case "closed":
        return "bg-gray-500/20 text-gray-400"
      case "pending":
        return "bg-yellow-500/20 text-yellow-400"
      case "rejected":
        return "bg-red-500/20 text-red-400"
      default:
        return "bg-gray-medium/30 text-gray-light"
    }
  }

  // Refresh data after deposit - SWR автоматично оновить
  const handleDepositSuccess = async () => {
    await Promise.all([refreshWallet(), refreshDeposits()])
  }

  if (loading) {
    return <Loading fullScreen size="lg" />
  }

  return (
    <>
      <Header isAuthenticated={true} />

      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
            <p className="text-gray-light">{t('subtitle')}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-gray-dark/20 border border-gray-medium/30 rounded-lg p-4 md:p-6 flex flex-col items-center text-center">
              <div className="mb-2 md:mb-4 text-silver">
                <BoltIcon className="w-8 md:w-10 h-8 md:h-10" />
              </div>
              <div className="text-gray-light text-xs md:text-sm mb-1 md:mb-2">{t('investments')}</div>
              <div className="text-xl md:text-3xl font-bold text-foreground font-sans">${totalInvestments.toFixed(2)}</div>
            </div>

            <div className="bg-gray-dark/20 border border-gray-medium/30 rounded-lg p-4 md:p-6 flex flex-col items-center text-center">
              <div className="mb-2 md:mb-4 text-silver">
                <ChartIcon className="w-8 md:w-10 h-8 md:h-10" />
              </div>
              <div className="text-gray-light text-xs md:text-sm mb-1 md:mb-2">{t('profit')}</div>
              <div className="text-xl md:text-3xl font-bold text-silver font-sans">${userProfit.toFixed(2)}</div>
            </div>

            <div className="bg-gray-dark/20 border border-gray-medium/30 rounded-lg p-4 md:p-6 flex flex-col items-center text-center">
              <div className="mb-2 md:mb-4 text-silver">
                <UserIcon className="w-8 md:w-10 h-8 md:h-10" />
              </div>
              <div className="text-gray-light text-xs md:text-sm mb-1 md:mb-2">{t('totalBalance')}</div>
              <div className="text-xl md:text-3xl font-bold text-foreground font-sans">${userBalance.toFixed(2)}</div>
              {frozenAmount > 0 && (
                <div className="text-xs text-orange-400 mt-1 md:mt-2">{t('frozen')}: ${frozenAmount.toFixed(2)}</div>
              )}
            </div>

            <div className="bg-gray-dark/20 border border-gray-medium/30 rounded-lg p-4 md:p-6 flex flex-col items-center text-center">
              <div className="mb-2 md:mb-4 text-silver">
                <NetworkIcon className="w-8 md:w-10 h-8 md:h-10" />
              </div>
              <div className="text-gray-light text-xs md:text-sm mb-1 md:mb-2">{t('activeDeposits')}</div>
              <div className="text-xl md:text-3xl font-bold text-silver font-sans">{activeDeposits.length}</div>
            </div>
          </div>

          {/* Deposit Creation and Active Deposits */}
          <div className="grid lg:grid-cols-2 gap-4 md:gap-6 mb-8">
            <DepositFlow onSuccess={handleDepositSuccess} userRate={profitPercentage} />

            <div className="bg-gray-dark/20 border border-gray-medium/30 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">{t('activeDeposits')}</h2>

              {activeDeposits.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {activeDeposits
                      .slice((activeDepositsPage - 1) * itemsPerPage, activeDepositsPage * itemsPerPage)
                      .map((deposit) => (
                    <div
                      key={deposit.id}
                      className="bg-blur/50 border border-gray-medium/50 rounded-lg p-3 sm:p-4 hover:border-silver/50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-light mb-1">{t('deposit')}</div>
                          <div className="text-xl sm:text-2xl font-bold text-silver font-sans break-words">${deposit.amount.toFixed(2)}</div>
                          {deposit.frozen > 0 && (
                            <div className="text-xs text-gray-light mt-1">
                              {t('frozen')}: ${deposit.frozen.toFixed(2)}
                            </div>
                          )}
                          {deposit.frozen > 0 && (
                            <div className="text-xs text-white mt-1">
                              {t('available')}: ${(deposit.available || 0).toFixed(2)}
                            </div>
                          )}
                        </div>
                        <div className="text-left sm:text-right">
                          <div className="text-xs text-gray-light mb-1">{t('profit')}</div>
                          <div className="text-lg font-bold text-foreground font-sans break-words">+${deposit.profit.toFixed(2)}</div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-3 border-t border-gray-medium/30">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs sm:text-sm text-gray-light whitespace-nowrap">
                            {new Date(deposit.date).toLocaleDateString("uk-UA")}
                          </span>
                          <span className={`inline-block px-2 py-1 rounded text-xs whitespace-nowrap ${getStatusColor(deposit.status)}`}>
                            {getStatusLabel(deposit.status)}
                          </span>
                        </div>
                        {deposit.status === 'active' && (
                          <button
                            onClick={() => handleWithdraw(deposit.id)}
                            className="btn-gradient-primary w-full sm:w-auto px-4 py-2 text-foreground font-bold text-sm rounded-lg transition-colors font-sans whitespace-nowrap"
                          >
                            {t('withdrawButton')}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  </div>
                  
                  <Pagination
                    currentPage={activeDepositsPage}
                    totalPages={Math.ceil(activeDeposits.length / itemsPerPage)}
                    onPageChange={setActiveDepositsPage}
                  />
                </>
              ) : (
                <div className="text-center py-12 text-gray-light">
                  <div className="mb-4">
                    <ChartIcon className="w-16 h-16 mx-auto opacity-50" />
                  </div>
                  <p className="mb-2 font-medium">{t('noActiveDeposits')}</p>
                  <p className="text-sm">{t('createFirstDeposit')}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mb-8">
            <div className="bg-gray-dark/20 border border-gray-medium/30 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">{t('depositHistory')}</h2>

              {depositHistory.length > 0 ? (
                <>
                  {/* Mobile & Tablet Cards */}
                  <div className="lg:hidden space-y-4">
                    {depositHistory
                      .slice((historyPage - 1) * itemsPerPage, historyPage * itemsPerPage)
                      .map((deposit) => (
                      <div
                        key={deposit.id}
                        className="bg-blur/50 border border-gray-medium/50 rounded-lg p-3 sm:p-4"
                      >
                        <div className="flex justify-between items-center gap-2 mb-3 pb-3 border-b border-gray-medium/30">
                          <span className="text-xs sm:text-sm font-sans text-gray-light truncate flex-1 min-w-0">
                            Deposit #{deposit.id.slice(0, 8)}...
                          </span>
                          <span
                            className={`px-2 py-1 ${getStatusColor(deposit.status)} rounded-full text-xs font-sans whitespace-nowrap flex-shrink-0`}
                          >
                            {getStatusLabel(deposit.status)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-xs text-gray-light mb-1">{t('deposit')}</div>
                            <div className="font-medium font-sans">${deposit.amount.toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-light mb-1">{t('profit')}</div>
                            <div className="font-medium text-silver font-sans">+${deposit.profit.toFixed(2)}</div>
                          </div>
                          {(deposit.locked || 0) > 0 && (
                            <div>
                              <div className="text-xs text-gray-light mb-1">{t('frozen')}</div>
                              <div className="font-medium font-sans text-gray-light">${(deposit.locked || 0).toFixed(2)}</div>
                            </div>
                          )}
                          {(deposit.locked || 0) > 0 && (
                            <div>
                              <div className="text-xs text-gray-light mb-1">{t('available')}</div>
                              <div className="font-medium font-sans">${(deposit.available || 0).toFixed(2)}</div>
                            </div>
                          )}
                          <div>
                            <div className="text-xs text-gray-light mb-1">{t('percentage')}</div>
                            <div className="font-medium text-silver font-sans">{deposit.percentage}%</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-light mb-1">{t('createdDate')}</div>
                            <div className="font-medium text-gray-light">{new Date(deposit.date).toLocaleDateString("uk-UA")}</div>
                          </div>
                          {(deposit.withdrawn || 0) > 0 && (
                            <div className="col-span-2">
                              <div className="text-xs text-gray-light mb-1">{t('withdrawn')}</div>
                              <div className="font-medium font-sans text-orange-400">-${(deposit.withdrawn || 0).toFixed(2)}</div>
                            </div>
                          )}
                          {deposit.withdrawDate && (
                            <div className="col-span-2">
                              <div className="text-xs text-gray-light mb-1">{t('withdrawDate')}</div>
                              <div className="font-medium text-gray-light">{new Date(deposit.withdrawDate).toLocaleDateString("uk-UA")}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-medium/30">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-light font-sans">ID</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-light">{t('initialAmount')}</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-light">{t('withdrawn')}</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-light">{t('frozen')}</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-light">{t('percentage')}</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-light">{t('profit')}</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-light">{t('createdDate')}</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-light">{t('withdrawDate')}</th>
                          <th className="text-center py-3 px-4 text-sm font-medium text-gray-light">{t('status')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {depositHistory
                          .slice((historyPage - 1) * itemsPerPage, historyPage * itemsPerPage)
                          .map((deposit) => (
                          <tr
                            key={deposit.id}
                            className="border-b border-gray-medium/20 hover:bg-blur/30 transition-colors"
                          >
                            <td className="py-3 px-4 text-sm font-sans">#{deposit.id.slice(0, 8)}...</td>
                            <td className="py-3 px-4 text-sm font-medium font-sans">${deposit.amount.toFixed(2)}</td>
                            <td className="py-3 px-4 text-sm font-medium font-sans text-orange-400">
                              {(deposit.withdrawn || 0) > 0 ? `-$${(deposit.withdrawn || 0).toFixed(2)}` : '—'}
                            </td>
                            <td className="py-3 px-4 text-sm font-medium font-sans text-gray-light">
                              {(deposit.locked || 0) > 0 ? `$${(deposit.locked || 0).toFixed(2)}` : '—'}
                            </td>
                            <td className="py-3 px-4 text-sm font-sans text-silver">{deposit.percentage}%</td>
                            <td className="py-3 px-4 text-sm font-medium text-silver font-sans">
                              +${deposit.profit.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-light">
                              {new Date(deposit.date).toLocaleDateString("uk-UA")}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-light">
                              {deposit.withdrawDate ? new Date(deposit.withdrawDate).toLocaleDateString("uk-UA") : '—'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`px-3 py-1 ${getStatusColor(deposit.status)} rounded-full text-xs font-sans whitespace-nowrap`}
                              >
                                {getStatusLabel(deposit.status)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <Pagination
                    currentPage={historyPage}
                    totalPages={Math.ceil(depositHistory.length / itemsPerPage)}
                    onPageChange={setHistoryPage}
                  />
                </>
              ) : (
                <div className="text-center py-8 text-gray-light">
                  <p>{t('depositHistoryEmpty')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6">
            <LocaleLink
              href="/withdraw"
              className="p-6 bg-gray-dark/20 hover:bg-gray-dark/30 border border-gray-medium/30 hover:border-silver/50 rounded-lg transition-all text-center group flex flex-col items-center"
            >
              <div className="text-silver mb-4 group-hover:scale-110 transition-transform">
                <BoltIcon className="w-10 h-10" />
              </div>
              <div className="font-bold mb-1">{t('withdrawFunds')}</div>
              <div className="text-sm text-gray-light">{t('withdrawFundsText')}</div>
            </LocaleLink>

            <LocaleLink
              href="/referral"
              className="p-6 bg-gray-dark/20 hover:bg-gray-dark/30 border border-gray-medium/30 hover:border-silver/50 rounded-lg transition-all text-center group flex flex-col items-center"
            >
              <div className="text-silver mb-4 group-hover:scale-110 transition-transform">
                <NetworkIcon className="w-10 h-10" />
              </div>
              <div className="font-bold mb-1">{t('referralProgram')}</div>
              <div className="text-sm text-gray-light">{t('referralProgramText')}</div>
            </LocaleLink>

            <LocaleLink
              href="/rules"
              className="p-6 bg-gray-dark/20 hover:bg-gray-dark/30 border border-gray-medium/30 hover:border-silver/50 rounded-lg transition-all text-center group flex flex-col items-center"
            >
              <div className="text-silver mb-4 group-hover:scale-110 transition-transform">
                <UserIcon className="w-10 h-10" />
              </div>
              <div className="font-bold mb-1">{t('platformRules')}</div>
              <div className="text-sm text-gray-light">{t('platformRulesText')}</div>
            </LocaleLink>
          </div>
        </div>
      </main>
    </>
  )
}
