import type { CoachSlot, Booking } from '@/shared/types/api'
import type { SlotStatusFilter, CalendarEvent } from '../types/coach-slot-types'

export function mapSlotsToCalendarEvents(
  slots: CoachSlot[],
  bookings: Booking[] = [],
  filter: SlotStatusFilter = 'ALL'
): CalendarEvent[] {
  return slots
    .filter((slot) => {
      if (filter === 'ALL') return true
      return slot.status === filter
    })
    .map((slot) => {
      const relatedBooking = bookings.find(
        (b) => b.slotId === slot.id && b.status !== 'CANCELLED_EARLY' && b.status !== 'CANCELLED_LATE'
      )

      const memberName = relatedBooking?.memberName
      const courseName = slot.courseName || relatedBooking?.courseName || 'PT 1:1'
      const title =
        memberName ||
        (slot.status === 'OPEN'
          ? 'Khung giờ trống'
          : slot.status === 'BLOCKED'
          ? slot.note || 'Đã khóa'
          : courseName)

      return {
        id: slot.id,
        title,
        start: new Date(slot.startsAt),
        end: new Date(slot.endsAt),
        status: slot.status,
        bookingId: relatedBooking?.id,
        memberName,
        courseName,
        coachName: slot.coachName,
        note: slot.note,
        bookingStatus: relatedBooking?.status,
      }
    })
}
