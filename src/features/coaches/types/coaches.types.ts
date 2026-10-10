import type {
  CoachDetail,
  CoachSummary,
  TrainingCourse,
  PackageOption,
  Purchase,
  Booking,
  CoachPayout,
  CoachReview,
  CoachSlot,
  Offering,
  MemberSummary,
} from '@/shared/types/api'

export interface UpdateCoachPayload {
  bio?: string
  specialization?: string
  certification?: string
  yearsOfExperience?: number
}

export interface CoachQueryParams {
  page?: number
  limit?: number
  search?: string
  specialization?: string
}

export interface CoachAvailabilitySlot {
  id: string
  coachId: string
  offeringId: string
  startsAt: string
  endsAt: string
  status: 'OPEN' | 'BOOKED' | 'BLOCKED' | 'CANCELLED' | 'COMPLETED'
  note?: string | null
}

export interface CoachPublicProfileData extends CoachDetail {
  approvedCourses?: TrainingCourse[]
  availablePackageOptions?: PackageOption[]
  reviews?: CoachReview[]
}

export interface CoachStudentData {
  id: string
  memberId: string
  coachId: string
  courseId: string
  courseNameSnapshot: string
  packageNameSnapshot?: string
  totalCredits: number
  reservedCredits: number
  consumedCredits: number
  availableCredits: number
  status: string
  activatedAt?: string
  expiresAt?: string
  member?: MemberSummary
}

export type {
  CoachDetail,
  CoachSummary,
  PackageOption,
  Purchase,
  Booking,
  CoachPayout,
  CoachReview,
  CoachSlot,
  Offering,
}
