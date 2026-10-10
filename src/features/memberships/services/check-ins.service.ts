import { apiClient } from '@/shared/api/client'
import type { ApiSuccess, CheckIn } from '@/shared/types/api'
import type { CreateCheckInPayload, CheckInQueryParams } from '../types/check-ins.types'

export const checkInsService = {
  /**
   * [1] GET /check-ins - Retrieve list of check-in records with optional member filter and pagination
   */
  async getCheckIns(params?: CheckInQueryParams): Promise<ApiSuccess<CheckIn[]>> {
    const res = await apiClient.get<ApiSuccess<CheckIn[]>>('/check-ins', { params })
    return res as unknown as ApiSuccess<CheckIn[]>
  },

  /**
   * [2] POST /check-ins - Create a new check-in record for a member
   */
  async createCheckIn(payload: CreateCheckInPayload): Promise<CheckIn> {
    const res = await apiClient.post<ApiSuccess<CheckIn>>('/check-ins', payload)
    const data = res as unknown as ApiSuccess<CheckIn>
    return data.data
  },
}
