import { apiClient } from '@/shared/api/client'
import type { ApiSuccess, Equipment, GymArea, Maintenance } from '@/shared/types/api'
import type {
  CreateEquipmentPayload,
  UpdateEquipmentPayload,
  UpdateEquipmentStatusPayload,
  EquipmentQueryParams,
  CreateGymAreaPayload,
  UpdateGymAreaPayload,
  MaintenanceQueryParams,
  CreateMaintenancePayload,
  UpdateMaintenancePayload,
  CompleteMaintenancePayload,
} from '../types/equipment.types'

export const equipmentService = {
  // ================= GYM AREAS =================
  /**
   * [1] GET /gym-areas - List all gym zones and areas
   */
  async getGymAreas(params?: { page?: number; limit?: number }): Promise<ApiSuccess<GymArea[]>> {
    const res = params
      ? await apiClient.get<ApiSuccess<GymArea[]>>('/gym-areas', { params })
      : await apiClient.get<ApiSuccess<GymArea[]>>('/gym-areas')
    return res as unknown as ApiSuccess<GymArea[]>
  },

  /**
   * [2] POST /gym-areas - Create a new gym area
   */
  async createGymArea(payload: CreateGymAreaPayload): Promise<GymArea> {
    const res = await apiClient.post<ApiSuccess<GymArea>>('/gym-areas', payload)
    const data = res as unknown as ApiSuccess<GymArea>
    return data.data ?? (data as unknown as GymArea)
  },

  /**
   * [3] PATCH /gym-areas/:id - Update gym area info
   */
  async updateGymArea(id: string, payload: UpdateGymAreaPayload): Promise<GymArea> {
    const res = await apiClient.patch<ApiSuccess<GymArea>>(`/gym-areas/${id}`, payload)
    const data = res as unknown as ApiSuccess<GymArea>
    return data.data ?? (data as unknown as GymArea)
  },

  // ================= EQUIPMENT =================
  /**
   * [4] GET /equipment - List all equipment items with filters
   */
  async getEquipment(params?: EquipmentQueryParams): Promise<ApiSuccess<Equipment[]>> {
    const res = await apiClient.get<ApiSuccess<Equipment[]>>('/equipment', { params })
    return res as unknown as ApiSuccess<Equipment[]>
  },

  /**
   * [5] GET /equipment/:id - Get equipment details & maintenance history
   */
  async getEquipmentById(id: string): Promise<Equipment> {
    const res = await apiClient.get<ApiSuccess<Equipment>>(`/equipment/${id}`)
    const data = res as unknown as ApiSuccess<Equipment>
    return data.data ?? (data as unknown as Equipment)
  },

  /**
   * [6] POST /equipment - Add a new equipment item
   */
  async createEquipment(payload: CreateEquipmentPayload): Promise<Equipment> {
    const res = await apiClient.post<ApiSuccess<Equipment>>('/equipment', payload)
    const data = res as unknown as ApiSuccess<Equipment>
    return data.data ?? (data as unknown as Equipment)
  },

  /**
   * [7] PATCH /equipment/:id - Update equipment info
   */
  async updateEquipment(id: string, payload: UpdateEquipmentPayload): Promise<Equipment> {
    const res = await apiClient.patch<ApiSuccess<Equipment>>(`/equipment/${id}`, payload)
    const data = res as unknown as ApiSuccess<Equipment>
    return data.data ?? (data as unknown as Equipment)
  },

  /**
   * [8] PATCH /equipment/:id/status - Update equipment operational status
   */
  async updateEquipmentStatus(id: string, payload: UpdateEquipmentStatusPayload): Promise<Equipment> {
    const res = await apiClient.patch<ApiSuccess<Equipment>>(`/equipment/${id}/status`, payload)
    const data = res as unknown as ApiSuccess<Equipment>
    return data.data ?? (data as unknown as Equipment)
  },

  // ================= MAINTENANCE SCHEDULES =================
  /**
   * [9] GET /maintenance-schedules - List maintenance tasks
   */
  async getMaintenanceSchedules(params?: MaintenanceQueryParams): Promise<ApiSuccess<Maintenance[]>> {
    const res = await apiClient.get<ApiSuccess<Maintenance[]>>('/maintenance-schedules', { params })
    return res as unknown as ApiSuccess<Maintenance[]>
  },

  /**
   * [10] POST /maintenance-schedules - Schedule equipment maintenance
   */
  async createMaintenanceSchedule(payload: CreateMaintenancePayload): Promise<Maintenance> {
    const res = await apiClient.post<ApiSuccess<Maintenance>>('/maintenance-schedules', payload)
    const data = res as unknown as ApiSuccess<Maintenance>
    return data.data ?? (data as unknown as Maintenance)
  },

  /**
   * [11] PATCH /maintenance-schedules/:id - Update scheduled maintenance
   */
  async updateMaintenanceSchedule(id: string, payload: UpdateMaintenancePayload): Promise<Maintenance> {
    const res = await apiClient.patch<ApiSuccess<Maintenance>>(`/maintenance-schedules/${id}`, payload)
    const data = res as unknown as ApiSuccess<Maintenance>
    return data.data ?? (data as unknown as Maintenance)
  },

  /**
   * [12] POST /maintenance-schedules/:id/complete - Mark maintenance as completed
   */
  async completeMaintenanceSchedule(id: string, payload: CompleteMaintenancePayload): Promise<Maintenance> {
    const res = await apiClient.post<ApiSuccess<Maintenance>>(`/maintenance-schedules/${id}/complete`, payload)
    const data = res as unknown as ApiSuccess<Maintenance>
    return data.data ?? (data as unknown as Maintenance)
  },
}
