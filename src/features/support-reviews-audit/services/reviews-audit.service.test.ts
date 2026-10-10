import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reviewsAuditService } from './reviews-audit.service'
import { apiClient } from '@/shared/api/client'

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('reviewsAuditService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('[1] calls GET /coach-reviews with params', async () => {
    const mockReviews = [{ id: 'rev-1', rating: 5, comment: 'Buổi tập rất tốt' }]
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockReviews,
    } as any)

    const res = await reviewsAuditService.getCoachReviews({ limit: 10 })
    expect(apiClient.get).toHaveBeenCalledWith('/coach-reviews', { params: { limit: 10 } })
    expect(res.data).toEqual(mockReviews)
  })

  it('[2] calls GET /audit-logs with params', async () => {
    const mockLogs = [{ id: 'log-1', action: 'SUBSCRIPTION_CREATE', entityType: 'Subscription' }]
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockLogs,
    } as any)

    const res = await reviewsAuditService.getAuditLogs({ limit: 20 })
    expect(apiClient.get).toHaveBeenCalledWith('/audit-logs', { params: { limit: 20 } })
    expect(res.data).toEqual(mockLogs)
  })

  it('[4] calls PATCH /coach-reviews/:id/moderation', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce({
      success: true,
      data: { id: 'rev-1', moderationStatus: 'HIDDEN' },
    } as any)

    await reviewsAuditService.moderateReview('rev-1', { moderationStatus: 'HIDDEN', reason: 'Spam' })
    expect(apiClient.patch).toHaveBeenCalledWith('/coach-reviews/rev-1/moderation', {
      moderationStatus: 'HIDDEN',
      reason: 'Spam',
    })
  })
})
