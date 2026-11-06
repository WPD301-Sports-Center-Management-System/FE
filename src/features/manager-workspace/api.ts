import { apiClient } from '@/shared/api/client'
import type { Adjustment, Disruption, EarningLine, EarningSummary, PayoutPeriod, PolicyRow, ReconciliationCase, Session } from '@/features/fixed-pt/types'
import type { PtPurchase, Subscription, Visit } from '@/features/reception-workspace/api'

// Manager API. Every call maps to a BE route the MANAGER role may use (BE/src/contract/endpoints.json).
// The axios interceptor unwraps the HTTP body to { success, data, meta }.
type Meta = { total: number; page: number; limit: number }
type Body<T> = { data: T; meta?: Meta }
const raw = async <T>(url: string, params?: object) => (await apiClient.get(url, { params })) as unknown as Body<T>
const get = async <T>(url: string, params?: object) => (await raw<T>(url, params)).data
const post = async <T>(url: string, body: object = {}) => ((await apiClient.post(url, body)) as unknown as Body<T>).data
const patch = async <T>(url: string, body: object = {}) => ((await apiClient.patch(url, body)) as unknown as Body<T>).data
const total = async (url: string, params: object = {}) => (await raw<unknown[]>(url, { ...params, limit: 1 })).meta?.total ?? 0
/** Reads every page of a list endpoint (100 per page, at most `maxPages`). */
async function all<T>(url: string, params: object = {}, maxPages = 10): Promise<T[]> {
  const out: T[] = []
  for (let p = 1; p <= maxPages; p++) {
    const b = await raw<T[]>(url, { ...params, page: p, limit: 100 })
    out.push(...(b.data ?? []))
    if (out.length >= (b.meta?.total ?? out.length) || (b.data ?? []).length < 100) break
  }
  return out
}

export interface Revenue {
  totalReceived: number; appliedToOrders: number; pendingReconciliation: number; membershipRevenue: number; ptGross: number; ptGymShare: number; coachBudget: number
  coachPendingConfirmation: number; coachEligibleUnpaid: number; coachOnHold: number; coachPaidOut: number; advanceRemaining: number; recoveryOutstanding: number; paymentCount: number
}
export interface ManagerDashboard { members: number; coaches: number; revenue: Revenue; bookingsToday: number; sessionsNeedingReview: number; openReconciliation: number; equipmentIssues: number }
export interface Offering { id: string; coachId: string; courseId: string; status: 'PENDING' | 'APPROVED' | 'REJECTED'; isActive: boolean; experienceNote?: string | null; rejectionReason?: string | null; approvedAt?: string | null; createdAt: string; updatedAt: string; coach: { user: { fullName: string } }; course: { id: string; name: string; difficultyLevel?: string | null } }
export interface PackageOption { id: string; coachId?: string | null; courseId: string; name: string; sessionCount: number; sessionsPerWeek?: number; validityDays: number; price: string; approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED'; isActive: boolean; rejectionReason?: string | null; createdAt: string; updatedAt: string; course?: { name: string }; coach?: { user: { fullName: string } } | null }
export interface CoachReview { id: string; coachId: string; rating: number; comment?: string | null; moderationStatus: 'VISIBLE' | 'HIDDEN'; createdAt: string }
export interface SupportLite { id: string; status: string; createdAt: string }

export const mgrApi = {
  dashboard: () => get<ManagerDashboard>('/dashboard/manager'),
  revenue: (from: string, to: string) => get<Revenue>('/reports/revenue', { from, to }),
  exportReport: async (reportType: string, format: 'csv' | 'xlsx', from?: string, to?: string) => (await apiClient.get('/reports/export', { params: { reportType, format, from, to }, responseType: 'blob' })) as unknown as Blob,
  memberTotal: () => total('/members'),
  subscriptions: (params: { status?: Subscription['status'] } = {}, maxPages = 10) => all<Subscription>('/subscriptions', params, maxPages),
  purchases: (params: { status?: string; coachId?: string } = {}, maxPages = 10) => all<PtPurchase>('/pt-package-purchases', params, maxPages),
  visits: (maxPages = 10) => all<Visit>('/check-ins', {}, maxPages),
  memberName: async (id: string) => { const m = await get<{ memberCode: string; user: { fullName: string; phone?: string | null } }>(`/members/${id}`); return { id, name: m.user.fullName, code: m.memberCode, phone: m.user.phone } },

  sessions: (params: { from?: string; to?: string; coachId?: string; status?: string; needsReview?: 'true' }, maxPages = 5) => all<Session>('/pt-bookings', params, maxPages),
  resolveReview: (id: string, reason: string) => post(`/pt-bookings/${id}/resolve-review`, { reason }),
  completeSession: (id: string, note: string) => post(`/pt-bookings/${id}/complete`, { note }),
  gymCancel: (id: string, reason: string) => post(`/pt-bookings/${id}/coach-cancel`, { reason }),
  reverseOutcome: (id: string, reason: string) => post(`/pt-bookings/${id}/reverse-outcome`, { reason }),

  offerings: (status?: Offering['status']) => all<Offering>('/coach-course-offerings', { status }, 5),
  approveOffering: (id: string) => patch(`/coach-course-offerings/${id}/approve`),
  rejectOffering: (id: string, rejectionReason: string) => patch(`/coach-course-offerings/${id}/reject`, { rejectionReason }),
  options: (approvalStatus?: PackageOption['approvalStatus']) => all<PackageOption>('/pt-package-options', { approvalStatus }, 5),
  approveOption: (id: string) => patch(`/pt-package-options/${id}/approve`),
  rejectOption: (id: string, rejectionReason: string) => patch(`/pt-package-options/${id}/reject`, { rejectionReason }),
  setOptionActive: (id: string, isActive: boolean) => patch(`/pt-package-options/${id}/status`, { isActive }),
  createOption: (body: { courseId: string; name: string; sessionCount: number; sessionsPerWeek: number; validityDays: number; price: number; durationMinutes?: 60 | 90 | 120; description?: string }) => post<PackageOption>('/pt-package-options', body),
  courses: () => get<{ id: string; name: string; isActive?: boolean }[]>('/training-courses', { limit: 100 }),

  earningSummary: () => get<EarningSummary>('/coach-earnings/summary'),
  earnings: (params: { status?: string } = {}, maxPages = 10) => all<EarningLine>('/coach-earnings', params, maxPages),
  confirmEarning: (id: string, note?: string) => post(`/coach-earnings/${id}/confirm`, { note }),
  rejectEarning: (id: string, reason: string) => post(`/coach-earnings/${id}/reject`, { reason }),
  periods: () => all<PayoutPeriod>('/coach-payout-periods', {}, 2),
  adjustments: () => all<Adjustment>('/coach-adjustments', {}, 2),

  policies: () => get<PolicyRow[]>('/policy-settings'),
  disruptions: () => all<Disruption>('/service-disruptions', {}, 2),
  reconciliation: () => all<ReconciliationCase>('/reconciliation-cases', {}, 2),
  reviews: () => all<CoachReview>('/coach-reviews', {}, 5),
  auditTotal: (from: string) => total('/audit-logs', { from }),
  support: () => all<SupportLite>('/support-requests', {}, 3),
  equipmentIssues: () => total('/equipment', { status: 'OUT_OF_SERVICE' }),
}
