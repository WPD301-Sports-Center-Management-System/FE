import type { Booking, PtBookingStatus } from '@/shared/types/api'

export interface PtBookingQueryParams {
  memberId?: string
  coachId?: string
  status?: PtBookingStatus
  page?: number
  limit?: number
}

export interface CreateBookingPayload {
  memberId: string
  purchaseId: string
  slotId: string
}

export interface CancelBookingPayload {
  reason: string
}

export interface CoachCancelBookingPayload {
  reason: string
}

export interface CompleteBookingPayload {
  completedAt?: string
  note?: string
}

export interface NoShowBookingPayload {
  reason?: string
}

export interface ExerciseResultItem {
  exerciseId: string
  exerciseName?: string
  sets: Array<{
    reps: number
    weight?: number | string
    rpe?: number
  }>
  completed: boolean
  note?: string
}

export interface CreateTrainingResultPayload {
  trainingPlanId?: string
  performedAt: string
  result: ExerciseResultItem[]
  coachComment?: string
  progressScore?: number
}

export interface BookingDetail extends Booking {
  slot?: {
    id: string
    startsAt: string
    endsAt: string
    status: string
    offering?: {
      id: string
      course?: {
        id: string
        name: string
      }
    }
  }
  member?: {
    id: string
    memberCode: string
    user?: {
      fullName: string
      phone: string
      email: string
    }
  }
  coach?: {
    id: string
    user?: {
      fullName: string
      phone?: string
      email?: string
    }
  }
  purchase?: {
    id: string
    purchaseCode: string
    courseNameSnapshot: string
    totalCredits: number
    availableCredits: number
  }
  makeupEntitlement?: {
    id: string
    status: string
  }
  cancellationPolicy?: {
    cutoffAt: string
    creditEffect: 'RETURN' | 'CONSUME'
    makeupEligible: boolean
  }
}

export interface RecurringMatrixSlot {
  slotIndex: number
  slotName: string
  startTime: string
  endTime: string
  isAvailableFully: boolean
  totalWeeksChecked: number
  conflictCount: number
  conflicts: Array<{ date: string; reason: string }>
}

export interface RecurringMatrixDay {
  dayOfWeek: number
  dayName: string
  slots: RecurringMatrixSlot[]
}

export interface RecurringPatternSuggestion {
  key: string
  name: string
  daysOfWeek: number[]
  availableSlots: Array<{ slotIndex: number; slotName: string; startTime: string; endTime: string }>
  hasAvailableSlots: boolean
}

export interface CoachRecurringMatrixResponse {
  coachId: string
  coachName: string
  startDate: string
  totalWeeks: number
  matrix: RecurringMatrixDay[]
  patterns: RecurringPatternSuggestion[]
}

export interface FixedSchedulePayload {
  startDate: string
  daysOfWeek: number[]
  slotIndex: number
}

export interface FixedScheduleSessionItem {
  sessionNumber: number
  date: string
  dayOfWeek: number
  dayName: string
  slotIndex: number
  slotName: string
  startTime: string
  endTime: string
  startsAt: string
  endsAt: string
  isAvailable: boolean
  conflictReason: string | null
  isGymMembershipActive: boolean
}

export interface FixedSchedulePreviewResponse {
  isAvailable: boolean
  totalSessions: number
  startDate: string
  endDate: string
  slot: { index: number; name: string; startTime: string; endTime: string }
  coachName: string
  courseName: string
  memberName: string
  isGymActiveUntilEnd: boolean
  sessions: FixedScheduleSessionItem[]
}

export interface FixedScheduleBookResponse {
  success: boolean
  totalBooked: number
  purchaseId: string
  coachId: string
  courseId: string
  memberId: string
  slotName: string
  startDate: string
  endDate: string
  bookings: Array<{
    id: string
    bookingCode: string
    sessionNumber: number
    date: string
    startsAt: string
    endsAt: string
  }>
}
