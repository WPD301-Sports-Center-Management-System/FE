import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CoachMyPackagesPage } from './coach-my-packages-page'
import { coachApprovalService } from '../services/coach-approval.service'
import { coachesService } from '@/features/coaches/services/coaches.service'
import { coursesExercisesService } from '@/features/courses-exercises/services/courses-exercises.service'
import { AppApiError } from '@/shared/api/api-error'

vi.mock('../services/coach-approval.service', () => ({
  coachApprovalService: {
    getMyOfferings: vi.fn(),
    getPtPackageOptions: vi.fn(),
    createCoachCourseOffering: vi.fn(),
    resubmitCoachCourseOffering: vi.fn(),
    createPtPackageOption: vi.fn(),
  },
}))
vi.mock('@/features/coaches/services/coaches.service', () => ({
  coachesService: { getMyPackageOptions: vi.fn() },
}))
vi.mock(
  '@/features/courses-exercises/services/courses-exercises.service',
  () => ({ coursesExercisesService: { getTrainingCourses: vi.fn() } }),
)
const result = <T,>(data: T) => ({ success: true as const, message: '', data })
const course = { id: 'c1', name: 'PT giảm mỡ', isActive: true }
const offering = {
  id: 'o1',
  coachId: 'coach',
  courseId: 'c1',
  status: 'APPROVED' as const,
  isActive: true,
}
const mount = () =>
  render(
    <MemoryRouter>
      <CoachMyPackagesPage />
    </MemoryRouter>,
  )

describe('Coach setup and package approval flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(coachesService.getMyPackageOptions).mockResolvedValue(result([]))
    vi.mocked(coursesExercisesService.getTrainingCourses).mockResolvedValue(
      result([course, { id: 'c2', name: 'Boxing', isActive: true }]),
    )
    vi.mocked(coachApprovalService.getMyOfferings).mockResolvedValue(result([]))
    vi.mocked(coachApprovalService.getPtPackageOptions).mockResolvedValue(
      result([]),
    )
  })
  it('blocks package creation until teaching approval and submits a teaching request', async () => {
    mount()
    await screen.findByText('PT giảm mỡ')
    expect(
      screen.getByRole('button', { name: 'Đề xuất gói PT mới' }),
    ).toBeDisabled()
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Đăng ký dạy khóa này' })[0],
    )
    fireEvent.change(
      screen.getByLabelText('Kinh nghiệm và năng lực giảng dạy'),
      { target: { value: 'Chứng chỉ PT' } },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Gửi đăng ký dạy' }))
    await waitFor(() =>
      expect(
        coachApprovalService.createCoachCourseOffering,
      ).toHaveBeenCalledWith({
        courseId: 'c1',
        experienceNote: 'Chứng chỉ PT',
      }),
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it('limits the package form to active approved courses and displays a server error inside the dialog', async () => {
    vi.mocked(coachApprovalService.getMyOfferings).mockResolvedValue(
      result([offering]),
    )
    vi.mocked(coachApprovalService.createPtPackageOption).mockRejectedValue(
      new AppApiError(409, {
        success: false,
        code: 'OFFERING_NOT_APPROVED',
        message: 'Quyền dạy vừa bị tạm dừng',
      }),
    )
    mount()
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Đề xuất gói PT mới' }),
      ).toBeEnabled(),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Đề xuất gói PT mới' }))
    const dialog = within(screen.getByRole('dialog'))
    expect(
      dialog.queryByRole('option', { name: 'Boxing' }),
    ).not.toBeInTheDocument()
    fireEvent.change(dialog.getByLabelText('Tên gói tập'), {
      target: { value: 'Gói 12 buổi' },
    })
    fireEvent.change(dialog.getByLabelText('Số buổi tập'), {
      target: { value: '12' },
    })
    fireEvent.change(dialog.getByLabelText('Hạn sử dụng (ngày)'), {
      target: { value: '60' },
    })
    fireEvent.change(dialog.getByLabelText('Học phí (VND)'), {
      target: { value: '3000000' },
    })
    fireEvent.click(dialog.getByRole('button', { name: 'Gửi Manager duyệt' }))
    await waitFor(() =>
      expect(dialog.getByRole('alert')).toHaveTextContent(
        'Quyền dạy vừa bị tạm dừng',
      ),
    )
  })
  it('resubmits the same rejected teaching request instead of making a duplicate', async () => {
    vi.mocked(coachApprovalService.getMyOfferings).mockResolvedValue(
      result([
        {
          ...offering,
          status: 'REJECTED',
          isActive: false,
          rejectionReason: 'Thiếu chứng chỉ',
        },
      ]),
    )
    mount()
    fireEvent.click(
      await screen.findByRole('button', { name: 'Bổ sung & gửi lại' }),
    )
    fireEvent.change(
      screen.getByLabelText('Kinh nghiệm và năng lực giảng dạy'),
      { target: { value: 'Đã bổ sung' } },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Gửi đăng ký dạy' }))
    await waitFor(() =>
      expect(
        coachApprovalService.resubmitCoachCourseOffering,
      ).toHaveBeenCalledWith('o1', { experienceNote: 'Đã bổ sung' }),
    )
    expect(
      coachApprovalService.createCoachCourseOffering,
    ).not.toHaveBeenCalled()
  })
  it('shows only shared options matching approved active teaching rights', async () => {
    vi.mocked(coachApprovalService.getMyOfferings).mockResolvedValue(
      result([offering]),
    )
    const p = {
      id: 'p1',
      name: 'Gói chung giảm mỡ',
      courseId: 'c1',
      sessionCount: 12,
      validityDays: 60,
      price: '3000000',
      approvalStatus: 'APPROVED' as const,
      isActive: true,
    }
    vi.mocked(coachApprovalService.getPtPackageOptions).mockResolvedValue(
      result([p, { ...p, id: 'p2', courseId: 'c2', name: 'Gói chung Boxing' }]),
    )
    mount()
    fireEvent.click(
      await screen.findByRole('button', { name: 'Gói chung có thể dùng (1)' }),
    )
    expect(screen.getByText('Gói chung giảm mỡ')).toBeInTheDocument()
    expect(screen.queryByText('Gói chung Boxing')).not.toBeInTheDocument()
  })
})
