import { apiClient } from '@/shared/api/client'
import type { ApiSuccess, SupportRequest } from '@/shared/types/api'

export interface SupportRequestQueryParams {
  memberId?: string
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  assignedTo?: string
  page?: number
  limit?: number
}

export interface RespondSupportPayload {
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  response?: string
  assignedTo?: string
}

export const supportRequestsService = {
  /**
   * [1] GET /support-requests - List support tickets (Staff)
   */
  async getSupportRequests(params?: SupportRequestQueryParams): Promise<ApiSuccess<SupportRequest[]>> {
    const res = await apiClient.get<ApiSuccess<SupportRequest[]>>('/support-requests', { params })
    return res as unknown as ApiSuccess<SupportRequest[]>
  },

  /**
   * [2] GET /support-requests/:id - Get ticket details
   */
  async getSupportRequestById(id: string): Promise<SupportRequest> {
    const res = await apiClient.get<ApiSuccess<SupportRequest>>(`/support-requests/${id}`)
    const data = res as unknown as ApiSuccess<SupportRequest>
    return data.data ?? (data as unknown as SupportRequest)
  },

  /**
   * [3] PATCH /support-requests/:id - Respond / update support ticket status
   */
  async updateSupportRequest(id: string, payload: RespondSupportPayload): Promise<SupportRequest> {
    const res = await apiClient.patch<ApiSuccess<SupportRequest>>(`/support-requests/${id}`, payload)
    const data = res as unknown as ApiSuccess<SupportRequest>
    return data.data ?? (data as unknown as SupportRequest)
  },

  /**
   * [4] POST /support-requests/:id/reopen - Reopen a closed/resolved ticket
   */
  async reopenSupportRequest(id: string, reason?: string): Promise<SupportRequest> {
    const res = await apiClient.post<ApiSuccess<SupportRequest>>(`/support-requests/${id}/reopen`, { reason })
    const data = res as unknown as ApiSuccess<SupportRequest>
    return data.data ?? (data as unknown as SupportRequest)
  },

  /**
   * [5] GET /me/support-requests - List support tickets for logged-in member
   */
  async getMySupportRequests(params?: { page?: number; limit?: number }): Promise<ApiSuccess<SupportRequest[]>> {
    const res = await apiClient.get<ApiSuccess<SupportRequest[]>>('/me/support-requests', { params })
    return res as unknown as ApiSuccess<SupportRequest[]>
  },

  /**
   * [6] POST /support-requests - Member creates a new support ticket
   */
  async createSupportRequest(payload: { subject: string; message: string; category?: 'GENERAL' | 'COACH' | 'SCHEDULE' | 'PAYMENT'; ptPurchaseId?: string }): Promise<SupportRequest> {
    const res = await apiClient.post<ApiSuccess<SupportRequest>>('/support-requests', payload)
    const data = res as unknown as ApiSuccess<SupportRequest>
    return data.data ?? (data as unknown as SupportRequest)
  },
}

