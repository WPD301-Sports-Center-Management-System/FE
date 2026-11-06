import { centerDate, centerInstant, CENTER_TIME_ZONE } from '@/shared/utils/date'
import type { Session } from '@/features/fixed-pt/types'

// All business dates use the center timezone (UTC+7) regardless of the device.
export const DAY_MS = 86_400_000
export const WEEKDAY_NAMES = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
export const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

/** Center-local weekday (0 = Sunday) of a YYYY-MM-DD day. */
export const weekdayOf = (day: string) => new Date(`${day}T12:00:00+07:00`).getUTCDay()
export const addDays = (day: string, n: number) => centerDate(new Date(centerInstant(day, '12:00').getTime() + n * DAY_MS))
/** Monday of the week containing `day`. */
export const mondayOf = (day: string) => addDays(day, -((weekdayOf(day) + 6) % 7))
export const dayStart = (day: string) => `${day}T00:00:00+07:00`
export const dayEnd = (day: string) => `${day}T23:59:59.999+07:00`
export const shortDate = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`
export const longDate = (day: string) => `${WEEKDAY_NAMES[weekdayOf(day)]}, ${day.slice(8, 10)}/${day.slice(5, 7)}/${day.slice(0, 4)}`

/** ISO week number of a center-local day. */
export function isoWeek(day: string) {
  const d = new Date(`${day}T00:00:00Z`)
  const n = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - n + 3)
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4))
  return 1 + Math.round(((d.getTime() - firstThursday.getTime()) / DAY_MS - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7)
}

export const hhmm = (iso?: string | null) => iso ? new Intl.DateTimeFormat('vi-VN', { timeZone: CENTER_TIME_ZONE, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso)) : '—'
export const minutesBetween = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60_000)

/** "hôm nay 11:00", "ngày mai 06:00", "T5 19:00" or "12/11 09:00". */
export function relativeSlot(iso: string, today = centerDate()) {
  const day = centerDate(iso)
  if (day === today) return `hôm nay ${hhmm(iso)}`
  if (day === addDays(today, 1)) return `ngày mai ${hhmm(iso)}`
  const diff = Math.round((centerInstant(day).getTime() - centerInstant(today).getTime()) / DAY_MS)
  if (diff > 1 && diff < 7) return `${WEEKDAY_SHORT[weekdayOf(day)]} ${hhmm(iso)}`
  return `${shortDate(day)} ${hhmm(iso)}`
}

export function relativeAgo(iso: string, today = centerDate()) {
  const day = centerDate(iso)
  if (day === today) return 'hôm nay'
  if (day === addDays(today, -1)) return 'hôm qua'
  return shortDate(day)
}

export const SESSION_LABEL: Record<string, string> = {
  CONFIRMED: 'Sắp tới', ARRIVED: 'Đã đến', IN_PROGRESS: 'Đang diễn ra', COMPLETED: 'Đã hoàn thành', CANCELLED_EARLY: 'HV hủy sớm', CANCELLED_LATE: 'HV hủy muộn',
  COACH_CANCELLED: 'Coach hủy', NO_SHOW: 'Vắng', RESCHEDULED: 'Đã đổi lịch',
}
export type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'violet'
export const SESSION_TONE: Record<string, Tone> = {
  CONFIRMED: 'neutral', ARRIVED: 'info', IN_PROGRESS: 'primary', COMPLETED: 'success', CANCELLED_EARLY: 'neutral', CANCELLED_LATE: 'danger', COACH_CANCELLED: 'neutral', NO_SHOW: 'danger', RESCHEDULED: 'neutral',
}
export const isLive = (s: Pick<Session, 'status'>) => s.status === 'IN_PROGRESS'
export const isUpcoming = (s: Pick<Session, 'status'>) => s.status === 'CONFIRMED' || s.status === 'ARRIVED'
export const isDone = (s: Pick<Session, 'status'>) => s.status === 'COMPLETED'
export const isAbsent = (s: Pick<Session, 'status'>) => s.status === 'NO_SHOW' || s.status === 'CANCELLED_LATE'
/** Sessions that still occupy the Coach's time (not cancelled or moved). */
export const isScheduled = (s: Pick<Session, 'status'>) => !['CANCELLED_EARLY', 'COACH_CANCELLED', 'RESCHEDULED'].includes(s.status)

export const PURCHASE_LABEL: Record<string, string> = { ACTIVE: 'Đang dạy', COMPLETED: 'Đã hoàn thành', EXPIRED: 'Hết hạn', PENDING_PAYMENT: 'Chờ thanh toán', PAUSED: 'Tạm ngưng', CANCELLED: 'Đã hủy', REFUNDED: 'Đã hoàn tiền', SUSPENDED: 'Tạm dừng' }
export const CHANGE_TYPE: Record<string, string> = { RESCHEDULE: 'Đổi giờ', MAKEUP: 'Học bù', SCHEDULE_AVAILABLE: 'Xếp buổi còn trống' }
export const CHANGE_LABEL: Record<string, string> = { REQUESTED: 'Chờ xử lý', PROPOSED: 'Chờ HV đồng ý', ACCEPTED: 'Đã duyệt', DECLINED: 'Đã từ chối', WITHDRAWN: 'Đã rút', EXPIRED: 'Hết hạn' }
export const CHANGE_TONE: Record<string, Tone> = { REQUESTED: 'warning', PROPOSED: 'info', ACCEPTED: 'success', DECLINED: 'danger', WITHDRAWN: 'neutral', EXPIRED: 'neutral' }

export const num = (v: unknown) => { if (v === null || v === undefined || typeof v === 'string' && !v.trim()) return null; const n = Number(v); return Number.isFinite(n) ? n : null }
export const fmtNumber = (v: number, digits = 0) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(v)
export const fmtMoney = (v: unknown) => `${fmtNumber(Number(v ?? 0))} ₫`
export const fmtMillions = (v: number) => `${fmtNumber(v / 1_000_000, 1)} tr`
export const signed = (v: number, digits = 1, unit = '') => `${v > 0 ? '+' : v < 0 ? '−' : '±'}${fmtNumber(Math.abs(v), digits)}${unit}`

/** Downloads rows as a UTF-8 CSV that Excel opens with Vietnamese characters intact. */
export function downloadCsv(filename: string, header: string[], rows: (string | number | null | undefined)[][]) {
  const cell = (v: unknown) => { const s = v === null || v === undefined ? '' : String(v); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
  const csv = '﻿' + [header, ...rows].map(r => r.map(cell).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Why an earning line is held (CoachEarningLine.holdReason), in plain Vietnamese. */
export const HOLD_REASON: Record<string, string> = {
  DISPUTE: 'Đang có tranh chấp chờ Manager kết luận',
  LEGACY_PAYOUT_PENDING_DECISION: 'Khoản chi theo cách tính cũ đang chờ Manager quyết định',
}
export const holdReasonLabel = (code?: string | null) => code ? HOLD_REASON[code] ?? 'Đang tạm giữ chờ Manager xử lý' : ''
