import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ReportsPage } from './reports-page'
import { reportsService } from '@/features/reports-audit/services/reports.service'

vi.mock('@/features/reports-audit/services/reports.service', () => ({
  reportsService: {
    getRevenueReport: vi.fn(),
    getCoachWithdrawals: vi.fn(),
  },
}))

describe('ReportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders revenue report and withdrawals list from API', async () => {
    vi.mocked(reportsService.getRevenueReport).mockResolvedValueOnce({
      membershipRevenue: 990000,
      ptGross: 3600000,
      ptGymShare: 1440000,
      coachBudget: 2160000,
      coachEligibleUnpaid: 1080000,
      paymentCount: 3,
    })

    vi.mocked(reportsService.getCoachWithdrawals).mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 'wd-1',
          code: 'WD-1',
          coachId: 'coach-1',
          coach: { user: { fullName: 'Coach Đỗ Thùy Trang' } },
          amount: 1080000,
          createdAt: '2026-10-31T03:00:00.000Z',
          status: 'PAID',
          transferRef: 'MB-123456',
        } as any,
      ],
    } as any)

    render(<ReportsPage />)

    await waitFor(() => {
      expect(screen.getByText('Báo Cáo Tài Chính & Quyết Toán HLV')).toBeInTheDocument()
      expect(screen.getByText('Coach Đỗ Thùy Trang')).toBeInTheDocument()
      expect(screen.getByText('Ngân sách huấn luyện viên theo gói đã thanh toán')).toBeInTheDocument()
      expect(screen.getByText(/Còn phải trả hiện tại:/)).toHaveTextContent('1.080.000')
      expect(screen.getByText('Kỳ báo cáo: Tất cả thời gian')).toBeInTheDocument()
    })
  })
})
