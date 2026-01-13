"use client"

interface LoadingProps {
  fullScreen?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function Loading({ fullScreen = false, size = 'md' }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14'
  }

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center">
      <div className={`${sizeClasses[size]} relative`}>
        {/* Outer circle */}
        <div className="absolute inset-0 rounded-full border-[3px] border-gray-medium/20"></div>
        
        {/* Spinning gradient ring */}
        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-silver/80 border-r-silver/40 animate-spin"></div>
      </div>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return <LoadingSpinner />
}
