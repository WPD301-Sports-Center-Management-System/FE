import { hybridGet, hybridSend } from './hybrid-api'
export interface PatternSlot { weekday: number; startTime: string }
export interface PatternResult { sessionsPerWeek: number; slots: (PatternSlot & { available: boolean })[]; suggestions: { pattern: PatternSlot[]; label: string }[] }
export interface GymCoverage { status: string; coveredUntil: string | null; uncoveredSessions: number; firstUncoveredDate: string | null; lastUncoveredDate: string | null; renewableSubscriptionId: string | null }
export interface SeriesPreview { coachTier?: import('@/shared/utils/coach-tier').CoachTier | null; gymCoverage?: GymCoverage; items: { startsAt: string; endsAt: string }[]; skipped: { startsAt: string }[]; expectedCompletionAt: string; canConfirmAll: boolean; cadenceError?: string; price: string; sessionCount: number; policy: { holdMinutes: number } }
export interface SeriesOrder { price?: string; coachTier?: import('@/shared/utils/coach-tier').CoachTier | null; purchaseId: string; hold: { expiresAt: string }; expectedCompletionAt: string }
export interface SeriesCheckoutBody {
  coachId: string; packageOptionId: string; memberId?: string; startDate?: string; pattern?: PatternSlot[]
  consentEvidence?: string; acceptPolicy?: true; idempotencyKey: string; expectedPrice?: number
}
export type SeriesPreviewBody = Omit<SeriesCheckoutBody, 'idempotencyKey' | 'expectedPrice'> & { purchaseId?: string }
// Rehold reuses the existing purchase's policy snapshot. Its strict schema does not accept acceptPolicy.
export interface SeriesReholdBody { pattern: PatternSlot[]; startDate: string; idempotencyKey: string; consentEvidence?: string }
export const seriesApi = {
  renewal: (id: string) => hybridGet<{ memberId: string; coachId: string; suggestedPackageOptionId: string | null; pattern: PatternSlot[]; suggestedStartDate: string }>(`/pt-package-purchases/${id}/renewal-draft`),
  patterns: (coachId: string, packageOptionId: string, startDate: string, memberId: string, purchaseId?: string) => hybridGet<PatternResult>(`/coaches/${coachId}/patterns`, { packageOptionId, startDate, memberId, purchaseId }),
  preview: (body: SeriesPreviewBody) => hybridSend<SeriesPreview>('post', '/pt-checkout/preview', body),
  checkout: (body: SeriesCheckoutBody) => hybridSend<SeriesOrder>('post', '/pt-purchases', body),
  rehold: (id: string, body: SeriesReholdBody) => hybridSend<SeriesOrder>('post', `/pt-purchases/${id}/rehold`, body),
}
