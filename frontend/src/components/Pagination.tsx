'use client'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    
    if (totalPages <= 7) {
      // Показуємо всі сторінки якщо їх 7 або менше
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Завжди показуємо першу сторінку
      pages.push(1)
      
      if (currentPage > 3) {
        pages.push('...')
      }
      
      // Показуємо сторінки навколо поточної
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i)
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...')
      }
      
      // Завжди показуємо останню сторінку
      pages.push(totalPages)
    }
    
    return pages
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 bg-blur-dark border border-gray-medium rounded-lg hover:border-silver/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="flex gap-1">
        {getPageNumbers().map((page, index) => (
          typeof page === 'number' ? (
            <button
              key={index}
              onClick={() => onPageChange(page)}
              className={`px-4 py-2 rounded-lg font-sans transition-all ${
                currentPage === page
                  ? 'bg-gradient-to-r from-silver/20 to-silver/10 border border-silver/30 text-white font-bold'
                  : 'bg-blur-dark border border-gray-medium hover:border-silver/30 text-gray-light'
              }`}
            >
              {page}
            </button>
          ) : (
            <span key={index} className="px-3 py-2 text-gray-light">
              {page}
            </span>
          )
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 bg-blur-dark border border-gray-medium rounded-lg hover:border-silver/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
