import type React from "react"
import type { Metadata } from "next"
import { Orbitron, Space_Grotesk, Playfair_Display } from "next/font/google"
import "./globals.css"

const orbitron = Orbitron({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
})

const spaceGrotesk = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
})

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Білий трафік — чорні цифри",
  description: "Закрита інвестиційна онлайн-платформа для роботи з криптовалютними активами",
  icons: {
    icon: '/image.png',
    apple: '/image.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="uk">
      <body className={`${orbitron.variable} ${spaceGrotesk.variable} ${playfair.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
