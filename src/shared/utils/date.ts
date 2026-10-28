// Centralized Date/Time utilities. Business dates/times are always shown in the center's timezone
// (Asia/Bangkok, UTC+7) regardless of the device timezone.
export const CENTER_TIME_ZONE = 'Asia/Bangkok'
// Implements the critical 4-hour PT cancellation cutoff rule

export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '-'
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return '-'
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: CENTER_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  } catch {
    return '-'
  }
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '-'
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return '-'
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: CENTER_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d)
  } catch {
    return '-'
  }
}

export function formatTime(isoString?: string | null): string {
  if (!isoString) return '-'
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return '-'
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: CENTER_TIME_ZONE,
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  } catch {
    return '-'
  }
}

export function getHoursUntil(targetIso: string): number {
  const now = Date.now()
  const target = new Date(targetIso).getTime()
  return (target - now) / (1000 * 60 * 60)
}

/**
 * 4-Hour Cancellation Cutoff Rule:
 * Returns true if appointment is >= 4 hours away (Eligible for credit refund / makeup).
 * Returns false if < 4 hours (Late cancellation, credit consumed).
 */
export function isBeforeCutoff(startsAtIso: string, cutoffHours = 4): boolean {
  return getHoursUntil(startsAtIso) >= cutoffHours
}

export function toIsoUtcString(date: Date): string {
  return date.toISOString()
}

// YYYY-MM-DD of an instant in the center timezone.
export function centerDate(value: Date | string = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: CENTER_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value))
}
// Instant of a center-local date and time (HH:MM).
export function centerInstant(day: string, time = '00:00'): Date {
  return new Date(`${day}T${time}:00+07:00`)
}
export function formatWeekdayDateTime(isoString?: string | null): string {
  if (!isoString) return '-'
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return '-'
  return new Intl.DateTimeFormat('vi-VN', { timeZone: CENTER_TIME_ZONE, weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d)
}
