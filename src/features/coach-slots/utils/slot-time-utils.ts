import { formatDate } from '@/shared/utils/date'
import { startOfWeek, endOfWeek } from 'date-fns'

export function formatWeekRangeText(dateOrStart: Date, maybeEnd?: Date): string {
  if (maybeEnd) {
    return `${formatDate(dateOrStart.toISOString())} — ${formatDate(maybeEnd.toISOString())}`
  }
  const start = startOfWeek(dateOrStart, { weekStartsOn: 1 })
  const end = endOfWeek(dateOrStart, { weekStartsOn: 1 })
  return `${formatDate(start.toISOString())} — ${formatDate(end.toISOString())}`
}

export function formatDayTitleText(date: Date): string {
  return formatDate(date.toISOString())
}

export function toTimeString(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

export function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
