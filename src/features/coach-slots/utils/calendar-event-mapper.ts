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

      const memberName =
        (relatedBooking as any)?.member?.user?.fullName ||
        relatedBooking?.memberName ||
        (slot as any).booking?.member?.user?.fullName

      const courseName =
        (slot as any).offering?.course?.name ||
        slot.courseName ||
        (relatedBooking as any)?.course?.name ||
        relatedBooking?.courseName ||
        'PT 1:1'

      const coachName =
        (slot as any).coach?.user?.fullName ||
        slot.coachName ||
        (relatedBooking as any)?.coach?.user?.fullName ||
        relatedBooking?.coachName

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
        bookingId: relatedBooking?.id || (slot as any).booking?.id,
        memberName,
        courseName,
        coachName,
        note: slot.note,
        bookingStatus: relatedBooking?.status || (slot as any).booking?.status,
      }
    })
}
