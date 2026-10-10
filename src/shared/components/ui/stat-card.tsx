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
    orange: 'bg-orange-500/15 text-orange-500 dark:text-orange-400 border-orange-500/20',
    cyan: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20',
    emerald: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    purple: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20',
  }[accentColor]

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-border-subtle bg-bg-surface p-5 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 ${glowBorder}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">{title}</p>
        <div className={`rounded-xl border p-2.5 ${iconBg}`}>{icon}</div>
      </div>
      <div className="mt-3">
        <h4 className="text-2xl font-bold tracking-tight text-text-primary">{value}</h4>
        {(change || description) && (
          <div className="mt-1 flex items-center gap-2 text-xs">
            {change && (
              <span className={`font-semibold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-danger'}`}>
                {change}
              </span>
            )}
            {description && <span className="text-text-muted">{description}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
