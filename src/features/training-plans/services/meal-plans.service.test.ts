import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mealPlansService } from './meal-plans.service'
import { apiClient } from '@/shared/api/client'

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('mealPlansService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('[1] calls GET /meal-plans with params', async () => {
    const mockPlans = [{ id: 'mp-1', title: 'Thực đơn tăng cơ', status: 'DRAFT' }]
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockPlans,
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    } as any)

    const result = await mealPlansService.getMealPlans({ status: 'DRAFT' })
    expect(apiClient.get).toHaveBeenCalledWith('/meal-plans', { params: { status: 'DRAFT' } })
    expect(result.data).toEqual(mockPlans)
  })

  it('[2] calls GET /meal-plans/:id for detail', async () => {
    const mockDetail = { id: 'mp-1', title: 'Thực đơn chi tiết', items: [] }
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockDetail,
    } as any)

    const result = await mealPlansService.getMealPlanById('mp-1')
    expect(apiClient.get).toHaveBeenCalledWith('/meal-plans/mp-1')
    expect(result).toEqual(mockDetail)
  })

  it('[3] calls POST /meal-plans to create draft', async () => {
    const payload = {
      memberId: 'mem-1',
      ptPurchaseId: 'purchase-1',
      title: 'Kế hoạch Calo 2000',
      dailyCalorieTarget: 2000,
      startDate: '2026-10-20',
      medicalDisclaimer: 'Cảnh báo y tế',
    }
    const created = { id: 'mp-1', ...payload, status: 'DRAFT' }
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      success: true,
      data: created,
    } as any)

    const result = await mealPlansService.createMealPlan(payload)
    expect(apiClient.post).toHaveBeenCalledWith('/meal-plans', payload)
    expect(result).toEqual(created)
  })

  it('[4] calls PATCH /meal-plans/:id to update draft', async () => {
    const updatePayload = { title: 'Tên mới' }
    const updated = { id: 'mp-1', title: 'Tên mới' }
    vi.mocked(apiClient.patch).mockResolvedValueOnce({
      success: true,
      data: updated,
    } as any)

    const result = await mealPlansService.updateMealPlan('mp-1', updatePayload)
    expect(apiClient.patch).toHaveBeenCalledWith('/meal-plans/mp-1', updatePayload)
    expect(result).toEqual(updated)
  })

  it('[5] calls POST /meal-plans/:id/assign to activate plan', async () => {
    const assigned = { id: 'mp-1', status: 'ACTIVE' }
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      success: true,
      data: assigned,
    } as any)

    const result = await mealPlansService.assignMealPlan('mp-1')
    expect(apiClient.post).toHaveBeenCalledWith('/meal-plans/mp-1/assign', {})
    expect(result).toEqual(assigned)
  })

  it('[6] calls POST /meal-plans/:id/items to add meal item', async () => {
    const itemPayload = {
      dayNumber: 1,
      mealType: 'Bữa sáng',
      foodName: 'Yến mạch',
      estimatedCalories: 400,
    }
    const createdItem = { id: 'item-1', ...itemPayload }
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      success: true,
      data: createdItem,
    } as any)

    const result = await mealPlansService.addMealItem('mp-1', itemPayload)
    expect(apiClient.post).toHaveBeenCalledWith('/meal-plans/mp-1/items', itemPayload)
    expect(result).toEqual(createdItem)
  })

  it('[7] calls PATCH /meal-plans/:id/items/:itemId to update meal item', async () => {
    const patchPayload = { foodName: 'Yến mạch sữa tươi' }
    const updatedItem = { id: 'item-1', foodName: 'Yến mạch sữa tươi' }
    vi.mocked(apiClient.patch).mockResolvedValueOnce({
      success: true,
      data: updatedItem,
    } as any)

    const result = await mealPlansService.updateMealItem('mp-1', 'item-1', patchPayload)
    expect(apiClient.patch).toHaveBeenCalledWith('/meal-plans/mp-1/items/item-1', patchPayload)
    expect(result).toEqual(updatedItem)
  })

  it('[8] calls DELETE /meal-plans/:id/items/:itemId to delete meal item', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({
      success: true,
      data: { deleted: true },
    } as any)

    const result = await mealPlansService.deleteMealItem('mp-1', 'item-1')
    expect(apiClient.delete).toHaveBeenCalledWith('/meal-plans/mp-1/items/item-1')
    expect(result).toEqual({ deleted: true })
  })

  it('[9] calls POST /meal-plans/:id/days/:dayNumber/duplicate to clone meals', async () => {
    const clonedMeals = [{ id: 'item-2', dayNumber: 2, foodName: 'Yến mạch' }]
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      success: true,
      data: clonedMeals,
    } as any)

    const result = await mealPlansService.duplicateMealDay('mp-1', 1, 2)
    expect(apiClient.post).toHaveBeenCalledWith('/meal-plans/mp-1/days/1/duplicate', {
      targetDayNumber: 2,
    })
    expect(result).toEqual(clonedMeals)
  })
})
