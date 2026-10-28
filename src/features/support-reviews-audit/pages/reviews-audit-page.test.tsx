import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ReviewsAuditPage } from './reviews-audit-page'
import { reviewsAuditService } from '@/features/support-reviews-audit/services/reviews-audit.service'

vi.mock('@/features/support-reviews-audit/services/reviews-audit.service', () => ({
  reviewsAuditService: {
    getCoachReviews: vi.fn(),
    getAuditLogs: vi.fn(),
  },
}))

describe('ReviewsAuditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders reviews and audit logs from API', async () => {
    vi.mocked(reviewsAuditService.getCoachReviews).mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 'rev-1',
          memberDisplayName: 'Hội viên An',
          courseNameSnapshot: 'Boxing 1:1',
          rating: 5,
          comment: 'HLV hướng dẫn nhiệt tình',
          moderationStatus: 'VISIBLE',
          createdAt: '2026-10-10T00:00:00Z',
        } as any,
      ],
    } as any)

    vi.mocked(reviewsAuditService.getAuditLogs).mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 'log-1',
          actorName: 'Quản lý',
          action: 'CREATE_USER',
          entityType: 'User',
          createdAt: '2026-10-10T00:00:00Z',
        } as any,
      ],
    } as any)

    render(<ReviewsAuditPage />)

    await waitFor(() => {
      expect(screen.getByText('Kiểm Duyệt Đánh Giá & Audit Log')).toBeInTheDocument()
      expect(screen.getByText('Hội viên An')).toBeInTheDocument()
    })
  })
})
