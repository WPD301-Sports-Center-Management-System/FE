import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ReportsPage } from './reports-page'
import { reportsService } from '@/features/reports-audit/services/reports.service'

vi.mock('@/features/reports-audit/services/reports.service', () => ({
  reportsService: {
    getRevenueReport: vi.fn(),
    getCoachPayouts: vi.fn(),
  },
}))

describe('ReportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders revenue report and payouts list from API', async () => {
    vi.mocked(reportsService.getRevenueReport).mockResolvedValueOnce({
      membershipRevenue: 990000,
      ptGross: 3600000,
      ptGymShare: 1440000,
      coachPayable: 2160000,
      coachPending: 1080000,
      paymentCount: 3,
    })

    vi.mocked(reportsService.getCoachPayouts).mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 'payout-1',
          coachName: 'Coach Đỗ Thùy Trang',
          grossAmount: '1800000',
          gymAmount: '720000',
          coachAmount: '1080000',
          status: 'PAID',
          transferRef: 'MB-123456',
        } as any,
      ],
    } as any)

    render(<ReportsPage />)

    await waitFor(() => {
      expect(screen.getByText('Báo Cáo Tài Chính & Quyết Toán HLV (WEB-MAN-10)')).toBeInTheDocument()
      expect(screen.getByText('Coach Đỗ Thùy Trang')).toBeInTheDocument()
    })
  })
})
