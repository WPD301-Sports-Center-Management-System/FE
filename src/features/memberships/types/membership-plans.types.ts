import type { MembershipPlan } from '@/shared/types/api'

export type UpdateMembershipPlanPayload = {
  name?: string
  description?: string | null
  paidMonths?: number
  bonusMonths?: number
  price?: string
  benefits?: string[] | null
}

export type UpdatePlanStatusPayload = {
  isActive: boolean
}

export type MembershipPlanQueryParams = {
  isActive?: boolean
  page?: number
  limit?: number
  search?: string
}

export type { MembershipPlan }
