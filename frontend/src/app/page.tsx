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

export default function Home() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  // Show loading while checking auth
  if (authLoading) {
    return <Loading fullScreen size="lg" />
  }

  // Redirect to dashboard if already logged in
  if (user) {
    router.push('/dashboard')
    return <Loading fullScreen size="lg" />
  }

  return (
    <>
      <Header isAuthenticated={false} />

      <main className="min-h-screen">
        <section className="relative min-h-[90vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-6 flex justify-center">
              <Image
                src="/image.png"
                alt="Conglomerate Group"
                width={600}
                height={200}
                className="object-contain"
                priority
              />
            </div>

            <p className="text-2xl sm:text-3xl text-silver font-medium mb-12 tracking-wide">
              Білий трафік — чорні цифри
            </p>

            <p className="text-lg sm:text-xl text-gray-light mb-12 max-w-2xl mx-auto leading-relaxed">
              Закрита інвестиційна платформа для заробітку на арбітражі трафіку. Інвестуйте в цифрові активи та отримуйте стабільний прибуток від професійної роботи з трафіком.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/auth/register"
                className="btn-gradient-primary px-8 py-4 text-foreground text-lg font-bold rounded-lg transition-all w-full sm:w-auto font-sans"
              >
                Почати інвестувати
              </Link>
              <Link
                href="/auth/login"
                className="btn-gradient-secondary px-8 py-4 text-foreground text-lg font-bold rounded-lg transition-all w-full sm:w-auto font-sans"
              >
                Увійти
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">Про платформу</h2>

            <div className="grid md:grid-cols-2 gap-12 mb-16">
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-silver">Що це за платформа</h3>
                <p className="text-gray-light leading-relaxed">
                  Conglomerate Group — це закрита інвестиційна платформа, що спеціалізується на арбітражі трафіку. 
                  Ми дозволяємо користувачам інвестувати кошти та заробляти на професійній роботі з рекламним трафіком.
                </p>
                <p className="text-gray-light leading-relaxed">
                  Розрахунки здійснюються виключно в криптовалюті — це забезпечує швидкі транзакції, мінімальні комісії, 
                  глобальну доступність та максимальну конфіденційність для наших інвесторів.
                </p>
              </div>

              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-silver">Як працює інвестування</h3>
                <ol className="space-y-4 text-gray-light">
                  <li className="flex gap-3">
                    <span className="text-silver font-bold">1.</span>
                    <span>Реєстрація та верифікація через email та номер телефону</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-silver font-bold">2.</span>
                    <span>Поповнення балансу через криптовалюту</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-silver font-bold">3.</span>
                    <span>Автоматичне нарахування прибутку</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-silver font-bold">4.</span>
                    <span>Вивід коштів через криптовалюту</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">Переваги платформи</h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="p-6 bg-gray-dark/20 rounded-lg border border-gray-medium/30 hover:border-silver/50 hover:bg-gray-dark/30 transition-all">
                <div className="text-silver mb-4">
                  <ChartIcon className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold mb-3">Прозорі цифри</h3>
                <p className="text-gray-light text-sm">
                  Вся статистика та історія операцій у вашому особистому кабінеті
                </p>
              </div>

              <div className="p-6 bg-gray-dark/20 rounded-lg border border-gray-medium/30 hover:border-silver/50 hover:bg-gray-dark/30 transition-all">
                <div className="text-silver mb-4">
                  <UserIcon className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold mb-3">Особистий кабінет</h3>
                <p className="text-gray-light text-sm">Повний контроль над інвестиціями та прибутком</p>
              </div>

              <div className="p-6 bg-gray-dark/20 rounded-lg border border-gray-medium/30 hover:border-silver/50 hover:bg-gray-dark/30 transition-all">
                <div className="text-silver mb-4">
                  <NetworkIcon className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold mb-3">Реферальна система</h3>
                <p className="text-gray-light text-sm">Додатковий дохід від залучення нових користувачів</p>
              </div>

              <div className="p-6 bg-gray-dark/20 rounded-lg border border-gray-medium/30 hover:border-silver/50 hover:bg-gray-dark/30 transition-all">
                <div className="text-silver mb-4">
                  <BoltIcon className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold mb-3">Швидкий вивід</h3>
                <p className="text-gray-light text-sm">Виводьте кошти швидко та безпечно через криптовалюту</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8">Готові почати?</h2>
            <p className="text-xl text-gray-light mb-12">Приєднуйтесь до закритої спільноти інвесторів</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="btn-gradient-primary px-8 py-4 text-foreground text-lg font-bold rounded-lg transition-all font-sans"
              >
                Зареєструватися
              </Link>
              <Link
                href="/dashboard"
                className="btn-gradient-secondary px-8 py-4 text-foreground text-lg font-bold rounded-lg transition-all font-sans"
              >
                Поповнити депозит
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
