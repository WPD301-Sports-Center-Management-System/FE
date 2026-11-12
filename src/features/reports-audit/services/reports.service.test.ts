import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reportsService } from './reports.service'
import { apiClient } from '@/shared/api/client'

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}))

describe('reportsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('[1] calls GET /reports/revenue', async () => {
    const mockRev = {
      membershipRevenue: 990000,
      ptGross: 3600000,
      ptGymShare: 1440000,
      coachBudget: 2160000,
      coachEligibleUnpaid: 1080000,
      paymentCount: 3,
    }
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockRev,
    } as any)

    const res = await reportsService.getRevenueReport()
    expect(apiClient.get).toHaveBeenCalledWith('/reports/revenue')
    expect(res).toEqual(mockRev)
  })

  it('[2] calls GET /coach-withdrawals', async () => {
    const mockWithdrawals = [{ id: 'wd-1', code: 'WD-1', amount: 1080000, status: 'PAID' }]
    vi.mocked(apiClient.get).mockResolvedValueOnce({ success: true, data: mockWithdrawals } as any)

    const res = await reportsService.getCoachWithdrawals({ status: 'PAID' })
    expect(apiClient.get).toHaveBeenCalledWith('/coach-withdrawals', { params: { status: 'PAID' } })
    expect(res.data).toEqual(mockWithdrawals)
  })
})
