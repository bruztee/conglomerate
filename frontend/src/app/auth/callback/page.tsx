"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Loading from "@/components/Loading"

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function handleCallback() {
      const hash = window.location.hash
      const params = new URLSearchParams(hash.substring(1))
      
      const type = params.get('type')
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      
      if (type === 'signup' && accessToken && refreshToken) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.conglomerate-g.com'
          
          const response = await fetch(`${apiUrl}/auth/verify-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              access_token: accessToken,
              refresh_token: refreshToken
            }),
            credentials: 'include',
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.user && !data.user.full_name) {
              router.push('/auth/set-name')
            } else {
              router.push('/dashboard')
            }
          } else {
            const data = await response.json()
            setError(data.error?.message || 'Verification failed')
            setTimeout(() => router.push('/auth/login'), 3000)
          }
        } catch (err) {
          setError('Network error')
          setTimeout(() => router.push('/auth/login'), 3000)
        }
      } else if (type === 'recovery' && accessToken) {
        // Password reset callback
        router.push(`/auth/reset-password?access_token=${accessToken}`)
      } else {
        // Невідомий callback - на login
        router.push('/auth/login')
      }
    }

    handleCallback()
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="bg-red-900/20 border border-red-500 text-red-400 px-6 py-4 rounded-lg mb-4">
            {error}
          </div>
          <p className="text-gray-light text-sm">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return <Loading fullScreen size="lg" />
}
