import { apiClient } from '@/shared/api/client'
import type { ApiSuccess, CoachPayout } from '@/shared/types/api'
import type { RevenueReportData } from '../types/reports.types'

export const reportsService = {
  /**
   * [1] GET /reports/revenue - Financial revenue statistics & split
   */
  async getRevenueReport(): Promise<RevenueReportData> {
    const res = await apiClient.get<ApiSuccess<RevenueReportData>>('/reports/revenue')
    const data = res as unknown as ApiSuccess<RevenueReportData>
    return data.data
  },

  /**
   * [2] GET /coach-payouts - List of coach payouts with settlement status
   */
  async getCoachPayouts(params?: { status?: string; page?: number; limit?: number }): Promise<ApiSuccess<CoachPayout[]>> {
    const res = await apiClient.get<ApiSuccess<CoachPayout[]>>('/coach-payouts', { params })
    return res as unknown as ApiSuccess<CoachPayout[]>
  },

  /**
   * [3] PATCH /coach-payouts/{id}/mark-paid - Manager marks coach payout as paid with transfer reference
   */
  async markPaid(id: string, payload: { transferRef: string }): Promise<CoachPayout> {
    const res = await apiClient.patch<ApiSuccess<CoachPayout>>(`/coach-payouts/${id}/mark-paid`, payload)
    const data = res as unknown as ApiSuccess<CoachPayout>
    return data.data ?? (data as unknown as CoachPayout)
  },
}
