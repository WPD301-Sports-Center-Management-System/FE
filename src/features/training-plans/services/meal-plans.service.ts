import { apiClient } from '@/shared/api/client'
import type { MealPlan } from '@/shared/types/api'

export interface CreateMealPlanPayload {
  repeatWeekly?: boolean
  daySettings?: Record<number, { calories: number; mealCount: number }>
  memberId: string
  ptPurchaseId?: string
  title: string
  description?: string
  dailyCalorieTarget?: number
  startDate: string
  endDate?: string | null
  medicalDisclaimer: string
}

export interface UpdateMealPlanPayload {
  repeatWeekly?: boolean
  daySettings?: Record<number, { calories: number; mealCount: number }>
  title?: string
  description?: string
  dailyCalorieTarget?: number
  startDate?: string
  endDate?: string | null
  medicalDisclaimer?: string
}

/** One food of the center library; nutrition is per one serving. */
export interface FoodItem {
  id: string
  name: string
  category?: string | null
  servingLabel: string
  calories: number
  proteinGrams: number | string
  carbsGrams: number | string
  fatGrams: number | string
  isActive: boolean
}

export interface MealTemplateItem {
  id?: string
  dayNumber: number
  mealType: string
  foodItemId?: string | null
  foodName: string
  servings: number | string
  quantity?: string | null
  estimatedCalories?: number | null
  proteinGrams?: number | string | null
  carbsGrams?: number | string | null
  fatGrams?: number | string | null
  note?: string | null
  sortOrder?: number
}

export interface MealTemplate {
  id: string
  scope: 'CENTER' | 'COACH'
  coachId?: string | null
  title: string
  description?: string | null
  goalTag?: string | null
  dailyCalorieTarget: number
  dayCount: number
  isActive: boolean
  itemCount?: number
  mine?: boolean
  items?: MealTemplateItem[]
}

export interface CalorieSuggestion {
  suggestion: { age: number; sex: 'M' | 'F'; bmr: number; maintain: number; fatLoss: number; muscleGain: number } | null
  weightKg: number | null
  heightCm: number | null
  missing: string[]
}

export interface TemplatePayload {
  title: string
  description?: string
  goalTag?: string
  dailyCalorieTarget?: number
  items: { dayNumber: number; mealType: string; foodItemId?: string; servings?: number; foodName?: string; quantity?: string; estimatedCalories?: number; note?: string; sortOrder?: number }[]
}

export const GOAL_TAG_LABEL: Record<string, string> = { FAT_LOSS: 'Giảm mỡ', MAINTAIN: 'Duy trì', MUSCLE_GAIN: 'Tăng cơ', VEGETARIAN: 'Ăn chay' }

/** Library food × servings, the same rule the server applies. */
export function foodLine(food: FoodItem, servings: number) {
  const r1 = (n: number) => Math.round(n * 10) / 10
  return {
    estimatedCalories: Math.round(food.calories * servings),
    proteinGrams: r1(Number(food.proteinGrams) * servings),
    carbsGrams: r1(Number(food.carbsGrams) * servings),
    fatGrams: r1(Number(food.fatGrams) * servings),
  }
}

export interface MealPlanItemPayload {
  dayNumber: number
  mealType: string
  foodItemId?: string
  servings?: number
  foodName?: string
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

export interface MealDayRequest { dayNumber: number; calories: number; mealCount: number }
export interface SuggestedMealDay { dayNumber: number; calories: number; meals: MealPlanItemPayload[] }

export const mealPlansService = {
  async suggestDays(payload: { memberId: string; context?: string; days: MealDayRequest[] }): Promise<SuggestedMealDay[]> {
    const res = await apiClient.post('/meal-plan-suggestions', payload, { timeout: 60_000 }) as any
    return res?.data ?? res
  },
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

  /** POST /meal-plans/:id/duplicate - Copy a plan (with all items) into a new DRAFT */
  async duplicateMealPlan(id: string): Promise<MealPlan> {
    const res = (await apiClient.post(`/meal-plans/${id}/duplicate`, {})) as any
    return (res?.data ?? res) as MealPlan
  },

  /** POST /meal-plans/:id/archive - Retire a plan; the member stops seeing it as current */
  async archiveMealPlan(id: string): Promise<MealPlan> {
    const res = (await apiClient.post(`/meal-plans/${id}/archive`, {})) as any
    return (res?.data ?? res) as MealPlan
  },

  // ---- Food library and templates ----
  async getFoodItems(params?: { search?: string; category?: string; includeInactive?: boolean }): Promise<FoodItem[]> {
    const res = (await apiClient.get('/food-items', { params })) as any
    return (res?.data ?? res ?? []) as FoodItem[]
  },
  async createFoodItem(payload: Omit<FoodItem, 'id' | 'isActive'>): Promise<FoodItem> {
    const res = (await apiClient.post('/food-items', payload)) as any
    return (res?.data ?? res) as FoodItem
  },
  async updateFoodItem(id: string, payload: Partial<Omit<FoodItem, 'id'>>): Promise<FoodItem> {
    const res = (await apiClient.patch(`/food-items/${id}`, payload)) as any
    return (res?.data ?? res) as FoodItem
  },
  async getTemplates(params?: { includeInactive?: boolean }): Promise<MealTemplate[]> {
    const res = (await apiClient.get('/meal-plan-templates', { params })) as any
    return (res?.data ?? res ?? []) as MealTemplate[]
  },
  async getTemplate(id: string): Promise<MealTemplate> {
    const res = (await apiClient.get(`/meal-plan-templates/${id}`)) as any
    return (res?.data ?? res) as MealTemplate
  },
  async createTemplate(payload: TemplatePayload): Promise<MealTemplate> {
    const res = (await apiClient.post('/meal-plan-templates', payload)) as any
    return (res?.data ?? res) as MealTemplate
  },
  async replaceTemplate(id: string, payload: TemplatePayload): Promise<MealTemplate> {
    const res = (await apiClient.put(`/meal-plan-templates/${id}`, payload)) as any
    return (res?.data ?? res) as MealTemplate
  },
  async setTemplateActive(id: string, isActive: boolean): Promise<MealTemplate> {
    const res = (await apiClient.patch(`/meal-plan-templates/${id}/status`, { isActive })) as any
    return (res?.data ?? res) as MealTemplate
  },
  /** Creates a DRAFT plan for the Member with portions scaled to the requested daily kcal. */
  async createFromTemplate(payload: { templateId: string; memberId: string; ptPurchaseId?: string; startDate: string; endDate?: string; dailyCalorieTarget?: number; title?: string }): Promise<MealPlan> {
    const res = (await apiClient.post('/meal-plans/from-template', payload)) as any
    return (res?.data ?? res) as MealPlan
  },
  async saveAsTemplate(planId: string, payload: { title: string; description?: string; goalTag?: string }): Promise<MealTemplate> {
    const res = (await apiClient.post(`/meal-plans/${planId}/save-as-template`, payload)) as any
    return (res?.data ?? res) as MealTemplate
  },
  async getCalorieSuggestion(memberId: string): Promise<CalorieSuggestion> {
    const res = (await apiClient.get(`/members/${memberId}/calorie-suggestion`)) as any
    return (res?.data ?? res) as CalorieSuggestion
  },
}
