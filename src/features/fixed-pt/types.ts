// Types of the fixed-schedule PT API (BE/src/v2/http).
export interface WeeklySlot { weekday: number; startTime: string; durationMinutes: number }
export interface TimeItem { startsAt: string; endsAt: string }
export interface PreviewItem extends TimeItem { seq: number; coachBusy: boolean; memberBusy: boolean; coachTimeOff: boolean; available: boolean }
export interface PolicyRow { key: string; decision: string; label: string; value: unknown; source: 'APPROVED' | 'INTERIM' | 'MISSING'; interim: unknown }

export interface IntakeRule {
  id: string; title: string; status: 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'ARCHIVED'; validFrom: string; validTo?: string | null; version: number; offeringId: string
  slots: WeeklySlot[]; options: { packageOptionId: string; packageOption: { id: string; name: string; sessionCount: number; price: string } }[]
  offering?: { course?: { name: string } }
}
export interface PublicIntakeRule { id: string; title: string; courseId: string; courseName: string; slots: WeeklySlot[]; packageOptions: { id: string; name: string; sessionCount: number; validityDays: number; price: string }[] }

export interface PaymentRow { id: string; paymentCode: string; method: string; status: string; application?: string | null; amount: string; expiresAt?: string | null; paidAt?: string | null; createdAt: string }

export type SessionStatus = 'CONFIRMED' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED_EARLY' | 'CANCELLED_LATE' | 'COACH_CANCELLED' | 'NO_SHOW' | 'RESCHEDULED'
export interface CancellationPreview { cutoffAt: string; creditEffect: 'RETURN' | 'CONSUME'; makeupEligible: boolean; evaluatedAt: string }
export interface Session {
  bookedAt?: string
  id: string; bookingCode: string; status: SessionStatus; purchaseId: string; memberId: string; coachId: string; creditId: string | null; startsAt: string; endsAt: string; centerDate: string
  memberName?: string; coachName?: string; courseName?: string; isMakeup: boolean; needsReview: boolean; reviewReason?: string | null; disruptionId?: string | null; outcomeReversedAt?: string | null; dataOrigin: 'NATIVE' | 'LEGACY'
  actualStartedAt?: string | null; actualEndedAt?: string | null; arrivedAt?: string | null; expectedEndsAt?: string | null; plannedStartsAt?: string; plannedEndsAt?: string
  credit?: { creditIndex: number; status: string } | null; purchase?: { id: string; purchaseCode: string; packageNameSnapshot: string; totalCredits: number } | null
  cancellationPolicy: CancellationPreview | null
  allowedActions: { arrive: boolean; start: boolean; end: boolean; noShow: boolean; cancel: boolean; coachCancel: boolean; reverse: boolean; interrupt?: boolean; recordCompleted?: boolean }
  actionReasons?: { start?: string | null; noShow?: string | null }
  serverTime?: string
}
export interface Credit { id: string; creditIndex: number; status: 'AVAILABLE' | 'SCHEDULED' | 'CONSUMED'; allocationAmount?: string; openMakeup: { id: string; status: string } | null; sessions: { id: string; status: string; plannedStartsAt: string; plannedEndsAt: string; outcomeReversedAt?: string | null; makeupEntitlementId?: string | null }[] }
export interface ScheduleChange { proposedBy?: string | null; id: string; code: string; type: 'RESCHEDULE' | 'MAKEUP' | 'SCHEDULE_AVAILABLE'; status: 'REQUESTED' | 'PROPOSED' | 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN' | 'EXPIRED'; note?: string | null; responseNote?: string | null; createdAt: string; purchaseId: string
  items: { id: string; creditId: string; sourceBookingId?: string | null; startsAt?: string | null; endsAt?: string | null; sourceBooking?: { plannedStartsAt: string; plannedEndsAt: string } | null }[]
  purchase: { id: string; purchaseCode: string; memberId: string; coachId: string; packageNameSnapshot: string } }

