"use client"

interface LoadingProps {
  fullScreen?: boolean
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

export default function Loading({ fullScreen = false, size = 'md', text }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14'
  }

  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className={`${sizeClasses[size]} relative`}>
        {/* Outer circle */}
        <div className="absolute inset-0 rounded-full border-[3px] border-gray-medium/20"></div>
        
        {/* Spinning gradient ring */}
        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-silver/80 border-r-silver/40 animate-spin"></div>
      </div>
      
      {text && (
        <p className="text-sm text-gray-light/80 font-normal tracking-wide">
          {text}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    )
  }

  return <LoadingSpinner />
}
