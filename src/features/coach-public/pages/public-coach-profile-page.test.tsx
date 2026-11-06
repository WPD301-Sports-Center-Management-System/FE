import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { PublicCoachProfilePage } from './public-coach-profile-page'
import { coachesService } from '@/features/coaches/services/coaches.service'

vi.mock('@/features/coaches/services/coaches.service', () => ({
  coachesService: {
    getCoaches: vi.fn(),
    getCoachById: vi.fn(),
    getCoachReviews: vi.fn(),
  },
}))

describe('PublicCoachProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders coach profile details and reviews successfully', async () => {
    vi.mocked(coachesService.getCoachById).mockResolvedValueOnce({
      id: 'coach-uuid-1',
      fullName: 'Huấn Luyện Viên John Doe',
      specialization: 'Fitness & Bodybuilding',
      bio: 'Chuyên gia thể hình với nhiều năm kinh nghiệm.',
      yearsOfExperience: 5,
      certification: 'NASM-CPT',
      averageRating: 4.9,
      reviewCount: 15,
      availablePackageOptions: [
        {
          id: 'pkg-1',
          name: 'Gói 12 Buổi Giảm Mỡ',
          sessionCount: 12,
          price: '6000000',
          courseName: 'Giảm Mỡ Chuẩn Y Khoa',
          validityDays: 60,
          approvalStatus: 'APPROVED',
          isActive: true,
        },
      ],
    } as any)

    vi.mocked(coachesService.getCoachReviews).mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 'rev-1',
          memberDisplayName: 'Nguyễn Văn A',
          rating: 5,
          comment: 'HLV nhiệt tình và chuyên nghiệp!',
          createdAt: '2026-10-01T08:00:00Z',
          courseNameSnapshot: 'Giảm Mỡ Chuẩn Y Khoa',
        },
      ],
    } as any)

    render(
      <MemoryRouter initialEntries={['/coaches/coach-uuid-1']}>
        <Routes>
          <Route path="/coaches/:coachId" element={<PublicCoachProfilePage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Huấn Luyện Viên John Doe')).toBeInTheDocument()
      expect(screen.getByText('Fitness & Bodybuilding')).toBeInTheDocument()
      expect(screen.getByText('Gói 12 Buổi Giảm Mỡ')).toBeInTheDocument()
      expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument()
      expect(screen.getByText('"HLV nhiệt tình và chuyên nghiệp!"')).toBeInTheDocument()
    })
  })
})
