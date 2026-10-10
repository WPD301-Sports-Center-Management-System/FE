import { apiClient } from '@/shared/api/client'
import type { ApiSuccess } from '@/shared/types/api'
import type { ManagerDashboardData } from '../types/dashboard.types'

export const dashboardService = {
  /**
   * GET /dashboard/manager - Retrieve high-level KPIs and operational metrics
   */
  async getManagerDashboardStats(): Promise<ManagerDashboardData> {
    const res = await apiClient.get<ApiSuccess<ManagerDashboardData>>('/dashboard/manager')
    const data = res as unknown as ApiSuccess<ManagerDashboardData>
    return data.data
  },
}
