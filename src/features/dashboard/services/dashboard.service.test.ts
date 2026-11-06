import { describe, it, expect, vi, beforeEach } from 'vitest'
import { dashboardService } from './dashboard.service'
import { apiClient } from '@/shared/api/client'

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

describe('dashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls GET /dashboard/manager and returns KPI stats', async () => {
    const mockData = {
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
      bookingsToday: 2,
      equipmentIssues: 0,
    }

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockData,
    } as any)

    const res = await dashboardService.getManagerDashboardStats()
    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/manager')
    expect(res).toEqual(mockData)
  })
})
