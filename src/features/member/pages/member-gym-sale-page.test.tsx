import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import { MemberGymSalePage } from './member-gym-sale-page'
import { deskApi } from '@/features/reception-workspace/api'
import { hybridSend } from '@/features/fixed-pt/hybrid-api'
vi.mock('@/features/auth/context/auth-context', () => ({ useAuth: () => ({ user: { id: 'u1', role: 'MEMBER' } }) }))
vi.mock('@/features/reception-workspace/api', () => ({ deskApi: { plans: vi.fn().mockResolvedValue([{ id: 'plan', name: 'Vé 1 tháng', paidMonths: 1, bonusMonths: 0, price: '500000' }]), payVnpay: vi.fn(), renewSubscription: vi.fn() } }))
vi.mock('@/features/fixed-pt/hybrid-api', () => ({ hybridGet: vi.fn().mockResolvedValue([]), hybridSend: vi.fn().mockResolvedValue({ id: 'order', planNameSnapshot: 'Vé 1 tháng', priceSnapshot: '500000', startDate: '2026-12-01', endDate: '2026-12-31' }) }))
it('keeps the created gym order when payment fails and preserves the explicit return to the PT draft', async () => {
  vi.mocked(deskApi.payVnpay).mockRejectedValue(new Error('Chưa mở được thanh toán'))
  render(<MemoryRouter initialEntries={[{ pathname: '/member/membership-sale', state: { ptDraft: { coachId: 'coach', optionId: 'option' } } }]}><MemberGymSalePage /></MemoryRouter>)
  fireEvent.change(await screen.findByRole('combobox'), { target: { value: 'plan' } })
  await waitFor(() => expect(screen.getByRole('button', { name: 'Tạo đơn vé để xem lại' })).toBeEnabled())
  fireEvent.click(screen.getByRole('button', { name: 'Tạo đơn vé để xem lại' }))
  const pay = await screen.findByRole('button', { name: 'Tiếp tục thanh toán vé qua VNPay' })
  fireEvent.click(pay)
  await screen.findByText('Chưa mở được thanh toán')
  fireEvent.click(pay)
  await waitFor(() => expect(deskApi.payVnpay).toHaveBeenCalledTimes(2))
  expect(hybridSend).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('link', { name: 'Quay lại phương án PT' })).toHaveAttribute('href', '/member/pt-sale')
})
