import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import type { ApiSuccess } from '@/shared/types/api'

// Public data for the website. Everything shown to visitors comes from these endpoints, never from
// hardcoded samples, so prices, Coaches and reviews always match what the center really offers.
export interface PublicCoach {
  tier?: import('@/shared/utils/coach-tier').CoachTier
  id: string
  fullName: string
  avatarUrl?: string | null
  specialization?: string | null
  certification?: string | null
  yearsOfExperience?: number | null
  averageRating?: number | string | null
  reviewCount?: number | null
}
export interface PublicMembershipPlan { id: string; name: string; paidMonths: number; bonusMonths: number; price: string | number }
export interface PublicCourse {
  id: string
  name: string
  description?: string | null
  objective?: string | null
  difficultyLevel?: string | null
  imageUrl?: string | null
  muscleGroups: string[]
  priceFrom: number | null
  coachCount: number
}
export interface PublicCatalog { membershipPlans: PublicMembershipPlan[]; courses: PublicCourse[]; stats: { coaches: number; courses: number; exercises: number } }
export interface PublicReview { id: string; rating: number; comment?: string | null; courseName?: string | null; memberName?: string | null; createdAt: string; coachName?: string }
/** What the visitor was looking at when they asked for a trial, sent along so staff can call back prepared. */
export interface TrialContext { interest?: string; coachId?: string; coachName?: string }
export interface TrialRequestInput { fullName: string; phone: string; goal?: string; preferredTime?: string; coachId?: string; interest?: string; note?: string }

const data = async <T>(promise: Promise<unknown>) => ((await promise) as ApiSuccess<T>).data

export const landingApi = {
  catalog: () => data<PublicCatalog>(apiClient.get('/public/catalog')),
  coaches: () => data<PublicCoach[]>(apiClient.get('/coaches', { params: { limit: 8 } })),
  reviews: (coachId: string) => data<PublicReview[]>(apiClient.get(`/coaches/${coachId}/reviews`, { params: { limit: 3 } })),
  submitTrial: (body: TrialRequestInput) => data<{ id: string }>(apiClient.post('/trial-requests', body)),
}

export const useCatalog = () => useQuery({ queryKey: ['public-catalog'], queryFn: landingApi.catalog, staleTime: 5 * 60_000 })
export const usePublicCoaches = () => useQuery({ queryKey: ['public-coaches'], queryFn: landingApi.coaches, staleTime: 5 * 60_000 })

/** Most recent visible reviews of the best-reviewed Coaches (empty when nobody has reviews yet). */
export function useReviews(coaches?: PublicCoach[]) {
  const top = [...(coaches ?? [])].filter((c) => (c.reviewCount ?? 0) > 0).sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0)).slice(0, 3)
  return useQuery({
    queryKey: ['public-reviews', top.map((c) => c.id)],
    enabled: !!coaches,
    queryFn: async () => (await Promise.all(top.map(async (c) => (await landingApi.reviews(c.id)).map((r) => ({ ...r, coachName: c.fullName }))))).flat().filter((r) => r.comment).slice(0, 6),
    staleTime: 5 * 60_000,
  })
}

export const difficultyLabel = (level?: string | null) =>
  ({ BEGINNER: 'Cơ bản', INTERMEDIATE: 'Trung cấp', ADVANCED: 'Nâng cao', Beginner: 'Cơ bản', Intermediate: 'Trung cấp', Advanced: 'Nâng cao' } as Record<string, string>)[level ?? ''] ?? level ?? null
