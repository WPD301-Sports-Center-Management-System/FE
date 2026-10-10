import type { CoachPayout, ApiSuccess } from '@/shared/types/api'

export interface RevenueReportData {
  membershipRevenue: number
  ptGross: number
  ptGymShare: number
  coachPayable: number
  coachPending: number
  paymentCount: number
}

export type { CoachPayout, ApiSuccess }
