"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import Header from "@/components/Header"
import ChartIcon from "@/components/icons/ChartIcon"
import UserIcon from "@/components/icons/UserIcon"
import NetworkIcon from "@/components/icons/NetworkIcon"
import BoltIcon from "@/components/icons/BoltIcon"
import { useAuth } from "@/context/AuthContext"
import Loading from "@/components/Loading"
import { useTranslations } from 'next-intl'

export default function Home() {
  const t = useTranslations('home')
  const router = useRouter()
  const { user } = useAuth()

  // Redirect if already logged in (in useEffect to avoid render issues)
  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  // Don't show content if redirecting
  if (user) {
    return <Loading fullScreen size="lg" />
  }

  return (
    <>
      <Header isAuthenticated={false} />

      <main className="min-h-screen">
        <section className="relative min-h-[90vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-3 flex justify-center">
              <Image
                src="/image.png"
                alt="Conglomerate Group"
                width={600}
                height={200}
                className="object-contain"
                priority
              />
            </div>

            <p className="text-2xl sm:text-3xl text-silver font-medium mb-8 tracking-wide">
              {t('tagline')}
            </p>

            <p className="text-lg sm:text-xl text-gray-light mb-10 max-w-2xl mx-auto leading-relaxed">
              {t('description')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/auth/register"
                className="btn-gradient-primary px-8 py-4 text-foreground text-lg font-bold rounded-lg transition-all w-full sm:w-auto font-sans"
              >
                {t('startInvesting')}
              </Link>
              <Link
                href="/auth/login"
                className="btn-gradient-secondary px-8 py-4 text-foreground text-lg font-bold rounded-lg transition-all w-full sm:w-auto font-sans"
              >
                {t('login')}
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">{t('aboutPlatform')}</h2>

            <div className="grid md:grid-cols-2 gap-12 mb-16">
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-silver">{t('whatIsPlatform')}</h3>
                <p className="text-gray-light leading-relaxed">
                  {t('whatIsPlatformText1')}
                </p>
                <p className="text-gray-light leading-relaxed">
                  {t('whatIsPlatformText2')}
                </p>
              </div>

              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-silver">{t('howItWorks')}</h3>
                <ol className="space-y-4 text-gray-light">
                  <li className="flex gap-3">
                    <span className="text-silver font-bold">1.</span>
                    <span>{t('howItWorksStep1')}</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-silver font-bold">2.</span>
                    <span>{t('howItWorksStep2')}</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-silver font-bold">3.</span>
                    <span>{t('howItWorksStep3')}</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-silver font-bold">4.</span>
                    <span>{t('howItWorksStep4')}</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">{t('advantages')}</h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="p-6 bg-gray-dark/20 rounded-lg border border-gray-medium/30 hover:border-silver/50 hover:bg-gray-dark/30 transition-all">
                <div className="text-silver mb-4">
                  <ChartIcon className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold mb-3">{t('advantage1Title')}</h3>
                <p className="text-gray-light text-sm">
                  {t('advantage1Text')}
                </p>
              </div>

              <div className="p-6 bg-gray-dark/20 rounded-lg border border-gray-medium/30 hover:border-silver/50 hover:bg-gray-dark/30 transition-all">
                <div className="text-silver mb-4">
                  <UserIcon className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold mb-3">{t('advantage2Title')}</h3>
                <p className="text-gray-light text-sm">{t('advantage2Text')}</p>
              </div>

              <div className="p-6 bg-gray-dark/20 rounded-lg border border-gray-medium/30 hover:border-silver/50 hover:bg-gray-dark/30 transition-all">
                <div className="text-silver mb-4">
                  <NetworkIcon className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold mb-3">{t('advantage3Title')}</h3>
                <p className="text-gray-light text-sm">{t('advantage3Text')}</p>
              </div>

              <div className="p-6 bg-gray-dark/20 rounded-lg border border-gray-medium/30 hover:border-silver/50 hover:bg-gray-dark/30 transition-all">
                <div className="text-silver mb-4">
                  <BoltIcon className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold mb-3">{t('advantage4Title')}</h3>
                <p className="text-gray-light text-sm">{t('advantage4Text')}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8">{t('readyToStart')}</h2>
            <p className="text-xl text-gray-light mb-12">{t('joinCommunity')}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="btn-gradient-primary px-8 py-4 text-foreground text-lg font-bold rounded-lg transition-all font-sans"
              >
                {t('registerNow')}
              </Link>
              <Link
                href="/dashboard"
                className="btn-gradient-secondary px-8 py-4 text-foreground text-lg font-bold rounded-lg transition-all font-sans"
              >
                {t('makeDeposit')}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
