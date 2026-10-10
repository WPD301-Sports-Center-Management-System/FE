import type { CheckIn } from '@/shared/types/api'

export interface CreateCheckInPayload {
  memberId: string
  note?: string
}

export interface CheckInQueryParams {
  page?: number
  limit?: number
  memberId?: string
}

export type { CheckIn }
