import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ManagerDashboardPage } from './manager-dashboard-page'
import { dashboardService } from '@/features/dashboard/services/dashboard.service'
import { coachesService } from '@/features/coaches/services/coaches.service'

vi.mock('@/features/dashboard/services/dashboard.service', () => ({
  dashboardService: {
    getManagerDashboardStats: vi.fn(),
  },
}))

vi.mock('@/features/coaches/services/coaches.service', () => ({
  coachesService: {
    getCoaches: vi.fn(),
  },
}))

describe('ManagerDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dashboard with stats and coaches from API', async () => {
    vi.mocked(dashboardService.getManagerDashboardStats).mockResolvedValueOnce({
      members: 13,
      coaches: 6,
      revenue: {
        membershipRevenue: 990000,
        ptGross: 3600000,
        ptGymShare: 1440000,
        coachPayable: 2160000,
        coachPending: 1080000,
        paymentCount: 3,
      },
      bookingsToday: 4,
      equipmentIssues: 1,
    })

    vi.mocked(coachesService.getCoaches).mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 'c-1',
          fullName: 'Coach Nam Thể Hình',
          averageRating: 4.9,
          reviewCount: 15,
        } as any,
      ],
    } as any)

    render(
      <MemoryRouter>
        <ManagerDashboardPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Bảng điều khiển Quản Lý (Manager)')).toBeInTheDocument()
      expect(screen.getByText('Coach Nam Thể Hình')).toBeInTheDocument()
    })
  })
})
