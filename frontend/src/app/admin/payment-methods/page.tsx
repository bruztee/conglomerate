"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import Loading from "@/components/Loading"

interface PaymentMethod {
  id: string
  currency: string
  network: string
  wallet_address: string
  is_active: boolean
  min_amount: number
  created_at: string
}

export default function PaymentMethodsPage() {
  const [loading, setLoading] = useState(true)
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
  // Підтримувані монети і мережі
  const CURRENCIES = ['USDT', 'BTC', 'ETH', 'USDC', 'TRX', 'BNB']
  const NETWORKS = ['TRC20', 'ERC20', 'BEP20', 'Bitcoin', 'Polygon']
  
  const [formData, setFormData] = useState({
    currency: 'USDT',
    network: 'TRC20',
    wallet_address: '',
    is_active: true,
    min_amount: 0,
  })

  useEffect(() => {
    fetchMethods()
  }, [])

  async function fetchMethods() {
    setLoading(true)
    try {
      const result = await api.adminGetPaymentMethods()
      if (result.success) {
        setMethods(result.data.payment_methods || [])
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      let result
      if (editingMethod) {
        result = await api.adminUpdatePaymentMethod(editingMethod.id, formData)
      } else {
        result = await api.adminCreatePaymentMethod(formData)
      }

      if (result.success) {
        alert(editingMethod ? 'Реквізити оновлено' : 'Реквізити додано')
        setShowModal(false)
        setEditingMethod(null)
        resetForm()
        fetchMethods()
      } else {
        alert('Помилка: ' + (result.error?.message || 'Помилка збереження'))
      }
    } catch (error) {
      alert('Помилка збереження реквізитів')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Видалити цей метод оплати?')) return

    try {
      const result = await api.adminDeletePaymentMethod(id)
      if (result.success) {
        alert('Метод видалено')
        fetchMethods()
      } else {
        alert('Помилка видалення')
      }
    } catch (error) {
      alert('Помилка видалення')
    }
  }

  function resetForm() {
    setFormData({
      currency: 'USDT',
      network: 'TRC20',
      wallet_address: '',
      is_active: true,
      min_amount: 0,
    })
  }

  function openEditModal(method: PaymentMethod) {
    setEditingMethod(method)
    setFormData({
      currency: method.currency,
      network: method.network,
      wallet_address: method.wallet_address,
      is_active: method.is_active,
      min_amount: method.min_amount,
    })
    setShowModal(true)
  }

  if (loading) {
    return <Loading fullScreen size="lg" />
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Реквізити для депозитів</h1>
          <p className="text-gray-light">Управління гаманцями для прийому депозитів</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setEditingMethod(null)
            setShowModal(true)
          }}
          className="btn-gradient-primary px-6 py-3 text-foreground font-bold rounded-lg"
        >
          + Додати гаманець
        </button>
      </div>

      {/* Methods Grid */}
      <div className="grid gap-4">
        {methods.map((method) => (
          <div
            key={method.id}
            className={`bg-gray-dark border rounded-lg p-6 ${method.is_active ? 'border-gray-medium' : 'border-gray-medium/30 opacity-50'}`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-gray-light mb-1">Валюта</div>
                  <div className="font-bold text-silver font-sans">{method.currency}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-light mb-1">Мережа</div>
                  <div className="font-medium font-sans">{method.network}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-xs text-gray-light mb-1">Адреса гаманця</div>
                  <div className="font-mono text-sm break-all">{method.wallet_address}</div>
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => openEditModal(method)}
                  className="px-3 py-1 bg-background border border-gray-medium rounded text-sm hover:border-silver/30 transition-all"
                >
                  Редагувати
                </button>
                <button
                  onClick={() => handleDelete(method.id)}
                  className="px-3 py-1 bg-red-900/20 border border-red-500/30 text-red-400 rounded text-sm hover:bg-red-900/30 transition-all"
                >
                  Видалити
                </button>
              </div>
            </div>

            <div className="flex gap-4 mt-4 pt-4 border-t border-gray-medium/30 text-xs text-gray-light">
              <div>
                Статус: <span className={method.is_active ? 'text-green-500' : 'text-red-500'}>{method.is_active ? 'Активний' : 'Вимкнено'}</span>
              </div>
              <div>
                Мін. сума: <span className="font-sans">${method.min_amount}</span>
              </div>
              <div>
                Створено: {new Date(method.created_at).toLocaleDateString('uk-UA')}
              </div>
            </div>
          </div>
        ))}

        {methods.length === 0 && (
          <div className="bg-gray-dark border border-gray-medium rounded-lg p-12 text-center">
            <div className="text-4xl mb-4">💳</div>
            <p className="text-gray-light mb-4">Немає доданих реквізитів</p>
            <button
              onClick={() => {
                resetForm()
                setShowModal(true)
              }}
              className="btn-gradient-primary px-6 py-3 text-foreground font-bold rounded-lg"
            >
              Додати перший гаманець
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-dark border border-gray-medium rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold mb-6">{editingMethod ? 'Редагувати реквізити' : 'Додати новий гаманець'}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Валюта</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-gray-medium rounded-lg focus:outline-none focus:border-silver"
                    required
                  >
                    {CURRENCIES.map(currency => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Мережа</label>
                  <select
                    value={formData.network}
                    onChange={(e) => setFormData({ ...formData, network: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-gray-medium rounded-lg focus:outline-none focus:border-silver"
                    required
                  >
                    {NETWORKS.map(network => (
                      <option key={network} value={network}>{network}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Адреса гаманця</label>
                <input
                  type="text"
                  value={formData.wallet_address}
                  onChange={(e) => setFormData({ ...formData, wallet_address: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-gray-medium rounded-lg focus:outline-none focus:border-silver font-mono"
                  placeholder="TXyz...abc123"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Мінімальна сума депозиту ($)</label>
                <input
                  type="number"
                  value={formData.min_amount}
                  onChange={(e) => setFormData({ ...formData, min_amount: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-background border border-gray-medium rounded-lg focus:outline-none focus:border-silver font-sans"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="is_active" className="text-sm">Активний (показувати користувачам)</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 btn-gradient-primary px-4 py-3 text-foreground font-bold rounded-lg"
                >
                  {editingMethod ? 'Зберегти зміни' : 'Додати гаманець'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingMethod(null)
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
