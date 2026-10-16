import { useMemo } from 'react'
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
} from 'date-fns'
import {
  BookOpen,
  Clock,
  User,
  MapPin,
  Lock,
  Plus,
} from 'lucide-react'
import { STANDARD_TEMPLATE_SLOTS, type TemplateSlotConfig, SLOT_STATUS_CONFIG } from '../constants/coach-slot.constants'
import type { CalendarEvent } from '../types/coach-slot-types'
import type { CoachSlot } from '@/shared/types/api'

export interface SelectedTimeRange {
  dateStr: string
  slotIndex?: number
  startTime: string
  endTime: string
}

interface CoachScheduleCalendarProps {
  events: CalendarEvent[]
  rawSlots?: CoachSlot[]
  date: Date
  view: string
  onNavigate: (newDate: Date) => void
  onView: (newView: any) => void
  onEventClick: (slotId: string, event: CalendarEvent | any) => void
  onTimeSelect?: (selection: SelectedTimeRange) => void
  isLoading?: boolean
}

export function CoachScheduleCalendar({
  events,
  rawSlots = [],
  date,
  view,
  onEventClick,
  onTimeSelect,
  isLoading = false,
}: CoachScheduleCalendarProps) {
  // Tính danh sách các ngày hiển thị
  const days = useMemo(() => {
    if (view === 'day') {
      const dayNames = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
      const dayName = dayNames[date.getDay()]
      return [
        {
          date,
          dateStr: format(date, 'yyyy-MM-dd'),
          dayName,
          dayNumber: format(date, 'dd'),
          formatted: `${dayName} (${format(date, 'dd/MM')})`,
          isToday: isSameDay(date, new Date()),
        },
      ]
    }

    // Weekly Matrix: Thứ 2 -> Chủ Nhật
    const monday = startOfWeek(date, { weekStartsOn: 1 })
    const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN']

    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(monday, i)
      const name = dayNames[i] || ''
      return {
        date: d,
        dateStr: format(d, 'yyyy-MM-dd'),
        dayName: name,
        dayNumber: format(d, 'dd'),
        formatted: `${name} (${format(d, 'dd/MM')})`,
        isToday: isSameDay(d, new Date()),
      }
    })
  }, [date, view])

  // Helper tìm các event khớp với ngày và slot
  const findEventsForCell = (dateStr: string, slot: TemplateSlotConfig): CalendarEvent[] => {
    return events.filter((ev) => {
      const evDate = format(ev.start, 'yyyy-MM-dd')
      if (evDate !== dateStr) return false

      const evStartStr = format(ev.start, 'HH:mm')
      if (evStartStr === slot.startTime) return true

      // Mapping fallback nếu thời gian rơi vào khoảng slot
      const [sH, sM] = slot.startTime.split(':').map(Number)
      const [eH, eM] = slot.endTime.split(':').map(Number)
      const [evH, evM] = evStartStr.split(':').map(Number)

      const slotStartMin = (sH ?? 0) * 60 + (sM ?? 0)
      const slotEndMin = (eH ?? 0) * 60 + (eM ?? 0)
      const evStartMin = (evH ?? 0) * 60 + (evM ?? 0)

      return evStartMin >= slotStartMin - 15 && evStartMin < slotEndMin
    })
  }

  return (
    <div className="relative rounded-2xl border border-border-subtle bg-bg-surface shadow-md backdrop-blur-md overflow-hidden min-w-0 w-full">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-bg-app/60 backdrop-blur-xs">
          <div className="flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-surface px-4 py-2.5 shadow-lg">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
            <span className="text-xs font-medium text-text-primary">Đang đồng bộ dữ liệu thời khóa biểu...</span>
          </div>
        </div>
      )}

      {/* Table Matrix Container with horizontal scroll */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full table-fixed min-w-[900px] border-collapse text-left select-none">
          {/* Column definitions for proportional scaling */}
          <colgroup>
            <col className={view === 'day' ? 'w-20' : 'w-14 sm:w-16'} />
            {days.map((d) => (
              <col key={d.dateStr} className="w-auto" />
            ))}
          </colgroup>

          {/* Table Header */}
          <thead>
            <tr className="border-b border-border-subtle bg-bg-surface-muted divide-x divide-border-subtle text-center">
              <th className="w-14 sm:w-16 py-3 px-1 text-xs font-bold text-text-primary uppercase tracking-wider sticky left-0 z-20 bg-bg-surface-muted text-center shadow-xs">
                Slot
              </th>
              {days.map((d) => (
                <th
                  key={d.dateStr}
                  className={`py-3 px-2 text-xs font-bold transition-colors ${
                    d.isToday
                      ? 'bg-orange-500/10 text-orange-400 font-extrabold ring-inset ring-1 ring-orange-500/30'
                      : 'text-text-primary'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 truncate">
                    <span>{d.formatted}</span>
                    {d.isToday && (
                      <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse shrink-0" title="Hôm nay" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body - 7 Standard Template Slots */}
          <tbody className="divide-y divide-border-subtle">
            {STANDARD_TEMPLATE_SLOTS.map((slot) => (
              <tr key={slot.index} className="divide-x divide-border-subtle hover:bg-bg-surface-muted/40 transition-colors">
                {/* Slot Number Column */}
                <td className="w-14 sm:w-16 p-2 text-center align-middle sticky left-0 z-10 bg-bg-surface shadow-xs">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-base font-bold text-text-primary font-mono">
                      {slot.index}
                    </span>
                    <span className="text-[9px] text-text-muted font-mono leading-none mt-0.5">
                      {slot.startTime}
                    </span>
                  </div>
                </td>

                {/* Day Cells */}
                {days.map((d) => {
                  const cellEvents = findEventsForCell(d.dateStr, slot)
                  const [year, month, day] = d.dateStr.split('-').map(Number)
                  const [sH, sM] = slot.startTime.split(':').map(Number)
                  const slotStartDateTime = new Date(year, month - 1, day, sH, sM, 0, 0)
                  const isPast = slotStartDateTime <= new Date()

                  // Tìm slot OPEN đã mở trên hệ thống (chưa có khách đặt) khớp với ca này
                  const existingOpenSlot = rawSlots.find((s) => {
                    if (s.status !== 'OPEN') return false
                    const sDate = s.startsAt.split('T')[0]
                    if (sDate !== d.dateStr) return false
                    const sTime = s.startsAt.substring(11, 16)
                    return sTime === slot.startTime
                  })

                  return (
                    <td
                      key={`${d.dateStr}-${slot.index}`}
                      className={`p-1.5 align-top transition-colors relative min-h-[90px] ${
                        d.isToday ? 'bg-orange-500/5' : isPast ? 'bg-bg-surface-muted/40' : ''
                      }`}
                    >
                      {cellEvents.length > 0 ? (
                        <div className="space-y-1.5">
                          {cellEvents.map((ev) => {
                            const status = ev.status || 'OPEN'
                            const cfg = SLOT_STATUS_CONFIG[status] || SLOT_STATUS_CONFIG.OPEN
                            const isBooked = status === 'BOOKED'
                            const isBlocked = status === 'BLOCKED'

                            return (
                              <div
                                key={ev.id}
                                onClick={() => onEventClick(ev.id, ev)}
                                className={`group/card cursor-pointer rounded-xl p-2 transition-all shadow-xs hover:shadow-md border min-w-0 overflow-hidden ${
                                  isPast ? 'opacity-70 saturate-50 hover:opacity-100 hover:saturate-100 ' : ''
                                }${
                                  status === 'OPEN'
                                    ? 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/20'
                                    : status === 'BOOKED'
                                    ? 'bg-sky-500/10 border-sky-500/30 hover:border-sky-500/60 hover:bg-sky-500/20'
                                    : status === 'BLOCKED'
                                    ? 'bg-bg-surface-muted border-border-subtle hover:border-border-strong'
                                    : status === 'COMPLETED'
                                    ? 'bg-teal-500/10 border-teal-500/30 hover:border-teal-500/60'
                                    : 'bg-rose-500/10 border-rose-500/30 hover:border-rose-500/60'
                                }`}
                              >
                                {/* Top: Course Name & Status Tag */}
                                <div className="flex items-center justify-between gap-1 mb-1 min-w-0">
                                  <div className="flex items-center gap-1 min-w-0 flex-1">
                                    <BookOpen className={`h-3 w-3 shrink-0 ${cfg.textClass}`} />
                                    <span
                                      className="text-[11px] font-bold text-text-primary truncate leading-tight"
                                      title={ev.courseName || 'PT 1:1 Cá Nhân'}
                                    >
                                      {ev.courseName || 'PT 1:1 Cá Nhân'}
                                    </span>
                                  </div>
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 uppercase tracking-wider ${cfg.badgeBg} ${cfg.badgeText}`}
                                  >
                                    {isPast && status === 'OPEN' ? 'Hết hạn' : cfg.shortLabel}
                                  </span>
                                </div>

                                {/* Time range */}
                                <div className="flex items-center gap-1 text-[10.5px] font-mono text-text-muted font-medium mb-1 min-w-0">
                                  <Clock className="h-3 w-3 text-text-muted shrink-0" />
                                  <span className="truncate">
                                    {format(ev.start, 'HH:mm')} – {format(ev.end, 'HH:mm')}
                                  </span>
                                </div>

                                {/* Bottom info: Location & Member/Note */}
                                <div className="space-y-0.5 text-[10.5px] text-text-muted min-w-0">
                                  {isBooked ? (
                                    <div
                                      className="flex items-center gap-1 font-semibold text-sky-600 dark:text-sky-300 min-w-0"
                                      title={ev.memberName || 'Hội viên đã đặt'}
                                    >
                                      <User className="h-3 w-3 shrink-0 text-sky-500" />
                                      <span className="truncate">{ev.memberName || 'Hội viên đã đặt'}</span>
                                    </div>
                                  ) : isBlocked ? (
                                    <div
                                      className="flex items-center gap-1 text-text-muted min-w-0"
                                      title={ev.note || 'Khóa bận'}
                                    >
                                      <Lock className="h-3 w-3 shrink-0 text-amber-500" />
                                      <span className="truncate">{ev.note || 'Khóa bận'}</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 text-text-muted text-[10px] min-w-0">
                                      <MapPin className="h-3 w-3 shrink-0 text-text-muted" />
                                      <span className="truncate">Khu vực PT 1:1</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : isPast ? (
                        /* Past Empty Cell - LOCKED / DISABLED */
                        <div
                          className="h-full w-full min-h-[60px] rounded-xl flex flex-col items-center justify-center text-text-muted/40 bg-bg-surface-muted/30 cursor-not-allowed select-none opacity-40"
                          title="Đã qua thời gian (Quá khứ - Không thể mở slot)"
                        >
                          <span className="text-text-muted/40 text-sm font-bold">-</span>
                        </div>
                      ) : existingOpenSlot ? (
                        /* Slot đã mở sẵn sàng trên hệ thống, đang chờ học viên đặt lịch */
                        <div
                          onClick={() => onEventClick(existingOpenSlot.id, existingOpenSlot as any)}
                          className="h-full w-full min-h-[60px] rounded-xl flex items-center justify-center text-text-muted font-semibold cursor-pointer hover:bg-emerald-500/10 hover:border hover:border-emerald-500/30 transition-all group/open-slot"
                          title={`Ca ${slot.index} (${slot.startTime} - ${slot.endTime}) đang mở nhận lịch (Chờ học viên đặt). Click để xem chi tiết / chặn ca.`}
                        >
                          <span className="group-hover/open-slot:hidden text-text-muted/60 text-sm font-medium">
                            -
                          </span>
                          <span className="hidden group-hover/open-slot:inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-lg border border-emerald-500/20 shadow-xs animate-in fade-in duration-150">
                            <Clock className="h-3 w-3 text-emerald-500" />
                            Chờ hội viên đặt
                          </span>
                        </div>
                      ) : (
                        /* Future Empty Cell - Clickable to Open Slot */
                        <div
                          onClick={() => {
                            if (onTimeSelect) {
                              onTimeSelect({
                                dateStr: d.dateStr,
                                slotIndex: slot.index,
                                startTime: slot.startTime,
                                endTime: slot.endTime,
                              })
                            }
                          }}
                          className="h-full w-full min-h-[60px] rounded-xl flex items-center justify-center text-text-muted font-semibold cursor-pointer hover:bg-bg-surface-muted hover:text-orange-400 transition-all group/empty"
                          title={`Click để mở Ca ${slot.index} (${slot.startTime} - ${slot.endTime}) ngày ${d.formatted}`}
                        >
                          <span className="group-hover/empty:hidden text-text-muted/60 text-sm font-medium">
                            -
                          </span>
                          <span className="hidden group-hover/empty:inline-flex items-center gap-1 text-[10px] font-semibold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded-lg border border-orange-500/20 shadow-xs animate-in fade-in duration-150">
                            <Plus className="h-3 w-3" />
                            Mở ca
                          </span>
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
