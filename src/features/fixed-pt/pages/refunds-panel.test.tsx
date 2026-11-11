import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RefundsPanel } from './refunds-panel'
import { refundApi } from '../refund-api'
vi.mock('../refund-api', () => ({ refundApi: { list: vi.fn(), preview: vi.fn(), confirm: vi.fn(), paid: vi.fn() } }))
vi.mock('../components/purchase-picker', () => ({ PurchasePicker: () => <div>Chọn gói</div> }))
const pending = { id: 'r1', purchaseId: 'p1', status: 'PENDING_TRANSFER' as const, amount: 600000, creditIds: ['c1', 'c2'], reason: 'Không tập tiếp' }
const quote = { purchaseCode: 'PT-001', amount: 600000, creditIds: ['c1', 'c2'], refund: null }
beforeEach(() => { vi.clearAllMocks(); vi.mocked(refundApi.list).mockResolvedValue([]); vi.mocked(refundApi.preview).mockResolvedValue(quote); vi.mocked(refundApi.confirm).mockResolvedValue(pending); vi.mocked(refundApi.paid).mockResolvedValue({ ...pending, status: 'PAID', transferRef: 'BANK-1' }) })
describe('Manager refund workflow', () => {
  it('does not offer confirmation when no unused credits remain', async () => {
    vi.mocked(refundApi.preview).mockResolvedValue({ ...quote, amount: 0, creditIds: [] })
    render(<RefundsPanel initialPurchaseId="p1" />)
    expect(await screen.findByText('Không còn phần chưa dùng để hoàn')).toBeInTheDocument()
    expect(screen.queryByLabelText('Lý do hoàn tiền')).not.toBeInTheDocument()
  })
  it('loads the linked package quote automatically and confirms the current amount with a reason', async () => {
    render(<RefundsPanel initialPurchaseId="p1" />)
    await screen.findByText(/PT-001/)
    expect(refundApi.preview).toHaveBeenCalledWith('p1')
    expect(screen.queryByRole('button', { name: 'Xác nhận đã chuyển' })).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Lý do hoàn tiền'), { target: { value: 'Không tập tiếp' } })
    fireEvent.click(screen.getByRole('button', { name: /Chốt hoàn .* và thu hồi 2 buổi/ }))
    await waitFor(() => expect(refundApi.confirm).toHaveBeenCalledWith('p1', 600000, 'Không tập tiếp'))
    expect(await screen.findAllByLabelText('Mã chuyển tiền hoàn PT-001')).toHaveLength(1)
  })
  it('requires a transfer reference and preserves an uncertain transfer until explicitly recorded', async () => {
    vi.mocked(refundApi.preview).mockResolvedValue({ ...quote, refund: pending })
    render(<RefundsPanel initialPurchaseId="p1" />)
    const button = await screen.findByRole('button', { name: 'Xác nhận đã chuyển' })
    expect(button).toBeDisabled(); expect(refundApi.paid).not.toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Mã chuyển tiền hoàn PT-001'), { target: { value: 'BANK-1' } })
    fireEvent.click(button)
    await waitFor(() => expect(refundApi.paid).toHaveBeenCalledWith('p1', 'BANK-1'))
  })
  it('shows paid history with the recorded reference and no payment form', async () => {
    vi.mocked(refundApi.list).mockResolvedValue([{ ...pending, status: 'PAID', transferRef: 'BANK-1' }])
    render(<RefundsPanel />)
    fireEvent.click(await screen.findByRole('tab', { name: /Đã chuyển/ }))
    expect(await screen.findByText('Mã giao dịch: BANK-1')).toBeInTheDocument()
    expect(refundApi.preview).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Xác nhận đã chuyển' })).not.toBeInTheDocument()
  })
})
