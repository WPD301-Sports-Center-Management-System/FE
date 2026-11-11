import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { AppApiError } from '@/shared/api/api-error'
import { MembershipPlansPage } from './membership-plans-page'
import { membershipPlansService } from '../services/membership-plans.service'

vi.mock('../services/membership-plans.service', () => ({
  membershipPlansService: { getPlans: vi.fn(), createPlan: vi.fn(), deletePlan: vi.fn(), updatePlan: vi.fn(), updatePlanStatus: vi.fn() },
}))

const plan = { id: 'plan-1', code: 'GYM_1M', name: 'Vé gym 1 tháng', paidMonths: 1, bonusMonths: 0, totalMonths: 1, price: '330000', isActive: true }
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(membershipPlansService.getPlans).mockResolvedValue({ success: true, data: [plan] } as never)
})

describe('MembershipPlansPage create and delete', () => {
  it('creates a plan with trimmed values and a numeric price, then lists it', async () => {
    vi.mocked(membershipPlansService.createPlan).mockResolvedValue({ ...plan, id: 'plan-2', code: 'GYM-6M', name: 'Vé 6 tháng', paidMonths: 6, bonusMonths: 1, totalMonths: 7, price: '1800000' } as never)
    render(<MembershipPlansPage />)
    await screen.findByText('Vé gym 1 tháng')
    fireEvent.click(screen.getByRole('button', { name: /Tạo gói vé/ }))
    const dialog = await screen.findByRole('dialog')
    const submit = within(dialog).getByRole('button', { name: 'Tạo gói vé' })
    expect(submit).toBeDisabled() // nothing typed yet
    fireEvent.change(within(dialog).getByLabelText(/Mã gói/), { target: { value: ' GYM-6M ' } })
    fireEvent.change(within(dialog).getByLabelText(/Tên gói/), { target: { value: ' Vé 6 tháng ' } })
    fireEvent.change(within(dialog).getByLabelText(/Số tháng thanh toán/), { target: { value: '6' } })
    fireEvent.change(within(dialog).getByLabelText(/Số tháng tặng/), { target: { value: '1' } })
    fireEvent.change(within(dialog).getByLabelText(/Giá niêm yết/), { target: { value: '1800000' } })
    expect(within(dialog).getByText('7 tháng')).toBeInTheDocument()
    fireEvent.click(submit)
    await waitFor(() => expect(membershipPlansService.createPlan).toHaveBeenCalledWith({ code: 'GYM-6M', name: 'Vé 6 tháng', paidMonths: 6, bonusMonths: 1, price: 1800000 }))
    expect(await screen.findByText('Vé 6 tháng')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Đã tạo gói vé "Vé 6 tháng".')
  })

  it('shows the duplicate-code refusal inside the form and keeps it open', async () => {
    vi.mocked(membershipPlansService.createPlan).mockRejectedValue(new AppApiError(409, { code: 'PLAN_CODE_EXISTS', message: 'Mã gói "GYM_1M" đã được dùng. Hãy chọn mã khác.' } as never))
    render(<MembershipPlansPage />)
    await screen.findByText('Vé gym 1 tháng')
    fireEvent.click(screen.getByRole('button', { name: /Tạo gói vé/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText(/Mã gói/), { target: { value: 'GYM_1M' } })
    fireEvent.change(within(dialog).getByLabelText(/Tên gói/), { target: { value: 'Trùng' } })
    fireEvent.change(within(dialog).getByLabelText(/Giá niêm yết/), { target: { value: '100000' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Tạo gói vé' }))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('đã được dùng')
    expect(screen.getAllByText('Vé gym 1 tháng')).toHaveLength(1)
  })

  it('rejects an invalid code or price before calling the API', async () => {
    render(<MembershipPlansPage />)
    await screen.findByText('Vé gym 1 tháng')
    fireEvent.click(screen.getByRole('button', { name: /Tạo gói vé/ }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText(/Mã gói/), { target: { value: 'sai mã!' } })
    fireEvent.change(within(dialog).getByLabelText(/Tên gói/), { target: { value: 'Tên' } })
    fireEvent.change(within(dialog).getByLabelText(/Giá niêm yết/), { target: { value: '0' } })
    expect(within(dialog).getByRole('button', { name: 'Tạo gói vé' })).toBeDisabled()
    expect(membershipPlansService.createPlan).not.toHaveBeenCalled()
  })

  it('deletes after confirmation, removes the plan from the list and keeps pause/activate', async () => {
    vi.mocked(membershipPlansService.deletePlan).mockResolvedValue(undefined)
    render(<MembershipPlansPage />)
    await screen.findByText('Vé gym 1 tháng')
    expect(screen.getByRole('button', { name: 'Đang mở bán' })).toBeInTheDocument() // status toggle untouched
    fireEvent.click(screen.getByRole('button', { name: 'Xóa gói vé Vé gym 1 tháng' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('“Vé gym 1 tháng”')).toBeInTheDocument()
    expect(within(dialog).getByText(/Vé đã bán giữ nguyên/)).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xóa' }))
    await waitFor(() => expect(membershipPlansService.deletePlan).toHaveBeenCalledWith('plan-1'))
    await waitFor(() => expect(screen.queryByText('GYM_1M')).toBeNull())
    expect(screen.getByRole('status')).toHaveTextContent('Đã xóa gói vé "Vé gym 1 tháng".')
  })

  it('keeps the plan and shows the BE reason when the plan is still in use', async () => {
    vi.mocked(membershipPlansService.deletePlan).mockRejectedValue(new AppApiError(409, { code: 'IN_USE', message: 'Gói vé đang có 3 vé chờ thanh toán hoặc còn hiệu lực. Hãy ngừng bán gói thay vì xóa.' } as never))
    render(<MembershipPlansPage />)
    await screen.findByText('Vé gym 1 tháng')
    fireEvent.click(screen.getByRole('button', { name: 'Xóa gói vé Vé gym 1 tháng' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xóa' }))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('3 vé chờ thanh toán')
    expect(screen.getByText('GYM_1M')).toBeInTheDocument()
  })
})
