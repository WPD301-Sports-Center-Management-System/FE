import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { CoachApprovalPage } from './coach-approval-page'
import { coachApprovalService } from '@/features/coach-approval/services/coach-approval.service'

vi.mock('@/features/coach-approval/services/coach-approval.service', () => ({
  coachApprovalService: {
    getCoachCourseOfferings: vi.fn(),
    approveCoachCourseOffering: vi.fn(),
    rejectCoachCourseOffering: vi.fn(),
    updateOfferingStatus: vi.fn(),
    getPtPackageOptions: vi.fn(),
    approvePtPackageOption: vi.fn(),
    rejectPtPackageOption: vi.fn(),
  },
}))

describe('CoachApprovalPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders offerings from API', async () => {
    vi.mocked(coachApprovalService.getCoachCourseOfferings).mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 'off-1',
          coach: { user: { fullName: 'Coach Hải Thể Hình' } },
          course: { name: 'Chest Strength Nâng Cao', difficultyLevel: 'ADVANCED' },
          status: 'APPROVED',
          isActive: true,
          experienceNote: '5 năm kinh nghiệm huấn luyện thể hình',
        } as any,
      ],
    } as any)

    vi.mocked(coachApprovalService.getPtPackageOptions).mockResolvedValueOnce({
      success: true,
      data: [],
    } as any)

    render(<CoachApprovalPage />)

    await waitFor(() => {
      expect(screen.getByText('Phê Duyệt HLV & Gói Tập (WEB-MAN-07)')).toBeInTheDocument()
      expect(screen.getByText('Chest Strength Nâng Cao')).toBeInTheDocument()
      expect(screen.getByText(/Coach Hải Thể Hình/i)).toBeInTheDocument()
    })
  })

  it('approves a pending offering via API', async () => {
    vi.mocked(coachApprovalService.getCoachCourseOfferings).mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 'off-pending',
          coach: { user: { fullName: 'Coach Tuấn Anh' } },
          course: { name: 'Boxing Thể Lực' },
          status: 'PENDING',
          isActive: false,
          experienceNote: 'Có chứng chỉ Boxing Quốc gia',
        } as any,
      ],
    } as any)

    vi.mocked(coachApprovalService.getPtPackageOptions).mockResolvedValueOnce({
      success: true,
      data: [],
    } as any)

    render(<CoachApprovalPage />)

    await waitFor(() => {
      expect(screen.getByText('Boxing Thể Lực')).toBeInTheDocument()
    })

    vi.mocked(coachApprovalService.approveCoachCourseOffering).mockResolvedValueOnce({
      id: 'off-pending',
      status: 'APPROVED',
      isActive: true,
    } as any)

    const approveBtn = screen.getByRole('button', { name: /Phê duyệt/i })
    fireEvent.click(approveBtn)

    await waitFor(() => {
      expect(coachApprovalService.approveCoachCourseOffering).toHaveBeenCalledWith('off-pending')
      expect(screen.getByText(/Đã phê duyệt năng lực giảng dạy cho HLV Coach Tuấn Anh!/i)).toBeInTheDocument()
    })
  })

  it('rejects a pending offering with reason modal', async () => {
    vi.mocked(coachApprovalService.getCoachCourseOfferings).mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 'off-pending-2',
          coach: { user: { fullName: 'Coach Minh' } },
          course: { name: 'Kickboxing PT' },
          status: 'PENDING',
          isActive: false,
        } as any,
      ],
    } as any)

    vi.mocked(coachApprovalService.getPtPackageOptions).mockResolvedValueOnce({
      success: true,
      data: [],
    } as any)

    render(<CoachApprovalPage />)

    await waitFor(() => {
      expect(screen.getByText('Kickboxing PT')).toBeInTheDocument()
    })

    const rejectBtn = screen.getByRole('button', { name: /Từ chối/i })
    fireEvent.click(rejectBtn)

    expect(screen.getByText('Lý do từ chối (Bắt buộc)')).toBeInTheDocument()

    const reasonInput = screen.getByPlaceholderText(/Ví dụ: Cần bổ sung chứng chỉ chuyên môn/i)
    fireEvent.change(reasonInput, { target: { value: 'Cần bổ sung bằng cấp chuyên môn' } })

    vi.mocked(coachApprovalService.rejectCoachCourseOffering).mockResolvedValueOnce({
      id: 'off-pending-2',
      status: 'REJECTED',
      isActive: false,
      rejectionReason: 'Cần bổ sung bằng cấp chuyên môn',
    } as any)

    fireEvent.click(screen.getByText('Xác nhận từ chối'))

    await waitFor(() => {
      expect(coachApprovalService.rejectCoachCourseOffering).toHaveBeenCalledWith('off-pending-2', {
        rejectionReason: 'Cần bổ sung bằng cấp chuyên môn',
      })
      expect(screen.getByText('Đã ghi nhận lý do và từ chối phê duyệt HLV.')).toBeInTheDocument()
    })
  })

  it('switches to package tab and approves a pending PT package', async () => {
    vi.mocked(coachApprovalService.getCoachCourseOfferings).mockResolvedValueOnce({
      success: true,
      data: [],
    } as any)

    vi.mocked(coachApprovalService.getPtPackageOptions).mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 'pkg-pending-1',
          name: 'Gói 12 Buổi Siết Mỡ',
          courseName: 'Cardio HIIT',
          coachName: 'HLV Tuấn Anh',
          sessionCount: 12,
          validityDays: 60,
          price: '3600000',
          approvalStatus: 'PENDING',
          isActive: false,
        } as any,
      ],
    } as any)

    render(<CoachApprovalPage />)

    await waitFor(() => {
      expect(screen.getByText('Gói PT HLV đề xuất (1)')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Gói PT HLV đề xuất (1)'))

    expect(screen.getByText('Gói 12 Buổi Siết Mỡ')).toBeInTheDocument()

    vi.mocked(coachApprovalService.approvePtPackageOption).mockResolvedValueOnce({
      id: 'pkg-pending-1',
      approvalStatus: 'APPROVED',
      isActive: true,
    } as any)

    const approveBtn = screen.getByRole('button', { name: /Phê duyệt/i })
    fireEvent.click(approveBtn)

    await waitFor(() => {
      expect(coachApprovalService.approvePtPackageOption).toHaveBeenCalledWith('pkg-pending-1')
      expect(screen.getByText('Đã phê duyệt gói tập PT thành công!')).toBeInTheDocument()
    })
  })
})
