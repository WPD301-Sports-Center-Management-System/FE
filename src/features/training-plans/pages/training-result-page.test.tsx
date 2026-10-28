import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { TrainingResultPage } from './training-result-page'
import { ptBookingsService } from '@/features/pt-bookings-schedule/services/pt-bookings.service'
import { coursesExercisesService } from '@/features/courses-exercises/services/courses-exercises.service'
import type { Booking, Exercise } from '@/shared/types/api'

vi.mock('@/features/pt-bookings-schedule/services/pt-bookings.service', () => ({
  ptBookingsService: {
    getMyCoachBookings: vi.fn(),
    createTrainingResult: vi.fn(),
    publishTrainingResult: vi.fn(),
  },
}))

vi.mock('@/features/courses-exercises/services/courses-exercises.service', () => ({
  coursesExercisesService: {
    getExercises: vi.fn(),
  },
}))

describe('TrainingResultPage', () => {
  const mockBooking: Booking = {
    id: 'b-completed-1',
    purchaseId: 'pur-1',
    slotId: 'slot-1',
    memberId: 'm-1',
    coachId: 'c-1',
    courseId: 'crs-1',
    status: 'COMPLETED',
    startsAt: '2026-10-10T08:00:00Z',
    endsAt: '2026-10-10T09:00:00Z',
    creditReturned: false,
    memberName: 'Hoi Vien Test',
    courseName: 'Gói Thể Hình Nâng Cao',
  }

  const mockExercise: Exercise = {
    id: 'ex-00000000-0000-0000-0000-000000000001',
    name: 'Bench Press',
    difficultyLevel: 'INTERMEDIATE',
    muscleGroups: [],
    isActive: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(ptBookingsService.getMyCoachBookings).mockResolvedValue({
      data: [mockBooking],
      total: 1,
      page: 1,
      limit: 100,
    } as any)
    vi.mocked(coursesExercisesService.getExercises).mockResolvedValue({
      data: [mockExercise],
      total: 1,
      page: 1,
      limit: 100,
    } as any)
  })

  it('renders training result page and loads completed bookings and exercises', async () => {
    render(
      <BrowserRouter>
        <TrainingResultPage />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Ghi Nhận Kết Quả Buổi Tập')).toBeInTheDocument()
      expect(screen.getByText(/Hoi Vien Test/)).toBeInTheDocument()
      expect(screen.getByText(/Bench Press/)).toBeInTheDocument()
    })
  })

  it('submits workout training result successfully', async () => {
    vi.mocked(ptBookingsService.createTrainingResult).mockResolvedValueOnce({
      id: 'tr-new-1',
      status: 'PUBLISHED',
    } as any)

    render(
      <BrowserRouter>
        <TrainingResultPage />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Lưu & công bố' })).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/Đánh giá & Góp ý của HLV/i), {
      target: { value: 'Hội viên hoàn thành tốt.' },
    })
    fireEvent.change(screen.getByLabelText(/Điểm tiến độ/i), {
      target: { value: '90' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Lưu & công bố' }))

    await waitFor(() => {
      expect(ptBookingsService.createTrainingResult).toHaveBeenCalledWith(
        'b-completed-1',
        expect.objectContaining({
          coachComment: expect.any(String),
          progressScore: 90,
          result: expect.arrayContaining([
            expect.objectContaining({
              exerciseId: 'ex-00000000-0000-0000-0000-000000000001',
              completed: true,
            }),
          ]),
        })
      )
    })
  })

  it('saves a draft without publishing it to the member', async () => {
    vi.mocked(ptBookingsService.createTrainingResult).mockResolvedValueOnce({ id: 'tr-draft-1', status: 'DRAFT' } as any)

    render(
      <BrowserRouter>
        <TrainingResultPage />
      </BrowserRouter>
    )

    await waitFor(() => expect(screen.getByRole('button', { name: 'Lưu nháp' })).toBeInTheDocument())
    fireEvent.change(screen.getByLabelText(/Đánh giá & Góp ý của HLV/i), { target: { value: 'Ghi tạm, bổ sung sau.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu nháp' }))

    await waitFor(() => expect(screen.getByText(/Đã lưu nháp/)).toBeInTheDocument())
    expect(ptBookingsService.createTrainingResult).toHaveBeenCalled()
    expect(ptBookingsService.publishTrainingResult).not.toHaveBeenCalled()
  })
})
