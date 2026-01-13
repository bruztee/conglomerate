"use client"

interface LoadingProps {
  fullScreen?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function Loading({ fullScreen = false, size = 'md' }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  }

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-medium border-t-transparent`}></div>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
        {/* Background layers matching site design */}
        <div className="gradient-layer-1 pointer-events-none" />
        <div className="gradient-layer-2 pointer-events-none" />
        <div className="gradient-layer-3 pointer-events-none" />
        <div className="noise-overlay pointer-events-none" />
        
        {/* Spinner on top */}
        <div className="relative z-10">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  return <LoadingSpinner />
}
