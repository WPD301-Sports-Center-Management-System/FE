import type { SlotStatus } from '@/shared/types/api'
import { SLOT_STATUS_CONFIG } from '../constants/coach-slot.constants'

export function SlotStatusBadge({ status }: { status: SlotStatus }) {
  const cfg = SLOT_STATUS_CONFIG[status] || SLOT_STATUS_CONFIG.OPEN

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border border-white/5 ${cfg.badgeBg} ${cfg.badgeText}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dotClass}`} />
      <span>{cfg.label}</span>
    </span>
  )
}
