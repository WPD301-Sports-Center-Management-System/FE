import { apiClient } from '@/shared/api/client'
import type { MealPlan } from '@/shared/types/api'

export interface CreateMealPlanPayload {
  memberId: string
  ptPurchaseId?: string
  title: string
  description?: string
  dailyCalorieTarget?: number
  startDate: string
  endDate?: string
  medicalDisclaimer: string
}

export interface UpdateMealPlanPayload {
  title?: string
  description?: string
  dailyCalorieTarget?: number
  startDate?: string
  endDate?: string
  medicalDisclaimer?: string
}

export interface MealPlanItemPayload {
  dayNumber: number
  mealType: string
  foodName: string
  quantity?: string
  estimatedCalories?: number
  proteinGrams?: number
  carbsGrams?: number
  fatGrams?: number
  note?: string
  sortOrder?: number
}

export interface MealPlanQueryParams {
  memberId?: string
  status?: string
  page?: number
  limit?: number
}

export const mealPlansService = {
  /**
   * [1] GET /meal-plans - List meal plans
   */
  async getMealPlans(params?: MealPlanQueryParams): Promise<{ data: MealPlan[]; meta?: any }> {
    const res = (await apiClient.get('/meal-plans', { params })) as any
    const items = res?.data || res?.items || (Array.isArray(res) ? res : [])
    return { data: items, meta: res?.meta }
  },

  /**
   * [2] GET /meal-plans/:id - Get meal plan details with items
   */
  async getMealPlanById(id: string): Promise<MealPlan> {
    const res = (await apiClient.get(`/meal-plans/${id}`)) as any
    return (res?.data ?? res) as MealPlan
  },

  /**
   * [3] POST /meal-plans - Create DRAFT meal plan
   */
  async createMealPlan(payload: CreateMealPlanPayload): Promise<MealPlan> {
    const res = (await apiClient.post('/meal-plans', payload)) as any
    return (res?.data ?? res) as MealPlan
  },

  /**
   * [4] PATCH /meal-plans/:id - Update draft meal plan
   */
  async updateMealPlan(id: string, payload: UpdateMealPlanPayload): Promise<MealPlan> {
    const res = (await apiClient.patch(`/meal-plans/${id}`, payload)) as any
    return (res?.data ?? res) as MealPlan
  },

  /**
   * [5] POST /meal-plans/:id/assign - Assign meal plan to member (status becomes ACTIVE)
   */
  async assignMealPlan(id: string): Promise<MealPlan> {
    const res = (await apiClient.post(`/meal-plans/${id}/assign`, {})) as any
    return (res?.data ?? res) as MealPlan
  },

  /**
   * [6] POST /meal-plans/:id/items - Add meal item to draft plan
   */
  async addMealItem(planId: string, payload: MealPlanItemPayload): Promise<any> {
    const res = await apiClient.post(`/meal-plans/${planId}/items`, payload)
    return res?.data ?? res
  },

  /**
   * [7] PATCH /meal-plans/:id/items/:itemId - Update meal item in draft plan
   */
  async updateMealItem(planId: string, itemId: string, payload: Partial<MealPlanItemPayload>): Promise<any> {
    const res = await apiClient.patch(`/meal-plans/${planId}/items/${itemId}`, payload)
    return res?.data ?? res
  },

  /**
   * [8] DELETE /meal-plans/:id/items/:itemId - Delete meal item in draft plan
   */
  async deleteMealItem(planId: string, itemId: string): Promise<any> {
    const res = await apiClient.delete(`/meal-plans/${planId}/items/${itemId}`)
    return res?.data ?? res
  },

  /**
   * [9] POST /meal-plans/:id/days/:dayNumber/duplicate - Duplicate day meals to target day
   */
  async duplicateMealDay(planId: string, dayNumber: number, targetDayNumber: number): Promise<any> {
    const res = await apiClient.post(`/meal-plans/${planId}/days/${dayNumber}/duplicate`, { targetDayNumber })
    return res?.data ?? res
  },
}
