import Link from "next/link"

export default function Footer() {
  return (
    <footer className="relative w-full border-t border-gray-dark/30 backdrop-blur-md">
      <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-background/40 to-transparent pointer-events-none"></div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-light text-sm font-sans">
            © 2026. Всі права захищені.
          </div>
          <div className="flex gap-6">
            <Link href="/rules" className="text-gray-light hover:text-foreground transition-colors text-sm font-sans">
              Правила та умови
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
