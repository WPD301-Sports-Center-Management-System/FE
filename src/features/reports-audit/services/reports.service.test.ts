import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reportsService } from './reports.service'
import { apiClient } from '@/shared/api/client'

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
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
      coachPayable: 2160000,
      coachPending: 1080000,
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

  it('[2] calls GET /coach-payouts', async () => {
    const mockPayouts = [
      { id: 'cp-1', grossAmount: '1800000', gymAmount: '720000', coachAmount: '1080000', status: 'PAID' },
    ]
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockPayouts,
    } as any)

    const res = await reportsService.getCoachPayouts({ status: 'PAID' })
    expect(apiClient.get).toHaveBeenCalledWith('/coach-payouts', { params: { status: 'PAID' } })
    expect(res.data).toEqual(mockPayouts)
  })

  it('[3] calls PATCH /coach-payouts/{id}/mark-paid', async () => {
    const mockPayout = {
      id: 'cp-1',
      status: 'PAID',
      transferRef: 'REF-TXN-123',
    }
    vi.mocked(apiClient.patch).mockResolvedValueOnce({
      success: true,
      data: mockPayout,
    } as any)

    const res = await reportsService.markPaid('cp-1', { transferRef: 'REF-TXN-123' })
    expect(apiClient.patch).toHaveBeenCalledWith('/coach-payouts/cp-1/mark-paid', {
      transferRef: 'REF-TXN-123',
    })
    expect(res).toEqual(mockPayout)
  })
})
