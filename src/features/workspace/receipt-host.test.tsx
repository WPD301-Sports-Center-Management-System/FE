import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { ReceiptHost } from './receipt-host'
import { openReceipt } from './receipt-events'
import { counterPayment } from './counter-payment'

vi.mock('@/shared/api/client', () => ({ apiClient: { get: vi.fn(), post: vi.fn() } }))
const invoice = { id: 'inv-1', invoiceNumber: 'INV-001', memberNameSnapshot: 'Nguyễn Văn An', memberEmailSnapshot: 'an@example.com', itemNameSnapshot: 'Vé Gym', subtotal: '120000', total: '120000', issuedAt: '2026-10-28T08:46:00Z', payment: { paymentCode: 'PAY-001', method: 'CASH', amount: '120000' } }

describe('shared payment receipt', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('never collects a bank transfer when the confirmation host is missing', async () => {
    await expect(counterPayment({ subscriptionId: 'sub-1', method: 'BANK_TRANSFER', receivedAmount: 120000 })).rejects.toThrow('Chưa ghi nhận thanh toán')
    expect(apiClient.post).not.toHaveBeenCalled()
  })

  it('opens an invoice with print and PDF actions, then restores scrolling on close', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: invoice })
    render(<ReceiptHost />)
    act(() => { openReceipt({ invoiceId: invoice.id }) })
    expect(await screen.findByRole('dialog', { name: 'INV-001' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tải hóa đơn PDF' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'In hóa đơn' })).toBeEnabled()
    await waitFor(() => expect(document.body.style.overflow).toBe('hidden'))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.body.style.overflow).toBe('')
  })

  it('never marks an unconfirmed payment as paid', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { status: 'PENDING' } })
    render(<ReceiptHost />)
    act(() => { openReceipt({ paymentId: 'pending' }) })
    expect(await screen.findByRole('alert')).toHaveTextContent('chưa được xác nhận')
    expect(screen.queryByText('Đã thanh toán')).not.toBeInTheDocument()
  })

  it('previews transfers and sends only one payment after explicit receipt confirmation', async () => {
    vi.mocked(apiClient.get).mockImplementation(async url => {
      if (url === '/subscriptions/sub-1') return { data: { id: 'sub-1', memberId: 'mem-1', priceSnapshot: '120000', planNameSnapshot: 'Vé Gym' } }
      if (url === '/members/mem-1') return { data: { user: { fullName: 'Nguyễn Văn An' } } }
      if (url === '/payments/pay-1') return { data: { status: 'PAID', invoiceId: 'inv-1' } }
      return { data: invoice }
    })
    vi.mocked(apiClient.post).mockResolvedValue({ data: { id: 'pay-1', changeAmount: 0 } })
    render(<ReceiptHost />)
    let payment!: Promise<{ id: string }>
    act(() => { payment = counterPayment({ subscriptionId: 'sub-1', method: 'BANK_TRANSFER', receivedAmount: 120000 }) })
    expect(await screen.findByText('Chuyển khoản ngân hàng')).toBeInTheDocument()
    expect(apiClient.post).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Đã nhận tiền — xác nhận' }))
    await act(async () => { expect((await payment).id).toBe('pay-1') })
    await screen.findByRole('dialog', { name: 'INV-001' })
    expect(apiClient.post).toHaveBeenCalledTimes(1)
  })

  it('closing a transfer preview never collects money', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { id: 'sub-1', memberId: 'mem-1', priceSnapshot: '120000' } }).mockResolvedValueOnce({ data: { user: { fullName: 'An' } } })
    render(<ReceiptHost />)
    let payment!: Promise<unknown>
    act(() => { payment = counterPayment({ subscriptionId: 'sub-1', method: 'BANK_TRANSFER', receivedAmount: 120000 }) })
    const rejected = expect(payment).rejects.toThrow('Chưa ghi nhận thanh toán')
    await screen.findByText('Chuyển khoản ngân hàng')
    fireEvent.click(screen.getByRole('button', { name: 'Đóng hóa đơn' }))
    await rejected
    expect(apiClient.post).not.toHaveBeenCalled()
  })

  it('receipt load failure offers retry without collecting payment again', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Mất kết nối')).mockResolvedValueOnce({ data: invoice })
    render(<ReceiptHost />)
    act(() => { openReceipt({ invoiceId: invoice.id }) })
    expect(await screen.findByRole('alert')).toHaveTextContent('Mất kết nối')
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }))
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'INV-001' })).toBeInTheDocument())
    expect(apiClient.post).not.toHaveBeenCalled()
  })
})
