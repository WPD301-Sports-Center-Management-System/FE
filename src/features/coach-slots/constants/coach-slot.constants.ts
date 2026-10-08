import type { SlotStatus } from '@/shared/types/api'

export const GYM_HOURS_START = '07:00:00'
export const GYM_HOURS_END = '22:00:00'
export const SCHEDULE_SLOT_DURATION = '00:30:00' // 30 minutes grid interval

export const coachSlotKeys = {
  all: ['coach-slots'] as const,
  lists: () => [...coachSlotKeys.all, 'list'] as const,
  list: (params: { coachId?: string; from?: string; to?: string }) =>
    [...coachSlotKeys.lists(), params] as const,
  details: () => [...coachSlotKeys.all, 'detail'] as const,
  detail: (id: string) => [...coachSlotKeys.details(), id] as const,
}

export const SLOT_STATUS_CONFIG: Record<
  SlotStatus,
  {
    label: string
    shortLabel: string
    cardClass: string
    textClass: string
    badgeBg: string
    badgeText: string
    dotClass: string
  }
> = {
  OPEN: {
    label: 'Khung giờ trống',
    shortLabel: 'Trống',
    cardClass:
      'bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 border-l-4 border-l-emerald-400 text-emerald-100',
    textClass: 'text-emerald-300',
    badgeBg: 'bg-emerald-950/80 border border-emerald-500/40',
    badgeText: 'text-emerald-300',
    dotClass: 'bg-emerald-400',
  },
  BOOKED: {
    label: 'Đã đặt lịch tập',
    shortLabel: 'Đã đặt',
    cardClass:
      'bg-sky-950/40 hover:bg-sky-900/50 border border-sky-500/30 border-l-4 border-l-sky-400 text-sky-100',
    textClass: 'text-sky-300',
    badgeBg: 'bg-sky-950/80 border border-sky-500/40',
    badgeText: 'text-sky-300',
    dotClass: 'bg-sky-400',
  },
  BLOCKED: {
    label: 'Đã khóa bận',
    shortLabel: 'Đã khóa',
    cardClass:
      'bg-slate-900/80 hover:bg-slate-850 border border-slate-700/50 border-l-4 border-l-slate-400 text-slate-200',
    textClass: 'text-slate-300',
    badgeBg: 'bg-slate-800/80 border border-slate-600/40',
    badgeText: 'text-slate-300',
    dotClass: 'bg-slate-400',
  },
  CANCELLED: {
    label: 'Đã hủy',
    shortLabel: 'Đã hủy',
    cardClass:
      'bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 border-l-4 border-l-rose-400 text-rose-100',
    textClass: 'text-rose-300',
    badgeBg: 'bg-rose-950/80 border border-rose-500/40',
    badgeText: 'text-rose-300',
    dotClass: 'bg-rose-400',
  },
  COMPLETED: {
    label: 'Đã hoàn thành',
    shortLabel: 'Hoàn thành',
    cardClass:
      'bg-teal-950/40 hover:bg-teal-900/50 border border-teal-500/30 border-l-4 border-l-teal-400 text-teal-100',
    textClass: 'text-teal-300',
    badgeBg: 'bg-teal-950/80 border border-teal-500/40',
    badgeText: 'text-teal-300',
    dotClass: 'bg-teal-400',
  },
}

export interface TemplateSlotConfig {
  index: number
  name: string
  period: 'MORNING' | 'NOON' | 'AFTERNOON' | 'PEAK_1' | 'PEAK_2' | 'LATE_NIGHT'
  periodLabel: string
  startTime: string
  endTime: string
  bufferTime: string
  colorBadge: string
}

export const STANDARD_TEMPLATE_SLOTS: TemplateSlotConfig[] = [
  {
    index: 1,
    name: 'Slot 1 (Ca Sáng sớm)',
    period: 'MORNING',
    periodLabel: 'Sáng sớm',
    startTime: '06:00',
    endTime: '07:00',
    bufferTime: '07:00 – 07:15',
    colorBadge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  {
    index: 2,
    name: 'Slot 2 (Ca Sáng)',
    period: 'MORNING',
    periodLabel: 'Sáng',
    startTime: '07:15',
    endTime: '08:15',
    bufferTime: '08:15 – 08:30',
    colorBadge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  {
    index: 3,
    name: 'Slot 3 (Ca Trưa)',
    period: 'NOON',
    periodLabel: 'Trưa',
    startTime: '11:30',
    endTime: '12:30',
    bufferTime: '12:30 – 12:45',
    colorBadge: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  },
  {
    index: 4,
    name: 'Slot 4 (Ca Chiều)',
    period: 'AFTERNOON',
    periodLabel: 'Chiều',
    startTime: '16:45',
    endTime: '17:45',
    bufferTime: '17:45 – 18:00',
    colorBadge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  },
  {
    index: 5,
    name: 'Slot 5 (Cao điểm 1)',
    period: 'PEAK_1',
    periodLabel: 'Cao điểm',
    startTime: '18:00',
    endTime: '19:00',
    bufferTime: '19:00 – 19:15',
    colorBadge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  },
  {
    index: 6,
    name: 'Slot 6 (Cao điểm 2)',
    period: 'PEAK_2',
    periodLabel: 'Cao điểm',
    startTime: '19:15',
    endTime: '20:15',
    bufferTime: '20:15 – 20:30',
    colorBadge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  },
  {
    index: 7,
    name: 'Slot 7 (Ca Tối muộn)',
    period: 'LATE_NIGHT',
    periodLabel: 'Tối muộn',
    startTime: '20:30',
    endTime: '21:30',
    bufferTime: '21:30 – Đóng cửa',
    colorBadge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  },
]

