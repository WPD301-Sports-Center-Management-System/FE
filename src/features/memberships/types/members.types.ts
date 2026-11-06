import type {
  MemberDetail,
  MemberSummary,
  UserSummary,
  Booking,
  BodyAssessment,
  TrainingResult,
} from '@/shared/types/api'

export interface CreateMemberPayload {
  fullName: string
  phone: string
  email?: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | string
  dateOfBirth?: string
  address?: string
  emergencyPhone?: string
}

export interface UpdateMemberPayload {
  address?: string
  emergencyPhone?: string
  fitnessLevel?: string
  medicalNotes?: string
  gender?: string
  dateOfBirth?: string
}

export interface MemberQueryParams {
  page?: number
  limit?: number
  search?: string
  memberCode?: string
  status?: string
  fitnessLevel?: string
}

export interface CreateMemberResponseData {
  member: MemberDetail
  user: UserSummary
  temporaryPassword?: string
}

export interface MemberHistoryResponseData {
  bookings: Booking[]
  assessments: BodyAssessment[]
  results: TrainingResult[]
}

export interface MemberProgressResponseData {
  assessments: BodyAssessment[]
  results: TrainingResult[]
}

export interface CreateBodyAssessmentPayload {
  /** Ties the assessment to a PT package so it can carry a milestone. */
  ptPurchaseId?: string
  milestone?: 'BASELINE' | 'PERIODIC' | 'FINAL'
  assessedAt: string
  weightKg?: string
  heightCm?: string
  bodyFatPercent?: string
  muscleMassKg?: string
  waistCm?: string
  chestCm?: string
  hipCm?: string
  restingHeartRate?: number
  notes?: string
}

export type { MemberDetail, MemberSummary }
