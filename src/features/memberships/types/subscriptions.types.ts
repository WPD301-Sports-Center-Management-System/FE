import type { Subscription, SubscriptionStatus, MembershipPlan, ApiSuccess } from '@/shared/types/api'

export interface CreateSubscriptionPayload {
  memberId: string
  planId: string
  startDate?: string
}

export interface RenewSubscriptionPayload {
  planId?: string
  startDate?: string
}

export interface CancelSubscriptionPayload {
  reason: string
}

export interface SubscriptionQueryParams {
  page?: number
  limit?: number
  memberId?: string
  planId?: string
  status?: SubscriptionStatus
  search?: string
}

export interface SubscriptionDetail extends Subscription {
  plan?: MembershipPlan
  cancelledAt?: string | null
  cancellationReason?: string | null
  createdBy?: string
  createdAt?: string
  updatedAt?: string
  paymentsSubscriptionId?: unknown[]
  member?: {
    id: string
    memberCode: string
    fullName: string
    phone?: string
    email?: string
  }
}

export type { Subscription, SubscriptionStatus, ApiSuccess }
