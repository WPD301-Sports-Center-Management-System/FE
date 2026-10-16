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

  it('correctly maps slots to CalendarEvent with JavaScript Date objects on timetable', () => {
    const events = mapSlotsToCalendarEvents(mockSlots, mockBookings, 'ALL')
    // On the timetable (ALL view): only booked/completed sessions and blocked times appear as cards (slt-2, slt-3, slt-4).
    // Unbooked OPEN (slt-1) and CANCELLED (slt-5) do not clutter the timetable.
    expect(events).toHaveLength(3)

    const bookedEvent = events.find((e) => e.id === 'slt-2')
    expect(bookedEvent).toBeDefined()
    expect(bookedEvent?.title).toBe('Nguyễn Văn A')
    expect(bookedEvent?.memberName).toBe('Nguyễn Văn A')
    expect(bookedEvent?.status).toBe('BOOKED')
    expect(bookedEvent?.bookingId).toBe('bkg-1')
    expect(bookedEvent?.start).toBeInstanceOf(Date)
    expect(bookedEvent?.end).toBeInstanceOf(Date)

    const blockedEvent = events.find((e) => e.id === 'slt-3')
    expect(blockedEvent?.title).toBe('Họp ban huấn luyện')
    expect(blockedEvent?.status).toBe('BLOCKED')

    const completedEvent = events.find((e) => e.id === 'slt-4')
    expect(completedEvent).toBeDefined()
    expect(completedEvent?.status).toBe('COMPLETED')
  })

  it('filters events accurately by status', () => {
    const openOnly = mapSlotsToCalendarEvents(mockSlots, mockBookings, 'OPEN')
    expect(openOnly).toHaveLength(1)
    expect(openOnly[0].id).toBe('slt-1')
    expect(openOnly[0].title).toBe('Khung giờ trống')
    expect(openOnly[0].status).toBe('OPEN')

    const bookedOnly = mapSlotsToCalendarEvents(mockSlots, mockBookings, 'BOOKED')
    expect(bookedOnly).toHaveLength(2)
    expect(bookedOnly.map((e) => e.id)).toEqual(['slt-2', 'slt-4'])

    const blockedOnly = mapSlotsToCalendarEvents(mockSlots, mockBookings, 'BLOCKED')
    expect(blockedOnly).toHaveLength(1)
    expect(blockedOnly[0].id).toBe('slt-3')
  })
})
