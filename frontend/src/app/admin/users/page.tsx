"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/lib/api"
import Loading from "@/components/Loading"
import { CheckIcon, ClockIcon, MinusIcon } from "@/components/icons/AdminIcons"
import Pagination from "@/components/Pagination"

interface User {
  id: string
  email: string
  email_verified: boolean
  full_name: string | null
  phone: string | null
  phone_verified: boolean
  status: string
  monthly_percentage: number
  max_deposit: number | null
  referral_code: string
  created_at: string
  total_deposits: number
  total_withdrawals: number
  unrealized_profit: number
  realized_profit: number
  current_investments: number
  frozen_funds: number
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { user, initialized } = useAuth()
  
  // ВСІ useState МАЮТЬ БУТИ НА ПОЧАТКУ
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [formData, setFormData] = useState({
    status: 'active',
    monthly_percentage: 5.0,
    max_deposit: null as number | null,
  })
  
  const usersPerPage = 20
  const totalPages = Math.ceil(users.length / usersPerPage)
  const paginatedUsers = users.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage)

  if (!initialized) return <Loading />
  if (!user) return null

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setLoading(true)
    try {
      const result = await api.adminGetUsers()
      if (result.success) {
        setUsers(result.data.users || [])
      }
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editingUser) return

    try {
      const result = await api.adminUpdateUser(editingUser.id, formData)
      if (result.success) {
        alert('Користувача оновлено')
        setShowModal(false)
        setEditingUser(null)
        fetchUsers()
      } else {
        alert('Помилка оновлення')
      }
    } catch (error) {
      alert('Помилка оновлення користувача')
    }
  }

  async function handleDelete() {
    if (!editingUser) return

    const confirmMessage = `УВАГА! Ви збираєтесь видалити користувача ${editingUser.email}.\n\nЦе видалить:\n- Профіль користувача\n- Всі депозити\n- Всі інвестиції\n- Всі виводи\n\nАудит логи будуть збережені.\n\nВведіть "DELETE" для підтвердження:`
    
    const confirmation = prompt(confirmMessage)
    
    if (confirmation !== 'DELETE') {
      return
    }

    try {
      const result = await api.adminDeleteUser(editingUser.id)
      if (result.success) {
        alert('Користувача видалено')
        setShowModal(false)
        setEditingUser(null)
        fetchUsers()
      } else {
        alert('Помилка видалення')
      }
    } catch (error) {
      alert('Помилка видалення користувача')
    }
  }

  function openEditModal(user: User) {
    setEditingUser(user)
    setFormData({
      status: user.status,
      monthly_percentage: user.monthly_percentage,
      max_deposit: user.max_deposit,
    })
    setShowModal(true)
  }

  if (loading) {
    return <Loading fullScreen size="lg" />
  }

  return (
    <div className="p-4 md:p-8 pt-16 md:pt-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Користувачі</h1>
        <p className="text-gray-light">Всього користувачів: <span className="font-sans">{users.length}</span></p>
        {totalPages > 1 && (
          <div className="mt-2 text-sm text-gray-light">
            Сторінка {currentPage} з {totalPages}
          </div>
        )}
      </div>

      {/* User Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedUsers.map((user) => (
          <div key={user.id} className="bg-blur-dark border border-gray-medium rounded-lg p-5 hover:border-silver/30 transition-all">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="font-medium text-silver mb-1">{user.email}</div>
                <div className="text-sm text-gray-light">{user.full_name || 'Немає імені'}</div>
                <div className="text-xs text-gray-light mt-1">{user.phone || 'Немає телефону'}</div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                user.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
              }`}>
                {user.status === 'active' ? 'Активний' : 'Заблокований'}
              </span>
            </div>
            
            {/* Verification Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                user.email_verified ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'
              }`}>
                {user.email_verified ? <CheckIcon /> : <ClockIcon />} Email
              </span>
              <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                user.phone_verified ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-400'
              }`}>
                {user.phone_verified ? <CheckIcon /> : <MinusIcon />} Phone
              </span>
            </div>
            
            {/* Financial Data */}
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-light">Депозити:</span>
                <span className="font-sans font-medium">${user.total_deposits.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-light">Баланс:</span>
                <span className="font-sans font-medium text-silver">${(user.current_investments || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-light">Нереалізований:</span>
                <span className="font-sans font-medium text-yellow-400">+${(user.unrealized_profit || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-light">Реалізований:</span>
                <span className="font-sans font-medium text-green-400">+${(user.realized_profit || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-light">Заморожено:</span>
                <span className="font-sans font-medium text-orange-400">${(user.frozen_funds || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-light">Виводи:</span>
                <span className="font-sans font-medium">${user.total_withdrawals.toFixed(2)}</span>
              </div>
            </div>
            
            {/* Settings */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-medium/30 mb-3">
              <div className="text-xs text-gray-light">Місячний %:</div>
              <div className="font-sans font-medium">{user.monthly_percentage}%</div>
            </div>
            <div className="flex justify-between items-center mb-4">
              <div className="text-xs text-gray-light">Макс. депозит:</div>
              <div className="font-sans font-medium">
                {user.max_deposit ? `$${parseFloat(user.max_deposit.toString()).toFixed(0)}` : '—'}
              </div>
            </div>
            
            {/* Action Button */}
            <button
              onClick={() => openEditModal(user)}
              className="w-full px-4 py-2 bg-silver/10 hover:bg-silver/20 text-silver rounded transition-colors text-sm font-medium"
            >
              Редагувати
            </button>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {showModal && editingUser && (
        <div className="fixed inset-0 bg-blur/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-blur-dark border border-gray-medium rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold mb-6">Редагувати користувача</h2>

            <div className="mb-6 p-4 bg-blur border border-gray-medium rounded-lg">
              <div className="text-sm text-gray-light mb-1">Email:</div>
              <div className="font-medium">{editingUser.email}</div>
              <div className="text-sm text-gray-light mt-2 mb-1">ID:</div>
              <div className="font-mono text-xs">{editingUser.id}</div>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Статус</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 bg-blur border border-gray-medium rounded-lg focus:outline-none focus:border-silver"
                  >
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Місячний % (дефолт 5%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.monthly_percentage}
                    onChange={(e) => setFormData({ ...formData, monthly_percentage: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 bg-blur border border-gray-medium rounded-lg focus:outline-none focus:border-silver font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Максимальний депозит (залиште пустим для глобального ліміту)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.max_deposit || ''}
                  onChange={(e) => setFormData({ ...formData, max_deposit: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="Без обмежень (використати глобальний ліміт)"
                  className="w-full px-4 py-2 bg-blur border border-gray-medium rounded-lg focus:outline-none focus:border-silver font-sans"
                />
                <p className="text-xs text-gray-light mt-1">Індивідуальний ліміт для цього користувача. Якщо не встановлено - використовується глобальний ліміт.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 btn-gradient-primary px-4 py-3 text-foreground font-bold rounded-lg"
                >
                  Зберегти зміни
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingUser(null)
                  }}
                  className="flex-1 px-4 py-3 bg-blur border border-gray-medium rounded-lg hover:border-silver/30 transition-all"
                >
                  Скасувати
                </button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-medium/30">
              <button
                type="button"
                onClick={handleDelete}
                className="w-full px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg hover:bg-red-500/20 hover:border-red-500/50 transition-all font-medium"
              >
                Видалити користувача
              </button>
              <p className="text-xs text-gray-light mt-2 text-center">
                Це видалить всі дані користувача назавжди (крім аудит логів)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
