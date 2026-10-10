import type { Equipment, Maintenance, GymArea, ApiSuccess, EquipmentStatus, MaintenanceStatus } from '@/shared/types/api'

export interface CreateGymAreaPayload {
  name: string
  location?: string
  description?: string
}

export interface UpdateGymAreaPayload {
  name?: string
  location?: string
  description?: string
  isActive?: boolean
}

export interface CreateEquipmentPayload {
  name: string
  equipmentCode: string
  gymAreaId: string
  brand?: string
  model?: string
  purchaseDate?: string
  note?: string
}

export interface UpdateEquipmentPayload {
  gymAreaId?: string
  name?: string
  brand?: string
  model?: string
  purchaseDate?: string
  note?: string
}

export interface UpdateEquipmentStatusPayload {
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'OUT_OF_SERVICE'
}

export interface EquipmentQueryParams {
  page?: number
  limit?: number
  gymAreaId?: string
  status?: string
  search?: string
}

export interface MaintenanceQueryParams {
  page?: number
  limit?: number
  equipmentId?: string
  status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
}

export interface CreateMaintenancePayload {
  equipmentId: string
  scheduledAt: string
  description: string
  handledBy?: string
}

export interface UpdateMaintenancePayload {
  scheduledAt?: string
  description?: string
  handledBy?: string | null
  status?: 'SCHEDULED' | 'IN_PROGRESS' | 'CANCELLED'
}

export interface CompleteMaintenancePayload {
  resultNote?: string
  nextMaintenanceAt?: string
}

export type { Equipment, Maintenance, GymArea, ApiSuccess, EquipmentStatus, MaintenanceStatus }
