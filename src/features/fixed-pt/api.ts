import { counterPayment } from '@/features/workspace/counter-payment'
import { apiClient } from '@/shared/api/client'
import type {
  CoachPackage, Adjustment, Advance, Credit, Disruption, EarningLine, EarningSummary, Enrollment, GymVisit, IntakeRule, PayoutPeriod, PolicyRow, PreviewItem,
  ProgramTemplate, PublicIntakeRule, ReconciliationCase, ScheduleChange, Session, SessionTemplate, SessionWithContent, TimeItem, WeeklySlot, ContentItem,
} from './types'

// The axios interceptor unwraps the HTTP body: { success, data, meta }.
type Body<T> = { data: T; meta?: { total: number; page: number; limit: number } }
const get = async <T>(url: string, params?: object) => ((await apiClient.get(url, { params })) as unknown as Body<T>).data
const post = async <T>(url: string, body: object = {}) => ((await apiClient.post(url, body)) as unknown as Body<T>).data
const patch = async <T>(url: string, body: object = {}) => ((await apiClient.patch(url, body)) as unknown as Body<T>).data
const del = async <T>(url: string) => ((await apiClient.delete(url)) as unknown as Body<T>).data

export const fixedPtApi = {
  policies: () => get<PolicyRow[]>('/policy-settings'),
  setPolicies: (settings: { key: string; value: unknown; note?: string }[]) => patch('/policy-settings', { settings }),

  myIntakeRules: () => get<IntakeRule[]>('/coaches/me/intake-rules'),
  createIntakeRule: (body: { offeringId: string; title: string; validFrom: string; validTo?: string | null; slots: WeeklySlot[]; packageOptionIds: string[]; note?: string }) => post<IntakeRule>('/coach-intake-rules', body),
  updateIntakeRule: (id: string, body: Partial<{ title: string; validFrom: string; validTo: string | null; slots: WeeklySlot[]; packageOptionIds: string[] }>) => patch<IntakeRule>(`/coach-intake-rules/${id}`, body),
  intakeRuleAction: (id: string, action: 'publish' | 'pause' | 'archive') => post<IntakeRule>(`/coach-intake-rules/${id}/${action}`),
  publicIntakeRules: (coachId: string) => get<PublicIntakeRule[]>(`/coaches/${coachId}/intake-rules`),
  optionsForCoach: (coachId: string) => get<{ id: string; courseId: string; name: string; sessionCount: number; price: string; course?: { name: string } }[]>('/pt-package-options', { coachId, limit: 100 }),
  preview: (body: { coachId: string; memberId?: string; intakeRuleId?: string; slots?: WeeklySlot[]; startDate: string; count: number }) => post<{ requested: number; generated: number; items: PreviewItem[] }>('/schedule-previews', body),
  myTimeOffs: () => get<{ id: string; startsAt: string; endsAt: string; reason?: string | null }[]>('/coaches/me/time-offs'),
  createTimeOff: (body: { startsAt: string; endsAt: string; reason?: string }) => post<{ affectedSessions: { id: string; plannedStartsAt: string }[] }>('/coach-time-offs', body),
  deleteTimeOff: (id: string) => del(`/coach-time-offs/${id}`),

  enrollments: (params?: object) => get<Enrollment[]>('/pt-enrollments', params),
  coachEnrollments: (params?: object) => get<Enrollment[]>('/coaches/me/pt-enrollments', params),
  enrollment: (id: string) => get<Enrollment>(`/pt-enrollments/${id}`),
  propose: (id: string, body: { items?: TimeItem[]; generate?: { slots: WeeklySlot[]; startDate: string }; note?: string }) => post<Enrollment>(`/pt-enrollments/${id}/proposals`, body),
  decline: (id: string, reason: string) => post<Enrollment>(`/pt-enrollments/${id}/decline`, { reason }),
  accept: (id: string, proposalId: string, consentEvidence?: string) => post<Enrollment>(`/pt-enrollments/${id}/accept`, { proposalId, consentEvidence }),
  requestChange: (id: string, message: string, consentEvidence?: string) => post<Enrollment>(`/pt-enrollments/${id}/request-change`, { message, consentEvidence }),
  withdraw: (id: string, reason?: string, consentEvidence?: string) => post<Enrollment>(`/pt-enrollments/${id}/withdraw`, { reason, consentEvidence }),
  payCounter: (body: { ptPurchaseId: string; method: 'CASH' | 'BANK_TRANSFER'; receivedAmount: number; externalRef?: string; overrideReason?: string }) => counterPayment<{ id: string; application: string; changeAmount: number }>(body),

  coachPackages: () => get<CoachPackage[]>('/coaches/me/pt-packages', { limit: 100 }),
  sessions: (params?: object) => get<Session[]>('/pt-bookings', params),
  coachSessions: (params?: object) => get<Session[]>('/coaches/me/pt-bookings', params),
  session: (id: string) => get<Session>(`/pt-bookings/${id}`),
  arrive: (id: string) => post<Session>(`/pt-bookings/${id}/arrive`),
  start: (id: string) => post<Session>(`/pt-bookings/${id}/start`),
  end: (id: string, body: { note?: string; earlyEndReason?: string }) => post<Session>(`/pt-bookings/${id}/complete`, body),
  noShow: (id: string, body: { reason?: string; confirmAbsentDespiteVisit?: boolean }) => post<Session>(`/pt-bookings/${id}/no-show`, body),
  cancel: (id: string, body: { reason?: string; expectedEffect: 'RETURN' | 'CONSUME' }) => post(`/pt-bookings/${id}/cancel`, body),
  coachCancel: (id: string, reason: string) => post(`/pt-bookings/${id}/coach-cancel`, { reason }),
  reverseOutcome: (id: string, reason: string) => post(`/pt-bookings/${id}/reverse-outcome`, { reason }),
  membershipOverride: (id: string, reason: string) => post(`/pt-bookings/${id}/membership-override`, { reason }),
  resolveReview: (id: string, reason: string) => post(`/pt-bookings/${id}/resolve-review`, { reason }),
  credits: (purchaseId: string) => get<Credit[]>(`/pt-package-purchases/${purchaseId}/credits`),

  scheduleChanges: (params?: object) => get<ScheduleChange[]>('/pt-schedule-changes', params),
  createScheduleChange: (body: { purchaseId: string; items: { bookingId?: string; creditId?: string; startsAt?: string; endsAt?: string }[]; note?: string }) => post<ScheduleChange>('/pt-schedule-changes', body),
  proposeScheduleChange: (id: string, items: { creditId: string; startsAt: string; endsAt: string }[], note?: string) => post<ScheduleChange>(`/pt-schedule-changes/${id}/propose`, { items, note }),
  scheduleChangeAction: (id: string, action: 'accept' | 'decline' | 'withdraw', body: object = {}) => post<ScheduleChange>(`/pt-schedule-changes/${id}/${action}`, body),

  sessionTemplates: () => get<SessionTemplate[]>('/session-templates'),
  duplicateTemplate: (id: string, name?: string) => post<SessionTemplate>(`/session-templates/${id}/duplicate`, { name }),
  programTemplates: () => get<ProgramTemplate[]>('/program-templates'),
  createProgram: (body: { name: string; slots: { label: string; sessionTemplateId: string }[] }) => post<ProgramTemplate>('/program-templates', body),
  updateProgram: (id: string, body: { name?: string; slots?: { label: string; sessionTemplateId: string }[]; status?: 'ACTIVE' | 'ARCHIVED' }) => patch<ProgramTemplate>(`/program-templates/${id}`, body),
  updateTemplate: (id: string, body: { name?: string; focus?: string }) => patch<SessionTemplate>(`/session-templates/${id}`, body),
  setTemplateStatus: (id: string, status: 'ACTIVE' | 'ARCHIVED') => patch<SessionTemplate>(`/session-templates/${id}/status`, { status }),
  purchaseSessions: (purchaseId: string) => get<SessionWithContent[]>(`/pt-package-purchases/${purchaseId}/sessions`),
  saveContent: (bookingId: string, body: { title?: string; items: ContentItem[]; reason?: string }) => post(`/pt-bookings/${bookingId}/content`, body),
  assignContent: (bookingId: string) => post(`/pt-bookings/${bookingId}/content/assign`),
  applyTemplate: (bookingId: string, sessionTemplateId: string, level?: string) => post(`/pt-bookings/${bookingId}/content/apply-template`, { sessionTemplateId, level }),
  saveActual: (bookingId: string, items: ContentItem[], reason: string) => post(`/pt-bookings/${bookingId}/content/actual`, { items, reason }),
  applyProgram: (purchaseId: string, body: { programTemplateId: string; fromBookingId?: string; overwrite: boolean; level?: string }) => post<{ applied: string[]; skipped: string[] }>(`/pt-package-purchases/${purchaseId}/apply-program`, body),
  copyWeek: (purchaseId: string, body: { sourceWeekStart: string; targetWeekStart: string; overwrite: boolean }) => post<{ copied: string[]; skipped: string[] }>(`/pt-package-purchases/${purchaseId}/copy-week`, body),
  assignContents: (purchaseId: string, bookingIds: string[]) => post<{ bookingId: string; assigned: boolean; code?: string; message?: string }[]>(`/pt-package-purchases/${purchaseId}/assign-contents`, { bookingIds }),

  earnings: (params?: object) => get<EarningLine[]>('/coach-earnings', params),
  earningSummary: (coachId?: string) => get<EarningSummary>('/coach-earnings/summary', { coachId }),
  myEarnings: (params?: object) => get<EarningLine[]>('/coaches/me/earnings', params),
  myEarningSummary: () => get<EarningSummary>('/coaches/me/earnings/summary'),
  earningAction: (id: string, action: 'confirm' | 'reject' | 'release', body: object) => post(`/coach-earnings/${id}/${action}`, body),
  openDispute: (id: string, reason: string) => post(`/coach-earnings/${id}/disputes`, { reason }),
  resolveDispute: (id: string, resolution: 'UPHELD' | 'NOT_ELIGIBLE', note: string) => post(`/earning-disputes/${id}/resolve`, { resolution, note }),
  periods: (params?: object) => get<PayoutPeriod[]>('/coach-payout-periods', params),
  myPeriods: () => get<PayoutPeriod[]>('/coaches/me/payout-periods'),
  createPeriod: (body: { coachId: string; periodFrom: string; periodTo: string }) => post<PayoutPeriod>('/coach-payout-periods', body),
  addPeriodItems: (id: string, body: { earningLineIds?: string[]; adjustmentId?: string; amount?: number }) => post<PayoutPeriod>(`/coach-payout-periods/${id}/items`, body),
  removePeriodItem: (id: string, itemId: string, reason: string) => post<PayoutPeriod>(`/coach-payout-periods/${id}/items/${itemId}/remove`, { reason }),
  periodAction: (id: string, action: 'lock' | 'reopen' | 'cancel' | 'mark-paid', body: object = {}) => post<PayoutPeriod>(`/coach-payout-periods/${id}/${action}`, body),
  adjustments: (params?: object) => get<Adjustment[]>('/coach-adjustments', params),
  createAdjustment: (body: { coachId: string; type: 'RECOVERY' | 'ADDITION'; amount: number; reason: string }) => post<Adjustment>('/coach-adjustments', body),
  settleAdjustment: (id: string, amount: number, reference: string) => post<Adjustment>(`/coach-adjustments/${id}/settle-external`, { amount, reference }),
  waiveAdjustment: (id: string, reason: string) => post<Adjustment>(`/coach-adjustments/${id}/waive`, { reason }),
  advances: () => get<Advance[]>('/coach-advances'),

  reconciliationCases: (params?: object) => get<ReconciliationCase[]>('/reconciliation-cases', params),
  updateReconciliation: (id: string, body: { status: 'IN_PROGRESS' | 'RESOLVED'; resolution?: string }) => patch(`/reconciliation-cases/${id}`, body),
  disruptions: (params?: object) => get<Disruption[]>('/service-disruptions', params),
  createDisruption: (body: { purchaseId: string; supportRequestId?: string; reason: string; scopeFrom: string; scopeTo: string }) => post<Disruption>('/service-disruptions', body),
  disruptionAction: (id: string, action: 'approve' | 'resolve', body: object = {}) => post<Disruption>(`/service-disruptions/${id}/${action}`, body),
  protectExpiry: (purchaseId: string, body: { days: number; reason: string; disruptionId?: string }) => post(`/pt-package-purchases/${purchaseId}/expiry-protection`, body),

  checkIn: (memberId: string, note?: string) => post<GymVisit>('/check-ins', { memberId, note }),
  checkOut: (visitId: string) => post<GymVisit>(`/check-ins/${visitId}/check-out`),
  visits: (params?: object) => get<GymVisit[]>('/check-ins', params),
}
