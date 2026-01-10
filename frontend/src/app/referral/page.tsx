"use client"

import { useState } from "react"
import Header from "@/components/Header"

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
  const [userBalance] = useState(15000)
  const [userProfit] = useState(3250.5)
  const [totalReferrals] = useState(12)
  const [activeReferrals] = useState(8)
  const [totalEarnings] = useState(850.75)
  const [availableEarnings] = useState(650.25)

  const referralLink = "https://conglomerate.com/ref/ABC123"

  const [referrals] = useState<Referral[]>([
    {
      id: "1",
      name: "Іван К.",
      email: "ivan***@gmail.com",
      deposits: 5000,
      earnings: 250,
      date: "2026-01-01",
      status: "active",
    },
    {
      id: "2",
      name: "Олена С.",
      email: "olena***@gmail.com",
      deposits: 3000,
      earnings: 150,
      date: "2025-12-28",
      status: "active",
    },
    {
      id: "3",
      name: "Петро М.",
      email: "petro***@gmail.com",
      deposits: 7500,
      earnings: 375,
      date: "2025-12-20",
      status: "active",
    },
    {
      id: "4",
      name: "Марія Д.",
      email: "maria***@gmail.com",
      deposits: 0,
      earnings: 0,
      date: "2025-12-15",
      status: "inactive",
    },
  ])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink)
  }

  return (
    <>
      <Header isAuthenticated={true} userBalance={userBalance} userProfit={userProfit} />

      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Реферальна програма</h1>
            <p className="text-gray-light">Запрошуйте друзів та заробляйте додатковий дохід</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-gray-dark border border-gray-medium rounded-lg p-6">
              <div className="text-gray-light text-sm mb-2">Всього рефералів</div>
              <div className="text-3xl font-bold text-foreground font-sans">{totalReferrals}</div>
            </div>

            <div className="bg-gray-dark border border-gray-medium rounded-lg p-6">
              <div className="text-gray-light text-sm mb-2">Активні реферали</div>
              <div className="text-3xl font-bold text-silver font-sans">{activeReferrals}</div>
            </div>

            <div className="bg-gray-dark border border-gray-medium rounded-lg p-6">
              <div className="text-gray-light text-sm mb-2">Загальний заробіток</div>
              <div className="text-3xl font-bold text-foreground font-sans">${totalEarnings.toFixed(2)}</div>
            </div>

            <div className="bg-gray-dark border border-gray-medium rounded-lg p-6">
              <div className="text-gray-light text-sm mb-2">Доступно до виводу</div>
              <div className="text-3xl font-bold text-silver font-sans">${availableEarnings.toFixed(2)}</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-gray-dark border border-gray-medium rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Ваше реферальне посилання</h2>

              <div className="bg-background border border-gray-medium rounded-lg p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    readOnly
                    value={referralLink}
                    className="flex-1 px-4 py-3 bg-gray-dark border border-gray-medium rounded-lg text-sm focus:outline-none"
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
                  <div className="text-2xl mb-2">📧</div>
                  <div className="text-sm font-medium font-sans">Email</div>
                </button>
                <button className="btn-gradient-secondary p-4 rounded-lg transition-all text-center">
                  <div className="text-2xl mb-2">💬</div>
                  <div className="text-sm font-medium font-sans">Telegram</div>
                </button>
                <button className="btn-gradient-secondary p-4 rounded-lg transition-all text-center">
                  <div className="text-2xl mb-2">🔗</div>
                  <div className="text-sm font-medium font-sans">Соцмережі</div>
                </button>
              </div>
            </div>

            <div className="bg-gray-dark border border-gray-medium rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Умови програми</h2>

              <div className="space-y-4 text-sm">
                <div className="flex gap-3">
                  <span className="text-silver">💰</span>
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
                  <span className="text-silver">🔄</span>
                  <div>
                    <div className="font-medium mb-1">Довічна винагорода</div>
                    <div className="text-gray-light">Заробляйте з кожного депозиту без обмежень</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="text-silver">⚡</span>
                  <div>
                    <div className="font-medium mb-1">Миттєве нарахування</div>
                    <div className="text-gray-light">Бонус нараховується автоматично</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="text-silver">💸</span>
                  <div>
                    <div className="font-medium mb-1">Вільний вивід</div>
                    <div className="text-gray-light">Виводьте заробіток у будь-який час</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-dark border border-gray-medium rounded-lg p-6">
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
                <div className="text-4xl mb-4">👥</div>
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
                <div className="flex-1 bg-background rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-silver transition-all"
                    style={{ width: `${(activeReferrals / 5) * 100}%` }}
                  ></div>
                </div>
                <div className="text-sm font-medium font-sans">{activeReferrals}/5</div>
              </div>
            </div>

            <div className="bg-gray-dark border border-gray-medium rounded-lg p-6">
              <h3 className="text-xl font-bold mb-3">Статистика</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-light">Середній депозит:</span>
                  <span className="font-medium font-sans">${(15500 / activeReferrals).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-light">Заробіток на реферала:</span>
                  <span className="font-medium text-silver font-sans">
                    ${(totalEarnings / activeReferrals).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-light">Конверсія:</span>
                  <span className="font-medium font-sans">
                    {((activeReferrals / totalReferrals) * 100).toFixed(0)}%
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
