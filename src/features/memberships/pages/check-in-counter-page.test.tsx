import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { CheckInCounterPage } from './check-in-counter-page'
import { membersService } from '@/features/memberships/services/members.service'
import { subscriptionsService } from '@/features/memberships/services/subscriptions.service'
import { checkInsService } from '@/features/memberships/services/check-ins.service'
import type { MemberSummary, CheckIn, Subscription } from '@/shared/types/api'

vi.mock('@/features/memberships/services/members.service', () => ({
  membersService: {
    getMembers: vi.fn(),
  },
}))

vi.mock('@/features/memberships/services/subscriptions.service', () => ({
  subscriptionsService: {
    getSubscriptions: vi.fn(),
  },
}))

vi.mock('@/features/memberships/services/check-ins.service', () => ({
  checkInsService: {
    getCheckIns: vi.fn(),
    createCheckIn: vi.fn(),
  },
}))

describe('CheckInCounterPage', () => {
  const mockMember: MemberSummary = {
    id: 'mem-101',
    userId: 'usr-101',
    memberCode: 'MEM-00109',
    fullName: 'Le Van C',
    phone: '0912345678',
    membershipStatus: 'ACTIVE',
  }

  const mockSubscription: Subscription = {
    id: 'sub-101',
    memberId: 'mem-101',
    planId: 'plan-01',
    planNameSnapshot: 'Gói 1 Tháng',
    paidMonthsSnapshot: 1,
    bonusMonthsSnapshot: 0,
    priceSnapshot: '500000',
    startDate: '2026-10-01',
    endDate: '2026-11-01',
    status: 'ACTIVE',
  }

  const mockCheckIn: CheckIn = {
    id: 'chk-101',
    memberId: 'mem-101',
    checkedInBy: 'rec-01',
    checkedInAt: new Date().toISOString(),
    note: 'Vào phòng tập tại quầy',
    member: mockMember,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(checkInsService.getCheckIns).mockResolvedValue({
      success: true,
      message: 'OK',
      data: [mockCheckIn],
    })
    vi.mocked(membersService.getMembers).mockResolvedValue({
      success: true,
      message: 'OK',
      data: [mockMember],
    })
    vi.mocked(subscriptionsService.getSubscriptions).mockResolvedValue({
      success: true,
      message: 'OK',
      data: [mockSubscription],
    })
  })

  it('renders check-in counter page with ready state and check-in history', async () => {
    render(
      <BrowserRouter>
        <CheckInCounterPage />
      </BrowserRouter>
    )

    expect(screen.getByRole('heading', { name: 'Quầy check-in' })).toBeInTheDocument()
    expect(screen.getByText(/Sẵn sàng điểm danh/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText(/Lịch Sử Vào Phòng/i)).toBeInTheDocument()
    })
  })

  it('allows searching for an active member and shows active badge', async () => {
    render(
      <BrowserRouter>
        <CheckInCounterPage />
      </BrowserRouter>
    )

    const input = screen.getByPlaceholderText(/Mã thẻ, số điện thoại/i)
    fireEvent.change(input, { target: { value: 'MEM-00109' } })

    const searchBtn = screen.getByRole('button', { name: /Tìm kiếm/i })
    fireEvent.click(searchBtn)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Le Van C' })).toBeInTheDocument()
      expect(screen.getByText(/Thẻ Gym Hợp Lệ/i)).toBeInTheDocument()
    })
  })

  it('allows searching for an expired member and performs check-in for valid member', async () => {
    const expiredMember: MemberSummary = {
      id: 'mem-102',
      userId: 'usr-102',
      memberCode: 'MEM-00200',
      fullName: 'Pham Thi D',
      phone: '0987654321',
      membershipStatus: 'EXPIRED',
    }

    vi.mocked(membersService.getMembers).mockImplementation(async (params) => {
      if (params?.memberCode === 'MEM-00200' || params?.search === 'MEM-00200') {
        return {
          success: true,
          message: 'OK',
          data: [expiredMember],
        }
      }
      return {
        success: true,
        message: 'OK',
        data: [mockMember],
      }
    })

    vi.mocked(subscriptionsService.getSubscriptions).mockImplementation(async (params) => {
      if (params?.memberId === 'mem-102') {
        return {
          success: true,
          message: 'OK',
          data: [],
        }
      }
      return {
        success: true,
        message: 'OK',
        data: [mockSubscription],
      }
    })

    render(
      <BrowserRouter>
        <CheckInCounterPage />
      </BrowserRouter>
    )

    const input = screen.getByPlaceholderText(/Mã thẻ, số điện thoại/i)
    fireEvent.change(input, { target: { value: 'MEM-00200' } })

    const searchBtn = screen.getByRole('button', { name: /Tìm kiếm/i })
    fireEvent.click(searchBtn)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Pham Thi D' })).toBeInTheDocument()
      expect(screen.getByText(/Không có vé gym còn hạn hôm nay/i)).toBeInTheDocument()
      expect(screen.getByText(/Gia hạn vé ngay/i)).toBeInTheDocument()
    })
  })

  it('performs check-in when clicking confirm button', async () => {
    vi.mocked(checkInsService.createCheckIn).mockResolvedValueOnce({
      id: 'chk-102',
      memberId: 'mem-101',
      checkedInBy: 'rec-01',
      checkedInAt: new Date().toISOString(),
      note: 'Vào phòng tập tại quầy',
      member: mockMember,
    })

    render(
      <BrowserRouter>
        <CheckInCounterPage />
      </BrowserRouter>
    )

    const input = screen.getByPlaceholderText(/Mã thẻ, số điện thoại/i)
    fireEvent.change(input, { target: { value: 'MEM-00109' } })

    const searchBtn = screen.getByRole('button', { name: /Tìm kiếm/i })
    fireEvent.click(searchBtn)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Le Van C' })).toBeInTheDocument()
    })

    const checkInBtn = screen.getByRole('button', { name: /Xác nhận Check-in/i })
    fireEvent.click(checkInBtn)

    await waitFor(() => {
      expect(checkInsService.createCheckIn).toHaveBeenCalledWith({
        memberId: 'mem-101',
        note: 'Vào phòng tập tại quầy',
      })
      expect(screen.getByText(/Check-in thành công cho hội viên Le Van C!/i)).toBeInTheDocument()
    })
  })

  it('never reports an expired ticket when the ticket lookup fails', async () => {
    vi.mocked(subscriptionsService.getSubscriptions).mockRejectedValueOnce(new Error('offline'))

    render(
      <BrowserRouter>
        <CheckInCounterPage />
      </BrowserRouter>
    )

    fireEvent.change(screen.getByPlaceholderText(/Mã thẻ, số điện thoại/i), { target: { value: 'MEM-00109' } })
    fireEvent.click(screen.getByRole('button', { name: /Tìm kiếm/i }))

    await waitFor(() => {
      expect(screen.getByText(/Chưa kiểm tra được vé gym/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /Kiểm tra lại/i })).toBeInTheDocument()
    expect(screen.queryByText(/Không có vé gym còn hạn hôm nay/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Xác nhận Check-in/i })).not.toBeInTheDocument()
  })
})
