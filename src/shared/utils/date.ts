// Centralized Date/Time utilities ensuring consistent local timezone handling
// Implements the critical 4-hour PT cancellation cutoff rule

export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '-'
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return '-'
    return new Intl.DateTimeFormat('vi-VN', {
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
