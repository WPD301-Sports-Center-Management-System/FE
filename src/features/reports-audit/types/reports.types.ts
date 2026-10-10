import type { CoachPayout, ApiSuccess } from '@/shared/types/api'

export interface RevenueReportData {
  membershipRevenue: number
  ptGross: number
  ptGymShare: number
  coachPayable: number
  coachPending: number
  paymentCount: number
}

export interface PtPackagesReportData {
  sold: number
  creditsTotal: number
  creditsConsumed: number
  creditsAvailable: number
}

export interface BookingReportItem {
  status: string
  count: number
}

export interface CoachReportItem {
  id: string
  averageRating: number | string
  reviewCount: number
  user: {
    fullName: string
  }
  _count?: {
    coachAvailabilitySlotsCoachId: number
    ptBookingsCoachId: number
  }
}

export interface CourseReportItem {
  id: string
  name: string
  _count?: {
    ptPackagePurchasesCourseId: number
    ptBookingsCourseId: number
  }
}

export interface EquipmentReportItem {
  status: string
  _count: {
    id: number
  }
}

export type ReportType = 'revenue' | 'pt-packages' | 'bookings' | 'coaches' | 'courses' | 'equipment'

export type { CoachPayout, ApiSuccess }
