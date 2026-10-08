import type { ReactNode } from 'react'

export interface StatCardProps {
  title: string
  value: string | number
  change?: string
  isPositive?: boolean
  icon: ReactNode
  description?: string
  accentColor?: 'orange' | 'cyan' | 'emerald' | 'purple'
}

export function StatCard({
  title,
  value,
  change,
  isPositive,
  icon,
  description,
  accentColor = 'orange',
}: StatCardProps) {
  const glowBorder = {
    orange: 'hover:border-orange-500/40 hover:shadow-orange-500/10',
    cyan: 'hover:border-sky-500/40 hover:shadow-sky-500/10',
    emerald: 'hover:border-emerald-500/40 hover:shadow-emerald-500/10',
    purple: 'hover:border-purple-500/40 hover:shadow-purple-500/10',
  }[accentColor]

  const iconBg = {
    orange: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
    cyan: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  }[accentColor]

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 ${glowBorder}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
        <div className={`rounded-xl border p-2.5 ${iconBg}`}>{icon}</div>
      </div>
      <div className="mt-3">
        <h4 className="text-2xl font-bold tracking-tight text-white">{value}</h4>
        {(change || description) && (
          <div className="mt-1 flex items-center gap-2 text-xs">
            {change && (
              <span className={`font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                {change}
              </span>
            )}
            {description && <span className="text-slate-400">{description}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
