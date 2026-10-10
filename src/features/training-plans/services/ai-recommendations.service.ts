import { apiClient } from '@/shared/api/client'
import type { ApiSuccess } from '@/shared/types/api'

export interface CreateRecommendationPayload {
  memberId: string
  ptPurchaseId?: string
  goal?: string
  context?: string
}

export interface UpdateRecommendationPayload {
  editedContent: Record<string, unknown>
}

export interface RecommendationQueryParams {
  memberId?: string
  status?: 'DRAFT' | 'APPROVED' | 'REJECTED'
  page?: number
  limit?: number
}

export interface AiRecommendation {
  id: string
  coachId: string
  memberId: string
  ptPurchaseId?: string
  promptContext: any
  generatedContent: any
  editedContent?: any
  status: 'DRAFT' | 'APPROVED' | 'REJECTED'
  rejectionReason?: string
  trainingPlanId?: string
  createdAt: string
  reviewedAt?: string
}

export const aiRecommendationsService = {
  /**
   * [1] POST /ai/recommendations - Generate AI recommendation
   */
  async createRecommendation(payload: CreateRecommendationPayload): Promise<AiRecommendation> {
    const res = await apiClient.post<ApiSuccess<AiRecommendation>>('/ai/recommendations', payload)
    const data = res as unknown as ApiSuccess<AiRecommendation>
    return data.data ?? (data as unknown as AiRecommendation)
  },

  /**
   * [2] GET /ai/recommendations - List coach's AI recommendations
   */
  async getRecommendations(params?: RecommendationQueryParams): Promise<ApiSuccess<AiRecommendation[]>> {
    const res = await apiClient.get<ApiSuccess<AiRecommendation[]>>('/ai/recommendations', { params })
    return res as unknown as ApiSuccess<AiRecommendation[]>
  },

  /**
   * [3] GET /ai/recommendations/:id - Get recommendation detail
   */
  async getRecommendationById(id: string): Promise<AiRecommendation> {
    const res = await apiClient.get<ApiSuccess<AiRecommendation>>(`/ai/recommendations/${id}`)
    const data = res as unknown as ApiSuccess<AiRecommendation>
    return data.data ?? (data as unknown as AiRecommendation)
  },

  /**
   * [4] PATCH /ai/recommendations/:id - Edit draft recommendation
   */
  async updateRecommendation(id: string, payload: UpdateRecommendationPayload): Promise<AiRecommendation> {
    const res = await apiClient.patch<ApiSuccess<AiRecommendation>>(`/ai/recommendations/${id}`, payload)
    const data = res as unknown as ApiSuccess<AiRecommendation>
    return data.data ?? (data as unknown as AiRecommendation)
  },

  /**
   * [5] POST /ai/recommendations/:id/approve - Approve recommendation (creates TrainingPlan)
   */
  async approveRecommendation(id: string, payload?: { title?: string }): Promise<any> {
    const res = await apiClient.post(`/ai/recommendations/${id}/approve`, payload || {})
    return res?.data ?? res
  },

  /**
   * [6] POST /ai/recommendations/:id/reject - Reject recommendation with reason
   */
  async rejectRecommendation(id: string, rejectionReason: string): Promise<AiRecommendation> {
    const res = await apiClient.post<ApiSuccess<AiRecommendation>>(`/ai/recommendations/${id}/reject`, {
      rejectionReason,
    })
    const data = res as unknown as ApiSuccess<AiRecommendation>
    return data.data ?? (data as unknown as AiRecommendation)
  },
}
