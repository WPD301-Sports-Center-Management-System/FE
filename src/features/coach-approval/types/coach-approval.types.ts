import type { Offering, PackageOption, ApiSuccess } from '@/shared/types/api'

export interface CoachCourseOfferingQueryParams {
  coachId?: string
  courseId?: string
  status?: 'PENDING' | 'APPROVED' | 'REJECTED'
  page?: number
  limit?: number
}

export interface CreateCoachCourseOfferingPayload {
  courseId: string
  experienceNote?: string
}

export interface RejectOfferingPayload {
  rejectionReason: string
}

export interface ResubmitOfferingPayload {
  experienceNote: string
}

export interface UpdateOfferingStatusPayload {
  isActive: boolean
}

export interface UpdatePtPackageOptionPayload {
  name?: string
  sessionCount?: number
  validityDays?: number
  price?: number
  description?: string
}

export interface UpdatePtPackageOptionStatusPayload {
  isActive: boolean
}

export interface OfferingDetail extends Offering {
  coach?: {
    id?: string
    user?: {
      fullName: string
      email?: string
      avatarUrl?: string
    }
  }
  course?: {
    id: string
    name: string
    description?: string
    difficultyLevel?: string
    imageUrl?: string
    objective?: string
    isActive?: boolean
  }
}

export type { Offering, PackageOption, ApiSuccess }
