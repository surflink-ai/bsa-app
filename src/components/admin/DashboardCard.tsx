'use client'

interface DashboardCardProps {
  title: string
  value: string | number
  subtitle?: string
}

export function DashboardCard({ title, value, subtitle }: DashboardCardProps) {
  return (
    <div className="py-4">
      <p
        className="text-[32px] font-semibold text-[#0A2540] leading-none"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {value}
      </p>
      <p
        className="text-[10px] uppercase tracking-[0.15em] text-[#0A2540]/30 mt-2"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {title}
      </p>
      {subtitle && (
        <p className="text-[11px] text-[#0A2540]/25 mt-0.5">{subtitle}</p>
      )}
    </div>
  )
}
