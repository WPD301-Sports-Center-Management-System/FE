import { SLOT_STATUS_CONFIG } from '../constants/coach-slot.constants'
import type { SlotStatus } from '@/shared/types/api'

export function ScheduleLegend() {
  const statuses: SlotStatus[] = ['OPEN', 'BOOKED', 'BLOCKED', 'COMPLETED', 'CANCELLED']

  return (
    <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-slate-800/80 bg-slate-900/60 px-4 py-2.5 backdrop-blur-sm text-xs">
      <span className="font-semibold text-slate-400 mr-1 text-[11px] uppercase tracking-wider">
        Chú thích:
      </span>
      {statuses.map((st) => {
        const cfg = SLOT_STATUS_CONFIG[st]
        return (
          <div
            key={st}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${cfg.badgeBg} ${cfg.badgeText}`}
          >
            <span className={`h-2 w-2 rounded-full ${cfg.dotClass}`} />
            <span>{cfg.label}</span>
          </div>
        )
      })}
    </div>
  )
}