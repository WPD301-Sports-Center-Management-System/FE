import { apiClient } from '@/shared/api/client'
import type { ApiSuccess } from '@/shared/types/api'
import type {
  ManagerDashboardData,
  ReceptionistDashboardData,
  CoachDashboardData,
  MemberDashboardData,
} from '../types/dashboard.types'

export const dashboardService = {
  /**
   * GET /dashboard/manager - Retrieve high-level KPIs and operational metrics
   */
  async getManagerDashboardStats(): Promise<ManagerDashboardData> {
    const res = await apiClient.get<ApiSuccess<ManagerDashboardData>>('/dashboard/manager')
    const data = res as unknown as ApiSuccess<ManagerDashboardData>
    return data.data
  },

  /**
   * GET /dashboard/receptionist - Retrieve operational summary for receptionist
   */
  async getReceptionistDashboard(): Promise<ReceptionistDashboardData> {
    const res = await apiClient.get<ApiSuccess<ReceptionistDashboardData>>('/dashboard/receptionist')
    const data = res as unknown as ApiSuccess<ReceptionistDashboardData>
    return data.data
  },

  /**
   * GET /dashboard/coach - Retrieve operational stats for logged-in coach
   */
  async getCoachDashboard(): Promise<CoachDashboardData> {
    const res = await apiClient.get<ApiSuccess<CoachDashboardData>>('/dashboard/coach')
    const data = res as unknown as ApiSuccess<CoachDashboardData>
    return data.data
  },

  /**
   * GET /dashboard/member - Retrieve operational overview for logged-in member
   */
  async getMemberDashboard(): Promise<MemberDashboardData> {
    const res = await apiClient.get<ApiSuccess<MemberDashboardData>>('/dashboard/member')
    const data = res as unknown as ApiSuccess<MemberDashboardData>
    return data.data
  },
}


