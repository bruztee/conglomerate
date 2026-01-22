"use client"

import { useState } from "react"
import { useRouter } from "@/lib/navigation"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/lib/api"
import { useAdminInvestments } from "@/hooks/useAdminInvestments"
import Loading from "@/components/Loading"
import Pagination from "@/components/Pagination"
import { EditIcon, CheckIcon } from "@/components/icons/AdminIcons"

interface Investment {
  id: string
  user_id: string
  principal: number
  accrued_interest: number
  rate_monthly: number
  locked_amount: number
  status: 'active' | 'frozen' | 'closed'
  opened_at: string
  closed_at: string | null
  deposit_id: string
  total_value: number
  available: number
  total_withdrawn: number
  initial_amount: number
  real_profit: number
  profiles: {
    id: string
    email: string
    full_name: string | null
    phone: string | null
  }
}

export default function AdminInvestmentsPage() {
  const router = useRouter()
  const { user } = useAuth()
  
  // SWR hook - instant loading з кешу
  const { investments: allInvestments, isLoading: loading, refresh: refreshInvestments } = useAdminInvestments()
  
  const [filter, setFilter] = useState<'all' | 'active' | 'frozen' | 'closed'>('active')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    rate_monthly: 5,
    status: 'active' as 'active' | 'closed',
    locked_amount: 0,
  })
  const investmentsPerPage = 20

  // AdminLayout already checked auth
  
  // Filter investments
  const investments = filter === 'all' 
    ? allInvestments 
    : allInvestments.filter((inv: Investment) => inv.status === filter)

  if (loading) {
    return <Loading fullScreen size="lg" />
  }

  const activeCount = investments.filter(inv => inv.status === 'active').length
  const totalPages = Math.ceil(investments.length / investmentsPerPage)
  const paginatedInvestments = investments.slice(
    (currentPage - 1) * investmentsPerPage,
    currentPage * investmentsPerPage
  )

  return (
    <div className="p-4 md:p-8 pt-16 md:pt-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Інвестиції користувачів</h1>
        <p className="text-gray-light">
          Активних позицій: <span className="font-sans text-green-500">{activeCount}</span>
        </p>
        {totalPages > 1 && (
          <div className="mt-2 text-sm text-gray-light">
            Сторінка {currentPage} з {totalPages}
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-medium mb-6 overflow-x-auto">
        <button
          onClick={() => { setFilter('active'); setCurrentPage(1); }}
          className={`px-4 md:px-6 py-3 font-medium transition-colors whitespace-nowrap ${
            filter === 'active' ? 'text-silver border-b-2 border-silver' : 'text-gray-light hover:text-foreground'
          }`}
        >
          Активні
        </button>
        <button
          onClick={() => { setFilter('frozen'); setCurrentPage(1); }}
          className={`px-4 md:px-6 py-3 font-medium transition-colors whitespace-nowrap ${
            filter === 'frozen' ? 'text-silver border-b-2 border-silver' : 'text-gray-light hover:text-foreground'
          }`}
        >
          Заморожені
        </button>
        <button
          onClick={() => { setFilter('all'); setCurrentPage(1); }}
          className={`px-4 md:px-6 py-3 font-medium transition-colors whitespace-nowrap ${
            filter === 'all' ? 'text-silver border-b-2 border-silver' : 'text-gray-light hover:text-foreground'
          }`}
        >
          Всі
        </button>
        <button
          onClick={() => { setFilter('closed'); setCurrentPage(1); }}
          className={`px-4 md:px-6 py-3 font-medium transition-colors whitespace-nowrap ${
            filter === 'closed' ? 'text-silver border-b-2 border-silver' : 'text-gray-light hover:text-foreground'
          }`}
        >
          Закриті
        </button>
      </div>

      {/* Investments List */}
      <div className="space-y-4 overflow-x-hidden">
        {paginatedInvestments.map((investment) => {
          // Використовуємо total_value та available з API
          const totalValue = investment.total_value || 0
          const available = investment.available || 0
          
          return (
            <div
              key={investment.id}
              className="bg-blur-dark border border-gray-medium rounded-lg p-4 md:p-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 text-sm">
                <div className="sm:col-span-2 lg:col-span-1">
                  <div className="text-xs text-gray-light mb-1">Користувач</div>
                  <div className="font-medium">{investment.profiles?.full_name || 'Без імені'}</div>
                  <div className="text-xs text-gray-light truncate">{investment.profiles?.email}</div>
                  {investment.profiles?.phone && (
                    <div className="text-xs text-gray-light mt-1">{investment.profiles.phone}</div>
                  )}
                </div>

                <div>
                  <div className="text-xs text-gray-light mb-1">Початкова сума</div>
                  <div className="text-lg md:text-xl font-bold text-foreground font-sans">
                    ${investment.initial_amount.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-light mt-1">
                    {investment.rate_monthly}% місячних
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-light mb-1">{investment.status === 'closed' ? 'Поточна сума' : 'Поточна сума'}</div>
                  <div className="text-lg font-bold text-silver font-sans">
                    ${investment.status === 'closed' ? '0.00' : totalValue.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-light mt-1">
                    Principal: ${parseFloat(investment.principal.toString()).toFixed(2)}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-light mb-1">{investment.status === 'closed' ? 'Виведено' : 'Профіт'}</div>
                  <div className="text-lg font-bold text-green-400 font-sans">
                    {investment.status === 'closed' 
                      ? `$${parseFloat(investment.total_withdrawn.toString()).toFixed(2)}`
                      : `+$${investment.real_profit.toFixed(2)}`
                    }
                  </div>
                  <div className="text-xs text-gray-light mt-1">
                    {investment.status === 'closed' 
                      ? `Прибуток: +$${investment.real_profit.toFixed(2)}`
                      : `Accrued: $${parseFloat(investment.accrued_interest.toString()).toFixed(2)}`
                    }
                  </div>
                </div>

                {investment.status !== 'closed' && (
                  <div>
                    <div className="text-xs text-gray-light mb-1">Заморожено</div>
                    <div className="font-medium font-sans text-orange-400">
                      ${parseFloat(investment.locked_amount.toString()).toFixed(2)}
                    </div>
                    <div className="text-xs text-green-400 mt-1">
                      Доступно: ${available.toFixed(2)}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-xs text-gray-light mb-1">Дата відкриття</div>
                  <div className="text-sm">{new Date(investment.opened_at).toLocaleDateString('uk-UA')}</div>
                  {investment.closed_at && (
                    <>
                      <div className="text-xs text-gray-light mt-2 mb-1">Закрито</div>
                      <div className="text-sm">{new Date(investment.closed_at).toLocaleDateString('uk-UA')}</div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-medium/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-3 py-1 rounded text-xs ${
                      investment.status === 'active' 
                        ? 'bg-green-500/20 text-green-500' 
                        : investment.status === 'frozen'
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {investment.status === 'active' ? 'Активна' : investment.status === 'frozen' ? 'Заморожено' : 'Закрита'}
                    </span>
                    
                    <span className="text-xs text-gray-light">
                      ID: <span className="font-mono">{investment.id.slice(0, 8)}...</span>
                    </span>
                  </div>
                  
                  <button
                    onClick={() => {
                      setSelectedInvestment(investment)
                      setFormData({
                        rate_monthly: investment.rate_monthly,
                        status: investment.status as 'active' | 'closed',
                        locked_amount: parseFloat(investment.locked_amount.toString()),
                      })
                      setShowModal(true)
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blur border border-gray-medium rounded hover:border-silver/30 transition-all text-sm"
                  >
                    <EditIcon /> Управління
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {paginatedInvestments.length === 0 && (
          <div className="bg-blur-dark border border-gray-medium rounded-lg p-12 text-center">
            <p className="text-gray-light">
              {filter === 'active' ? 'Немає активних інвестицій' : 
               filter === 'closed' ? 'Немає закритих інвестицій' : 
               'Інвестицій не знайдено'}
            </p>
          </div>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
      
      {/* Management Modal */}
      {showModal && selectedInvestment && (
        <div className="fixed inset-0 bg-blur/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-blur-dark border border-gray-medium rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold mb-6">Управління інвестицією</h2>

            <div className="mb-6 p-4 bg-blur border border-gray-medium rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-light">Користувач:</div>
                  <div className="font-medium">{selectedInvestment.profiles?.email}</div>
                </div>
                <div>
                  <div className="text-gray-light">Початкова сума:</div>
                  <div className="font-bold text-silver font-sans">${parseFloat(selectedInvestment.principal.toString()).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-gray-light">Профіт:</div>
                  <div className="text-green-400 font-sans">+${parseFloat(selectedInvestment.accrued_interest.toString()).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-gray-light">Всього:</div>
                  <div className="font-sans">${(parseFloat(selectedInvestment.principal.toString()) + parseFloat(selectedInvestment.accrued_interest.toString())).toFixed(2)}</div>
                </div>
              </div>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault()
              try {
                const result = await api.adminUpdateInvestment(selectedInvestment.id, formData)
                if (result.success) {
                  alert('Інвестиція оновлена')
                  setShowModal(false)
                  refreshInvestments()
                } else {
                  alert('Помилка: ' + (result.error?.message || 'Unknown error'))
                }
              } catch (error) {
                alert('Помилка оновлення інвестиції')
              }
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Місячний % (поточний: {selectedInvestment.rate_monthly}%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.rate_monthly}
                    onChange={(e) => setFormData({ ...formData, rate_monthly: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 bg-blur border border-gray-medium rounded-lg focus:outline-none focus:border-silver font-sans"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Статус</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'closed' })}
                    className="w-full px-4 py-2 bg-blur border border-gray-medium rounded-lg focus:outline-none focus:border-silver"
                  >
                    <option value="active">Активна</option>
                    <option value="closed">Закрита</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Заморожено (макс: ${(parseFloat(selectedInvestment.principal.toString()) + parseFloat(selectedInvestment.accrued_interest.toString())).toFixed(2)})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={parseFloat(selectedInvestment.principal.toString()) + parseFloat(selectedInvestment.accrued_interest.toString())}
                  value={formData.locked_amount}
                  onChange={(e) => setFormData({ ...formData, locked_amount: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 bg-blur border border-gray-medium rounded-lg focus:outline-none focus:border-silver font-sans"
                />
                <p className="text-xs text-gray-light mt-1">
                  Доступно буде: ${((parseFloat(selectedInvestment.principal.toString()) + parseFloat(selectedInvestment.accrued_interest.toString())) - formData.locked_amount).toFixed(2)}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-silver/10 border border-silver/30 text-silver font-bold rounded-lg hover:bg-silver/20 transition-all"
                >
                  Зберегти зміни
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setSelectedInvestment(null)
                  }}
                  className="flex-1 px-4 py-3 bg-blur border border-gray-medium rounded-lg hover:border-silver/30 transition-all"
                >
                  Скасувати
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
