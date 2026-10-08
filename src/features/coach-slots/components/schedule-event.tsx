import type { EventProps } from 'react-big-calendar'
import { format } from 'date-fns'
import { Lock, User, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { SLOT_STATUS_CONFIG } from '../constants/coach-slot.constants'
import type { CalendarEvent } from '../types/coach-slot-types'

export function ScheduleEvent({ event }: EventProps<CalendarEvent>) {
  const status = event.status || 'OPEN'
  const config = SLOT_STATUS_CONFIG[status] || SLOT_STATUS_CONFIG.OPEN

  const timeText = `${format(event.start, 'HH:mm')} – ${format(event.end, 'HH:mm')}`

  const renderIcon = () => {
    switch (status) {
      case 'OPEN':
        return <span className={`h-2 w-2 rounded-full ${config.dotClass} shrink-0 animate-pulse`} />
      case 'BOOKED':
        return <User className="h-3.5 w-3.5 text-sky-300 shrink-0" />
      case 'BLOCKED':
        return <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
      case 'COMPLETED':
        return <CheckCircle2 className="h-3.5 w-3.5 text-teal-300 shrink-0" />
      case 'CANCELLED':
        return <XCircle className="h-3.5 w-3.5 text-rose-300 shrink-0" />
      default:
        return <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
    }
  }

  const primaryTitle = () => {
    if (status === 'BOOKED' && event.memberName) {
      return event.memberName
    }
    if (status === 'BLOCKED') {
      return event.note || 'Khóa bận'
    }
    if (status === 'OPEN') {
      return 'Khung giờ trống'
    }
    return event.title || config.shortLabel
  }

  const courseOrNote = () => {
    if (status === 'BOOKED') {
      return event.courseName || 'PT 1:1'
    }
    if (status === 'OPEN' && event.courseName) {
      return event.courseName
    }
    return null
  }

  return (
    <div
      className="h-full w-full flex flex-col justify-between overflow-hidden select-none p-1.5"
      title={`${primaryTitle()} • ${timeText} ${courseOrNote() ? '• ' + courseOrNote() : ''}`}
    >
      {/* Top row: Icon + Title + Status Tag */}
      <div className="flex items-center justify-between gap-1.5 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          {renderIcon()}
          <span className="text-xs font-bold truncate leading-tight tracking-tight text-white">
            {primaryTitle()}
          </span>
        </div>
        <span
          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0 uppercase tracking-wider ${config.badgeBg} ${config.badgeText}`}
        >
          {config.shortLabel}
        </span>
      </div>

      {/* Bottom row: Time + Course */}
      <div className="flex items-center justify-between gap-2 text-[11px] mt-0.5 min-w-0">
        <div className="flex items-center gap-1 font-mono text-slate-200 font-medium shrink-0">
          <Clock className="h-3 w-3 text-slate-400 shrink-0" />
          <span>{timeText}</span>
        </div>

        {courseOrNote() && (
          <span className="text-[10px] text-slate-300 truncate text-right font-medium">
            {courseOrNote()}
          </span>
        )}
      </div>
    </div>
  )
}
