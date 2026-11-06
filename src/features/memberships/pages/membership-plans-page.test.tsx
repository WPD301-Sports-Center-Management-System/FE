import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MembershipPlansPage } from './membership-plans-page'
import { membershipPlansService } from '../services/membership-plans.service'

vi.mock('../services/membership-plans.service', () => ({
  membershipPlansService: {
    getPlans: vi.fn(),
    getPlanById: vi.fn(),
    updatePlan: vi.fn(),
    updatePlanStatus: vi.fn(),
  },
}))

describe('MembershipPlansPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders plans and allows editing plan price', async () => {
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

    vi.mocked(membershipPlansService.getPlans).mockResolvedValueOnce({
      success: true,
      data: mockPlans,
    } as any)

    vi.mocked(membershipPlansService.updatePlan).mockResolvedValueOnce({
      ...mockPlans[0],
      price: '360000',
    } as any)

    render(<MembershipPlansPage />)

    // Wait for list to load
    await waitFor(() => {
      expect(screen.getByText('Vé gym 1 tháng')).toBeInTheDocument()
      expect(screen.getByText('GYM_1M')).toBeInTheDocument()
    })

    // Click edit button
    const editBtn = screen.getByRole('button', { name: /Chỉnh giá vé/i })
    fireEvent.click(editBtn)

    // Verify modal opens
    expect(screen.getByText('Chỉnh giá gói: Vé gym 1 tháng')).toBeInTheDocument()

    // Submit new price
    const input = screen.getByLabelText(/Giá niêm yết mới/i)
    fireEvent.change(input, { target: { value: '360000' } })

    const confirmBtn = screen.getByRole('button', { name: /Xác nhận cập nhật/i })
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(membershipPlansService.updatePlan).toHaveBeenCalledWith('plan-1', {
        price: '360000',
      })
    })
  })

  it('toggles plan active status', async () => {
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

    vi.mocked(membershipPlansService.getPlans).mockResolvedValueOnce({
      success: true,
      data: mockPlans,
    } as any)

    vi.mocked(membershipPlansService.updatePlanStatus).mockResolvedValueOnce({
      ...mockPlans[0],
      isActive: false,
    } as any)

    render(<MembershipPlansPage />)

    await waitFor(() => {
      expect(screen.getByText('Đang mở bán')).toBeInTheDocument()
    })

    const toggleBtn = screen.getByRole('button', { name: /Đang mở bán/i })
    fireEvent.click(toggleBtn)

    await waitFor(() => {
      expect(membershipPlansService.updatePlanStatus).toHaveBeenCalledWith('plan-1', {
        isActive: false,
      })
    })
  })
})
