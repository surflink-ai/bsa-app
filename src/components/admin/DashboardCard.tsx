'use client'

interface DashboardCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: string
  color?: string
}

export function DashboardCard({ title, value, subtitle, icon, color = '#2BA5A0' }: DashboardCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1"
             style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {title}
          </p>
          <p className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color }}>
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-400 mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {subtitle}
            </p>
          )}
        </div>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
    </div>
  )
}
