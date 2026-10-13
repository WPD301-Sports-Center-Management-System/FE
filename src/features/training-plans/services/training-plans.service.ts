import { apiClient } from '@/shared/api/client'
import type { ApiSuccess, TrainingPlan } from '@/shared/types/api'

export interface CreateTrainingPlanPayload {
  memberId: string
  ptPurchaseId: string
  title: string
  goal?: string
  notes?: string
  startDate: string
  endDate?: string
}

export interface UpdateTrainingPlanPayload {
  title?: string
  goal?: string
  notes?: string
  startDate?: string
  endDate?: string
}

export interface PlanExercisePayload {
  exerciseId: string
  scheduledDate: string
  sets?: number
  reps?: number
  durationMinutes?: number
  restSeconds?: number
  targetWeight?: number
  instructions?: string
  sortOrder?: number
}

export interface TrainingPlanQueryParams {
  memberId?: string
  status?: string
  page?: number
  limit?: number
}

export const trainingPlansService = {
  /**
   * [1] GET /training-plans - List training plans (Coach / Manager)
   */
  async getTrainingPlans(params?: TrainingPlanQueryParams): Promise<ApiSuccess<TrainingPlan[]>> {
    const res = await apiClient.get<ApiSuccess<TrainingPlan[]>>('/training-plans', { params })
    return res as unknown as ApiSuccess<TrainingPlan[]>
  },

  /**
   * [2] GET /training-plans/:id - Get training plan details with exercises
   */
  async getTrainingPlanById(id: string): Promise<TrainingPlan> {
    const res = await apiClient.get<ApiSuccess<TrainingPlan>>(`/training-plans/${id}`)
    const data = res as unknown as ApiSuccess<TrainingPlan>
    return data.data ?? (data as unknown as TrainingPlan)
  },

  /**
   * [3] POST /training-plans - Create DRAFT training plan
   */
  async createTrainingPlan(payload: CreateTrainingPlanPayload): Promise<TrainingPlan> {
    const res = await apiClient.post<ApiSuccess<TrainingPlan>>('/training-plans', payload)
    const data = res as unknown as ApiSuccess<TrainingPlan>
    return data.data ?? (data as unknown as TrainingPlan)
  },

  /**
   * [4] PATCH /training-plans/:id - Update draft training plan
   */
  async updateTrainingPlan(id: string, payload: UpdateTrainingPlanPayload): Promise<TrainingPlan> {
    const res = await apiClient.patch<ApiSuccess<TrainingPlan>>(`/training-plans/${id}`, payload)
    const data = res as unknown as ApiSuccess<TrainingPlan>
    return data.data ?? (data as unknown as TrainingPlan)
  },

  /**
   * [5] POST /training-plans/:id/assign - Assign plan to member
   */
  async assignTrainingPlan(id: string): Promise<TrainingPlan> {
    const res = await apiClient.post<ApiSuccess<TrainingPlan>>(`/training-plans/${id}/assign`, {})
    const data = res as unknown as ApiSuccess<TrainingPlan>
    return data.data ?? (data as unknown as TrainingPlan)
  },

  /**
   * [6] POST /training-plans/:id/duplicate - Duplicate plan
   */
  async duplicateTrainingPlan(id: string, payload?: { title?: string }): Promise<TrainingPlan> {
    const res = await apiClient.post<ApiSuccess<TrainingPlan>>(`/training-plans/${id}/duplicate`, payload || {})
    const data = res as unknown as ApiSuccess<TrainingPlan>
    return data.data ?? (data as unknown as TrainingPlan)
  },

  /**
   * [7] DELETE /training-plans/:id - Delete draft plan
   */
  async deleteTrainingPlan(id: string): Promise<any> {
    const res = await apiClient.delete(`/training-plans/${id}`)
    return res?.data ?? res
  },

  /**
   * [8] POST /training-plans/:id/exercises - Add exercise to draft plan
   */
  async addExercise(planId: string, payload: PlanExercisePayload): Promise<any> {
    const res = await apiClient.post(`/training-plans/${planId}/exercises`, payload)
    return res?.data ?? res
  },

  /**
   * [9] PATCH /training-plans/:id/exercises/:exerciseId - Update exercise in draft plan
   */
  async updateExercise(planId: string, exerciseId: string, payload: Partial<PlanExercisePayload>): Promise<any> {
    const res = await apiClient.patch(`/training-plans/${planId}/exercises/${exerciseId}`, payload)
    return res?.data ?? res
  },

  /**
   * [10] DELETE /training-plans/:id/exercises/:exerciseId - Delete exercise in draft plan
   */
  async deleteExercise(planId: string, exerciseId: string): Promise<any> {
    const res = await apiClient.delete(`/training-plans/${planId}/exercises/${exerciseId}`)
    return res?.data ?? res
  },
}
