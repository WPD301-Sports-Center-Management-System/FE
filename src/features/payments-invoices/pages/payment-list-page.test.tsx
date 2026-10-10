import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { PaymentListPage } from './payment-list-page'
import { paymentsService } from '../services/payments.service'
import type { Payment, Invoice } from '@/shared/types/api'

vi.mock('../services/payments.service', () => ({
  paymentsService: {
    getPayments: vi.fn(),
    getInvoiceById: vi.fn(),
  },
}))

describe('PaymentListPage', () => {
  const mockPayments: Payment[] = [
    {
      id: 'pay-001',
      paymentCode: 'PAY-20261010-001',
      memberId: 'mem-1',
      amount: '1200000',
      method: 'CASH',
      status: 'PAID',
      paidAt: '2026-10-10T09:00:00Z',
      memberName: 'Nguyen Van A',
      itemDescription: 'Vé Tập Gym 1 Tháng',
      invoiceId: 'inv-001',
    },
  ]

  const mockInvoice: Invoice = {
    id: 'inv-001',
    invoiceNumber: 'INV-20261010-001',
    paymentId: 'pay-001',
    memberNameSnapshot: 'Nguyen Van A',
    itemNameSnapshot: 'Vé Tập Gym 1 Tháng',
    subtotal: '1200000',
    total: '1200000',
    issuedAt: '2026-10-10T09:00:00Z',
    paymentMethod: 'CASH',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(paymentsService.getPayments).mockResolvedValue({
      data: mockPayments,
      total: 1,
      page: 1,
      limit: 100,
    } as any)
    vi.mocked(paymentsService.getInvoiceById).mockResolvedValue(mockInvoice)
  })

  it('renders payment list page and displays payments from API', async () => {
    render(
      <BrowserRouter>
        <PaymentListPage />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Sổ Thu Ngân & Hóa Đơn (WEB-REC-08, 09)')).toBeInTheDocument()
      expect(screen.getByText('PAY-20261010-001')).toBeInTheDocument()
      expect(screen.getByText('Nguyen Van A')).toBeInTheDocument()
      expect(screen.getByText('Vé Tập Gym 1 Tháng')).toBeInTheDocument()
    })
  })

  it('opens invoice modal when clicking "In Hóa đơn"', async () => {
    render(
      <BrowserRouter>
        <PaymentListPage />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('In Hóa đơn')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('In Hóa đơn'))

    await waitFor(() => {
      expect(screen.getByText('Hóa Đơn Thu Phí Dịch Vụ')).toBeInTheDocument()
      expect(screen.getByText('INV-20261010-001')).toBeInTheDocument()
      expect(screen.getByText('SPORTS CENTER MANAGEMENT')).toBeInTheDocument()
    })
  })
})
