"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/lib/api"
import EmailIcon from "@/components/icons/EmailIcon"
import MoneyIcon from "@/components/icons/MoneyIcon"
import TelegramIcon from "@/components/icons/TelegramIcon"
import ShareIcon from "@/components/icons/ShareIcon"
import BoltIcon from "@/components/icons/BoltIcon"
import RefreshIcon from "@/components/icons/RefreshIcon"
import Header from "@/components/Header"
import Loading from "@/components/Loading"

interface Referral {
  id: string
  name: string
  email: string
  deposits: number
  earnings: number
  date: string
  status: "active" | "inactive"
}

export default function ReferralPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  const [userBalance, setUserBalance] = useState(0)
  const [userProfit, setUserProfit] = useState(0)
  const [loading, setLoading] = useState(true)
  const [totalReferrals, setTotalReferrals] = useState(0)
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [referralLink, setReferralLink] = useState("")
  const [referralCode, setReferralCode] = useState("")
  const [copiedMessage, setCopiedMessage] = useState(false)

  const [referrals, setReferrals] = useState<Referral[]>([])

  // Завантаження даних при mount
  useEffect(() => {
    async function fetchData() {
      if (!user) {
        router.push('/auth/login')
        return
      }

      setLoading(true)
      try {
        // Отримати wallet balance
        const walletResult = await api.getWallet()
        if (walletResult.success && walletResult.data) {
          setUserBalance(walletResult.data.balance || 0)
        }

        // Отримати referral stats
        const refResult = await api.getReferralStats()
        if (refResult.success && refResult.data) {
          const data = refResult.data
          
          setReferralCode(data.referral_code || '')
          setReferralLink(data.referral_link || `https://conglomerate-eight.vercel.app/?ref=${data.referral_code}`)
          setTotalReferrals(data.stats?.total_referrals || 0)
          setTotalEarnings(data.stats?.total_earned || 0)
          
          // Маппінг рефералів
          const referralsData = data.referrals?.map((r: any) => ({
            id: r.id,
            name: r.full_name || 'Анонім',
            email: r.email ? r.email.replace(/(.{3}).*(@.*)/, '$1***$2') : 'hidden@email.com',
            deposits: 0, // TODO: додати підрахунок з deposits
            earnings: 0, // TODO: додати підрахунок з bonuses
            date: r.created_at,
            status: 'active' as const, // TODO: визначити статус
          })) || []
          
          setReferrals(referralsData)
        }
      } catch (err) {
        // Silent fail
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, router])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink)
    setCopiedMessage(true)
    setTimeout(() => setCopiedMessage(false), 2000)
  }

  if (loading) {
    return <Loading fullScreen size="lg" />
  }

  if (!user) {
    return null
  }

  const activeReferrals = referrals.filter(r => r.status === 'active').length

  return (
    <>
      <Header isAuthenticated={true} />
      
      {/* Success message при копіюванні */}
      {copiedMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-900/90 border border-green-500 text-green-400 px-6 py-4 rounded-lg shadow-lg">
          Посилання скопійовано!
        </div>
      )}

      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Реферальна програма</h1>
            <p className="text-gray-light">Запрошуйте друзів та заробляйте додатковий дохід</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-blur-dark border border-gray-medium rounded-lg p-6">
              <div className="text-gray-light text-sm mb-2">Всього рефералів</div>
              <div className="text-3xl font-bold text-foreground font-sans">{totalReferrals}</div>
            </div>

            <div className="bg-blur-dark border border-gray-medium rounded-lg p-6">
              <div className="text-gray-light text-sm mb-2">Активні реферали</div>
              <div className="text-3xl font-bold text-silver font-sans">{activeReferrals}</div>
            </div>

            <div className="bg-blur-dark border border-gray-medium rounded-lg p-6">
              <div className="text-gray-light text-sm mb-2">Загальний заробіток</div>
              <div className="text-3xl font-bold text-foreground font-sans">${totalEarnings.toFixed(2)}</div>
            </div>

            <div className="bg-blur-dark border border-gray-medium rounded-lg p-6">
              <div className="text-gray-light text-sm mb-2">Реферальний код</div>
              <div className="text-2xl font-bold text-silver font-mono">{referralCode || '—'}</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-blur-dark border border-gray-medium rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Ваше реферальне посилання</h2>

              <div className="bg-blur border border-gray-medium rounded-lg p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    readOnly
                    value={referralLink}
                    className="flex-1 px-4 py-3 bg-blur-dark border border-gray-medium rounded-lg text-sm focus:outline-none"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="btn-gradient-primary px-6 py-3 text-foreground font-medium rounded-lg transition-all whitespace-nowrap font-sans"
                  >
                    Копіювати
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <button className="btn-gradient-secondary p-4 rounded-lg transition-all text-center">
                  <div className="flex justify-center mb-2">
                    <EmailIcon className="w-8 h-8 text-silver" />
                  </div>
                  <div className="text-sm font-medium font-sans">Email</div>
                </button>
                <button className="btn-gradient-secondary p-4 rounded-lg transition-all text-center">
                  <div className="flex justify-center mb-2">
                    <TelegramIcon className="w-8 h-8 text-silver" />
                  </div>
                  <div className="text-sm font-medium font-sans">Telegram</div>
                </button>
                <button className="btn-gradient-secondary p-4 rounded-lg transition-all text-center">
                  <div className="flex justify-center mb-2">
                    <ShareIcon className="w-8 h-8 text-silver" />
                  </div>
                  <div className="text-sm font-medium font-sans">Соцмережі</div>
                </button>
              </div>
            </div>

            <div className="bg-blur-dark border border-gray-medium rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Умови програми</h2>

              <div className="space-y-4 text-sm">
                <div className="flex gap-3">
                  <MoneyIcon className="w-5 h-5 text-silver flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium mb-1">
                      <span className="font-sans">5%</span> від депозитів
                    </div>
                    <div className="text-gray-light">
                      Отримуйте <span className="font-sans">5%</span> від кожного депозиту вашого реферала
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <RefreshIcon className="w-5 h-5 text-silver flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium mb-1">Довічна винагорода</div>
                    <div className="text-gray-light">Заробляйте з кожного депозиту без обмежень</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <BoltIcon className="w-5 h-5 text-silver flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium mb-1">Миттєве нарахування</div>
                    <div className="text-gray-light">Бонус нараховується автоматично</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <MoneyIcon className="w-5 h-5 text-silver flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium mb-1">Вільний вивід</div>
                    <div className="text-gray-light">Виводьте заробіток у будь-який час</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blur-dark border border-gray-medium rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Ваші реферали</h2>
              <div className="text-sm text-gray-light">
                Показано: {referrals.length} з {totalReferrals}
              </div>
            </div>

            {referrals.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-medium">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-light">Користувач</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-light">Депозитів</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-light">Ваш заробіток</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-light">Статус</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-light">Дата реєстрації</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((referral) => (
                      <tr key={referral.id} className="border-b border-gray-medium/50 hover:bg-gray-medium/20">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">{referral.name}</div>
                            <div className="text-xs text-gray-light">{referral.email}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium font-sans">
                          {referral.deposits > 0 ? `$${referral.deposits.toFixed(2)}` : "-"}
                        </td>
                        <td className="py-3 px-4 font-medium text-silver font-sans">
                          {referral.earnings > 0 ? `$${referral.earnings.toFixed(2)}` : "-"}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              referral.status === "active"
                                ? "bg-green-500/20 text-green-500"
                                : "bg-gray-medium text-gray-light"
                            }`}
                          >
                            {referral.status === "active" ? "Активний" : "Неактивний"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-light">
                          {new Date(referral.date).toLocaleDateString("uk-UA")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-light">
                <div className="flex justify-center mb-4">
                  <svg className="w-16 h-16 text-gray-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="mb-2">У вас поки немає рефералів</p>
                <p className="text-sm">Поділіться своїм посиланням, щоб почати заробляти</p>
              </div>
            )}
          </div>

          <div className="mt-8 grid sm:grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-silver/10 to-silver/5 border border-silver/30 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-3">Бонус за активність</h3>
              <p className="text-sm text-gray-light mb-4">
                Запросіть <span className="font-sans">5</span> активних рефералів та отримайте додаткові{" "}
                <span className="font-sans">2%</span> від їхніх депозитів
              </p>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-blur rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-silver transition-all"
                    style={{ width: `${(activeReferrals / 5) * 100}%` }}
                  ></div>
                </div>
                <div className="text-sm font-medium font-sans">{activeReferrals}/5</div>
              </div>
            </div>

            <div className="bg-blur-dark border border-gray-medium rounded-lg p-6">
              <h3 className="text-xl font-bold mb-3">Статистика</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-light">Активних рефералів:</span>
                  <span className="font-medium font-sans">{activeReferrals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-light">Заробіток на реферала:</span>
                  <span className="font-medium text-silver font-sans">
                    ${activeReferrals > 0 ? (totalEarnings / activeReferrals).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-light">Конверсія:</span>
                  <span className="font-medium font-sans">
                    {totalReferrals > 0 ? ((activeReferrals / totalReferrals) * 100).toFixed(0) : '0'}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
