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
  force?: boolean
}

export interface NoShowBookingPayload {
  reason?: string
  force?: boolean
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
