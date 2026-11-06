import { apiClient } from '@/shared/api/client'
import type { ContentItem, EarningLine, EarningSummary, IntakeRule, PayoutPeriod, ScheduleChange, Session, SessionTemplate } from '@/features/fixed-pt/types'

// Coach workspace API. Every call maps to a BE route the COACH role may use (BE/src/contract/endpoints.json).
// The axios interceptor unwraps the HTTP body to { success, data, meta }.
type Meta = { total: number; page: number; limit: number; totalPages?: number }
type Body<T> = { data: T; meta?: Meta }
const raw = async <T>(url: string, params?: object) => (await apiClient.get(url, { params })) as unknown as Body<T>
const get = async <T>(url: string, params?: object) => (await raw<T>(url, params)).data
const post = async <T>(url: string, body: object = {}) => ((await apiClient.post(url, body)) as unknown as Body<T>).data
const patch = async <T>(url: string, body: object = {}) => ((await apiClient.patch(url, body)) as unknown as Body<T>).data

/** Reads every page of a list endpoint (100 per page, at most `maxPages`). */
async function all<T>(url: string, params: object = {}, maxPages = 10): Promise<T[]> {
  const out: T[] = []
  for (let page = 1; page <= maxPages; page++) {
    const body = await raw<T[]>(url, { ...params, page, limit: 100 })
    out.push(...(body.data ?? []))
    const total = body.meta?.total ?? out.length
    if (out.length >= total || (body.data ?? []).length < 100) break
  }
  return out
}

