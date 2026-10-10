import type { Purchase, PtPurchaseStatus, PaymentMethod } from '@/shared/types/api'

export interface CreatePtPurchasePayload {
  memberId?: string
  courseId: string
  coachId: string
  packageOptionId: string
}

export interface PtPurchaseQueryParams {
  memberId?: string
  coachId?: string
  status?: PtPurchaseStatus
  page?: number
  limit?: number
}

export interface MakeupEntitlement {
  id: string
  purchaseId: string
  sourceBookingId: string
  completedBookingId?: string | null
  originalStartsAt: string
  status: 'PENDING' | 'BOOKED' | 'COMPLETED' | 'FORFEITED'
  appliedExtensionDays: number
  createdAt: string
  sourceBooking?: {
    id: string
    slot?: {
      startsAt: string
      endsAt: string
    }
  }
  completedBooking?: {
    id: string
    slot?: {
      startsAt: string
      endsAt: string
    }
  }
}

export interface PurchaseDetail extends Purchase {
  paymentsPtPurchaseId?: Array<{
    id: string
    paymentCode: string
    amount: string
    method: PaymentMethod
    status: string
    paidAt?: string
  }>
  course?: {
    id: string
    name: string
  }
  coach?: {
    id: string
    user?: {
      fullName: string
      email?: string
      phone?: string
    }
  }
  member?: {
    id: string
    memberCode: string
    user?: {
      fullName: string
      email?: string
      phone?: string
    }
  }
}

export interface CreateReviewPayload {
  rating: number
  comment?: string
}

export interface CancelPurchasePayload {
  reason: string
}
