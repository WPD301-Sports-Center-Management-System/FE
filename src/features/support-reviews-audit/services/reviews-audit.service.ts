import { apiClient } from '@/shared/api/client'
import type { ApiSuccess, CoachReview, AuditLog, SupportRequest } from '@/shared/types/api'
import type { ReviewQueryParams, AuditLogQueryParams } from '../types/reviews-audit.types'

export const reviewsAuditService = {
  /**
   * [1] GET /coach-reviews - List coach ratings and reviews
   */
  async getCoachReviews(params?: ReviewQueryParams): Promise<ApiSuccess<CoachReview[]>> {
    const res = await apiClient.get<ApiSuccess<CoachReview[]>>('/coach-reviews', { params })
    return res as unknown as ApiSuccess<CoachReview[]>
  },

  /**
   * [2] GET /audit-logs - List system security and audit logs
   */
  async getAuditLogs(params?: AuditLogQueryParams): Promise<ApiSuccess<AuditLog[]>> {
    const res = await apiClient.get<ApiSuccess<AuditLog[]>>('/audit-logs', { params })
    return res as unknown as ApiSuccess<AuditLog[]>
  },

  /**
   * [3] GET /audit-logs/:id - Get audit log detail
   */
  async getAuditLogById(id: string): Promise<AuditLog> {
    const res = await apiClient.get<ApiSuccess<AuditLog>>(`/audit-logs/${id}`)
    const data = res as unknown as ApiSuccess<AuditLog>
    return data.data ?? (data as unknown as AuditLog)
  },

  /**
   * [4] GET /audit-logs/export - Export audit logs as CSV
   */
  async exportAuditLogs(params?: AuditLogQueryParams): Promise<Blob> {
    const res = await apiClient.get<Blob>('/audit-logs/export', {
      params,
      responseType: 'blob',
    })
    return res as unknown as Blob
  },

  /**
   * [5] GET /support-requests - List support tickets and requests
   */
  async getSupportRequests(params?: { status?: string; page?: number; limit?: number }): Promise<ApiSuccess<SupportRequest[]>> {
    const res = await apiClient.get<ApiSuccess<SupportRequest[]>>('/support-requests', { params })
    return res as unknown as ApiSuccess<SupportRequest[]>
  },

  /**
   * [6] PATCH /coach-reviews/:id/moderation - Moderate review visibility (Manager)
   */
  async moderateReview(
    reviewId: string,
    payload: { moderationStatus: 'VISIBLE' | 'HIDDEN'; reason?: string }
  ): Promise<CoachReview> {
    const res = await apiClient.patch<ApiSuccess<CoachReview>>(`/coach-reviews/${reviewId}/moderation`, payload)
    const data = res as unknown as ApiSuccess<CoachReview>
    return data.data ?? (data as unknown as CoachReview)
  },
}
