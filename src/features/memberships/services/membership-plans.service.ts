import { apiClient } from '@/shared/api/client'
import type { ApiSuccess, MembershipPlan } from '@/shared/types/api'
import type {
  CreateMembershipPlanPayload,
  UpdateMembershipPlanPayload,
  UpdatePlanStatusPayload,
  MembershipPlanQueryParams,
} from '../types/membership-plans.types'

export const membershipPlansService = {
  /**
   * [1] GET /membership-plans - List all membership plans
   */
  async getPlans(params?: MembershipPlanQueryParams): Promise<ApiSuccess<MembershipPlan[]>> {
    const res = await apiClient.get<ApiSuccess<MembershipPlan[]>>('/membership-plans', { params })
    return res as unknown as ApiSuccess<MembershipPlan[]>
  },

  /**
   * [2] GET /membership-plans/{id} - Get plan details by ID
   */
  async getPlanById(id: string): Promise<MembershipPlan> {
    const res = await apiClient.get<ApiSuccess<MembershipPlan>>(`/membership-plans/${id}`)
    const data = res as unknown as ApiSuccess<MembershipPlan>
    return data.data
  },

  /**
   * POST /membership-plans - Create a gym ticket plan (Manager). 409 PLAN_CODE_EXISTS / PLAN_NAME_EXISTS on duplicates.
   */
  async createPlan(payload: CreateMembershipPlanPayload): Promise<MembershipPlan> {
    const res = await apiClient.post<ApiSuccess<MembershipPlan>>('/membership-plans', payload)
    const data = res as unknown as ApiSuccess<MembershipPlan>
    return data.data
  },

  /**
   * DELETE /membership-plans/{id} - Soft delete (Manager). Sold tickets keep their own snapshot; 409 while a ticket is pending/valid.
   */
  async deletePlan(id: string): Promise<void> {
    await apiClient.delete(`/membership-plans/${id}`)
  },

  /**
   * [3] PATCH /membership-plans/{id} - Update plan pricing and info
   */
  async updatePlan(id: string, payload: UpdateMembershipPlanPayload): Promise<MembershipPlan> {
    const res = await apiClient.patch<ApiSuccess<MembershipPlan>>(`/membership-plans/${id}`, payload)
    const data = res as unknown as ApiSuccess<MembershipPlan>
    return data.data
  },

  /**
   * [4] PATCH /membership-plans/{id}/status - Update plan active status
   */
  async updatePlanStatus(id: string, payload: UpdatePlanStatusPayload): Promise<MembershipPlan> {
    const res = await apiClient.patch<ApiSuccess<MembershipPlan>>(`/membership-plans/${id}/status`, payload)
    const data = res as unknown as ApiSuccess<MembershipPlan>
    return data.data
  },
}
