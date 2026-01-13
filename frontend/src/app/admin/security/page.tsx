"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/lib/api"
import Loading from "@/components/Loading"
import { CheckIcon, XIcon, EditIcon, KeyIcon, DotIcon } from "@/components/icons/AdminIcons"
import LockIcon from "@/components/icons/LockIcon"

interface AuditLog {
  id: string
  source: 'auth' | 'public'
  action: string
  entity_type: string | null
  entity_id: string | null
  meta: any
  ip_address: string | null
  user_agent: string | null
  created_at: string
  actor_user_id: string | null
}

export default function AdminSecurityPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  if (authLoading) return <Loading />
  if (!user) { router.push('/auth/login'); return <Loading /> }
  if (user.role !== 'admin') { router.push('/dashboard'); return <Loading /> }

  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [filters, setFilters] = useState({
    limit: 100,
  })
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [])

  async function fetchLogs() {
    setLoading(true)
    try {
      const result = await api.adminGetAuditLog({ limit: filters.limit })
      if (result.success) {
        setLogs(result.data.logs || [])
      }
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false)
    }
  }

  function getActionColor(action: string) {
    if (action.includes('create') || action.includes('register')) return 'text-green-500'
    if (action.includes('delete') || action.includes('reject')) return 'text-red-500'
    if (action.includes('update') || action.includes('approve')) return 'text-yellow-500'
    if (action.includes('login')) return 'text-blue-500'
    return 'text-gray-light'
  }

  function getActionIcon(action: string) {
    if (action.includes('create') || action.includes('register')) return <CheckIcon />
    if (action.includes('delete')) return <XIcon />
    if (action.includes('update')) return <EditIcon />
    if (action.includes('login')) return <KeyIcon />
    if (action.includes('approve')) return <CheckIcon />
    if (action.includes('reject')) return <XIcon />
    return <DotIcon />
  }

  if (loading) {
    return <Loading fullScreen size="lg" />
  }

  // Client-side фільтрація
  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      log.action?.toLowerCase().includes(search) ||
      log.source?.toLowerCase().includes(search) ||
      log.ip_address?.toLowerCase().includes(search) ||
      log.actor_user_id?.toLowerCase().includes(search)
    )
  })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Безпека та Audit Log</h1>
        <p className="text-gray-light">Auth логи + Admin дії - всього {logs.length} записів</p>
      </div>

      {/* Search */}
      <div className="bg-gray-dark border border-gray-medium rounded-lg p-6 mb-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Пошук</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-gray-medium rounded-lg focus:outline-none focus:border-silver"
              placeholder="Пошук по action, source, IP..."
            />
          </div>
          <button
            onClick={fetchLogs}
            className="px-6 py-2 bg-silver/10 text-silver border border-silver/20 rounded-lg hover:bg-silver/20 transition-colors"
          >
            Оновити
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-gray-dark border border-gray-medium rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-medium/20">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-medium">Час</th>
                <th className="text-left py-4 px-6 text-sm font-medium">Джерело</th>
                <th className="text-left py-4 px-6 text-sm font-medium">Дія</th>
                <th className="text-left py-4 px-6 text-sm font-medium">User</th>
                <th className="text-left py-4 px-6 text-sm font-medium">IP</th>
                <th className="text-left py-4 px-6 text-sm font-medium">Метадані</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-t border-gray-medium/30 hover:bg-gray-medium/10">
                  <td className="py-4 px-6">
                    <div className="text-sm text-gray-light font-mono">
                      {new Date(log.created_at).toLocaleString('uk-UA', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded text-xs ${
                      log.source === 'auth' ? 'bg-blue-500/20 text-blue-500' : 'bg-green-500/20 text-green-500'
                    }`}>
                      {log.source}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className={`flex items-center gap-2 text-sm ${getActionColor(log.action)}`}>
                      <span>{getActionIcon(log.action)}</span>
                      <span className="font-mono text-xs">{log.action}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-xs font-mono text-gray-light truncate max-w-[150px]">
                      {log.actor_user_id?.substring(0, 8) || '—'}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-xs font-mono text-gray-light">
                      {log.ip_address || '—'}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {log.entity_type && (
                      <div>
                        <div className="text-gray-light text-xs">{log.entity_type}</div>
                        {log.entity_id && (
                          <div className="font-mono text-xs truncate max-w-[150px]">
                            {log.entity_id}
                          </div>
                        )}
                      </div>
                    )}
                    {!log.entity_type && <span className="text-gray-light">—</span>}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {log.actor_user_id ? (
                      <div className="font-mono text-xs truncate max-w-[150px]">
                        {log.actor_user_id}
                      </div>
                    ) : (
                      <span className="text-gray-light">System</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm font-mono">
                    {log.ip_address || <span className="text-gray-light">—</span>}
                  </td>
                  <td className="py-3 px-4">
                    {log.meta && Object.keys(log.meta).length > 0 ? (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-silver hover:text-foreground">
                          Показати
                        </summary>
                        <pre className="mt-2 p-2 bg-background border border-gray-medium rounded text-xs overflow-x-auto">
                          {JSON.stringify(log.meta, null, 2)}
                        </pre>
                      </details>
                    ) : (
                      <span className="text-gray-light text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && (
          <div className="p-12 text-center text-gray-light">
            <div className="flex justify-center mb-4">
              <LockIcon className="w-16 h-16 text-silver" />
            </div>
            <p>Логи відсутні або не знайдено за заданими фільтрами</p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-6 bg-background border border-gray-medium rounded-lg p-4">
        <div className="text-sm text-gray-light">
          <div className="font-medium mb-2">Інформація про логування:</div>
          <ul className="space-y-1 text-xs">
            <li>• Всі дії адміністраторів автоматично логуються</li>
            <li>• Логи зберігаються назавжди для аудиту</li>
            <li>• IP адреса та User Agent записуються для безпеки</li>
            <li>• Metadata містить додаткову інформацію про дію</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
