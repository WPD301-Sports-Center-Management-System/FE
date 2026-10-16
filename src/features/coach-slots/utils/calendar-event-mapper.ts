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
        (slot as any).booking?.member?.user?.fullName ||
        slot.memberName

      const bookingCode =
        relatedBooking?.bookingCode ||
        (slot as any).booking?.bookingCode ||
        slot.bookingCode

      const memberPhone =
        (relatedBooking as any)?.member?.user?.phone ||
        (slot as any).booking?.member?.user?.phone ||
        slot.memberPhone

      const memberEmail =
        (relatedBooking as any)?.member?.user?.email ||
        (slot as any).booking?.member?.user?.email ||
        slot.memberEmail

      const memberAvatar =
        (relatedBooking as any)?.member?.user?.avatarUrl ||
        (slot as any).booking?.member?.user?.avatarUrl ||
        slot.memberAvatar

      const memberCode =
        (relatedBooking as any)?.member?.memberCode ||
        (slot as any).booking?.member?.memberCode ||
        slot.memberCode

      const fitnessLevel =
        (relatedBooking as any)?.member?.fitnessLevel ||
        (slot as any).booking?.member?.fitnessLevel ||
        slot.fitnessLevel

      const medicalNotes =
        (relatedBooking as any)?.member?.medicalNotes ||
        (slot as any).booking?.member?.medicalNotes ||
        slot.medicalNotes

      const packageName =
        (relatedBooking as any)?.purchase?.packageNameSnapshot ||
        (slot as any).booking?.purchase?.packageNameSnapshot ||
        slot.packageName

      const totalCredits =
        (relatedBooking as any)?.purchase?.totalCredits ??
        (slot as any).booking?.purchase?.totalCredits ??
        slot.totalCredits

      const consumedCredits =
        (relatedBooking as any)?.purchase?.consumedCredits ??
        (slot as any).booking?.purchase?.consumedCredits ??
        slot.consumedCredits

      const remainingCredits =
        (relatedBooking as any)?.purchase?.remainingCredits ??
        (slot as any).booking?.purchase?.remainingCredits ??
        slot.remainingCredits

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
        bookingId: relatedBooking?.id || (slot as any).booking?.id || slot.bookingId,
        bookingCode,
        memberName,
        memberPhone,
        memberEmail,
        memberAvatar,
        memberCode,
        fitnessLevel,
        medicalNotes,
        packageName,
        totalCredits,
        consumedCredits,
        remainingCredits,
        courseName,
        coachName,
        note: slot.note,
        bookingStatus: relatedBooking?.status || (slot as any).booking?.status || slot.bookingStatus,
      }
    })
}
