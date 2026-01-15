"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import PhoneVerificationPopup from "./PhoneVerificationPopup"

export default function PhoneVerificationWrapper({ children }: { children: React.ReactNode }) {
  const { user, refreshUser, loading } = useAuth()
  const [showPopup, setShowPopup] = useState(false)

  useEffect(() => {
    // ТИМЧАСОВО ВИМКНЕНО: обов'язкова верифікація телефону
    // TODO: Увімкнути після верифікації Twilio
    setShowPopup(false)
    
    /* 
    // Don't show popup while loading to avoid flashing
    if (loading) {
      return
    }

    // Show popup only if user is loaded and phone is not verified
    if (user && user.phone_verified === false) {
      // Small delay to ensure page is rendered first
      const timer = setTimeout(() => {
        setShowPopup(true)
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setShowPopup(false)
    }
    */
  }, [user, loading])

  const handleVerified = async () => {
    await refreshUser()
    setShowPopup(false)
  }

  return (
    <>
      {children}
      {showPopup && <PhoneVerificationPopup onVerified={handleVerified} />}
    </>
  )
}
