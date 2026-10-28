import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ReceptionistDashboardPage } from './receptionist-dashboard-page'
import { dashboardService } from '../services/dashboard.service'
import { checkInsService } from '@/features/memberships/services/check-ins.service'
import { membersService } from '@/features/memberships/services/members.service'
import { ptBookingsService } from '@/features/pt-bookings-schedule/services/pt-bookings.service'
import { supportRequestsService } from '@/features/support-reviews-audit/services/support-requests.service'

vi.mock('../services/dashboard.service', () => ({
  dashboardService: {
    getReceptionistDashboard: vi.fn(),
  },
}))

vi.mock('@/features/memberships/services/check-ins.service', () => ({
  checkInsService: {
    getCheckIns: vi.fn(),
  },
}))

vi.mock('@/features/memberships/services/members.service', () => ({
  membersService: {
    getMembers: vi.fn(),
  },
}))

vi.mock('@/features/pt-bookings-schedule/services/pt-bookings.service', () => ({
  ptBookingsService: {
    getBookings: vi.fn(),
  },
}))


vi.mock('@/features/support-reviews-audit/services/support-requests.service', () => ({
  supportRequestsService: {
    getSupportRequests: vi.fn(),
  },
}))

describe('ReceptionistDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders receptionist dashboard with stats from real API', async () => {
    vi.mocked(dashboardService.getReceptionistDashboard).mockResolvedValueOnce({
      checkinsToday: 12,
      insideGym: 0,
      activeMembers: 0,
      ptSessionsToday: 0,
      openSupportRequests: 0,
      pendingPayments: 2,
      expiringSubscriptions: 5,
    })
    vi.mocked(checkInsService.getCheckIns).mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 'chk-1',
          memberId: 'm-1',
          checkedInAt: '2026-03-30T10:00:00Z',
          note: 'Tập tự do',
          member: {
            id: 'm-1',
            fullName: 'Nguyen Van A',
            memberCode: 'MEM-001',
          },
        } as any,
      ],
    } as any)
    vi.mocked(membersService.getMembers).mockResolvedValueOnce({
      success: true,
      data: [
        { id: 'm-1', fullName: 'Nguyen Van A' } as any,
        { id: 'm-2', fullName: 'Tran Thi B' } as any,
      ],
    } as any)
    vi.mocked(ptBookingsService.getBookings).mockResolvedValueOnce({
      success: true,
      data: [
        { id: 'b-1', status: 'CONFIRMED' } as any,
      ],
    } as any)
    vi.mocked(supportRequestsService.getSupportRequests).mockResolvedValueOnce({
      success: true,
      data: [
        { id: 'sr-1', status: 'OPEN' } as any,
      ],
    } as any)

    render(
      <MemoryRouter>
        <ReceptionistDashboardPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Quầy Tiếp Đón Lễ Tân')).toBeInTheDocument()
      expect(screen.getByText('Nguyen Van A')).toBeInTheDocument()
      expect(screen.getByText('MEM-001')).toBeInTheDocument()
    })
  })

  it('renders empty state when there are no check-ins', async () => {
    vi.mocked(dashboardService.getReceptionistDashboard).mockResolvedValueOnce({
      checkinsToday: 0,
      insideGym: 0,
      activeMembers: 0,
      ptSessionsToday: 0,
      openSupportRequests: 0,
      pendingPayments: 0,
      expiringSubscriptions: 0,
    })
    vi.mocked(checkInsService.getCheckIns).mockResolvedValueOnce({
      success: true,
      data: [],
    } as any)
    vi.mocked(membersService.getMembers).mockResolvedValueOnce({
      success: true,
      data: [],
    } as any)
    vi.mocked(ptBookingsService.getBookings).mockResolvedValueOnce({
      success: true,
      data: [],
    } as any)
    vi.mocked(supportRequestsService.getSupportRequests).mockResolvedValueOnce({
      success: true,
      data: [],
    } as any)

    render(
      <MemoryRouter>
        <ReceptionistDashboardPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Chưa có lượt check-in nào trong ngày hôm nay.')).toBeInTheDocument()
    })
  })

  it('handles error state and provides retry', async () => {
    vi.mocked(dashboardService.getReceptionistDashboard).mockRejectedValueOnce(new Error('Network Error'))
    vi.mocked(checkInsService.getCheckIns).mockRejectedValueOnce(new Error('Network Error'))
    vi.mocked(membersService.getMembers).mockRejectedValueOnce(new Error('Network Error'))
    vi.mocked(ptBookingsService.getBookings).mockRejectedValueOnce(new Error('Network Error'))
    vi.mocked(supportRequestsService.getSupportRequests).mockRejectedValueOnce(new Error('Network Error'))


    render(
      <MemoryRouter>
        <ReceptionistDashboardPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Không thể tải dữ liệu dashboard lễ tân/i)).toBeInTheDocument()
    })

    // Retry
    vi.mocked(dashboardService.getReceptionistDashboard).mockResolvedValueOnce({
      checkinsToday: 5,
      insideGym: 0,
      activeMembers: 0,
      ptSessionsToday: 0,
      openSupportRequests: 0,
      pendingPayments: 0,
      expiringSubscriptions: 1,
    })
    vi.mocked(checkInsService.getCheckIns).mockResolvedValueOnce({ success: true, data: [] } as any)
    vi.mocked(membersService.getMembers).mockResolvedValueOnce({ success: true, data: [] } as any)
    vi.mocked(ptBookingsService.getBookings).mockResolvedValueOnce({ success: true, data: [] } as any)
    vi.mocked(supportRequestsService.getSupportRequests).mockResolvedValueOnce({ success: true, data: [] } as any)

    const retryButton = screen.getByRole('button', { name: /Thử lại/i })
    fireEvent.click(retryButton)

    await waitFor(() => {
      expect(screen.getByText('Quầy Tiếp Đón Lễ Tân')).toBeInTheDocument()
    })
  })
})
