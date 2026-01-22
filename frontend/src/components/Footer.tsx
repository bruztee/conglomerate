"use client"

import LocaleLink from "@/components/LocaleLink"
import { useLanguage } from "@/context/LanguageContext"
import { useTranslations } from 'next-intl'
import type { Locale } from '@/i18n/request'

export default function Footer() {
  const t = useTranslations('footer')
  const { locale, setLocale } = useLanguage()

  const languages: { code: Locale; name: string }[] = [
    { code: 'uk', name: 'УКР' },
    { code: 'ru', name: 'РУС' },
    { code: 'en', name: 'ENG' },
  ]

  return (
    <footer className="relative w-full border-t border-gray-dark/30 backdrop-blur-md">
      <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-background/40 to-transparent pointer-events-none"></div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-light text-sm font-sans">
            {t('copyright')}
          </div>
          <div className="flex items-center gap-6">
            <LocaleLink href="/rules" className="text-gray-light hover:text-foreground transition-colors text-sm font-sans">
              {t('terms')}
            </LocaleLink>
            <div className="flex gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLocale(lang.code)}
                  className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                    locale === lang.code
                      ? 'bg-silver text-background'
                      : 'text-gray-light hover:text-foreground'
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
