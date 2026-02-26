const s = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }

export function WaveIcon({ size = 24 }: { size?: number }) {
  return <svg {...s} width={size} height={size}><path d="M2 12c1.5-2.5 3-3.5 4.5-2s3 1 4.5-1 3-3.5 4.5-2 3 2.5 4.5 0" /><path d="M2 17c1.5-2.5 3-3.5 4.5-2s3 1 4.5-1 3-3.5 4.5-2 3 2.5 4.5 0" opacity={0.4} /></svg>
}
export function TrophyIcon({ size = 24 }: { size?: number }) {
  return <svg {...s} width={size} height={size}><path d="M6 9V4h12v5a6 6 0 01-12 0z" /><path d="M6 5H4a2 2 0 000 4h2" /><path d="M18 5h2a2 2 0 010 4h-2" /><line x1="12" y1="15" x2="12" y2="19" /><path d="M8 21h8" /></svg>
}
export function CalendarIcon({ size = 24 }: { size?: number }) {
  return <svg {...s} width={size} height={size}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
}
export function MapPinIcon({ size = 24 }: { size?: number }) {
  return <svg {...s} width={size} height={size}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" /></svg>
}
export function UsersIcon({ size = 24 }: { size?: number }) {
  return <svg {...s} width={size} height={size}><circle cx="9" cy="7" r="3" /><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" /><circle cx="17" cy="8" r="2.5" /><path d="M21 21v-1.5a3.5 3.5 0 00-2.5-3.36" /></svg>
}
export function CompassIcon({ size = 24 }: { size?: number }) {
  return <svg {...s} width={size} height={size}><circle cx="12" cy="12" r="9" /><polygon points="16,6 14,14 10,18 8,10" fill="none" /></svg>
}
export function ChevronDownIcon({ size = 24 }: { size?: number }) {
  return <svg {...s} width={size} height={size}><polyline points="6 9 12 15 18 9" /></svg>
}
export function ArrowRightIcon({ size = 24 }: { size?: number }) {
  return <svg {...s} width={size} height={size}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
}
export function SearchIcon({ size = 24 }: { size?: number }) {
  return <svg {...s} width={size} height={size}><circle cx="10.5" cy="10.5" r="6.5" /><line x1="15.5" y1="15.5" x2="21" y2="21" /></svg>
}
export function HomeIcon({ size = 24 }: { size?: number }) {
  return <svg {...s} width={size} height={size}><path d="M3 12l9-8 9 8" /><path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" /></svg>
}
export function BarChartIcon({ size = 24 }: { size?: number }) {
  return <svg {...s} width={size} height={size}><line x1="6" y1="20" x2="6" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="18" y1="20" x2="18" y2="14" /></svg>
}
