import { apiClient } from '@/shared/api/client'
import type { ApiSuccess } from '@/shared/types/api'
import type { PayoutPeriod } from '@/features/fixed-pt/types'
import type {
  RevenueReportData,
  PtPackagesReportData,
  BookingReportItem,
  CoachReportItem,
  CourseReportItem,
  EquipmentReportItem,
  ReportType,
} from '../types/reports.types'

export const reportsService = {
  /**
   * [1] GET /reports/revenue - Financial revenue statistics & split
   */
  async getRevenueReport(params?: { from?: string; to?: string }): Promise<RevenueReportData> {
    const res = params
      ? await apiClient.get<ApiSuccess<RevenueReportData>>('/reports/revenue', { params })
      : await apiClient.get<ApiSuccess<RevenueReportData>>('/reports/revenue')
    const data = res as unknown as ApiSuccess<RevenueReportData>
    return data.data ?? (data as unknown as RevenueReportData)
  },

  /**
   * [2] GET /reports/pt-packages - PT package sales and credit breakdown
   */
  async getPtPackagesReport(params?: { from?: string; to?: string }): Promise<PtPackagesReportData> {
    const res = await apiClient.get<ApiSuccess<PtPackagesReportData>>('/reports/pt-packages', params ? { params } : undefined)
    const data = res as unknown as ApiSuccess<PtPackagesReportData>
    return data.data ?? (data as unknown as PtPackagesReportData)
  },

  /**
   * [3] GET /reports/bookings - PT bookings grouped by status
   */
  async getBookingsReport(params?: { from?: string; to?: string }): Promise<BookingReportItem[]> {
    const res = await apiClient.get<ApiSuccess<BookingReportItem[]>>('/reports/bookings', params ? { params } : undefined)
    const data = res as unknown as ApiSuccess<BookingReportItem[]>
    return data.data ?? (data as unknown as BookingReportItem[])
  },

  /**
   * [4] GET /reports/coaches - Coach performance, ratings, and slot/booking counts
   */
  async getCoachesReport(): Promise<CoachReportItem[]> {
    const res = await apiClient.get<ApiSuccess<CoachReportItem[]>>('/reports/coaches')
    const data = res as unknown as ApiSuccess<CoachReportItem[]>
    return data.data ?? (data as unknown as CoachReportItem[])
  },

  /**
   * [5] GET /reports/courses - Course package demand and booking volume
   */
  async getCoursesReport(): Promise<CourseReportItem[]> {
    const res = await apiClient.get<ApiSuccess<CourseReportItem[]>>('/reports/courses')
    const data = res as unknown as ApiSuccess<CourseReportItem[]>
    return data.data ?? (data as unknown as CourseReportItem[])
  },

  /**
   * [6] GET /reports/equipment - Equipment status distribution
   */
  async getEquipmentReport(): Promise<EquipmentReportItem[]> {
    const res = await apiClient.get<ApiSuccess<EquipmentReportItem[]>>('/reports/equipment')
    const data = res as unknown as ApiSuccess<EquipmentReportItem[]>
    return data.data ?? (data as unknown as EquipmentReportItem[])
  },

  /**
   * [7] GET /reports/export - Download report as CSV or XLSX binary
   */
  async exportReport(params: {
    reportType: ReportType
    format: 'csv' | 'xlsx'
    from?: string
    to?: string
  }): Promise<Blob> {
    const res = await apiClient.get<Blob>('/reports/export', {
      params,
      responseType: 'blob',
    })
    return res as unknown as Blob
  },

  /**
   * [8] GET /coach-payout-periods - Coach payout periods of the per-session ledger.
   * The legacy per-order /coach-payouts table is no longer written by the backend.
   */
  async getCoachPayouts(params?: { status?: string; page?: number; limit?: number }): Promise<ApiSuccess<PayoutPeriod[]>> {
    const res = await apiClient.get<ApiSuccess<PayoutPeriod[]>>('/coach-payout-periods', { params })
    return res as unknown as ApiSuccess<PayoutPeriod[]>
  },

  /**
   * [9] POST /coach-payout-periods/{id}/mark-paid - Manager records the transfer of a LOCKED period
   */
  async markPaid(id: string, payload: { transferRef: string }): Promise<PayoutPeriod> {
    const res = await apiClient.post<ApiSuccess<PayoutPeriod>>(`/coach-payout-periods/${id}/mark-paid`, payload)
    const data = res as unknown as ApiSuccess<PayoutPeriod>
    return data.data ?? (data as unknown as PayoutPeriod)
  },
}
