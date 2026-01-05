export default function ChartIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="18" stroke="currentColor" strokeWidth="2" rx="2"/>
      <path d="M7 15L10 12L13 14L17 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="7" cy="15" r="1.5" fill="currentColor"/>
      <circle cx="10" cy="12" r="1.5" fill="currentColor"/>
      <circle cx="13" cy="14" r="1.5" fill="currentColor"/>
      <circle cx="17" cy="9" r="1.5" fill="currentColor"/>
    </svg>
  )
}
