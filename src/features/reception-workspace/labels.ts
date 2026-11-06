import { centerDate } from '@/shared/utils/date'
import { addDays, type Tone } from '@/features/workspace/utils'
import type { Payment, Subscription, SupportStatus, TrialStatus } from './api'

export const METHOD_LABEL: Record<Payment['method'], string> = { CASH: 'Tiền mặt', BANK_TRANSFER: 'Chuyển khoản', VNPAY: 'VNPay' }
export const PAYMENT_LABEL: Record<Payment['status'], { label: string; tone: Tone }> = {
  PAID: { label: 'Đã thanh toán', tone: 'success' }, PENDING: { label: 'Chờ thanh toán', tone: 'warning' }, FAILED: { label: 'Thất bại', tone: 'danger' },
  CANCELLED: { label: 'Đã hủy', tone: 'neutral' }, EXPIRED: { label: 'Hết hạn', tone: 'neutral' }, SUPERSEDED: { label: 'Đã thay thế', tone: 'neutral' },
}
export const SUB_LABEL: Record<Subscription['status'], { label: string; tone: Tone }> = {
  ACTIVE: { label: 'Đang hiệu lực', tone: 'success' }, PENDING: { label: 'Chờ thanh toán', tone: 'warning' }, EXPIRED: { label: 'Hết hạn', tone: 'neutral' }, CANCELLED: { label: 'Đã hủy', tone: 'neutral' },
}
export const SUPPORT_LABEL: Record<SupportStatus, { label: string; tone: Tone }> = {
  OPEN: { label: 'Mới', tone: 'warning' }, IN_PROGRESS: { label: 'Đang xử lý', tone: 'info' }, RESOLVED: { label: 'Đã giải quyết', tone: 'success' }, CLOSED: { label: 'Đã đóng', tone: 'neutral' },
}
export const SUPPORT_CATEGORY: Record<string, string> = { GENERAL: 'Chung', COACH: 'Phản ánh Coach', SCHEDULE: 'Lịch tập', PAYMENT: 'Thanh toán' }
export const TRIAL_LABEL: Record<TrialStatus, { label: string; tone: Tone }> = {
  NEW: { label: 'Chờ gọi', tone: 'warning' }, CONTACTED: { label: 'Đã liên hệ', tone: 'info' }, CONVERTED: { label: 'Đã thành hội viên', tone: 'success' }, CLOSED: { label: 'Đã đóng', tone: 'neutral' },
}

export const dmy = (iso?: string | null) => iso ? centerDate(iso).split('-').reverse().join('/') : '—'
export const daysUntil = (iso: string) => Math.round((new Date(`${centerDate(iso)}T00:00:00+07:00`).getTime() - new Date(`${centerDate()}T00:00:00+07:00`).getTime()) / 86_400_000)

export type MemberState = { key: 'active' | 'expiring' | 'expired' | 'pending' | 'none'; label: string; tone: Tone; sub?: Subscription }
/** Gym-ticket state of a member from their subscriptions (latest active one wins). */
export function memberState(subs: Subscription[]): MemberState {
  const today = centerDate()
  const active = subs.filter(s => s.status === 'ACTIVE' && centerDate(s.endDate) >= today).sort((a, b) => b.endDate.localeCompare(a.endDate))[0]
  if (active) return centerDate(active.endDate) <= addDays(today, 7) ? { key: 'expiring', label: 'Sắp hết hạn', tone: 'warning', sub: active } : { key: 'active', label: 'Đang hoạt động', tone: 'success', sub: active }
  const pending = subs.find(s => s.status === 'PENDING')
  if (pending) return { key: 'pending', label: 'Chờ thanh toán', tone: 'info', sub: pending }
  const last = [...subs].sort((a, b) => b.endDate.localeCompare(a.endDate))[0]
  return last ? { key: 'expired', label: 'Hết hạn', tone: 'danger', sub: last } : { key: 'none', label: 'Chưa có vé', tone: 'neutral' }
}