export interface ContentItem { exerciseId: string | null; name: string; roleName?: string; sets?: number; reps?: number; durationMinutes?: number; restSeconds?: number; targetWeight?: number; rpe?: string; notes?: string; confirmed: boolean; needsExercise?: boolean }
export interface SessionWithContent extends Omit<Session, 'allowedActions' | 'cancellationPolicy'> {
  content: { id?: string; status?: 'DRAFT' | 'ASSIGNED' | 'LOCKED'; title?: string | null; programLabel?: string | null; recoveryWarning?: string | null; startedWithout?: string | null; items?: ContentItem[]; state?: string; actualItems?: ContentItem[] | null; currentVersion?: number; assignedVersion?: number | null } | null
  result?: { id: string; status: string } | null
}
export interface SessionTemplate { id: string; coachId: string | null; presetKey: string | null; name: string; focus?: string | null; version: number; items: { id: string; seq: number; candidateNames: string[]; roleName?: string | null; exercise?: { id: string; name: string } | null }[] }
export interface ProgramTemplate { id: string; name: string; version: number; slots: { label: string; sessionTemplateId: string; sessionTemplate: { id: string; name: string } }[] }

export type EarningStatus = 'PENDING_CONFIRMATION' | 'ELIGIBLE' | 'ON_HOLD' | 'INCLUDED' | 'PAID' | 'SETTLED_BY_ADVANCE' | 'VOIDED'
export interface EarningLine { id: string; coachId: string; amount: string; outcome: string; status: EarningStatus; effective: boolean; holdReason?: string | null; statusReason?: string | null; dataOrigin: string; createdAt: string
  booking: { bookingCode: string; plannedStartsAt: string; status: string; outcomeReversedAt?: string | null }; credit: { creditIndex: number }
  purchase: { purchaseCode: string; packageNameSnapshot: string; member: { memberCode: string; user: { fullName: string } } }; coach?: { user: { fullName: string } }
  disputes: { id: string; status: string; afterPayment: boolean; reason: string }[] }
export interface EarningSummary { byStatus: Record<string, { amount: number; count: number }>; recoveryOutstanding: number; paidOut: number; reserved: number; available: number; unverified: number }
export interface PayoutPeriod { id: string; code: string; coachId: string; periodFrom: string; periodTo: string; status: 'DRAFT' | 'LOCKED' | 'PAID' | 'CANCELLED'; grossAmount: string; offsetAmount: string; netAmount: string; transferRef?: string | null; paidAt?: string | null; coach?: { user: { fullName: string } }
  items: { id: string; itemType: 'EARNING' | 'ADJUSTMENT'; amount: string; status: string; earningLine?: { booking: { bookingCode: string; plannedStartsAt: string }; credit: { creditIndex: number }; purchase: { purchaseCode: string } } | null; adjustment?: { code: string; type: string; reason: string } | null }[] }
export interface Adjustment { id: string; code: string; coachId: string; type: 'RECOVERY' | 'ADDITION'; status: string; amount: string; remaining: string; reason: string; createdAt: string; coach?: { user: { fullName: string } }; settlements: { id: string; amount: string; method: string; reference?: string | null; createdAt: string }[] }
export interface Advance { id: string; amount: string; remaining: string; reference?: string | null; purchase: { purchaseCode: string; packageNameSnapshot: string; status: string }; coach: { user: { fullName: string } } }
export interface ReconciliationCase { id: string; code: string; type: string; status: string; amount: string; detail: string; resolution?: string | null; createdAt: string; paymentId: string
  payment: { paymentCode: string; method: string; member: { user: { fullName: string; phone: string } } }; ptPurchase?: { purchaseCode: string; packageNameSnapshot: string; status: string } | null; enrollment?: { code: string; status: string } | null }
export interface Disruption { id: string; code: string; status: string; reason: string; scopeFrom: string; scopeTo: string; resolution?: string | null; purchaseId: string; purchase: { purchaseCode: string; packageNameSnapshot: string; coachNameSnapshot: string; expiresAt?: string | null }; bookings: { id: string; plannedStartsAt: string; status: string }[] }
export interface GymVisit { id: string; memberId: string; status: 'OPEN' | 'CLOSED' | 'AUTO_CLOSED' | 'LEGACY_IMPORTED'; checkedInAt: string; checkedOutAt?: string | null; reused?: boolean
  todaySessions?: { id: string; status: string; plannedStartsAt: string; plannedEndsAt: string; coach?: { user: { fullName: string } } }[] }
export interface CoachPackage { id: string; purchaseCode: string; memberId: string; memberName?: string; memberCode?: string; packageNameSnapshot: string; courseNameSnapshot: string | null; status: string; totalCredits: number; reservedCredits: number; consumedCredits: number; availableCredits: number; expiresAt?: string | null }
