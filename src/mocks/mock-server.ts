import { mockUsers, mockMembers, mockCoaches, mockMembershipPlans, mockSubscriptions, mockCheckIns } from './fixtures-base'
import {
  mockMuscleGroups,
  mockExercises,
  mockCourses,
  mockOfferings,
  mockPackageOptions,
  mockPurchases,
  mockSlots,
  mockBookings,
  mockPayments,
  mockInvoices,
  mockCoachPayouts,
  mockTrainingPlans,
  mockTrainingResults,
  mockAssessments,
  mockFitnessGoals,
  mockGymAreas,
  mockEquipment,
  mockMaintenance,
  mockReviews,
  mockSupportRequests,
  mockAuditLogs,
} from './fixtures-training'
import { isBeforeCutoff } from '@/shared/utils/date'

// In-Memory state store supporting interactive state mutations in Mock mode
export const db = {
  users: [...mockUsers],
  members: [...mockMembers],
  coaches: [...mockCoaches],
  plans: [...mockMembershipPlans],
  subscriptions: [...mockSubscriptions],
  checkIns: [...mockCheckIns],
  muscleGroups: [...mockMuscleGroups],
  exercises: [...mockExercises],
  courses: [...mockCourses],
  offerings: [...mockOfferings],
  packageOptions: [...mockPackageOptions],
  purchases: [...mockPurchases],
  slots: [...mockSlots],
  bookings: [...mockBookings],
  payments: [...mockPayments],
  invoices: [...mockInvoices],
  payouts: [...mockCoachPayouts],
  trainingPlans: [...mockTrainingPlans],
  trainingResults: [...mockTrainingResults],
  assessments: [...mockAssessments],
  goals: [...mockFitnessGoals],
  gymAreas: [...mockGymAreas],
  equipment: [...mockEquipment],
  maintenance: [...mockMaintenance],
  reviews: [...mockReviews],
  support: [...mockSupportRequests],
  auditLogs: [...mockAuditLogs],
}

export function mockPaginate<T>(items: T[], page = 1, limit = 20) {
  const total = items.length
  const totalPages = Math.ceil(total / limit) || 1
  const start = (page - 1) * limit
  const data = items.slice(start, start + limit)
  return { data, meta: { page, limit, total, totalPages } }
}

export function handleMockBookingCancel(bookingId: string, role: string, reason?: string) {
  const b = db.bookings.find((item) => item.id === bookingId)
  if (!b) throw new Error('Booking không tồn tại')

  if (role === 'COACH') {
    b.status = 'COACH_CANCELLED'
    b.creditReturned = true
    // Refund credit to purchase
    const pur = db.purchases.find((p) => p.id === b.purchaseId)
    if (pur) pur.availableCredits += 1
    return { booking: b, effect: 'RETURN', message: `HLV đã hủy buổi tập. Lý do: ${reason || 'Việc đột xuất'}. Buổi tập đã hoàn lại cho hội viên.` }
  }

  const eligible = isBeforeCutoff(b.startsAt, 4)
  if (eligible) {
    b.status = 'CANCELLED_EARLY'
    b.creditReturned = true
    const pur = db.purchases.find((p) => p.id === b.purchaseId)
    if (pur) pur.availableCredits += 1
    return { booking: b, effect: 'RETURN', message: 'Hủy trước 4 giờ: Buổi tập đã được hoàn lại thành công!' }
  } else {
    b.status = 'CANCELLED_LATE'
    b.creditReturned = false
    const pur = db.purchases.find((p) => p.id === b.purchaseId)
    if (pur) pur.consumedCredits += 1
    return { booking: b, effect: 'CONSUME', message: 'Hủy sát giờ (< 4 giờ): Buổi tập bị tính phí và trừ lượt.' }
  }
}
