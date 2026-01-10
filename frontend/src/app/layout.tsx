import type React from "react"
import type { Metadata } from "next"
import { Orbitron, Space_Grotesk, Playfair_Display } from "next/font/google"
import "./globals.css"
import AnimatedBackground from "@/components/AnimatedBackground"
import Footer from "@/components/Footer"
import { AuthProvider } from "@/context/AuthContext"

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
  title: "Conglomerate Group | Білий трафік — чорні цифри",
  description: "Закрита інвестиційна онлайн-платформа для роботи з криптовалютними активами",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${orbitron.variable} ${spaceGrotesk.variable} ${playfair.variable} antialiased`}>
        <AuthProvider>
          <AnimatedBackground />
          <div className="flex flex-col min-h-screen">
            <div className="flex-1">{children}</div>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
