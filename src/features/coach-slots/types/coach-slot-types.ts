import type { SlotStatus, PtBookingStatus } from '@/shared/types/api'
import type { View } from 'react-big-calendar'

export type SlotViewMode = View
export type SlotStatusFilter = 'ALL' | 'OPEN' | 'BOOKED' | 'BLOCKED'

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  status: SlotStatus
  bookingId?: string
  memberName?: string
  courseName?: string
  coachName?: string
  note?: string
  bookingStatus?: PtBookingStatus
}

export type SlotCalendarEventProps = Partial<CalendarEvent>

export interface CreateSlotInput {
  date: string
  startTime: string
  endTime: string
  offeringId: string
  note?: string
}

export interface BulkCreateSlotInput {
  startTime: string
  endTime: string
  offeringId: string
  daysOfWeek: number[] // 1 = Monday, 2 = Tuesday, etc.
  startDate: string
  endDate: string
  note?: string
}

export interface BlockSlotInput {
  slotId: string
  reason?: string
}

export interface QuickBulkCreateSlotsInput {
  courseOfferingId: string
  date?: string
  startDate?: string
  endDate?: string
  daysOfWeek?: number[] // 1 = Monday ... 7 = Sunday
  slotIndexes: number[] // 1 .. 7
  note?: string
}

