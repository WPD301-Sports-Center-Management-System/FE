import { apiClient } from '@/shared/api/client'
import type { ApiSuccess, Booking } from '@/shared/types/api'
import type {
  PtBookingQueryParams,
  CreateBookingPayload,
  CancelBookingPayload,
  CoachCancelBookingPayload,
  CompleteBookingPayload,
  NoShowBookingPayload,
  CreateTrainingResultPayload,
  BookingDetail,
} from '../types/pt-bookings.types'

export const ptBookingsService = {
  /**
   * [1] GET /pt-bookings - List PT bookings with filters (Staff / Manager)
   */
  async getBookings(params?: PtBookingQueryParams): Promise<ApiSuccess<Booking[]>> {
    const res = await apiClient.get<ApiSuccess<Booking[]>>('/pt-bookings', { params })
    return res as unknown as ApiSuccess<Booking[]>
  },

  /**
   * [2] POST /pt-bookings - Receptionist books slot on behalf of member
   */
  async createBooking(payload: CreateBookingPayload): Promise<Booking> {
    const res = await apiClient.post<ApiSuccess<Booking>>('/pt-bookings', payload)
    const data = res as unknown as ApiSuccess<Booking>
    return data.data ?? (data as unknown as Booking)
  },

  /**
   * [3] GET /pt-bookings/{id} - Get booking detail & cancellation policy
   */
  async getBookingById(id: string): Promise<BookingDetail> {
    const res = await apiClient.get<ApiSuccess<BookingDetail>>(`/pt-bookings/${id}`)
    const data = res as unknown as ApiSuccess<BookingDetail>
    return data.data ?? (data as unknown as BookingDetail)
  },

  /**
   * [4] POST /pt-bookings/{id}/cancel - Member/Receptionist cancels booking
   */
  async cancelBooking(id: string, payload: CancelBookingPayload): Promise<any> {
    const res = await apiClient.post(`/pt-bookings/${id}/cancel`, payload)
    return res?.data ?? res
  },

  /**
   * [5] POST /pt-bookings/{id}/coach-cancel - Coach or Gym cancels booking (always refunds credit)
   */
  async coachCancelBooking(id: string, payload: CoachCancelBookingPayload): Promise<any> {
    const res = await apiClient.post(`/pt-bookings/${id}/coach-cancel`, payload)
    return res?.data ?? res
  },

  /**
   * [6] POST /pt-bookings/{id}/complete - Coach marks session completed
   */
  async completeBooking(id: string, payload?: CompleteBookingPayload): Promise<any> {
    const res = await apiClient.post(`/pt-bookings/${id}/complete`, { ...payload, force: true })
    return res?.data ?? res
  },

  /**
   * [7] POST /pt-bookings/{id}/no-show - Coach marks member no-show (consumes credit)
   */
  async noShowBooking(id: string, payload?: NoShowBookingPayload): Promise<any> {
    const res = await apiClient.post(`/pt-bookings/${id}/no-show`, { ...payload, force: true })
    return res?.data ?? res
  },

  /**
   * [8] POST /pt-bookings/{id}/training-result - Coach records training workout result
   */
  async createTrainingResult(id: string, payload: CreateTrainingResultPayload): Promise<any> {
    const res = await apiClient.post(`/pt-bookings/${id}/training-result`, payload)
    return res?.data ?? res
  },

  /**
   * Helper: GET /coaches/me/pt-bookings - List bookings for logged-in coach
   */
  async getMyCoachBookings(params?: { status?: string; page?: number; limit?: number }): Promise<ApiSuccess<Booking[]>> {
    const res = await apiClient.get<ApiSuccess<Booking[]>>('/coaches/me/pt-bookings', { params })
    return res as unknown as ApiSuccess<Booking[]>
  },

  /**
   * Helper: GET /me/pt-bookings - List bookings for logged-in member
   */
  async getMyMemberBookings(params?: { status?: string; page?: number; limit?: number }): Promise<ApiSuccess<Booking[]>> {
    const res = await apiClient.get<ApiSuccess<Booking[]>>('/me/pt-bookings', { params })
    return res as unknown as ApiSuccess<Booking[]>
  },
}
