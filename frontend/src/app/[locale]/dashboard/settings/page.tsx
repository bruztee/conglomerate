"use client"

import { useState, useEffect } from "react"
import { useRouter } from "@/lib/navigation"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/lib/api"
import CheckCircleIcon from "@/components/icons/CheckCircleIcon"
import WarningIcon from "@/components/icons/WarningIcon"
import Header from "@/components/Header"
import Loading from "@/components/Loading"
import PhoneVerificationPopup from "@/components/PhoneVerificationPopup"
import { useTranslations } from 'next-intl'

export default function SettingsPage() {
  const t = useTranslations('settings')
  const router = useRouter()
  const { user } = useAuth()
  
  // ВСІ useState МАЮТЬ БУТИ НА ПОЧАТКУ
  const [activeTab, setActiveTab] = useState<'email' | 'phone' | 'password'>('email')
  const [emailForm, setEmailForm] = useState({ email: '' })
  const [phoneForm, setPhoneForm] = useState({ phone: '' })
  const [passwordCooldown, setPasswordCooldown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [userProfile, setUserProfile] = useState<any>(null)
  const [showPhoneVerification, setShowPhoneVerification] = useState(false)

  // Middleware already checked auth

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (!emailForm.email) {
      setError(t('emailRequired'))
      setLoading(false)
      return
    }

    const result = await api.updateEmail(emailForm.email)

    if (result.success) {
      setMessage(t('checkNewEmail'))
      setEmailForm({ email: '' })
    } else {
      setError(result.error?.message || t('emailUpdateError'))
    }

    setLoading(false)
  }

  const handleUpdatePhone = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    
    // Відкрити popup для phone verification
    setShowPhoneVerification(true)
  }

  const handlePhoneVerified = async () => {
    setShowPhoneVerification(false)
    setMessage(t('phoneVerified'))
    
    // Перезавантажити дані профілю
    const profileResult = await api.me()
    if (profileResult.success && profileResult.data) {
      setUserProfile(profileResult.data)
    }
  }

  const handleSendPasswordReset = async () => {
    if (passwordCooldown > 0) return
    
    setLoading(true)
    setError('')
    setMessage('')

    if (!user?.email) {
      setError(t('emailNotFound'))
      setLoading(false)
      return
    }

    const result = await api.forgotPassword(user.email)

    if (result.success) {
      setMessage(t('passwordLinkSent'))
      
      // Встановити cooldown 60 секунд
      setPasswordCooldown(60)
      localStorage.setItem('password_reset_cooldown', (Date.now() + 60000).toString())
      
      const interval = setInterval(() => {
        setPasswordCooldown(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            localStorage.removeItem('password_reset_cooldown')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      setError(result.error?.message || t('linkSendError'))
    }

    setLoading(false)
  }

  useEffect(() => {
    // Redirect if not authenticated
    if (!user) {
      router.push('/auth/login')
      return
    }

    // Перевірити cooldown при завантаженні
    const cooldownEnd = localStorage.getItem('password_reset_cooldown')
    if (cooldownEnd) {
      const remaining = Math.max(0, Math.floor((parseInt(cooldownEnd) - Date.now()) / 1000))
      if (remaining > 0) {
        setPasswordCooldown(remaining)
        const interval = setInterval(() => {
          setPasswordCooldown(prev => {
            if (prev <= 1) {
              clearInterval(interval)
              localStorage.removeItem('password_reset_cooldown')
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        localStorage.removeItem('password_reset_cooldown')
      }
    }

    // Використовуємо user з AuthContext замість зайвого api.me()
    setUserProfile(user)
    setPageLoading(false)
  }, [user, router])

  if (!user) {
    return null
  }

  if (pageLoading) {
    return <Loading fullScreen size="lg" />
  }

  return (
    <>
      <Header isAuthenticated={true} />
      
      <main className="min-h-screen px-4 py-12">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>

          {/* Current user info */}
          <div className="bg-blur-dark border border-gray-medium rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">{t('currentInfo')}</h2>
            <div className="space-y-2 text-gray-light">
              <p><strong>{t('name')}</strong> {userProfile?.full_name || user.full_name || t('notSpecified')}</p>
              <p><strong>{t('email')}</strong> {userProfile?.email || user.email}</p>
              <p className="flex items-center gap-2"><strong>{t('phone')}</strong> {userProfile?.phone || user.phone || t('notSpecified')} {userProfile?.phone && (userProfile?.phone_verified ? <CheckCircleIcon className="w-4 h-4 text-green-400" /> : <span className="flex items-center gap-1 text-yellow-500"><WarningIcon className="w-4 h-4" /> {t('notVerified')}</span>)}</p>
              <p><strong>{t('yourPlan')}</strong> {userProfile?.plan || t('standard')}</p>
              <p><strong>{t('monthlyPercentage')}</strong> {userProfile?.monthly_percentage || '0'}%</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-gray-medium overflow-x-auto">
            <button
              onClick={() => setActiveTab('email')}
              className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'email'
                  ? 'text-silver border-b-2 border-silver'
                  : 'text-gray-light hover:text-foreground'
              }`}
            >
              {t('changeEmail')}
            </button>
            <button
              onClick={() => setActiveTab('phone')}
              className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'phone'
                  ? 'text-silver border-b-2 border-silver'
                  : 'text-gray-light hover:text-foreground'
              }`}
            >
              {t('changePhone')}
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
                activeTab === 'password'
                  ? 'text-silver border-b-2 border-silver'
                  : 'text-gray-light hover:text-foreground'
              }`}
            >
              {t('changePassword')}
            </button>
          </div>

          {/* Messages */}
          {message && (
            <div className="bg-green-900/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg text-sm mb-6">
              {message}
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          {/* Email Tab */}
          {activeTab === 'email' && (
            <div className="bg-blur-dark border border-gray-medium rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">{t('changeEmail')}</h2>
              <form onSubmit={handleUpdateEmail} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    {t('newEmail')}
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={emailForm.email}
                    onChange={(e) => setEmailForm({ email: e.target.value })}
                    className="w-full px-4 py-3 bg-blur border border-gray-medium rounded-lg focus:outline-none focus:border-silver transition-colors"
                    placeholder={t('newEmailPlaceholder')}
                    disabled={loading}
                  />
                  <p className="text-sm text-gray-light mt-2">
                    {t('emailChangeNote')}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gradient-primary px-6 py-3 text-foreground font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t('updating') : t('updateEmail')}
                </button>
              </form>
            </div>
          )}

          {/* Phone Tab */}
          {activeTab === 'phone' && (
            <div className="bg-blur-dark border border-gray-medium rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">{t('changePhone')}</h2>
              
              {userProfile?.phone && (
                <div className="mb-6 p-4 bg-blur/50 rounded-lg border border-gray-medium">
                  <p className="text-sm text-gray-light mb-1">{t('currentPhone')}</p>
                  <p className="flex items-center gap-2 text-lg font-medium">{userProfile.phone} {userProfile.phone_verified ? <span className="flex items-center gap-1 text-green-400"><CheckCircleIcon className="w-5 h-5" /> {t('verified')}</span> : <span className="flex items-center gap-1 text-yellow-500"><WarningIcon className="w-5 h-5" /> {t('notVerified')}</span>}</p>
                </div>
              )}
              
              <form onSubmit={handleUpdatePhone} className="space-y-6">
                <div>
                  <p className="text-sm text-gray-light mb-4">
                    {t('phoneChangeNote', { action: userProfile?.phone ? t('phoneChangeAction') : t('phoneAddAction') })}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gradient-primary px-6 py-3 text-foreground font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t('updating') : t('updatePhone')}
                </button>
              </form>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="bg-blur-dark border border-gray-medium rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">{t('changePassword')}</h2>
              <p className="text-gray-light mb-6">
                {t('passwordChangeNote')}
              </p>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSendPasswordReset}
                  disabled={loading || passwordCooldown > 0}
                  className="btn-gradient-primary px-6 py-3 text-foreground font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t('sending') : t('sendLink')}
                </button>
                
                {passwordCooldown > 0 && (
                  <div className="flex items-center gap-2 text-gray-light">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">
                      {t('nextLinkIn', { seconds: passwordCooldown })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Phone Verification Popup */}
      {showPhoneVerification && (
        <PhoneVerificationPopup 
          onVerified={handlePhoneVerified}
          onClose={() => setShowPhoneVerification(false)}
        />
      )}
    </>
  )
}
