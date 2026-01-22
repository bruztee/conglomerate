"use client"

import { useState } from "react"
import { useRouter } from "@/lib/navigation"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/lib/api"
import { useAdminDeposits } from "@/hooks/useAdminDeposits"
import Loading from "@/components/Loading"
import { CheckIcon, XIcon } from "@/components/icons/AdminIcons"
import { useTranslations } from 'next-intl'

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
  const { user } = useAuth()
  const t = useTranslations('admin.depositsPage')
  
  // SWR hook - instant loading з кешу
  const { deposits: allDeposits, isLoading: loading, refresh: refreshDeposits } = useAdminDeposits()
  
  // ВСІ useState МАЮТЬ БУТИ НА ПОЧАТКУ
  const [tab, setTab] = useState<'pending' | 'history'>('pending')
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [action, setAction] = useState<'approve' | 'reject'>('approve')
  const [note, setNote] = useState('')

  // AdminLayout already checked auth
  
  // Filter deposits based on tab
  const deposits = tab === 'pending' 
    ? allDeposits.filter((d: Deposit) => d.status === 'pending')
    : allDeposits

  async function handleAction(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDeposit) return

    try {
      let result
      if (action === 'approve') {
        result = await api.adminApproveDeposit(selectedDeposit.id, note)
      } else {
        if (!note.trim()) {
          alert(t('rejectNoteRequired'))
          return
        }
        result = await api.adminRejectDeposit(selectedDeposit.id, note)
      }

      if (result.success) {
        alert(action === 'approve' ? t('depositApproved') : t('depositRejected'))
        setShowModal(false)
        setSelectedDeposit(null)
        setNote('')
        refreshDeposits()
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

  const pendingCount = allDeposits.filter((d: Deposit) => d.status === 'pending').length

  return (
    <div className="p-4 md:p-8 pt-16 md:pt-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
        <p className="text-gray-light">
          {t('awaitingConfirmation')}: <span className="font-sans text-yellow-500">{pendingCount}</span>
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
          {t('pending')} ({pendingCount})
        </button>
        <button
          onClick={() => setTab('history')}
          className={`px-6 py-3 font-medium transition-colors ${
            tab === 'history' ? 'text-silver border-b-2 border-silver' : 'text-gray-light hover:text-foreground'
          }`}
        >
          {t('history')}
        </button>
      </div>

      {/* Deposits List */}
      <div className="space-y-4 overflow-x-hidden">
        {deposits.map((deposit: Deposit) => (
          <div
            key={deposit.id}
            className={`bg-blur-dark border rounded-lg p-4 md:p-6 ${
              deposit.status === 'pending' ? 'border-yellow-500/30' : 'border-gray-medium'
            }`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-sm">
              <div className="sm:col-span-2 md:col-span-1">
                <div className="text-xs text-gray-light mb-1">{t('user')}</div>
                {deposit.user ? (
                  <>
                    <div className="font-medium">{deposit.user.full_name || t('noName')}</div>
                    <div className="text-xs text-gray-light">{deposit.user.email}</div>
                  </>
                ) : (
                  <div className="text-xs text-red-400">User profile not found</div>
                )}
              </div>

              <div>
                <div className="text-xs text-gray-light mb-1">{t('amount')}</div>
                <div className="text-xl md:text-2xl font-bold text-silver font-sans">${deposit.amount.toFixed(2)}</div>
              </div>

              <div>
                <div className="text-xs text-gray-light mb-1">{t('paymentMethod')}</div>
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
                <div className="text-xs text-gray-light mb-1">{t('createdDate')}</div>
                <div className="text-sm">{new Date(deposit.created_at).toLocaleString('uk-UA')}</div>
                {deposit.confirmed_at && (
                  <>
                    <div className="text-xs text-gray-light mt-2 mb-1">{t('confirmedDate')}</div>
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
                    {t('note')}: {deposit.admin_note}
                  </div>
                )}
              </div>

              {deposit.status === 'pending' && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => openModal(deposit, 'approve')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-900/20 border border-green-500/30 text-green-400 rounded hover:bg-green-900/30 transition-all cursor-pointer text-xs sm:text-sm whitespace-nowrap"
                  >
                    <CheckIcon /> {t('approve')}
                  </button>
                  <button
                    onClick={() => openModal(deposit, 'reject')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/20 border border-red-500/30 text-red-400 rounded hover:bg-red-900/30 transition-all cursor-pointer text-xs sm:text-sm whitespace-nowrap"
                  >
                    <XIcon /> {t('reject')}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {deposits.length === 0 && (
          <div className="bg-blur-dark border border-gray-medium rounded-lg p-12 text-center">
            <p className="text-gray-light">
              {tab === 'pending' ? t('noPending') : t('noHistory')}
            </p>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showModal && selectedDeposit && (
        <div className="fixed inset-0 bg-blur/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-blur-dark border border-gray-medium rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold mb-6">
              {action === 'approve' ? t('approveDeposit') : t('rejectDeposit')}
            </h2>

            <div className="bg-blur border border-gray-medium rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-light">{t('user')}:</div>
                  <div className="font-medium">{selectedDeposit.user.email}</div>
                </div>
                <div>
                  <div className="text-gray-light">{t('amount')}:</div>
                  <div className="font-bold text-silver font-sans">${selectedDeposit.amount.toFixed(2)}</div>
                </div>
              </div>
            </div>

            <form onSubmit={handleAction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('adminNote')} {action === 'reject' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-4 py-3 bg-blur border border-gray-medium rounded-lg focus:outline-none focus:border-silver resize-none"
                  rows={4}
                  placeholder={action === 'approve' ? t('additionalInfo') : t('rejectReason')}
                  required={action === 'reject'}
                />
              </div>

              {action === 'approve' && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <div className="text-xs text-green-500">{t('approveConfirmation')}</div>
                  <div className="text-sm text-gray-light mt-1">
                    {t('approveText')}
                  </div>
                </div>
              )}

              {action === 'reject' && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <div className="text-xs text-red-500">{t('rejectConfirmation')}</div>
                  <div className="text-sm text-gray-light mt-1">
                    {t('rejectText')}
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
                  {action === 'approve' ? t('confirm') : t('reject')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setSelectedDeposit(null)
                    setNote('')
                  }}
                  className="flex-1 px-4 py-3 bg-blur border border-gray-medium rounded-lg hover:border-silver/30 transition-all"
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
