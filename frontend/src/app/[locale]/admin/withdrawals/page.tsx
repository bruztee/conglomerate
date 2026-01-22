"use client"

import { useState } from "react"
import { useRouter } from "@/lib/navigation"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/lib/api"
import { useAdminWithdrawals } from "@/hooks/useAdminWithdrawals"
import Loading from "@/components/Loading"
import { CheckIcon, XIcon } from "@/components/icons/AdminIcons"
import WarningIcon from "@/components/icons/WarningIcon"
import { useTranslations } from 'next-intl'

interface Withdrawal {
  id: string
  amount: number
  destination: any
  status: string
  admin_note: string | null
  network_fee: number
  processed_at: string | null
  created_at: string
  method: string | null
  balance_before_withdrawal: number | null
  balance_after_withdrawal: number | null
  deposit_amount_before: number | null
  deposit_amount_after: number | null
  investment_id: string
  investments: {
    user_id: string
    deposit_id: string
    principal: number
    accrued_interest: number
    locked_amount: number
    profiles: {
      id: string
      email: string
      full_name: string | null
      phone: string | null
    }
  }
}

export default function AdminWithdrawalsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const t = useTranslations('admin.withdrawalsPage')
  
  // SWR hook - instant loading з кешу
  const { withdrawals: allWithdrawals, isLoading: loading, refresh: refreshWithdrawals } = useAdminWithdrawals()
  
  // ВСІ useState МАЮТЬ БУТИ НА ПОЧАТКУ
  const [tab, setTab] = useState<'pending' | 'history'>('pending')
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [action, setAction] = useState<'approve' | 'reject'>('approve')
  const [formData, setFormData] = useState({
    admin_note: '',
  })

  // AdminLayout already checked auth
  
  // Filter withdrawals based on tab
  const withdrawals = tab === 'pending' 
    ? allWithdrawals.filter((w: Withdrawal) => w.status === 'requested')
    : allWithdrawals.filter((w: Withdrawal) => w.status !== 'requested')

  async function handleAction(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedWithdrawal) return

    try {
      let result
      if (action === 'approve') {
        result = await api.adminApproveWithdrawal(selectedWithdrawal.id, {
          admin_note: formData.admin_note,
        })
      } else if (action === 'reject') {
        if (!formData.admin_note.trim()) {
          alert(t('rejectNoteRequired'))
          return
        }
        result = await api.adminRejectWithdrawal(selectedWithdrawal.id, formData.admin_note)
      }

      if (result?.success) {
        alert(action === 'approve' ? t('withdrawalApproved') : t('withdrawalRejected'))
        setShowModal(false)
        setSelectedWithdrawal(null)
        resetForm()
        refreshWithdrawals()
      } else {
        alert('Помилка: ' + (result?.error?.message || 'Unknown error'))
      }
    } catch (error) {
      alert('Помилка обробки виводу')
    }
  }

  function resetForm() {
    setFormData({
      admin_note: '',
    })
  }

  function openModal(withdrawal: Withdrawal, actionType: 'approve' | 'reject') {
    setSelectedWithdrawal(withdrawal)
    setAction(actionType)
    resetForm()
    setShowModal(true)
  }

  if (loading) {
    return <Loading fullScreen size="lg" />
  }

  const pendingCount = withdrawals.filter((w: Withdrawal) => w.status === 'requested').length

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

      {/* Withdrawals List */}
      <div className="space-y-4 overflow-x-hidden">
        {withdrawals.map((withdrawal) => (
          <div
            key={withdrawal.id}
            className={`bg-blur-dark border rounded-lg p-4 md:p-6 ${
              withdrawal.status === 'requested' ? 'border-yellow-500/30' : 'border-gray-medium'
            }`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-4 md:gap-6 text-sm">
              <div className="sm:col-span-2 md:col-span-1">
                <div className="md:hidden text-xs text-gray-light mb-1">{t('user')}</div>
                <div className="font-medium">{withdrawal.investments?.profiles?.full_name || t('noName')}</div>
                <div className="text-xs text-gray-light">{withdrawal.investments?.profiles?.email}</div>
              </div>

              <div>
                <div className="md:hidden text-xs text-gray-light mb-1">{t('withdrawAmount')}</div>
                <div className="text-xl md:text-2xl font-bold text-silver font-sans">${withdrawal.amount.toFixed(2)}</div>
                {withdrawal.network_fee > 0 && (
                  <div className="text-xs text-gray-light mt-1">
                    {t('networkFee')}: <span className="font-sans">${withdrawal.network_fee.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs text-gray-light mb-1">{t('investment')}</div>
                <div className="font-medium font-sans">
                  ${(withdrawal.investments?.principal || 0).toFixed(2)}
                </div>
                {withdrawal.investments?.accrued_interest > 0 && (
                  <div className="text-xs text-green-400 mt-1">
                    +${withdrawal.investments.accrued_interest.toFixed(2)} {t('profit')}
                  </div>
                )}
                {withdrawal.investments?.locked_amount > 0 && (
                  <div className="text-xs text-orange-400 mt-1">
                    ${withdrawal.investments.locked_amount.toFixed(2)} {t('frozen')}
                  </div>
                )}
              </div>

              <div>
                <div className="md:hidden text-xs text-gray-light mb-1">{t('currency')}</div>
                <div className="font-medium font-sans">
                  {withdrawal.destination?.coin || withdrawal.method || 'USDT'}
                </div>
                {withdrawal.destination?.network && (
                  <div className="text-xs text-gray-light mt-1">
                    {withdrawal.destination.network}
                  </div>
                )}
                {withdrawal.destination?.wallet_address && (
                  <div className="text-xs text-gray-light font-mono mt-1 truncate max-w-[200px]">
                    {withdrawal.destination.wallet_address}
                  </div>
                )}
                {withdrawal.destination?.address && (
                  <div className="text-xs text-gray-light font-mono mt-1 truncate max-w-[200px]">
                    {withdrawal.destination.address}
                  </div>
                )}
              </div>

              <div className="sm:col-span-2 md:col-span-1">
                <div className="text-xs text-gray-light mb-1">{t('createdDate')}</div>
                <div className="text-sm">{new Date(withdrawal.created_at).toLocaleString('uk-UA')}</div>
                {withdrawal.processed_at && (
                  <>
                    <div className="text-xs text-gray-light mt-2 mb-1">{t('processedDate')}</div>
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
                  {withdrawal.status === 'requested' ? t('awaitingApproval') :
                   withdrawal.status === 'approved' ? t('approved') :
                   withdrawal.status === 'sent' ? t('sent') :
                   withdrawal.status === 'rejected' ? t('rejected') :
                   withdrawal.status}
                </span>

                {withdrawal.admin_note && (
                  <div className="text-xs text-gray-light">
                    {t('note')}: {withdrawal.admin_note}
                  </div>
                )}
              </div>

              {withdrawal.status === 'requested' && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => openModal(withdrawal, 'approve')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-900/20 border border-green-500/30 text-green-400 rounded hover:bg-green-900/30 transition-all cursor-pointer text-xs sm:text-sm whitespace-nowrap"
                  >
                    <CheckIcon /> {t('approve')}
                  </button>
                  <button
                    onClick={() => openModal(withdrawal, 'reject')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/20 border border-red-500/30 text-red-400 rounded hover:bg-red-900/30 transition-all cursor-pointer text-xs sm:text-sm whitespace-nowrap"
                  >
                    <XIcon /> {t('reject')}
                  </button>
                </div>
              )}

            </div>
          </div>
        ))}

        {withdrawals.length === 0 && (
          <div className="bg-blur-dark border border-gray-medium rounded-lg p-12 text-center">
            <p className="text-gray-light">
              {tab === 'pending' ? t('noPending') : t('noHistory')}
            </p>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-blur/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-blur-dark border border-gray-medium rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold mb-6">
              {action === 'approve' ? t('approveWithdrawal') : t('rejectWithdrawal')}
            </h2>

            <div className="bg-blur border border-gray-medium rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-light">{t('user')}:</div>
                  <div className="font-medium">{selectedWithdrawal.investments?.profiles?.email}</div>
                </div>
                <div>
                  <div className="text-gray-light">{t('amount')}:</div>
                  <div className="font-bold text-silver font-sans">${selectedWithdrawal.amount.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-gray-light">{t('network')}:</div>
                  <div className="font-medium">{selectedWithdrawal.destination?.network || selectedWithdrawal.destination?.coin || 'USDT TRC20'}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-gray-light">{t('withdrawAddress')}:</div>
                  <div className="font-mono text-xs break-all">
                    {selectedWithdrawal.destination?.wallet_address || selectedWithdrawal.destination?.address || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleAction} className="space-y-4">

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('adminNote')} {action === 'reject' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={formData.admin_note}
                  onChange={(e) => setFormData({ ...formData, admin_note: e.target.value })}
                  className="w-full px-4 py-3 bg-blur border border-gray-medium rounded-lg focus:outline-none focus:border-silver resize-none"
                  rows={3}
                  placeholder={action === 'reject' ? t('rejectReason') : t('additionalInfo')}
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

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className={`flex-1 px-4 py-3 font-bold rounded-lg ${
                    action === 'approve' ? 'bg-green-900/20 border border-green-500/30 text-green-400 hover:bg-green-900/30' :
                    action === 'reject' ? 'bg-red-900/20 border border-red-500/30 text-red-400 hover:bg-red-900/30' :
                    'bg-silver/20 border border-silver/30 text-silver hover:bg-silver/30'
                  } transition-all`}
                >
                  {action === 'approve' ? t('approve') : t('reject')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setSelectedWithdrawal(null)
                    resetForm()
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
