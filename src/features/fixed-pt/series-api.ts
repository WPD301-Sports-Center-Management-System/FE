import { hybridGet, hybridSend } from './hybrid-api'
export interface PatternSlot { weekday: number; startTime: string }
export interface PatternResult { sessionsPerWeek: number; slots: (PatternSlot & { available: boolean })[]; suggestions: { pattern: PatternSlot[]; label: string }[] }
export interface SeriesPreview { items: { startsAt: string; endsAt: string }[]; skipped: { startsAt: string }[]; expectedCompletionAt: string; canConfirmAll: boolean; cadenceError?: string; price: string; sessionCount: number; policy: { holdMinutes: number } }
export interface SeriesOrder { purchaseId: string; hold: { expiresAt: string }; expectedCompletionAt: string }
export const seriesApi = {
  patterns: (coachId: string, packageOptionId: string, startDate: string, memberId: string, purchaseId?: string) => hybridGet<PatternResult>(`/coaches/${coachId}/patterns`, { packageOptionId, startDate, memberId, purchaseId }),
  preview: (body: object) => hybridSend<SeriesPreview>('post', '/pt-checkout/preview', body),
  checkout: (body: object) => hybridSend<SeriesOrder>('post', '/pt-purchases', body),
  rehold: (id: string, body: object) => hybridSend<SeriesOrder>('post', `/pt-purchases/${id}/rehold`, body),
}
