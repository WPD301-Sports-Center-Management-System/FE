import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CoachDashboardPage } from './coach-dashboard-page'
import { dashboardService } from '../services/dashboard.service'
import { coachesService } from '@/features/coaches/services/coaches.service'

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'u-coach', fullName: 'Coach Nam', role: 'COACH' },
    role: 'COACH',
  }),
}))

vi.mock('../services/dashboard.service', () => ({
  dashboardService: {
    getCoachDashboard: vi.fn(),
  },
}))


vi.mock('@/features/coaches/services/coaches.service', () => ({
  coachesService: {
    getMyBookings: vi.fn(),
    getMySlots: vi.fn(),
    getMyPackages: vi.fn(),
    getMyPayouts: vi.fn(),
  },
}))

describe('CoachDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders coach dashboard with KPIs from GET /dashboard/coach', async () => {
    vi.mocked(dashboardService.getCoachDashboard).mockResolvedValueOnce({
      todayBookings: 3,
      openSlots: 5,
      activeMembers: 8,
    })
    vi.mocked(coachesService.getMyBookings).mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 'b-1',
          memberName: 'Tran Van B',
          courseName: 'Khóa PT Tăng Cơ',
          status: 'CONFIRMED',
          startsAt: '2026-10-10T14:00:00Z',
          endsAt: '2026-10-10T15:00:00Z',
        } as any,
      ],
    } as any)
    vi.mocked(coachesService.getMySlots).mockResolvedValueOnce({
      success: true,
      data: [{ id: 's-1', status: 'OPEN' } as any],
    } as any)
    vi.mocked(coachesService.getMyPackages).mockResolvedValueOnce({
      success: true,
      data: [{ id: 'p-1', status: 'ACTIVE' } as any],
    } as any)
    vi.mocked(coachesService.getMyPayouts).mockResolvedValueOnce({
      success: true,
      data: [{ id: 'po-1', coachAmount: '600000', status: 'PENDING' } as any],
    } as any)

    render(
      <MemoryRouter>
        <CoachDashboardPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Bảng Điều Khiển HLV (WEB-COA-01)')).toBeInTheDocument()
      expect(screen.getByText('Tran Van B')).toBeInTheDocument()
      expect(screen.getByText('Khóa PT Tăng Cơ')).toBeInTheDocument()
    })
  })

  it('handles empty bookings state gracefully', async () => {
    vi.mocked(dashboardService.getCoachDashboard).mockResolvedValueOnce({
      todayBookings: 0,
      openSlots: 0,
      activeMembers: 0,
    })
    vi.mocked(coachesService.getMyBookings).mockResolvedValueOnce({ success: true, data: [] } as any)
    vi.mocked(coachesService.getMySlots).mockResolvedValueOnce({ success: true, data: [] } as any)
    vi.mocked(coachesService.getMyPackages).mockResolvedValueOnce({ success: true, data: [] } as any)
    vi.mocked(coachesService.getMyPayouts).mockResolvedValueOnce({ success: true, data: [] } as any)

    render(
      <MemoryRouter>
        <CoachDashboardPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Hiện tại bạn chưa có lịch hẹn PT 1:1 nào.')).toBeInTheDocument()
    })
  })
})
