"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/lib/api"
import Loading from "@/components/Loading"
import { CheckIcon, ClockIcon, MinusIcon } from "@/components/icons/AdminIcons"

interface User {
  id: string
  email: string
  email_verified: boolean
  full_name: string | null
  phone: string | null
  phone_verified: boolean
  status: string
  monthly_percentage: number
  referral_code: string
  created_at: string
  total_deposits: number
  total_withdrawals: number
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  // ВСІ useState МАЮТЬ БУТИ НА ПОЧАТКУ
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    status: 'active',
    monthly_percentage: 5.0,
  })

  if (authLoading) return <Loading />
  if (!user) { router.push('/auth/login'); return null }
  if (user.role !== 'admin') { router.push('/dashboard'); return null }

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

  function openEditModal(user: User) {
    setEditingUser(user)
    setFormData({
      status: user.status,
      monthly_percentage: user.monthly_percentage,
    })
    setShowModal(true)
  }

  if (loading) {
    return <Loading fullScreen size="lg" />
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Користувачі</h1>
        <p className="text-gray-light">Всього користувачів: <span className="font-sans">{users.length}</span></p>
      </div>

      {/* Users Table */}
      <div className="bg-gray-dark border border-gray-medium rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-medium/20">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-medium">Email</th>
                <th className="text-left py-4 px-6 text-sm font-medium">Ім'я</th>
                <th className="text-left py-4 px-6 text-sm font-medium">Телефон</th>
                <th className="text-left py-4 px-6 text-sm font-medium">Верифікація</th>
                <th className="text-left py-4 px-6 text-sm font-medium">Депозити</th>
                <th className="text-left py-4 px-6 text-sm font-medium">Виводи</th>
                <th className="text-left py-4 px-6 text-sm font-medium">%</th>
                <th className="text-left py-4 px-6 text-sm font-medium">Статус</th>
                <th className="text-left py-4 px-6 text-sm font-medium">Дії</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-gray-medium/30 hover:bg-gray-dark/30">
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-medium">{user.full_name || 'Без імені'}</div>
                      <div className="text-sm text-gray-light">{user.email}</div>
                      <div className="text-xs text-gray-light mt-1">
                        Реєстр: {new Date(user.created_at).toLocaleDateString('uk-UA')}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm">{user.full_name || '—'}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm font-sans">{user.phone || '—'}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex gap-2">
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
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm font-sans font-medium">${user.total_deposits.toFixed(2)}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm font-sans font-medium">${user.total_withdrawals.toFixed(2)}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm font-sans font-medium">{user.monthly_percentage}%</div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.status === 'active' ? 'bg-green-500/20 text-green-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-xs text-gray-light">
                      {new Date(user.created_at).toLocaleDateString('uk-UA')}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => openEditModal(user)}
                      className="text-silver hover:text-foreground transition-colors text-sm cursor-pointer"
                    >
                      Редагувати
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showModal && editingUser && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-dark border border-gray-medium rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold mb-6">Редагувати користувача</h2>

            <div className="mb-6 p-4 bg-background border border-gray-medium rounded-lg">
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
                    className="w-full px-4 py-2 bg-background border border-gray-medium rounded-lg focus:outline-none focus:border-silver"
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
                    className="w-full px-4 py-2 bg-background border border-gray-medium rounded-lg focus:outline-none focus:border-silver font-sans"
                  />
                </div>
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
