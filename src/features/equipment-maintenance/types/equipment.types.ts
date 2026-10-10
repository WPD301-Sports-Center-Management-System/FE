import type { Equipment, Maintenance, GymArea, ApiSuccess } from '@/shared/types/api'

export interface CreateEquipmentPayload {
  name: string
  equipmentCode: string
  gymAreaId: string
  brand?: string
  model?: string
  note?: string
}

export interface EquipmentQueryParams {
  page?: number
  limit?: number
  gymAreaId?: string
  status?: string
  search?: string
}

export type { Equipment, Maintenance, GymArea, ApiSuccess }
