import type React from "react"
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import AnimatedBackground from "@/components/AnimatedBackground"
import Footer from "@/components/Footer"
import { AuthProvider } from "@/context/AuthContext"
import PhoneVerificationWrapper from "@/components/PhoneVerificationWrapper"
import RootLayoutClient from "@/components/RootLayoutClient"
import ReferralCookieHandler from "@/components/ReferralCookieHandler"
import { LanguageProvider } from "@/context/LanguageContext"

const locales = ['uk', 'ru', 'en'] as const

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })

  return {
    title: t('title'),
    description: t('description'),
    icons: {
      icon: '/image.png',
      apple: '/image.png',
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  // Await params у Next.js 15+
  const { locale } = await params
  
  // Валідація locale
  if (!locales.includes(locale as any)) {
    notFound()
  }

  // Встановлюємо locale для next-intl
  setRequestLocale(locale)

  const messages = await getMessages({ locale })
  
  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <LanguageProvider>
        <AuthProvider>
          <ReferralCookieHandler />
          <RootLayoutClient>
            {children}
          </RootLayoutClient>
        </AuthProvider>
      </LanguageProvider>
    </NextIntlClientProvider>
  )
}
