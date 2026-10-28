import { counterPayment } from '@/features/workspace/counter-payment'
import { apiClient } from '@/shared/api/client'
import type { ReconciliationCase, ScheduleChange, Session } from '@/features/fixed-pt/types'

// Front-desk API. Every call maps to a BE route the RECEPTIONIST role may use (BE/src/contract/endpoints.json).
// The axios interceptor unwraps the HTTP body to { success, data, meta }.
type Meta = { total: number; page: number; limit: number }
export type Page<T> = { items: T[]; total: number }
type Body<T> = { data: T; meta?: Meta }
const raw = async <T>(url: string, params?: object) => (await apiClient.get(url, { params })) as unknown as Body<T>
const get = async <T>(url: string, params?: object) => (await raw<T>(url, params)).data
const post = async <T>(url: string, body: object = {}) => ((await apiClient.post(url, body)) as unknown as Body<T>).data
const patch = async <T>(url: string, body: object = {}) => ((await apiClient.patch(url, body)) as unknown as Body<T>).data
const page = async <T>(url: string, params: object): Promise<Page<T>> => { const b = await raw<T[]>(url, params); return { items: b.data ?? [], total: b.meta?.total ?? (b.data ?? []).length } }
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

export interface DeskDashboard { checkinsToday: number; insideGym: number; pendingPayments: number; expiringSubscriptions: number; activeMembers: number; ptSessionsToday: number; openSupportRequests: number }
export interface DeskMember { id: string; memberCode: string; fitnessLevel?: string | null; user: { id: string; fullName: string; email?: string | null; phone?: string | null; avatarUrl?: string | null; status?: string; createdAt?: string } }
export interface MemberProfile { id: string; memberCode: string; dateOfBirth?: string | null; gender?: string | null; address?: string | null; emergencyPhone?: string | null; fitnessLevel?: string | null; createdAt: string; user: { fullName: string; email?: string | null; phone?: string | null; avatarUrl?: string | null } }
export interface Plan { id: string; code: string; name: string; description?: string | null; paidMonths: number; bonusMonths: number; price: string; isActive: boolean; benefits?: unknown }
export interface Subscription { id: string; memberId: string; planId: string; planNameSnapshot: string; paidMonthsSnapshot: number; bonusMonthsSnapshot: number; priceSnapshot: string; startDate: string; endDate: string; status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED'; createdAt: string }
export interface Visit { id: string; memberId: string; status: 'OPEN' | 'CLOSED' | 'AUTO_CLOSED' | 'LEGACY_IMPORTED'; checkedInAt: string; checkedOutAt?: string | null; note?: string | null; member?: { id: string; memberCode: string; fullName: string; phone?: string | null; avatarUrl?: string | null } }
export interface CheckInResult extends Visit { reused: boolean; todaySessions: { id: string; status: string; plannedStartsAt: string; plannedEndsAt: string; coach?: { user?: { fullName: string } } }[] }
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'EXPIRED' | 'SUPERSEDED'
export interface Payment { id: string; paymentCode: string; memberId: string; subscriptionId?: string | null; ptPurchaseId?: string | null; amount: string; method: 'CASH' | 'BANK_TRANSFER' | 'VNPAY'; status: PaymentStatus; application?: string | null; paidAt?: string | null; createdAt: string; expiresAt?: string | null; memberName?: string; memberCode?: string; itemDescription?: string; invoiceId?: string | null }
export interface Invoice { id: string; invoiceNumber: string; paymentId: string; memberNameSnapshot: string; memberEmailSnapshot: string; itemNameSnapshot: string; subtotal: string; total: string; issuedAt: string }
export interface PtPurchase { id: string; purchaseCode: string; memberId: string; coachId: string; packageOptionId?: string; status: string; packageNameSnapshot: string; courseNameSnapshot: string; coachNameSnapshot?: string; priceSnapshot: string; totalCredits: number; reservedCredits: number; consumedCredits: number; expiresAt?: string | null; createdAt: string }
export type SupportStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
export interface SupportRequest { id: string; requestCode: string; memberId: string; memberName?: string | null; subject: string; message: string; status: SupportStatus; response?: string | null; respondedAt?: string | null; category: string; attachmentUrls: string[]; createdAt: string; updatedAt: string }
export type TrialStatus = 'NEW' | 'CONTACTED' | 'CONVERTED' | 'CLOSED'
export interface TrialRequest { id: string; fullName: string; phone: string; goal?: string | null; preferredTime?: string | null; coachId?: string | null; coachName?: string | null; interest?: string | null; note?: string | null; status: TrialStatus; staffNote?: string | null; handledAt?: string | null; createdAt: string }
export interface PublicCoach { id: string; user: { fullName: string } }

export const deskApi = {
  dashboard: () => get<DeskDashboard>('/dashboard/receptionist'),

  members: (params: { search?: string; page?: number; limit?: number }) => page<DeskMember>('/members', { ...params, search: params.search || undefined }),
  member: (id: string) => get<MemberProfile>(`/members/${id}`),
  createMember: (body: { fullName: string; phone: string; email?: string; dateOfBirth?: string; gender?: string; address?: string; emergencyPhone?: string }) => post<{ member: { id: string; memberCode: string }; user: { fullName: string; email: string; phone?: string | null }; temporaryPassword?: string }>('/members', body),

  plans: () => get<Plan[]>('/membership-plans'),
  subscriptions: (params: { memberId?: string; status?: Subscription['status'] }, maxPages = 10) => all<Subscription>('/subscriptions', params, maxPages),
  subscriptionTotal: (status: Subscription['status']) => total('/subscriptions', { status }),
  createSubscription: (body: { memberId: string; planId: string; startDate?: string }) => post<Subscription>('/subscriptions', body),

  visits: (params: { memberId?: string; status?: Visit['status'] }, maxPages = 3) => all<Visit>('/check-ins', params, maxPages),
  checkIn: (memberId: string, note?: string) => post<CheckInResult>('/check-ins', { memberId, note }),
  checkOut: (visitId: string) => post<Visit>(`/check-ins/${visitId}/check-out`),

  sessions: (params: { from?: string; to?: string; memberId?: string; coachId?: string; status?: string; purchaseId?: string }, maxPages = 5) => all<Session>('/pt-bookings', params, maxPages),
  arrive: (id: string) => post<Session>(`/pt-bookings/${id}/arrive`),
  cancelSession: (id: string, body: { reason?: string; expectedEffect: 'RETURN' | 'CONSUME' }) => post(`/pt-bookings/${id}/cancel`, body),
  purchases: (params: { memberId?: string; status?: string }) => all<PtPurchase>('/pt-package-purchases', params, 3),

  scheduleChanges: () => get<ScheduleChange[]>('/pt-schedule-changes'),
  requestChange: (body: { purchaseId: string; items: { bookingId?: string; creditId?: string; startsAt?: string; endsAt?: string }[]; note?: string }) => post<ScheduleChange>('/pt-schedule-changes', body),
  acceptChange: (id: string, consentEvidence: string) => post<ScheduleChange>(`/pt-schedule-changes/${id}/accept`, { consentEvidence }),
  declineChange: (id: string, reason?: string) => post<ScheduleChange>(`/pt-schedule-changes/${id}/decline`, { reason }),
  withdrawChange: (id: string, reason?: string) => post<ScheduleChange>(`/pt-schedule-changes/${id}/withdraw`, { reason }),

  payments: (params: { memberId?: string; status?: PaymentStatus; method?: string }, maxPages = 5) => all<Payment>('/payments', params, maxPages),
  invoices: (params: { memberId?: string }, maxPages = 3) => all<Invoice>('/invoices', params, maxPages),
  invoicePdf: async (id: string) => (await apiClient.get(`/invoices/${id}/pdf`, { responseType: 'blob' })) as unknown as Blob,
  payCounter: (body: { subscriptionId?: string; ptPurchaseId?: string; method: 'CASH' | 'BANK_TRANSFER'; receivedAmount: number; externalRef?: string }) => counterPayment<Payment & { changeAmount: number }>(body),
  payVnpay: (body: { subscriptionId?: string; ptPurchaseId?: string }) => post<{ paymentUrl: string; paymentId?: string }>('/payments/vnpay', { ...body, returnTarget: 'web' }),
  reconciliation: () => get<ReconciliationCase[]>('/reconciliation-cases'),

  support: (params: { status?: SupportStatus } = {}) => all<SupportRequest>('/support-requests', params, 3),
  updateSupport: (id: string, body: { status: SupportStatus; response?: string }) => patch<SupportRequest>(`/support-requests/${id}`, body),
  reopenSupport: (id: string) => post<SupportRequest>(`/support-requests/${id}/reopen`),

  trials: (params: { status?: TrialStatus } = {}) => all<TrialRequest>('/trial-requests', params, 3),
  updateTrial: (id: string, body: { status: TrialStatus; staffNote?: string }) => patch<TrialRequest>(`/trial-requests/${id}`, body),
  createTrial: (body: { fullName: string; phone: string; goal?: string; preferredTime?: string; coachId?: string; interest?: string; note?: string }) => post<{ id: string }>('/trial-requests', body),
  coaches: () => get<PublicCoach[]>('/coaches', { limit: 100 }),
  coursesForTrial: () => get<{ id: string; name: string }[]>('/training-courses', { limit: 100 }),
}
