"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/lib/api"
import Loading from "@/components/Loading"
import { CheckIcon, XIcon } from "@/components/icons/AdminIcons"

interface Deposit {
  id: string
  amount: number
  status: string
  created_at: string
  confirmed_at: string | null
  tx_hash: string | null
  admin_note: string | null
  user: {
    id: string
    email: string
    full_name: string | null
  }
  payment_method: {
    currency: string
    network: string
    wallet_address: string
  } | null
}

export default function AdminDepositsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  // ВСІ useState МАЮТЬ БУТИ НА ПОЧАТКУ
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pending' | 'history'>('pending')
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [action, setAction] = useState<'approve' | 'reject'>('approve')
  const [note, setNote] = useState('')

  if (authLoading) return <Loading />
  if (!user) { router.push('/auth/login'); return null }
  if (user.role !== 'admin') { router.push('/dashboard'); return null }

  useEffect(() => {
    fetchDeposits()
  }, [tab])

  async function fetchDeposits() {
    setLoading(true)
    try {
      const status = tab === 'pending' ? 'pending' : 'all'
      const result = await api.adminGetDeposits(status)
      if (result.success) {
        let depositsData = result.data.deposits || []
        if (tab === 'history') {
          depositsData = depositsData.filter((d: Deposit) => d.status !== 'pending')
        }
        setDeposits(depositsData)
      }
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false)
    }
  }

  async function handleAction(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDeposit) return

    try {
      let result
      if (action === 'approve') {
        result = await api.adminApproveDeposit(selectedDeposit.id, note)
      } else {
        if (!note.trim()) {
          alert('Для відхилення потрібна примітка')
          return
        }
        result = await api.adminRejectDeposit(selectedDeposit.id, note)
      }

      if (result.success) {
        alert(action === 'approve' ? 'Депозит підтверджено' : 'Депозит відхилено')
        setShowModal(false)
        setSelectedDeposit(null)
        setNote('')
        fetchDeposits()
      } else {
        alert('Помилка: ' + (result.error?.message || 'Unknown error'))
      }
    } catch (error) {
      alert('Помилка обробки депозиту')
    }
  }

  function openModal(deposit: Deposit, actionType: 'approve' | 'reject') {
    setSelectedDeposit(deposit)
    setAction(actionType)
    setNote('')
    setShowModal(true)
  }

  if (loading) {
    return <Loading fullScreen size="lg" />
  }

  const pendingCount = deposits.filter(d => d.status === 'pending').length

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Депозити</h1>
        <p className="text-gray-light">
          Очікують підтвердження: <span className="font-sans text-yellow-500">{pendingCount}</span>
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-medium mb-6">
        <button
          onClick={() => setTab('pending')}
          className={`px-6 py-3 font-medium transition-colors ${
            tab === 'pending' ? 'text-silver border-b-2 border-silver' : 'text-gray-light hover:text-foreground'
          }`}
        >
          Очікують ({pendingCount})
        </button>
        <button
          onClick={() => setTab('history')}
          className={`px-6 py-3 font-medium transition-colors ${
            tab === 'history' ? 'text-silver border-b-2 border-silver' : 'text-gray-light hover:text-foreground'
          }`}
        >
          Історія
        </button>
      </div>

      {/* Deposits List */}
      <div className="space-y-4">
        {deposits.map((deposit) => (
          <div
            key={deposit.id}
            className={`bg-gray-dark border rounded-lg p-6 ${
              deposit.status === 'pending' ? 'border-yellow-500/30' : 'border-gray-medium'
            }`}
          >
            <div className="grid md:grid-cols-4 gap-6">
              <div>
                <div className="text-xs text-gray-light mb-1">Користувач</div>
                {deposit.user ? (
                  <>
                    <div className="font-medium">{deposit.user.full_name || 'Без імені'}</div>
                    <div className="text-xs text-gray-light">{deposit.user.email}</div>
                  </>
                ) : (
                  <div className="text-xs text-red-400">User profile not found</div>
                )}
              </div>

              <div>
                <div className="text-xs text-gray-light mb-1">Сума</div>
                <div className="text-2xl font-bold text-silver font-sans">${deposit.amount.toFixed(2)}</div>
              </div>

              <div>
                <div className="text-xs text-gray-light mb-1">Метод оплати</div>
                {deposit.payment_method ? (
                  <div>
                    <div className="font-medium font-sans">{deposit.payment_method.currency} ({deposit.payment_method.network})</div>
                    <div className="text-xs text-gray-light font-mono mt-1 truncate">
                      {deposit.payment_method.wallet_address}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-light">—</div>
                )}
              </div>

              <div>
                <div className="text-xs text-gray-light mb-1">Дата створення</div>
                <div className="text-sm">{new Date(deposit.created_at).toLocaleString('uk-UA')}</div>
                {deposit.confirmed_at && (
                  <>
                    <div className="text-xs text-gray-light mt-2 mb-1">Підтверджено</div>
                    <div className="text-sm">{new Date(deposit.confirmed_at).toLocaleString('uk-UA')}</div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-medium/30">
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded text-xs ${
                  deposit.status === 'confirmed' ? 'bg-green-500/20 text-green-500' :
                  deposit.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                  'bg-red-500/20 text-red-500'
                }`}>
                  {deposit.status}
                </span>

                {deposit.tx_hash && (
                  <div className="text-xs text-gray-light">
                    TX: <span className="font-mono">{deposit.tx_hash}</span>
                  </div>
                )}

                {deposit.admin_note && (
                  <div className="text-xs text-gray-light">
                    Примітка: {deposit.admin_note}
                  </div>
                )}
              </div>

              {deposit.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => openModal(deposit, 'approve')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-900/20 border border-green-500/30 text-green-400 rounded hover:bg-green-900/30 transition-all cursor-pointer"
                  >
                    <CheckIcon /> Зарахувати
                  </button>
                  <button
                    onClick={() => openModal(deposit, 'reject')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-900/20 border border-red-500/30 text-red-400 rounded hover:bg-red-900/30 transition-all cursor-pointer"
                  >
                    <XIcon /> Відхилити
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {deposits.length === 0 && (
          <div className="bg-gray-dark border border-gray-medium rounded-lg p-12 text-center">
            <p className="text-gray-light">
              {tab === 'pending' ? 'Немає депозитів на підтвердження' : 'Історія депозитів порожня'}
            </p>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showModal && selectedDeposit && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-dark border border-gray-medium rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold mb-6">
              {action === 'approve' ? 'Підтвердити депозит' : 'Відхилити депозит'}
            </h2>

            <div className="bg-background border border-gray-medium rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-light">Користувач:</div>
                  <div className="font-medium">{selectedDeposit.user.email}</div>
                </div>
                <div>
                  <div className="text-gray-light">Сума:</div>
                  <div className="font-bold text-silver font-sans">${selectedDeposit.amount.toFixed(2)}</div>
                </div>
              </div>
            </div>

            <form onSubmit={handleAction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Примітка адміністратора {action === 'reject' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-gray-medium rounded-lg focus:outline-none focus:border-silver resize-none"
                  rows={4}
                  placeholder={action === 'approve' ? 'Додаткова інформація (опціонально)' : 'Причина відхилення (обов\'язково)'}
                  required={action === 'reject'}
                />
              </div>

              {action === 'approve' && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <div className="text-xs text-green-500">✓ Підтвердження</div>
                  <div className="text-sm text-gray-light mt-1">
                    Після підтвердження кошти будуть зараховані на баланс користувача
                  </div>
                </div>
              )}

              {action === 'reject' && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <div className="text-xs text-red-500">✗ Відхилення</div>
                  <div className="text-sm text-gray-light mt-1">
                    Депозит буде відхилено, кошти НЕ будуть зараховані
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className={`flex-1 px-4 py-3 font-bold rounded-lg ${
                    action === 'approve'
                      ? 'bg-green-900/20 border border-green-500/30 text-green-400 hover:bg-green-900/30'
                      : 'bg-red-900/20 border border-red-500/30 text-red-400 hover:bg-red-900/30'
                  } transition-all`}
                >
                  {action === 'approve' ? 'Підтвердити' : 'Відхилити'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setSelectedDeposit(null)
                    setNote('')
                  }}
                  className="flex-1 px-4 py-3 bg-background border border-gray-medium rounded-lg hover:border-silver/30 transition-all"
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
