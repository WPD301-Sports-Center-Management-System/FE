import { apiClient } from '@/shared/api/client'
import type { ApiSuccess, Equipment, GymArea } from '@/shared/types/api'
import type { CreateEquipmentPayload, EquipmentQueryParams } from '../types/equipment.types'

export const equipmentService = {
  /**
   * [1] GET /equipment - List all equipment items
   */
  async getEquipment(params?: EquipmentQueryParams): Promise<ApiSuccess<Equipment[]>> {
    const res = await apiClient.get<ApiSuccess<Equipment[]>>('/equipment', { params })
    return res as unknown as ApiSuccess<Equipment[]>
  },

  /**
   * [2] GET /gym-areas - List all gym zones and areas
   */
  async getGymAreas(): Promise<ApiSuccess<GymArea[]>> {
    const res = await apiClient.get<ApiSuccess<GymArea[]>>('/gym-areas')
    return res as unknown as ApiSuccess<GymArea[]>
  },

  /**
   * [3] POST /equipment - Add a new equipment item
   */
  async createEquipment(payload: CreateEquipmentPayload): Promise<Equipment> {
    const res = await apiClient.post<ApiSuccess<Equipment>>('/equipment', payload)
    const data = res as unknown as ApiSuccess<Equipment>
    return data.data
  },
}
