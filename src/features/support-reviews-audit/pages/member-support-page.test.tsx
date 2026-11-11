import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemberSupportPage } from './member-support-page'
import { supportRequestsService as service } from '../services/support-requests.service'
vi.mock('../services/support-requests.service', () => ({ supportRequestsService: { getMySupportRequests: vi.fn(), getSupportRequestById: vi.fn(), createSupportRequest: vi.fn(), reopenSupportRequest: vi.fn() } }))
vi.mock('@/features/fixed-pt/hybrid-api', () => ({ hybridGet: vi.fn().mockResolvedValue([{ id: 'p1', purchaseCode: 'PT-001', packageNameSnapshot: 'PT 3 buổi' }]) }))
beforeEach(() => { vi.clearAllMocks(); vi.mocked(service.getMySupportRequests).mockResolvedValue({ data: [] } as never); vi.mocked(service.createSupportRequest).mockResolvedValue({ id: 't1' } as never) })
describe('Member package refund support', () => {
  it('opens a prefilled request for the selected package and submits its link', async () => {
    render(<MemoryRouter initialEntries={['/member/support?purchaseId=p1&refund=1']}><MemberSupportPage /></MemoryRouter>)
    expect(await screen.findByDisplayValue('Yêu cầu hoàn phần gói PT chưa dùng')).toBeInTheDocument()
    await screen.findByRole('option', { name: 'PT-001 · PT 3 buổi' })
    expect(screen.getByLabelText('Gói PT liên quan')).toHaveValue('p1')
    fireEvent.change(screen.getByLabelText('Nội dung chi tiết'), { target: { value: 'Xin hoàn phần chưa dùng' } })
    fireEvent.click(screen.getByRole('button', { name: /^Gửi yêu cầu$/ }))
    await waitFor(() => expect(service.createSupportRequest).toHaveBeenCalledWith({ subject: 'Yêu cầu hoàn phần gói PT chưa dùng', message: 'Xin hoàn phần chưa dùng', category: 'PAYMENT', ptPurchaseId: 'p1' }))
  })
  it('loads current refund progress from the detail endpoint and links to an existing package route', async () => {
    const ticket = { id: 't1', requestCode: 'SUP-1', subject: 'Hoàn gói', message: 'Xin hoàn', status: 'OPEN', createdAt: '2026-11-11T03:00:00Z' }
    vi.mocked(service.getMySupportRequests).mockResolvedValue({ data: [ticket] } as never)
    vi.mocked(service.getSupportRequestById).mockResolvedValue({ ...ticket, links: { purchase: { id: 'p1', purchaseCode: 'PT-001', refund: { status: 'PAID', amount: '600000' } } } } as never)
    render(<MemoryRouter><MemberSupportPage /></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: 'Xem chi tiết' }))
    expect(await screen.findByText(/Đã chuyển tiền hoàn/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Gói PT-001' })).toHaveAttribute('href', '/pt-purchases/p1')
  })
})
