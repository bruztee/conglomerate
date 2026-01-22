"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentProps } from 'react'

export default function LocaleLink({ href, ...props }: ComponentProps<typeof Link>) {
  const pathname = usePathname()
  
  // Витягуємо поточний locale з URL
  const getCurrentLocale = () => {
    const segments = pathname.split('/')
    const locale = segments[1]
    return ['uk', 'ru', 'en'].includes(locale) ? locale : 'uk'
  }
  
  // Додаємо locale до шляху
  const addLocale = (path: string | object) => {
    // Якщо це об'єкт (pathname + query) - обробляємо окремо
    if (typeof path === 'object') {
      return path
    }
    
    const locale = getCurrentLocale()
    
    // Якщо шлях вже має locale - повертаємо як є
    if (path.startsWith(`/${locale}/`) || path === `/${locale}`) {
      return path
    }
    
    // Якщо шлях починається з / - додаємо locale
    if (path.startsWith('/')) {
      return `/${locale}${path}`
    }
    
    // Інакше додаємо / та locale
    return `/${locale}/${path}`
  }
  
  return <Link {...props} href={addLocale(href)} />
}
