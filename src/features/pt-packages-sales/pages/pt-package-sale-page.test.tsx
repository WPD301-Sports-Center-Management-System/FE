import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PtPackageSalePage } from './pt-package-sale-page'
import { membersService } from '@/features/memberships/services/members.service'
import { coursesExercisesService } from '@/features/courses-exercises/services/courses-exercises.service'
import { coachesService } from '@/features/coaches/services/coaches.service'
import { coachApprovalService } from '@/features/coach-approval/services/coach-approval.service'
import { ptPurchasesService } from '../services/pt-purchases.service'
import { paymentsService } from '@/features/payments-invoices/services/payments.service'

vi.mock('@/features/memberships/services/members.service', () => ({ membersService: { getMembers: vi.fn() } }))
vi.mock('@/features/courses-exercises/services/courses-exercises.service', () => ({ coursesExercisesService: { getTrainingCourses: vi.fn() } }))
vi.mock('@/features/coaches/services/coaches.service', () => ({ coachesService: { getCoaches: vi.fn() } }))
vi.mock('@/features/coach-approval/services/coach-approval.service', () => ({ coachApprovalService: { getPtPackageOptions: vi.fn() } }))
vi.mock('../services/pt-purchases.service', () => ({ ptPurchasesService: { createPurchase: vi.fn(), getPurchaseById: vi.fn() } }))
vi.mock('@/features/payments-invoices/services/payments.service', () => ({ paymentsService: { createVNPay: vi.fn(), payCounter: vi.fn() } }))

describe('PtPackageSalePage payment flow', () => {
  const pending = { id: 'purchase-1', purchaseCode: 'PT-1', status: 'PENDING_PAYMENT', priceSnapshot: '500000', totalCredits: 0 }
  const active = { ...pending, status: 'ACTIVE', totalCredits: 5 }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(membersService.getMembers).mockResolvedValue({ data: [{ id: 'member-1', fullName: 'Hội viên', memberCode: 'MEM-1' }] } as never)
    vi.mocked(coursesExercisesService.getTrainingCourses).mockResolvedValue({ data: [{ id: 'course-1', name: 'Khóa PT', isActive: true }] } as never)
    vi.mocked(coachesService.getCoaches).mockResolvedValue({ data: [{ id: 'coach-1', fullName: 'HLV' }] } as never)
    vi.mocked(coachApprovalService.getPtPackageOptions).mockResolvedValue({ data: [{ id: 'option-1', courseId: 'course-1', coachId: 'coach-1', name: 'Gói 5 buổi', price: '500000', sessionCount: 5, approvalStatus: 'APPROVED', isActive: true }] } as never)
    vi.mocked(ptPurchasesService.createPurchase).mockResolvedValue(pending as never)
  })

  it('uses VNPay, keeps a failed order pending, and retries that same order at the counter', async () => {
    vi.mocked(paymentsService.createVNPay).mockResolvedValue({ paymentId: 'payment-1', paymentUrl: '', expiresAt: '' })
    vi.mocked(ptPurchasesService.getPurchaseById)
      .mockResolvedValueOnce(pending as never)
      .mockResolvedValueOnce(active as never)
    vi.mocked(paymentsService.payCounter).mockResolvedValue({ status: 'PAID' } as never)

    render(<MemoryRouter><PtPackageSalePage /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: 'VNPay QR' }))
    fireEvent.click(screen.getByRole('button', { name: 'Thanh toán qua VNPay' }))

    await waitFor(() => expect(paymentsService.createVNPay).toHaveBeenCalledWith({
      ptPurchaseId: 'purchase-1', returnTarget: 'web',
    }))
    expect(paymentsService.payCounter).not.toHaveBeenCalled()
    expect(await screen.findByText(/đang chờ thanh toán/i)).toBeInTheDocument()
    expect(screen.queryByText('Đã thanh toán và kích hoạt gói PT')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Tiền mặt tại quầy' }))
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại thanh toán' }))

    await waitFor(() => expect(paymentsService.payCounter).toHaveBeenCalledWith({
      ptPurchaseId: 'purchase-1', method: 'CASH', receivedAmount: 500000,
    }))
    expect(ptPurchasesService.createPurchase).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('Đã thanh toán và kích hoạt gói PT')).toBeInTheDocument()
  })

  it('does not show an active package when counter payment fails', async () => {
    vi.mocked(paymentsService.payCounter).mockRejectedValue(new Error('Payment unavailable'))
    render(<MemoryRouter><PtPackageSalePage /></MemoryRouter>)

    fireEvent.click(await screen.findByRole('button', { name: 'Xác nhận thu tiền & Kích hoạt gói PT' }))

    expect(await screen.findByText(/Đơn PT-1 đang chờ thanh toán/i)).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Payment unavailable')
    expect(screen.queryByText('Đã thanh toán và kích hoạt gói PT')).not.toBeInTheDocument()
    expect(ptPurchasesService.createPurchase).toHaveBeenCalledTimes(1)
  })
})
