import { describe, it, expect } from 'vitest'
import { mapSlotsToCalendarEvents } from './calendar-event-mapper'
import type { CoachSlot, Booking } from '@/shared/types/api'

describe('calendar-event-mapper', () => {
  const mockSlots: CoachSlot[] = [
    {
      id: 'slt-1',
      coachId: 'coa-1',
      offeringId: 'off-1',
      startsAt: '2026-10-09T08:00:00+07:00',
      endsAt: '2026-10-09T09:00:00+07:00',
      status: 'OPEN',
      courseName: 'Cardio & Fitness',
    },
    {
      id: 'slt-2',
      coachId: 'coa-1',
      offeringId: 'off-1',
      startsAt: '2026-10-09T09:00:00+07:00',
      endsAt: '2026-10-09T10:00:00+07:00',
      status: 'BOOKED',
      courseName: 'Hypertrophy & Strength',
    },
    {
      id: 'slt-3',
      coachId: 'coa-1',
      offeringId: 'off-1',
      startsAt: '2026-10-09T10:00:00+07:00',
      endsAt: '2026-10-09T11:00:00+07:00',
      status: 'BLOCKED',
      note: 'Họp ban huấn luyện',
    },
    {
      id: 'slt-4',
      coachId: 'coa-1',
      offeringId: 'off-1',
      startsAt: '2026-10-09T14:00:00+07:00',
      endsAt: '2026-10-09T15:00:00+07:00',
      status: 'COMPLETED',
    },
    {
      id: 'slt-5',
      coachId: 'coa-1',
      offeringId: 'off-1',
      startsAt: '2026-10-09T15:00:00+07:00',
      endsAt: '2026-10-09T16:00:00+07:00',
      status: 'CANCELLED',
    },
  ]

  const mockBookings: Booking[] = [
    {
      id: 'bkg-1',
      purchaseId: 'pur-1',
      slotId: 'slt-2',
      memberId: 'mem-1',
      coachId: 'coa-1',
      courseId: 'crs-1',
      status: 'CONFIRMED',
      startsAt: '2026-10-09T09:00:00+07:00',
      endsAt: '2026-10-09T10:00:00+07:00',
      creditReturned: false,
      memberName: 'Nguyễn Văn A',
    },
  ]

  it('correctly maps slots to CalendarEvent with JavaScript Date objects', () => {
    const events = mapSlotsToCalendarEvents(mockSlots, mockBookings, 'ALL')
    expect(events).toHaveLength(5)

    const bookedEvent = events.find((e) => e.id === 'slt-2')
    expect(bookedEvent).toBeDefined()
    expect(bookedEvent?.title).toBe('Nguyễn Văn A')
    expect(bookedEvent?.memberName).toBe('Nguyễn Văn A')
    expect(bookedEvent?.status).toBe('BOOKED')
    expect(bookedEvent?.bookingId).toBe('bkg-1')
    expect(bookedEvent?.start).toBeInstanceOf(Date)
    expect(bookedEvent?.end).toBeInstanceOf(Date)

    const openEvent = events.find((e) => e.id === 'slt-1')
    expect(openEvent?.title).toBe('Khung giờ trống')
    expect(openEvent?.status).toBe('OPEN')
    expect(openEvent?.start).toBeInstanceOf(Date)

    const blockedEvent = events.find((e) => e.id === 'slt-3')
    expect(blockedEvent?.title).toBe('Họp ban huấn luyện')
    expect(blockedEvent?.status).toBe('BLOCKED')
  })

  it('filters events accurately by status', () => {
    const openOnly = mapSlotsToCalendarEvents(mockSlots, mockBookings, 'OPEN')
    expect(openOnly).toHaveLength(1)
    expect(openOnly[0].id).toBe('slt-1')

    const bookedOnly = mapSlotsToCalendarEvents(mockSlots, mockBookings, 'BOOKED')
    expect(bookedOnly).toHaveLength(1)
    expect(bookedOnly[0].id).toBe('slt-2')

    const blockedOnly = mapSlotsToCalendarEvents(mockSlots, mockBookings, 'BLOCKED')
    expect(blockedOnly).toHaveLength(1)
    expect(blockedOnly[0].id).toBe('slt-3')
  })
})
