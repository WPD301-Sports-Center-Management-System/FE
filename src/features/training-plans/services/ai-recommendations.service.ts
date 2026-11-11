import { apiClient } from '@/shared/api/client'
import type { ApiSuccess } from '@/shared/types/api'

export type AiKind = 'TRAINING_PLAN' | 'PROGRESS_SUMMARY' | 'MEAL_PLAN'
export const AI_KIND_LABEL: Record<AiKind, string> = { TRAINING_PLAN: 'Giáo án', PROGRESS_SUMMARY: 'Nhận xét tiến độ', MEAL_PLAN: 'Thực đơn' }

export interface CreateRecommendationPayload {
  kind: AiKind
  memberId: string
  ptPurchaseId?: string
  goal?: string
  /** Coach's notes for the AI: injuries, limits, allergies, preferences. */
  context?: string
  dailyCalorieTarget?: number
  days?: number
  durationMinutes?: number
}

// Draft content per kind, as validated by the server (library ids only, nutrition recomputed).
export interface TrainingPlanDraft { title: string; goal: string; notes?: string; exercises: { exerciseId: string; name: string; sets?: number; reps?: number; durationMinutes?: number; targetWeight?: number; restSeconds?: number; rpe?: string; instructions?: string }[] }
export interface ProgressSummaryDraft { title: string; summary: string; highlights: string[]; focusNext: string[] }
export interface MealPlanDraft { title: string; notes?: string; dailyCalorieTarget: number; averageDailyKcal: number; days: { dayNumber: number; meals: { mealType: string; items: { foodItemId: string; foodName: string; servings: number; quantity: string; estimatedCalories: number; proteinGrams: number }[] }[] }[] }
export type DraftContent = TrainingPlanDraft | ProgressSummaryDraft | MealPlanDraft

export interface AiRecommendation {
  id: string
  kind: AiKind
  coachId: string
  memberId: string
  ptPurchaseId?: string | null
  generatedContent: DraftContent
  editedContent?: DraftContent | null
  status: 'DRAFT' | 'APPROVED' | 'REJECTED'
  rejectionReason?: string | null
  /** Set when an approved training-plan draft became a template in the Coach's library. */
  sessionTemplateId?: string | null
  mealPlanId?: string | null
  progressReportId?: string | null
  provider?: string | null
  model?: string | null
  createdAt: string
  reviewedAt?: string | null
  member?: { memberCode: string; user: { fullName: string } }
}

export interface AiStatus { configured: boolean; provider: string; model: string }

const unwrap = <T,>(res: unknown) => ((res as ApiSuccess<T>)?.data ?? res) as T

export const aiRecommendationsService = {
  async status(): Promise<AiStatus> {
    return unwrap<AiStatus>(await apiClient.get('/ai/status'))
  },
  async createRecommendation(payload: CreateRecommendationPayload): Promise<AiRecommendation> {
    return unwrap<AiRecommendation>(await apiClient.post('/ai/recommendations', payload, { timeout: 60_000 }))
  },
  async getRecommendations(params?: { memberId?: string; status?: AiRecommendation['status']; kind?: AiKind; page?: number; limit?: number }): Promise<AiRecommendation[]> {
    return unwrap<AiRecommendation[]>(await apiClient.get('/ai/recommendations', { params })) ?? []
  },
  async getRecommendationById(id: string): Promise<AiRecommendation> {
    return unwrap<AiRecommendation>(await apiClient.get(`/ai/recommendations/${id}`))
  },
  async updateRecommendation(id: string, editedContent: DraftContent): Promise<AiRecommendation> {
    return unwrap<AiRecommendation>(await apiClient.patch(`/ai/recommendations/${id}`, { editedContent }))
  },
  /** Creates the real record: DRAFT training plan, DRAFT meal plan, or a progress report (sent when publish). */
  async approveRecommendation(id: string, payload: { title?: string; publish?: boolean } = {}): Promise<AiRecommendation> {
    return unwrap<AiRecommendation>(await apiClient.post(`/ai/recommendations/${id}/approve`, payload))
  },
  async rejectRecommendation(id: string, rejectionReason: string): Promise<AiRecommendation> {
    return unwrap<AiRecommendation>(await apiClient.post(`/ai/recommendations/${id}/reject`, { rejectionReason }))
  },
}
