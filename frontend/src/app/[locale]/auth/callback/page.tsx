"use client"

import { useEffect } from "react"
import Loading from "@/components/Loading"

export default function AuthCallbackPage() {
  useEffect(() => {
    async function handleCallback() {
      const hash = window.location.hash
      const params = new URLSearchParams(hash.substring(1))
      
      const type = params.get('type')
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      
      if (!accessToken || !refreshToken) {
        window.location.href = '/auth/login'
        return
      }
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.conglomerate-g.com'
      
      const response = await fetch(`${apiUrl}/auth/set-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          access_token: accessToken,
          refresh_token: refreshToken,
          type: type
        }),
        credentials: 'include',
      })
      
      if (!response.ok) {
        window.location.href = '/auth/login'
        return
      }
      
      const data = await response.json()
      
      if (type === 'signup') {
        if (data.user && !data.user.full_name) {
          window.location.href = '/auth/set-name'
        } else {
          window.location.href = '/dashboard'
        }
      } else if (type === 'recovery') {
        window.location.href = '/auth/reset-password'
      } else {
        window.location.href = '/dashboard'
      }
    }

    handleCallback()
  }, [])

  return <Loading fullScreen size="lg" />
}
