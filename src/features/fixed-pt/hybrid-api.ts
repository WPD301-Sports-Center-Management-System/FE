import { apiClient } from '@/shared/api/client'
import type { TimeItem } from './types'
const AVAILABILITY_REASONS: Record<string, string> = {
  INVALID_DURATION: 'Thời lượng chưa đúng với gói', IN_PAST: 'Giờ này đã qua',
  OUTSIDE_WINDOW: 'Ngoài thời gian được phép đặt trước', PACKAGE_EXPIRED: 'Gói đã hết hạn',
  ACTIVATION_DEADLINE: 'Đã quá hạn đặt buổi đầu; liên hệ hỗ trợ',
  OUTSIDE_WORKING_HOURS: 'Ngoài giờ làm việc của Coach', COACH_TIME_OFF: 'Coach nghỉ trong khoảng này',
  COACH_CONFLICT: 'Coach đã có lịch hoặc đang được giữ chỗ', MEMBER_CONFLICT: 'Học viên đã có lịch trùng giờ',
  BATCH_CONFLICT: 'Các buổi đang chọn trùng nhau hoặc thiếu thời gian nghỉ giữa buổi',
}
export const availabilityReason = (reason: string | null) => reason ? AVAILABILITY_REASONS[reason] ?? reason : 'Chưa khả dụng'
export const hybridGet = async <T>(url: string, params?: object) =>
  ((await apiClient.get(url, { params })) as unknown as { data: T }).data
export const hybridSend = async <T>(method: 'post' | 'put' | 'patch', url: string, body: object) =>
  ((await apiClient[method](url, body)) as unknown as { data: T }).data
export interface WorkingInterval {
  weekday: number
  startTime: string
  endTime: string
}
export interface WorkingRule extends WorkingInterval {
  id: string
  effectiveFrom: string
  effectiveTo: string | null
}
export interface CoachCalendar {
  timezone: string
  rules: WorkingRule[]
  sessions: {
    id: string
    plannedStartsAt: string
    plannedEndsAt: string
    status: string
    member: { user: { fullName: string } }
  }[]
  holds: ({ id: string; hold: { expiresAt: string } } & TimeItem)[]
  exceptions: ({ id: string; type: 'OPEN' | 'CLOSED'; reason: string | null } & TimeItem)[]
  timeOffs: ({ id: string; reason: string | null } & TimeItem)[]
}
export interface SlotPreview {
  items: (TimeItem & { available: boolean; reason: string | null })[]
  policy: {
    holdMinutes: number
    bookingWindowDays: number
    activationDeadlineDays: number
    cancelCutoffHours: number
  }
  durationMinutes: number
  bufferMinutes: number
}
export const hybridApi = {
  calendar: (from: string, to: string) =>
    hybridGet<CoachCalendar>('/coaches/me/calendar', { from, to }),
  rules: () => hybridGet<{ rules: WorkingRule[] }>('/coaches/me/availability-rules'),
  saveRules: (effectiveFrom: string, intervals: WorkingInterval[]) =>
    hybridSend<{ affectedCount: number }>('put', '/coaches/me/availability-rules', {
      effectiveFrom,
      intervals,
    }),
  previewRules: (effectiveFrom: string, intervals: WorkingInterval[]) =>
    hybridSend<{ affectedCount: number }>('post', '/coaches/me/availability-rules/preview', {
      effectiveFrom,
      intervals,
    }),
  exception: (body: TimeItem & { type: 'OPEN' | 'CLOSED'; reason: string }) =>
    hybridSend<{ affectedCount: number }>('post', '/coaches/me/availability-exceptions', body),
  deleteException: async (id: string) => { await apiClient.delete(`/coaches/me/availability-exceptions/${id}`) },
  settings: (coachId: string) =>
    hybridGet<{ acceptingNewMembers: boolean; bufferMinutes: number }>(
      `/coaches/${coachId}/service-settings`,
    ),
  setSettings: (coachId: string, body: object) =>
    hybridSend('patch', `/coaches/${coachId}/service-settings`, body),
}
