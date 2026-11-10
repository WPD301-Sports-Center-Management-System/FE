export const coachTiers = ['STANDARD', 'ADVANCED', 'EXPERT'] as const
export type CoachTier = typeof coachTiers[number]
export const tierLabels: Record<CoachTier, string> = { STANDARD: 'Tiêu chuẩn', ADVANCED: 'Nâng cao', EXPERT: 'Chuyên gia' }
export const tierLabel = (tier?: CoachTier | null) => tier ? tierLabels[tier] : 'Chưa có bậc'

/** Public profile wording; internal price tier labels remain unchanged. */
export const coachProfileLabel = (tier?: CoachTier | null) => tier === 'EXPERT' ? 'Huấn luyện viên chuyên gia' : tier === 'ADVANCED' ? 'Huấn luyện viên nâng cao' : 'Huấn luyện viên'
