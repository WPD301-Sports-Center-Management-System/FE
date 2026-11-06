import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { hybridGet, hybridSend } from '../hybrid-api'
import { ScheduleTools } from './schedule-tools'

vi.mock('../hybrid-api', () => ({ hybridGet: vi.fn(), hybridSend: vi.fn() }))
beforeEach(() => {
  vi.mocked(hybridGet).mockImplementation(async (path: string) => {
    if (path.endsWith('/scheduling-status')) return { allowance: { used: 4, remaining: 2, limit: 6 }, expectedCompletionAt: '2026-12-01T11:00:00Z', absences: [{ id: 'absence', plannedStartsAt: '2026-11-09T11:00:00Z', cancelledAt: '2026-11-07T11:00:00Z', replacements: [] }] }
    if (path.endsWith('/contact-status')) return { hasNoShow: false, canPause: false, eligibleAt: null }
    if (path.endsWith('/reschedule-slots')) return { day: '2026-11-09', slots: [{ startsAt: '2026-11-09T13:00:00Z', endsAt: '2026-11-09T14:00:00Z', available: true }] }
    if (path === '/coaches/me/pt-packages') return [{ id: 'pkg', purchaseCode: 'PT-12', memberName: 'An', status: 'ACTIVE' }]
    if (path === '/coaches/me/pt-bookings') return [{ id: 'booking', plannedStartsAt: '2026-11-09T11:00:00Z' }]
    throw new Error(`Unexpected request ${path}`)
  })
  vi.mocked(hybridSend).mockResolvedValue({})
})
afterEach(() => { cleanup(); vi.clearAllMocks() })

it('replaces range/pattern tools with allowance tracking and removes leave-pause actions', async () => {
  render(<ScheduleTools initialPurchaseId="pkg" initialTool="ABSENCES" />)
  expect(await screen.findByText(/còn 2 lượt/)).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'Nghỉ / nối cuối gói' })).toBeInTheDocument()
  expect(screen.queryByRole('tab', { name: 'Dời nhiều buổi' })).not.toBeInTheDocument()
  expect(screen.queryByRole('tab', { name: 'Đổi lịch cố định' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Tạm ngưng gói' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Xử lý lịch nối còn thiếu' }))
  expect(screen.getByRole('tab', { name: 'Xếp buổi chờ' })).toHaveAttribute('aria-selected', 'true')
})

it('offers only server-provided same-day times and submits unchanged duration without a new-date field', async () => {
  render(<ScheduleTools initialPurchaseId="pkg" />)
  const booking = await screen.findByRole('combobox', { name: 'Buổi cần đổi' })
  await waitFor(() => expect(booking.querySelector('option[value="booking"]')).not.toBeNull())
  fireEvent.change(booking, { target: { value: 'booking' } })
  const times = await screen.findByRole('combobox', { name: /Giờ mới.*2026-11-09/ })
  fireEvent.change(times, { target: { value: '2026-11-09T13:00:00Z' } })
  expect(screen.queryByLabelText('Ngày mới')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Xem giờ đề xuất' }))
  fireEvent.click(screen.getByRole('button', { name: 'Gửi đề xuất cho học viên' }))
  await waitFor(() => expect(hybridSend).toHaveBeenCalledWith('post', '/pt-schedule-changes', expect.objectContaining({ purchaseId: 'pkg', items: [{ bookingId: 'booking', creditId: undefined, startsAt: '2026-11-09T13:00:00Z', endsAt: '2026-11-09T14:00:00Z' }] })))
})
