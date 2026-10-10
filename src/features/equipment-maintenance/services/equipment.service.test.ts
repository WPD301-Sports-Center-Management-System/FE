import { describe, it, expect, vi, beforeEach } from 'vitest'
import { equipmentService } from './equipment.service'
import { apiClient } from '@/shared/api/client'

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('equipmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('[1] calls GET /equipment with query params', async () => {
    const mockEq = [{ id: 'eq-1', name: 'Treadmill Commercial', equipmentCode: 'EQ-TM-01' }]
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockEq,
    } as any)

    const res = await equipmentService.getEquipment({ limit: 10 })
    expect(apiClient.get).toHaveBeenCalledWith('/equipment', { params: { limit: 10 } })
    expect(res.data).toEqual(mockEq)
  })

  it('[2] calls GET /gym-areas', async () => {
    const mockAreas = [{ id: 'area-1', name: 'Free Weights', location: 'Tầng 1' }]
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockAreas,
    } as any)

    const res = await equipmentService.getGymAreas()
    expect(apiClient.get).toHaveBeenCalledWith('/gym-areas')
    expect(res.data).toEqual(mockAreas)
  })

  it('[3] calls POST /equipment', async () => {
    const payload = {
      name: 'Dumbbell 12kg',
      equipmentCode: 'EQ-DB-12',
      gymAreaId: 'area-1',
    }
    const created = { id: 'eq-created', ...payload, status: 'AVAILABLE' }
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      success: true,
      data: created,
    } as any)

    const res = await equipmentService.createEquipment(payload)
    expect(apiClient.post).toHaveBeenCalledWith('/equipment', payload)
    expect(res).toEqual(created)
  })
})
