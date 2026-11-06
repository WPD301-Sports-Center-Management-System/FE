import { describe, it, expect, vi, beforeEach } from 'vitest'
import { membershipPlansService } from './membership-plans.service'
import { apiClient } from '@/shared/api/client'

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('membershipPlansService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('[1] calls GET /membership-plans with query params', async () => {
    const mockPlans = [
      { id: 'p-1', code: 'GYM_1M', name: 'Vé 1 Tháng', price: '330000', isActive: true },
    ]
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockPlans,
    } as any)

    const result = await membershipPlansService.getPlans({ isActive: true })
    expect(apiClient.get).toHaveBeenCalledWith('/membership-plans', { params: { isActive: true } })
    expect(result.data).toEqual(mockPlans)
  })

  it('[2] calls GET /membership-plans/:id', async () => {
    const mockPlan = { id: 'p-1', code: 'GYM_1M', name: 'Vé 1 Tháng', price: '330000' }
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockPlan,
    } as any)

    const result = await membershipPlansService.getPlanById('p-1')
    expect(apiClient.get).toHaveBeenCalledWith('/membership-plans/p-1')
    expect(result).toEqual(mockPlan)
  })

  it('[3] calls PATCH /membership-plans/:id to update plan price', async () => {
    const mockUpdated = { id: 'p-1', code: 'GYM_1M', name: 'Vé 1 Tháng', price: '350000' }
    vi.mocked(apiClient.patch).mockResolvedValueOnce({
      success: true,
      data: mockUpdated,
    } as any)

    const result = await membershipPlansService.updatePlan('p-1', { price: '350000' })
    expect(apiClient.patch).toHaveBeenCalledWith('/membership-plans/p-1', { price: '350000' })
    expect(result).toEqual(mockUpdated)
  })

  it('[4] calls PATCH /membership-plans/:id/status to toggle status', async () => {
    const mockUpdated = { id: 'p-1', code: 'GYM_1M', isActive: false }
    vi.mocked(apiClient.patch).mockResolvedValueOnce({
      success: true,
      data: mockUpdated,
    } as any)

    const result = await membershipPlansService.updatePlanStatus('p-1', { isActive: false })
    expect(apiClient.patch).toHaveBeenCalledWith('/membership-plans/p-1/status', { isActive: false })
    expect(result).toEqual(mockUpdated)
  })
})
