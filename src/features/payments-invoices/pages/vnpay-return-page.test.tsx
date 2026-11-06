import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VnPayReturnPage } from './vnpay-return-page'
import { useAuth } from '@/features/auth/context/auth-context'
import { paymentsService } from '../services/payments.service'
import { openReceipt } from '@/features/workspace/receipt-events'

vi.mock('@/features/auth/context/auth-context', () => ({ useAuth: vi.fn() }))
vi.mock('../services/payments.service', () => ({ paymentsService: { getPaymentStatus: vi.fn(), getPaymentById: vi.fn(), getInvoiceById: vi.fn() } }))
vi.mock('@/features/workspace/receipt-events', () => ({ openReceipt: vi.fn() }))
const show = () => render(<MemoryRouter initialEntries={['/payment/vnpay-return?paymentId=p1&vnp_ResponseCode=00']}><VnPayReturnPage /></MemoryRouter>)
describe('VNPay server confirmation and entitlement application', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(useAuth).mockReturnValue({ user: { id: 'u1', role: 'MEMBER' }, isInitializing: false } as never) })
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