export interface CoachDashboard { todayBookings: number; pendingRequests: number; pendingChanges: number; activeMembers: number }
export interface ServiceSettings { acceptingNewMembers: boolean; bufferMinutes: number }
export interface CoachMember { id: string; memberCode: string; fullName?: string; email?: string | null; phone?: string | null; avatarUrl?: string | null; user?: { fullName: string; avatarUrl?: string | null; phone?: string | null } }
export interface CoachPurchase {
  seriesMode?: boolean; expectedCompletionAt?: string | null; autoRescheduleCount?: number;
  id: string; purchaseCode: string; memberId: string; courseId: string; packageOptionId: string; status: string
  packageNameSnapshot: string; courseNameSnapshot: string; priceSnapshot?: string
  totalCredits: number; reservedCredits: number; consumedCredits: number; availableCredits: number
  activatedAt?: string | null; expiresAt?: string | null; createdAt: string
  memberName: string; memberCode: string; phone?: string | null; email?: string | null; avatarUrl?: string | null
  gender?: string | null; fitnessLevel?: string | null; medicalNotes?: string | null
}
export interface MemberDetail {
  id: string; memberCode: string; dateOfBirth?: string | null; gender?: string | null; fitnessLevel?: string | null; medicalNotes?: string | null; createdAt: string
  user: { fullName: string; email?: string | null; phone?: string | null; avatarUrl?: string | null }
}
export interface Assessment { id: string; assessedAt: string; milestone?: 'BASELINE' | 'PERIODIC' | 'FINAL' | null; source?: 'COACH' | 'MEMBER'; weightKg?: string | null; heightCm?: string | null; bodyFatPercent?: string | null; muscleMassKg?: string | null; bmi?: string | null; waistCm?: string | null; notes?: string | null }
export interface MemberProgress { assessments: Assessment[]; results: { performedAt: string; completion?: string | null }[] }
export interface TrainingResult { id: string; ptBookingId: string; performedAt: string; status: 'DRAFT' | 'PUBLISHED'; coachComment?: string | null; }
export interface SessionDetail extends Session { completionNote?: string | null; earlyEndReason?: string | null; cancellationReason?: string | null; member?: { id: string; memberCode: string; medicalNotes?: string | null; user: { fullName: string; phone?: string | null } } }
export interface BookingContent { content: { id: string; status: 'DRAFT' | 'ASSIGNED' | 'LOCKED'; title?: string | null; recoveryWarning?: string | null } | null; items: ContentItem[] }
export interface LibraryTemplate extends SessionTemplate { description?: string | null; status?: string; items: (SessionTemplate['items'][number] & { phase?: string | null })[] }
export interface Offering { id: string; courseId: string; status: 'PENDING' | 'APPROVED' | 'REJECTED'; isActive: boolean; experienceNote?: string | null; rejectionReason?: string | null; createdAt: string; course: { id: string; name: string; difficultyLevel?: string | null; description?: string | null } }
export interface PackageOption { id: string; courseId: string; name: string; sessionCount: number; validityDays: number; price: string; approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED'; isActive: boolean; course?: { name: string } }
export interface Course { id: string; name: string; difficultyLevel?: string | null; description?: string | null }
export interface Exercise { id: string; name: string; difficultyLevel?: string | null }
export interface AiRecommendation { id: string; status: 'DRAFT' | 'APPROVED' | 'REJECTED'; createdAt: string }
export interface TimeOff { id: string; startsAt: string; endsAt: string; reason?: string | null }
export interface CoachTrialSession { id: string; fullName: string; phone: string; scheduledAt: string; durationMinutes: number; status: 'SCHEDULED' | 'CHECKED_IN' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED' | 'CONVERTED' }

export const coachWs = {
  dashboard: () => get<CoachDashboard>('/dashboard/coach'),
  settings: (coachId: string) => get<ServiceSettings>(`/coaches/${coachId}/service-settings`),
  updateSettings: (coachId: string, body: Partial<ServiceSettings>) => patch<ServiceSettings>(`/coaches/${coachId}/service-settings`, body),

  // Members with an ACTIVE or COMPLETED package with this Coach (the endpoint has no server-side search).
  members: () => all<CoachMember>('/coaches/me/members'),
  member: (id: string) => get<MemberDetail>(`/members/${id}`),
  progress: (id: string) => get<MemberProgress>(`/members/${id}/progress`),
  results: (memberId: string) => get<TrainingResult[]>(`/members/${memberId}/training-history`, { limit: 20 }),
  updateMedicalNotes: (memberId: string, medicalNotes: string) => patch(`/members/${memberId}`, { medicalNotes }),

  purchases: () => all<CoachPurchase>('/coaches/me/pt-packages'),
  sessions: (params: { from?: string; to?: string; status?: string; purchaseId?: string; order?: 'asc' | 'desc' }, maxPages = 5) => all<Session>('/coaches/me/pt-bookings', params, maxPages),
  trialSessions: (params: { from: string; to: string }) => all<CoachTrialSession>('/coaches/me/trial-sessions', params),
  session: (id: string) => get<SessionDetail>(`/pt-bookings/${id}`),
  arrive: (id: string) => post<Session>(`/pt-bookings/${id}/arrive`),
  start: (id: string) => post<Session>(`/pt-bookings/${id}/start`),
  complete: (id: string, body: { note?: string; earlyEndReason?: string }) => post<Session>(`/pt-bookings/${id}/complete`, body),
  noShow: (id: string, body: { reason?: string; confirmAbsentDespiteVisit?: boolean }) => post<Session>(`/pt-bookings/${id}/no-show`, body),
  timeOffs: () => get<TimeOff[]>('/coaches/me/time-offs'),

  content: (bookingId: string) => get<BookingContent>(`/pt-bookings/${bookingId}/content`),
  saveContent: (bookingId: string, body: { title?: string; items: ContentItem[] }) => post(`/pt-bookings/${bookingId}/content`, body),
  saveActual: (bookingId: string, items: ContentItem[], reason: string) => post(`/pt-bookings/${bookingId}/content/actual`, { items, reason }),
  assignContent: (bookingId: string) => post(`/pt-bookings/${bookingId}/content/assign`),
  applyTemplate: (bookingId: string, sessionTemplateId: string) => post(`/pt-bookings/${bookingId}/content/apply-template`, { sessionTemplateId }),

  scheduleChanges: () => get<ScheduleChange[]>('/pt-schedule-changes'),
  proposeChange: (body: { purchaseId: string; items: { bookingId: string; startsAt: string; endsAt: string }[]; note?: string }) => post<ScheduleChange>('/pt-schedule-changes', body),
  confirmChange: (id: string) => post<ScheduleChange>(`/pt-schedule-changes/${id}/accept`, {}),
  answerChange: (id: string, items: { creditId: string; startsAt: string; endsAt: string }[], note?: string) => post<ScheduleChange>(`/pt-schedule-changes/${id}/propose`, { items, note }),
  declineChange: (id: string, reason?: string) => post<ScheduleChange>(`/pt-schedule-changes/${id}/decline`, { reason }),
  withdrawChange: (id: string, reason?: string) => post<ScheduleChange>(`/pt-schedule-changes/${id}/withdraw`, { reason }),

  templates: () => get<LibraryTemplate[]>('/session-templates'),
  createTemplate: (body: { name: string; focus?: string; description?: string; items: { exerciseId?: string | null; candidateNames: string[]; roleName?: string }[] }) => post<LibraryTemplate>('/session-templates', body),
  duplicateTemplate: (id: string, name?: string) => post<LibraryTemplate>(`/session-templates/${id}/duplicate`, { name }),
  archiveTemplate: (id: string) => patch(`/session-templates/${id}/status`, { status: 'ARCHIVED' }),
  exercises: () => all<Exercise>('/exercises', {}, 3),

  offerings: () => all<Offering>('/coaches/me/offerings'),
  packageOptions: () => all<PackageOption>('/coaches/me/pt-package-options'),
  intakeRules: () => get<IntakeRule[]>('/coaches/me/intake-rules'),
  courses: () => get<Course[]>('/training-courses', { limit: 100 }),
  registerOffering: (body: { courseId: string; experienceNote?: string }) => post<Offering>('/coach-course-offerings', body),

  aiDrafts: async () => (await raw<AiRecommendation[]>('/ai/recommendations', { status: 'DRAFT', limit: 1 })).meta?.total ?? 0,

  earningSummary: () => get<EarningSummary>('/coaches/me/earnings/summary'),
  earnings: () => all<EarningLine>('/coaches/me/earnings', {}, 5),
  payoutPeriods: () => get<PayoutPeriod[]>('/coaches/me/payout-periods', { limit: 20 }),
}
