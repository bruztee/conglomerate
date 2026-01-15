"use client"

import Link from "next/link"
import Image from "next/image"

export default function NotFound() {
  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-dark/30 backdrop-blur-md">
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-transparent pointer-events-none"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex h-16 items-center justify-center">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Image src="/image.png" alt="Conglomerate Group" width={180} height={60} className="object-contain" />
            </Link>
          </div>
        </div>
      </header>

      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4">404</h1>
          <p className="text-xl text-gray-light mb-8">Сторінка не знайдена</p>
          <Link 
            href="/"
            className="btn-gradient-primary px-6 py-3 text-foreground font-bold rounded-lg transition-all inline-block"
          >
            На головну
          </Link>
        </div>
      </main>
    </>
  )
}
