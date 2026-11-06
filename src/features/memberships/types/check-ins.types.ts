import type { CheckIn } from '@/shared/types/api'

export interface CreateCheckInPayload {
  memberId: string
  note?: string
}

export interface CheckInQueryParams {
  page?: number
  limit?: number
  memberId?: string
  /** OPEN = still inside the gym. */
  status?: 'OPEN' | 'CLOSED' | 'AUTO_CLOSED' | 'LEGACY_IMPORTED'
}

export type { CheckIn }
