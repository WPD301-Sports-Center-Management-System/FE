import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { hybridGet, hybridSend } from '../hybrid-api'
import { ScheduleTools } from './schedule-tools'

vi.mock('../hybrid-api', () => ({ hybridGet: vi.fn(), hybridSend: vi.fn() }))
beforeEach(() => {
  vi.mocked(hybridGet).mockImplementation(async (path: string) => {
    if (path.endsWith('/scheduling-status')) return { allowance: { used: 4, remaining: 2, limit: 6 }, expectedCompletionAt: '2026-12-01T11:00:00Z', absences: [{ id: 'absence', absenceId: 'report', plannedStartsAt: '2026-11-09T11:00:00Z', cancelledAt: '2026-11-07T11:00:00Z', replacements: [] }] }
    if (path.endsWith('/contact-status')) return { hasNoShow: false, canPause: false, eligibleAt: null }
    if (path.endsWith('/reschedule-slots')) return { day: '2026-11-09', slots: [{ startsAt: '2026-11-09T13:00:00Z', endsAt: '2026-11-09T14:00:00Z', available: true }] }
    if (path === '/coaches/me/pt-packages') return [{ id: 'pkg', purchaseCode: 'PT-12', memberName: 'An', status: 'ACTIVE' }]
    if (path === '/coaches/me/pt-bookings') return [{ id: 'booking', plannedStartsAt: '2026-11-09T11:00:00Z' }]
    throw new Error(`Unexpected request ${path}`)
  })
  vi.mocked(hybridSend).mockResolvedValue({})
})
afterEach(() => { cleanup(); vi.clearAllMocks() })

it('shows absence history without nested tool tabs and opens a simple makeup form in place', async () => {
  render(<ScheduleTools initialPurchaseId="pkg" initialTool="ABSENCES" />)
  expect(await screen.findByText(/Còn 2 lượt/)).toBeInTheDocument()
  expect(screen.queryByRole('tab')).not.toBeInTheDocument()
  expect(screen.queryByRole('tab', { name: 'Dời nhiều buổi' })).not.toBeInTheDocument()
  expect(screen.queryByRole('tab', { name: 'Đổi lịch cố định' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Tạm ngưng gói' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Xếp lịch học bù' }))
  expect(screen.getByLabelText('Ngày học bù')).toBeInTheDocument()
  expect(screen.getByLabelText('Giờ bắt đầu')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Thứ hai' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /Quay lại danh sách nghỉ/ }))
  expect(screen.getByRole('button', { name: 'Xếp lịch học bù' })).toBeInTheDocument()
  expect(screen.queryByLabelText('Ngày học bù')).not.toBeInTheDocument()
})

it('offers only server-provided same-day times and submits unchanged duration without a new-date field', async () => {
  render(<ScheduleTools initialPurchaseId="pkg" />)
  const booking = await screen.findByRole('combobox', { name: 'Buổi cần đổi' })
  await waitFor(() => expect(booking.querySelector('option[value="booking"]')).not.toBeNull())
  fireEvent.change(booking, { target: { value: 'booking' } })
  const times = await screen.findByRole('combobox', { name: /Giờ mới.*2026-11-09/ })
  fireEvent.change(times, { target: { value: '2026-11-09T13:00:00Z' } })
  expect(screen.queryByLabelText('Ngày mới')).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Xem giờ đề xuất' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Gửi đề xuất cho học viên' }))
  await waitFor(() => expect(hybridSend).toHaveBeenCalledWith('post', '/pt-schedule-changes', expect.objectContaining({ purchaseId: 'pkg', items: [{ bookingId: 'booking', creditId: undefined, startsAt: '2026-11-09T13:00:00Z', endsAt: '2026-11-09T14:00:00Z' }] })))
})

it('checks and submits a makeup proposal for the selected absence only', async () => {
  render(<ScheduleTools initialPurchaseId="pkg" initialTool="ABSENCES" />)
  fireEvent.click(await screen.findByRole('button', { name: 'Xếp lịch học bù' }))
  fireEvent.change(screen.getByLabelText('Ngày học bù'), { target: { value: '2027-01-04' } })
  fireEvent.change(screen.getByLabelText('Giờ bắt đầu'), { target: { value: '18:00' } })
  vi.mocked(hybridSend).mockResolvedValueOnce({ items: [{ creditId: 'credit', startsAt: '2027-01-04T11:00:00Z', endsAt: '2027-01-04T12:00:00Z', available: true }] })
  fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra lịch trống' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Gửi đề xuất cho học viên' }))
  await waitFor(() => expect(hybridSend).toHaveBeenCalledWith('post', '/pt-package-purchases/pkg/schedule-preview', { tool: 'SCHEDULE_PENDING', absenceId: 'report', bookingId: 'absence', startDate: '2027-01-04', pattern: [{ weekday: 1, startTime: '18:00' }] }))
  expect(hybridSend).toHaveBeenCalledWith('post', '/pt-schedule-changes', expect.objectContaining({ purchaseId: 'pkg', absenceId: 'report', items: [{ bookingId: undefined, creditId: 'credit', startsAt: '2027-01-04T11:00:00Z', endsAt: '2027-01-04T12:00:00Z' }] }))
})

it('does not offer another proposal while the Member confirmation is pending', async () => {
  const original = vi.mocked(hybridGet).getMockImplementation()!
  vi.mocked(hybridGet).mockImplementation(async (path: string, params?: object) => {
    const result = await original(path, params) as any
    return path.endsWith('/scheduling-status') ? { ...result, absences: result.absences.map((a: object) => ({ ...a, awaitingConfirmation: true })) } : result
  })
  render(<ScheduleTools initialPurchaseId="pkg" initialTool="ABSENCES" />)
  expect(await screen.findByText('Đang chờ học viên xác nhận lịch học bù.')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Xếp lịch học bù' })).not.toBeInTheDocument()
})

it('keeps the chosen date and time on a failed availability check without offering submission', async () => {
  render(<ScheduleTools initialPurchaseId="pkg" initialTool="ABSENCES" />)
  fireEvent.click(await screen.findByRole('button', { name: 'Xếp lịch học bù' }))
  fireEvent.change(screen.getByLabelText('Ngày học bù'), { target: { value: '2027-01-04' } })
  fireEvent.change(screen.getByLabelText('Giờ bắt đầu'), { target: { value: '18:00' } })
  vi.mocked(hybridSend).mockRejectedValueOnce(new Error('Khung giờ đã có lịch'))
  fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra lịch trống' }))
  await screen.findByText('Khung giờ đã có lịch')
  expect(screen.getByLabelText('Ngày học bù')).toHaveValue('2027-01-04')
  expect(screen.getByLabelText('Giờ bắt đầu')).toHaveValue('18:00')
  expect(screen.queryByRole('button', { name: 'Gửi đề xuất cho học viên' })).not.toBeInTheDocument()
})
