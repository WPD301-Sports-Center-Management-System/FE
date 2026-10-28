import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MembershipSalePage } from './membership-sale-page'
import { membersService } from '@/features/memberships/services/members.service'
import { membershipPlansService } from '@/features/memberships/services/membership-plans.service'
import { subscriptionsService } from '@/features/memberships/services/subscriptions.service'
import { paymentsService } from '@/features/payments-invoices/services/payments.service'

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
    getSubscriptionById: vi.fn(),
  },
}))

vi.mock('@/features/payments-invoices/services/payments.service', () => ({
  paymentsService: {
    payCounter: vi.fn(),
    createVNPay: vi.fn(),
  },
}))

describe('MembershipSalePage', () => {
  let paidOk = true
  beforeEach(() => {
    vi.clearAllMocks()
    paidOk = true
    vi.mocked(paymentsService.payCounter).mockResolvedValue({ id: 'pay-1', status: 'PAID' } as any)
    vi.mocked(subscriptionsService.getSubscriptionById).mockImplementation(async (id: string) => ({ id, memberId: 'mem-1', planId: 'plan-1', planNameSnapshot: 'Vé gym 1 tháng', paidMonthsSnapshot: 1, bonusMonthsSnapshot: 0, priceSnapshot: '330000', startDate: '2026-10-10', endDate: '2026-11-09', status: paidOk ? 'ACTIVE' : 'PENDING' }) as any)
  })

  const arrange = () => {
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
  }

  it('renders plans and members, then creates a new subscription successfully', async () => {
    arrange()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Bán vé gym/i })).toBeInTheDocument()
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
      expect(screen.getByText('Đã bán vé và kích hoạt')).toBeInTheDocument()
    })
  })

  it('says the ticket is unpaid when collecting the money fails, and offers a retry', async () => {
    paidOk = false
    vi.mocked(paymentsService.payCounter).mockRejectedValueOnce(new Error('offline'))
    arrange()

    await waitFor(() => expect(screen.getByText('Vé gym 1 tháng')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận & Kích hoạt gói thẻ/i }))

    await waitFor(() => expect(screen.getByText('Đã tạo vé – chưa thu tiền')).toBeInTheDocument())
    expect(screen.queryByText('Đã bán vé và kích hoạt')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Thu tiền lại/i })).toBeInTheDocument()
  })
})
