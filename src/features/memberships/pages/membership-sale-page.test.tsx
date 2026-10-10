import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MembershipSalePage } from './membership-sale-page'
import { membersService } from '@/features/memberships/services/members.service'
import { membershipPlansService } from '@/features/memberships/services/membership-plans.service'
import { subscriptionsService } from '@/features/memberships/services/subscriptions.service'

vi.mock('@/features/memberships/services/members.service', () => ({
  membersService: {
    getMembers: vi.fn(),
  },
}))

vi.mock('@/features/memberships/services/membership-plans.service', () => ({
  membershipPlansService: {
    getPlans: vi.fn(),
  },
}))

vi.mock('@/features/memberships/services/subscriptions.service', () => ({
  subscriptionsService: {
    createSubscription: vi.fn(),
  },
}))

vi.mock('@/features/payments-invoices/services/payments.service', () => ({
  paymentsService: {
    payCounter: vi.fn().mockResolvedValue({ id: 'pay-1', status: 'PAID' }),
    createVNPay: vi.fn(),
  },
}))

describe('MembershipSalePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders plans and members, then creates a new subscription successfully', async () => {
    const mockMembers = [
      {
        id: 'mem-1',
        memberCode: 'MEM-001',
        fullName: 'Nguyễn Văn Test',
        phone: '0901234567',
      },
    ]

    const mockPlans = [
      {
        id: 'plan-1',
        code: 'GYM_1M',
        name: 'Vé gym 1 tháng',
        paidMonths: 1,
        bonusMonths: 0,
        totalMonths: 1,
        price: '330000',
        isActive: true,
      },
    ]

    vi.mocked(membersService.getMembers).mockResolvedValueOnce({
      success: true,
      data: mockMembers as any,
    } as any)

    vi.mocked(membershipPlansService.getPlans).mockResolvedValueOnce({
      success: true,
      data: mockPlans as any,
    } as any)

    vi.mocked(subscriptionsService.createSubscription).mockResolvedValueOnce({
      id: 'sub-created-1',
      memberId: 'mem-1',
      planId: 'plan-1',
      planNameSnapshot: 'Vé gym 1 tháng',
      paidMonthsSnapshot: 1,
      bonusMonthsSnapshot: 0,
      priceSnapshot: '330000',
      startDate: '2026-10-10',
      endDate: '2026-11-09',
      status: 'PENDING',
    })

    render(
      <MemoryRouter>
        <MembershipSalePage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Đăng Ký & Bán Vé Gym (WEB-REC-05)')).toBeInTheDocument()
      expect(screen.getByText('Vé gym 1 tháng')).toBeInTheDocument()
    })

    // Click submit button
    const submitBtn = screen.getByRole('button', { name: /Xác nhận & Kích hoạt gói thẻ/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(subscriptionsService.createSubscription).toHaveBeenCalledWith({
        memberId: 'mem-1',
        planId: 'plan-1',
        startDate: expect.any(String),
      })
      expect(screen.getByText('Giao Dịch Đăng Ký Gói Tập Đã Tạo Thành Công!')).toBeInTheDocument()
    })
  })
})
