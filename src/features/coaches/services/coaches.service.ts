import { apiClient } from '@/shared/api/client'
import type {
  ApiSuccess,
  CoachSummary,
  CoachDetail,
  Offering,
  Purchase,
  Booking,
  CoachReview,
  MemberSummary,
} from '@/shared/types/api'
import type {
  UpdateCoachPayload,
  CoachQueryParams,
  CoachAvailabilitySlot,
} from '@/features/coaches/types/coaches.types'

export const coachesService = {
  /**
   * [1] GET /coaches - List all public active coaches
   */
  async getCoaches(params?: CoachQueryParams): Promise<ApiSuccess<CoachSummary[]>> {
    const res = await apiClient.get<ApiSuccess<any[]>>('/coaches', { params })
    const raw = res as unknown as ApiSuccess<any[]>
    const normalizedData = (raw.data || []).map((c: any) => ({
      ...c,
      fullName: c.fullName || c.user?.fullName || 'Huấn luyện viên',
      avatarUrl: c.avatarUrl || c.user?.avatarUrl,
    }))
    return {
      ...raw,
      data: normalizedData as CoachSummary[],
    }
  },

  /**
   * [2] GET /coaches/{coachId} - Get public coach profile detail
   */
  async getCoachById(coachId: string): Promise<CoachDetail> {
    const res = await apiClient.get<ApiSuccess<any>>(`/coaches/${coachId}`)
    const data = (res as any)?.data || res
    return {
      ...data,
      fullName: data.fullName || data.user?.fullName || 'Huấn luyện viên',
      avatarUrl: data.avatarUrl || data.user?.avatarUrl,
    } as CoachDetail
  },

  /**
   * [3] PATCH /coaches/{coachId} - Update coach bio, cert, specialization
   */
  async updateCoach(coachId: string, payload: UpdateCoachPayload): Promise<CoachDetail> {
    const res = await apiClient.patch<ApiSuccess<CoachDetail>>(`/coaches/${coachId}`, payload)
    const data = res as unknown as ApiSuccess<CoachDetail>
    return data.data
  },

  /**
   * [4] GET /coaches/{coachId}/availability - Get coach open slots for booking
   */
  async getCoachAvailability(
    coachId: string,
    params?: { date?: string }
  ): Promise<CoachAvailabilitySlot[]> {
    const res = await apiClient.get<ApiSuccess<CoachAvailabilitySlot[]>>(
      `/coaches/${coachId}/availability`,
      { params }
    )
    const data = res as unknown as ApiSuccess<CoachAvailabilitySlot[]>
    return data.data || []
  },

  /**
   * [5] GET /coaches/me/members - Get students assigned to logged-in coach
   */
  async getMyMembers(params?: { page?: number; limit?: number }): Promise<ApiSuccess<MemberSummary[]>> {
    const res = await apiClient.get<ApiSuccess<any[]>>('/coaches/me/members', { params })
    const raw = res as unknown as ApiSuccess<any[]>
    const normalizedData = (raw.data || []).map((m: any) => ({
      ...m,
      fullName: m.fullName || m.user?.fullName || m.user?.email || 'Hội viên',
      ...(m.user?.email && !m.email ? { email: m.user.email } : {}),
      ...(m.user?.phone && !m.phone ? { phone: m.user.phone } : {}),
      ...(m.user?.id && !m.userId ? { userId: m.user.id } : {}),
      ...(m.user?.avatarUrl && !m.avatarUrl ? { avatarUrl: m.user.avatarUrl } : {}),
    }))
    return {
      ...raw,
      data: normalizedData as MemberSummary[],
    }
  },

  /**
   * [6] GET /coaches/me/offerings - Get course offerings for logged-in coach
   */
  async getMyOfferings(params?: { page?: number; limit?: number }): Promise<ApiSuccess<Offering[]>> {
    const res = await apiClient.get<ApiSuccess<Offering[]>>('/coaches/me/offerings', { params })
    return res as unknown as ApiSuccess<Offering[]>
  },

  /**
   * [9] GET /coaches/me/pt-packages - Get active & past student packages
   */
  async getMyPackages(params?: { page?: number; limit?: number }): Promise<ApiSuccess<Purchase[]>> {
    const res = await apiClient.get<ApiSuccess<Purchase[]>>('/coaches/me/pt-packages', { params })
    return res as unknown as ApiSuccess<Purchase[]>
  },

  /**
   * [10] GET /coaches/me/pt-bookings - Get PT 1:1 bookings for logged-in coach
   */
  async getMyBookings(params?: { from?: string; to?: string }): Promise<ApiSuccess<Booking[]>> {
    const res = await apiClient.get<ApiSuccess<Booking[]>>('/coaches/me/pt-bookings', { params })
    return res as unknown as ApiSuccess<Booking[]>
  },

  /**
   * [12] GET /coaches/{coachId}/reviews - Get public reviews for a coach
   */
  async getCoachReviews(
    coachId: string,
    params?: { page?: number; limit?: number }
  ): Promise<ApiSuccess<CoachReview[]>> {
    const res = await apiClient.get<ApiSuccess<CoachReview[]>>(`/coaches/${coachId}/reviews`, {
      params,
    })
    return res as unknown as ApiSuccess<CoachReview[]>
  },

  /**
   * [13] POST /pt-bookings/{id}/complete - Mark session completed
   */
  async completeBooking(id: string, payload?: { note?: string; earlyEndReason?: string }): Promise<any> {
    const res = await apiClient.post(`/pt-bookings/${id}/complete`, payload ?? {})
    return res?.data || res
  },

  /**
   * [14] POST /pt-bookings/{id}/no-show - Report member no-show
   */
  async reportNoShow(id: string, reason: string): Promise<any> {
    const res = await apiClient.post(`/pt-bookings/${id}/no-show`, { reason })
    return res?.data || res
  },

  /**
   * [15] POST /pt-bookings/{id}/coach-cancel - Coach emergency cancellation
   */
  async coachCancelBooking(id: string, reason: string): Promise<any> {
    const res = await apiClient.post(`/pt-bookings/${id}/coach-cancel`, { reason })
    return res?.data || res
  },
}

