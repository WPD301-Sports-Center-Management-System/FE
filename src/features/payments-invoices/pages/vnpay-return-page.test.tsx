import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VnPayReturnPage } from './vnpay-return-page'
import { useAuth } from '@/features/auth/context/auth-context'
import { paymentsService } from '../services/payments.service'
import { openReceipt } from '@/features/workspace/receipt-events'
import { savePtContinuation } from '@/shared/utils/pt-continuation'

vi.mock('@/features/auth/context/auth-context', () => ({ useAuth: vi.fn() }))
vi.mock('../services/payments.service', () => ({ paymentsService: { getPaymentStatus: vi.fn(), getPaymentById: vi.fn(), getInvoiceById: vi.fn() } }))
vi.mock('@/features/workspace/receipt-events', () => ({ openReceipt: vi.fn() }))
const show = () => render(<MemoryRouter initialEntries={['/payment/vnpay-return?paymentId=p1&vnp_ResponseCode=00']}><VnPayReturnPage /></MemoryRouter>)
describe('VNPay server confirmation and entitlement application', () => {
  beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear(); vi.mocked(useAuth).mockReturnValue({ user: { id: 'u1', role: 'MEMBER' }, isInitializing: false } as never) })
  const draft = { memberId: 'member', coachId: 'coach', optionId: 'option', startDate: '2027-01-04', pattern: [{ weekday: 1, startTime: '18:00' }] }
  const saveDraft = () => savePtContinuation({ ownerId: 'u1', role: 'MEMBER', paymentId: 'p1', subscriptionId: 'sub1', draft })
  it.each([
    ['PAID', 'APPLIED'], ['PAID', 'UNAPPLIED'], ['CANCELLED', null], ['PENDING', null],
  ])('offers an explicit PT continuation after verified %s/%s, including after reload', async (status, application) => {
    saveDraft()
    vi.mocked(paymentsService.getPaymentStatus).mockResolvedValue({ status, application } as never)
    vi.mocked(paymentsService.getPaymentById).mockResolvedValue({ id: 'p1', subscriptionId: 'sub1', status } as never)
    const first = show()
    await screen.findByRole('button', { name: 'Tiếp tục chọn lịch PT' })
    first.unmount()
    // A new page load has no React Router state from the gym-sale page.
    function Restored() { const location = useLocation(); return <pre data-testid="draft">{JSON.stringify(location.state)}</pre> }
    render(<MemoryRouter initialEntries={['/payment/vnpay-return?paymentId=p1']}><Routes><Route path="/payment/vnpay-return" element={<VnPayReturnPage />} /><Route path="/member/pt-sale" element={<Restored />} /></Routes></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: 'Tiếp tục chọn lịch PT' }))
    expect(JSON.parse(screen.getByTestId('draft').textContent!)).toEqual({ ptDraft: draft })
  })
  it('does not expose another account draft, an expired draft, or one attached to another payment', async () => {
    saveDraft()
    vi.mocked(paymentsService.getPaymentStatus).mockResolvedValue({ status: 'CANCELLED' } as never)
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'other', role: 'MEMBER' }, isInitializing: false } as never)
    const view = show()
    await screen.findByText('Giao Dịch Thất Bại')
    expect(screen.queryByRole('button', { name: 'Tiếp tục chọn lịch PT' })).toBeNull()
    view.unmount()
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'u1', role: 'MEMBER' }, isInitializing: false } as never)
    saveDraft()
    const saved = JSON.parse(sessionStorage.getItem('sc_pt_continuation:p1')!)
    sessionStorage.setItem('sc_pt_continuation:p1', JSON.stringify({ ...saved, expiresAt: Date.now() - 1 }))
    const expired = show()
    await screen.findByText('Giao Dịch Thất Bại')
    expect(screen.queryByRole('button', { name: 'Tiếp tục chọn lịch PT' })).toBeNull()
    expired.unmount()
    saveDraft()
    render(<MemoryRouter initialEntries={['/payment/vnpay-return?paymentId=p2']}><VnPayReturnPage /></MemoryRouter>)
    await screen.findByText('Giao Dịch Thất Bại')
    expect(screen.queryByRole('button', { name: 'Tiếp tục chọn lịch PT' })).toBeNull()
  })
  it('hides a previously verified continuation immediately when accounts change', async () => {
    saveDraft()
    vi.mocked(paymentsService.getPaymentStatus).mockResolvedValue({ status: 'CANCELLED' } as never)
    const view = show()
    await screen.findByRole('button', { name: 'Tiếp tục chọn lịch PT' })
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'other', role: 'MEMBER' }, isInitializing: false } as never)
    view.rerender(<MemoryRouter initialEntries={['/payment/vnpay-return?paymentId=p1']}><VnPayReturnPage /></MemoryRouter>)
    expect(screen.queryByRole('button', { name: 'Tiếp tục chọn lịch PT' })).toBeNull()
  })
  it('does not offer a continuation if payment access has not been verified', async () => {
    saveDraft()
    vi.mocked(paymentsService.getPaymentStatus).mockRejectedValue(new Error('Forbidden'))
    show()
    await screen.findByText('Không thể kết nối đến máy chủ để xác thực giao dịch.')
    expect(screen.queryByRole('button', { name: 'Tiếp tục chọn lịch PT' })).toBeNull()
  })
  it('does not treat a success code in the URL as payment confirmation', async () => {
    vi.mocked(paymentsService.getPaymentStatus).mockResolvedValue({ status: 'FAILED' } as never)
    show()
    await screen.findByText('Giao Dịch Thất Bại')
    expect(paymentsService.getPaymentById).not.toHaveBeenCalled()
    expect(openReceipt).not.toHaveBeenCalled()
  })
  it('distinguishes received money from an applied order', async () => {
    vi.mocked(paymentsService.getPaymentStatus).mockResolvedValue({ status: 'PAID', application: 'UNAPPLIED' } as never)
    vi.mocked(paymentsService.getPaymentById).mockResolvedValue({ id: 'p1', status: 'PAID' } as never)
    show()
    await screen.findByText('Đã nhận tiền — đang đối soát')
    expect(screen.queryByText('Thanh Toán Thành Công!')).not.toBeInTheDocument()
    expect(openReceipt).not.toHaveBeenCalled()
  })
  it('loads and opens a server-issued invoice for an applied payment', async () => {
    vi.mocked(paymentsService.getPaymentStatus).mockResolvedValue({ status: 'PAID', application: 'APPLIED' } as never)
    vi.mocked(paymentsService.getPaymentById).mockResolvedValue({ id: 'p1', status: 'PAID', invoiceId: 'inv1' } as never)
    vi.mocked(paymentsService.getInvoiceById).mockResolvedValue({ id: 'inv1', invoiceNumber: 'INV-1' } as never)
    show()
    await waitFor(() => expect(openReceipt).toHaveBeenCalledWith({ invoiceId: 'inv1' }))
    expect(screen.getByText('Thanh Toán Thành Công!')).toBeInTheDocument()
  })
  it('waits for auth bootstrap and offers login without requesting protected payment data', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, isInitializing: true } as never)
    const view = show()
    expect(paymentsService.getPaymentStatus).not.toHaveBeenCalled()
    vi.mocked(useAuth).mockReturnValue({ user: null, isInitializing: false } as never)
    view.rerender(<MemoryRouter><VnPayReturnPage /></MemoryRouter>)
    await screen.findByRole('button', { name: 'Đăng nhập để xem giao dịch' })
    expect(paymentsService.getPaymentStatus).not.toHaveBeenCalled()
  })
})
