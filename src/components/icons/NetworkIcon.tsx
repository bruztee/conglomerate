export default function NetworkIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
      <circle cx="5" cy="5" r="2" stroke="currentColor" strokeWidth="2"/>
      <circle cx="19" cy="5" r="2" stroke="currentColor" strokeWidth="2"/>
      <circle cx="5" cy="19" r="2" stroke="currentColor" strokeWidth="2"/>
      <circle cx="19" cy="19" r="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M9.5 10.5L6.5 7M14.5 10.5L17.5 7M9.5 13.5L6.5 17M14.5 13.5L17.5 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}
