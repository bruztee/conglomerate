"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import Loading from "@/components/Loading"
import { CheckIcon, XIcon } from "@/components/icons/AdminIcons"

interface Withdrawal {
  id: string
  amount: number
  method: string | null
  destination: any
  status: string
  network_fee: number
  admin_note: string | null
  created_at: string
  processed_at: string | null
  user: {
    id: string
    email: string
    full_name: string | null
  }
}

export default function WithdrawalsPage() {
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pending' | 'history'>('pending')
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [action, setAction] = useState<'approve' | 'reject' | 'mark-sent'>('approve')
  const [formData, setFormData] = useState({
    admin_note: '',
    network_fee: 0,
    tx_hash: '',
  })

  useEffect(() => {
    fetchWithdrawals()
  }, [tab])

  async function fetchWithdrawals() {
    setLoading(true)
    try {
      const status = tab === 'pending' ? 'requested' : 'all'
      const result = await api.adminGetWithdrawals(status)
      if (result.success) {
        let withdrawalsData = result.data.withdrawals || []
        if (tab === 'history') {
          withdrawalsData = withdrawalsData.filter((w: Withdrawal) => w.status !== 'requested')
        }
        setWithdrawals(withdrawalsData)
      }
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAction(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedWithdrawal) return

    try {
      let result
      if (action === 'approve') {
        result = await api.adminApproveWithdrawal(selectedWithdrawal.id, {
          admin_note: formData.admin_note,
          network_fee: formData.network_fee,
        })
      } else if (action === 'reject') {
        if (!formData.admin_note.trim()) {
          alert('Для відхилення потрібна примітка')
          return
        }
        result = await api.adminRejectWithdrawal(selectedWithdrawal.id, formData.admin_note)
      } else {
        result = await api.adminMarkWithdrawalSent(selectedWithdrawal.id, {
          tx_hash: formData.tx_hash,
          admin_note: formData.admin_note,
        })
      }

      if (result.success) {
        alert(
          action === 'approve' ? 'Вивід підтверджено' :
          action === 'reject' ? 'Вивід відхилено' :
          'Вивід позначено як відправлений'
        )
        setShowModal(false)
        setSelectedWithdrawal(null)
        resetForm()
        fetchWithdrawals()
      } else {
        alert('Помилка: ' + (result.error?.message || 'Unknown error'))
      }
    } catch (error) {
      alert('Помилка обробки виводу')
    }
  }

  function resetForm() {
    setFormData({
      admin_note: '',
      network_fee: 0,
      tx_hash: '',
    })
  }

  function openModal(withdrawal: Withdrawal, actionType: 'approve' | 'reject' | 'mark-sent') {
    setSelectedWithdrawal(withdrawal)
    setAction(actionType)
    resetForm()
    setShowModal(true)
  }

  if (loading) {
    return <Loading fullScreen size="lg" />
  }

  const pendingCount = withdrawals.filter(w => w.status === 'requested').length

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Виводи</h1>
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

      {/* Withdrawals List */}
      <div className="space-y-4">
        {withdrawals.map((withdrawal) => (
          <div
            key={withdrawal.id}
            className={`bg-gray-dark border rounded-lg p-6 ${
              withdrawal.status === 'requested' ? 'border-yellow-500/30' : 'border-gray-medium'
            }`}
          >
            <div className="grid md:grid-cols-4 gap-6">
              <div>
                <div className="text-xs text-gray-light mb-1">Користувач</div>
                <div className="font-medium">{withdrawal.user.full_name || 'Без імені'}</div>
                <div className="text-xs text-gray-light">{withdrawal.user.email}</div>
              </div>

              <div>
                <div className="text-xs text-gray-light mb-1">Сума виводу</div>
                <div className="text-2xl font-bold text-silver font-sans">${withdrawal.amount.toFixed(2)}</div>
                {withdrawal.network_fee > 0 && (
                  <div className="text-xs text-gray-light mt-1">
                    Комісія мережі: <span className="font-sans">${withdrawal.network_fee.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs text-gray-light mb-1">Метод / Адреса</div>
                <div className="font-medium font-sans">{withdrawal.method || 'USDT'}</div>
                {withdrawal.destination?.wallet_address && (
                  <div className="text-xs text-gray-light font-mono mt-1 truncate">
                    {withdrawal.destination.wallet_address}
                  </div>
                )}
                {withdrawal.destination?.address && (
                  <div className="text-xs text-gray-light font-mono mt-1 truncate">
                    {withdrawal.destination.address}
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs text-gray-light mb-1">Дата створення</div>
                <div className="text-sm">{new Date(withdrawal.created_at).toLocaleString('uk-UA')}</div>
                {withdrawal.processed_at && (
                  <>
                    <div className="text-xs text-gray-light mt-2 mb-1">Оброблено</div>
                    <div className="text-sm">{new Date(withdrawal.processed_at).toLocaleString('uk-UA')}</div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-medium/30">
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded text-xs ${
                  withdrawal.status === 'approved' || withdrawal.status === 'sent' ? 'bg-green-500/20 text-green-500' :
                  withdrawal.status === 'requested' ? 'bg-yellow-500/20 text-yellow-500' :
                  'bg-red-500/20 text-red-500'
                }`}>
                  {withdrawal.status}
                </span>

                {withdrawal.admin_note && (
                  <div className="text-xs text-gray-light">
                    Примітка: {withdrawal.admin_note}
                  </div>
                )}
              </div>

              {withdrawal.status === 'requested' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => openModal(withdrawal, 'approve')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-900/20 border border-green-500/30 text-green-400 rounded hover:bg-green-900/30 transition-all cursor-pointer"
                  >
                    <CheckIcon /> Схвалити
                  </button>
                  <button
                    onClick={() => openModal(withdrawal, 'reject')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-900/20 border border-red-500/30 text-red-400 rounded hover:bg-red-900/30 transition-all cursor-pointer"
                  >
                    <XIcon /> Відхилити
                  </button>
                </div>
              )}

              {withdrawal.status === 'approved' && (
                <div>
                  <button
                    onClick={() => openModal(withdrawal, 'mark-sent')}
                    className="flex items-center gap-2 px-4 py-2 bg-silver/20 border border-silver/30 text-silver rounded hover:bg-silver/30 transition-all cursor-pointer"
                  >
                    <CheckIcon /> Позначити відправленим
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {withdrawals.length === 0 && (
          <div className="bg-gray-dark border border-gray-medium rounded-lg p-12 text-center">
            <p className="text-gray-light">
              {tab === 'pending' ? 'Немає виводів на підтвердження' : 'Історія виводів порожня'}
            </p>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-dark border border-gray-medium rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold mb-6">
              {action === 'approve' ? 'Схвалити вивід' :
               action === 'reject' ? 'Відхилити вивід' :
               'Позначити як відправлений'}
            </h2>

            <div className="bg-background border border-gray-medium rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-light">Користувач:</div>
                  <div className="font-medium">{selectedWithdrawal.user.email}</div>
                </div>
                <div>
                  <div className="text-gray-light">Сума:</div>
                  <div className="font-bold text-silver font-sans">${selectedWithdrawal.amount.toFixed(2)}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-gray-light">Адреса виводу:</div>
                  <div className="font-mono text-xs break-all">
                    {selectedWithdrawal.destination?.wallet_address || selectedWithdrawal.destination?.address || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleAction} className="space-y-4">
              {action === 'approve' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Комісія мережі ($)
                  </label>
                  <input
                    type="number"
                    value={formData.network_fee}
                    onChange={(e) => setFormData({ ...formData, network_fee: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-background border border-gray-medium rounded-lg focus:outline-none focus:border-silver font-sans"
                    min="0"
                    step="0.01"
                    placeholder="Тільки комісія мережі (не мінімальна сума)"
                  />
                  <p className="text-xs text-gray-light mt-1">
                    ⚠️ Вказуйте тільки комісію мережі. Мінімальної суми виводу немає.
                  </p>
                </div>
              )}

              {action === 'mark-sent' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Transaction Hash (опціонально)
                  </label>
                  <input
                    type="text"
                    value={formData.tx_hash}
                    onChange={(e) => setFormData({ ...formData, tx_hash: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-gray-medium rounded-lg focus:outline-none focus:border-silver font-mono text-sm"
                    placeholder="0x..."
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  Примітка адміністратора {action === 'reject' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={formData.admin_note}
                  onChange={(e) => setFormData({ ...formData, admin_note: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-gray-medium rounded-lg focus:outline-none focus:border-silver resize-none"
                  rows={3}
                  placeholder={action === 'reject' ? 'Причина відхилення (обов\'язково)' : 'Додаткова інформація (опціонально)'}
                  required={action === 'reject'}
                />
              </div>

              {action === 'approve' && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <div className="text-xs text-green-500">✓ Схвалення</div>
                  <div className="text-sm text-gray-light mt-1">
                    Після схвалення кошти будуть списані з балансу користувача. Далі потрібно відправити кошти вручну та позначити вивід як "Відправлений".
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className={`flex-1 px-4 py-3 font-bold rounded-lg ${
                    action === 'approve' ? 'bg-green-900/20 border border-green-500/30 text-green-400 hover:bg-green-900/30' :
                    action === 'reject' ? 'bg-red-900/20 border border-red-500/30 text-red-400 hover:bg-red-900/30' :
                    'bg-silver/20 border border-silver/30 text-silver hover:bg-silver/30'
                  } transition-all`}
                >
                  {action === 'approve' ? 'Схвалити' :
                   action === 'reject' ? 'Відхилити' :
                   'Позначити відправленим'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setSelectedWithdrawal(null)
                    resetForm()
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
