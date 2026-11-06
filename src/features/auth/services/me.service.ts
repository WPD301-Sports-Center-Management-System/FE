import { apiClient } from '@/shared/api/client'
import type {
  ApiSuccess,
  Subscription,
  Purchase,
  Booking,
  Payment,
  Invoice,
  TrainingPlan,
  MealPlan,
  SupportRequest,
} from '@/shared/types/api'
import type { MemberProgressData } from '../types/me.types'

export const meService = {
  /**
   * [1] GET /me/subscriptions - List current user's gym membership subscriptions
   */
  async getMySubscriptions(): Promise<ApiSuccess<Subscription[]>> {
    const res = await apiClient.get<ApiSuccess<Subscription[]>>('/me/subscriptions')
    return res as unknown as ApiSuccess<Subscription[]>
  },

  /**
   * [2] GET /me/pt-packages - List current user's purchased PT 1:1 packages
   */
  async getMyPtPackages(): Promise<ApiSuccess<Purchase[]>> {
    const res = await apiClient.get<ApiSuccess<Purchase[]>>('/me/pt-packages')
    return res as unknown as ApiSuccess<Purchase[]>
  },

  /**
   * [3] GET /me/pt-bookings - List current user's booked PT sessions
   */
  async getMyPtBookings(): Promise<ApiSuccess<Booking[]>> {
    const res = await apiClient.get<ApiSuccess<Booking[]>>('/me/pt-bookings')
    return res as unknown as ApiSuccess<Booking[]>
  },

  /**
   * [4] GET /me/payments - List current user's payment history
   */
  async getMyPayments(): Promise<ApiSuccess<Payment[]>> {
    const res = await apiClient.get<ApiSuccess<Payment[]>>('/me/payments')
    return res as unknown as ApiSuccess<Payment[]>
  },

  /**
   * [5] GET /me/invoices - List current user's financial invoices
   */
  async getMyInvoices(): Promise<ApiSuccess<Invoice[]>> {
    const res = await apiClient.get<ApiSuccess<Invoice[]>>('/me/invoices')
    return res as unknown as ApiSuccess<Invoice[]>
  },

  /**
   * [6] GET /me/training-plans - List current user's assigned workout plans
   */
  async getMyTrainingPlans(): Promise<ApiSuccess<TrainingPlan[]>> {
    const res = await apiClient.get<ApiSuccess<TrainingPlan[]>>('/me/training-plans')
    return res as unknown as ApiSuccess<TrainingPlan[]>
  },

  /**
   * [7] GET /me/progress - Get current user's InBody metrics, training results and fitness goals
   */
  async getMyProgress(): Promise<MemberProgressData> {
    const res = await apiClient.get<ApiSuccess<MemberProgressData>>('/me/progress')
    const data = res as unknown as ApiSuccess<MemberProgressData>
    return data.data
  },

  /**
   * [8] GET /me/meal-plans - List current user's nutritional meal plans
   */
  async getMyMealPlans(): Promise<ApiSuccess<MealPlan[]>> {
    const res = await apiClient.get<ApiSuccess<MealPlan[]>>('/me/meal-plans')
    return res as unknown as ApiSuccess<MealPlan[]>
  },

  /**
   * [9] GET /me/support-requests - List current user's submitted support inquiries
   */
  async getMySupportRequests(): Promise<ApiSuccess<SupportRequest[]>> {
    const res = await apiClient.get<ApiSuccess<SupportRequest[]>>('/me/support-requests')
    return res as unknown as ApiSuccess<SupportRequest[]>
  },
}
