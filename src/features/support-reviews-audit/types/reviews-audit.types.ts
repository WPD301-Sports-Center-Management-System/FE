import type { CoachReview, AuditLog, SupportRequest, ApiSuccess } from '@/shared/types/api'

export interface ReviewQueryParams {
  page?: number
  limit?: number
  coachId?: string
  moderationStatus?: string
}

export interface AuditLogQueryParams {
  page?: number
  limit?: number
  action?: string
  entityType?: string
}

export type { CoachReview, AuditLog, SupportRequest, ApiSuccess }
