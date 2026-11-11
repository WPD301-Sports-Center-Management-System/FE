import { apiClient } from '@/shared/api/client'
import type { ApiSuccess } from '@/shared/types/api'
import type { Withdrawal } from '@/features/fixed-pt/wallet-api'
import type {
  RevenueReportData,
  PtPackagesReportData,
  BookingReportItem,
  CoachReportItem,
  CourseReportItem,
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

  /** GET /coach-withdrawals - Manager: Coach withdrawal requests (REQUESTED waits for the bank transfer). */
  async getCoachWithdrawals(params?: { status?: string; page?: number; limit?: number }): Promise<ApiSuccess<Withdrawal[]>> {
    const res = await apiClient.get<ApiSuccess<Withdrawal[]>>('/coach-withdrawals', { params })
    return res as unknown as ApiSuccess<Withdrawal[]>
  },
}
