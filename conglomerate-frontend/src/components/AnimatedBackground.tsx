'use client'

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="gradient-layer-1"></div>
      <div className="gradient-layer-2"></div>
      <div className="gradient-layer-3"></div>
      <div className="gradient-layer-4"></div>
      <div className="noise-overlay"></div>
    </div>
  )
}
