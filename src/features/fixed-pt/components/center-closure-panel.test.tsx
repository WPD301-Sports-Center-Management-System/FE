import { beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CenterClosurePanel } from './center-closure-panel'
import { centerClosuresApi } from '../center-closures-api'
import { AppApiError } from '@/shared/api/api-error'

vi.mock('../center-closures-api', () => ({ centerClosuresApi: { list: vi.fn(), preview: vi.fn(), apply: vi.fn() } }))
const preview = { fromDate: '2027-01-02', toDate: '2027-01-04', reason: 'Bảo trì', impactHash: 'a'.repeat(64), sessionCount: 2, purchaseCount: 1, ticketCount: 1, manualCount: 0, trialCount: 0, heldOrderCount: 0, sessions: [], tickets: [] }
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(centerClosuresApi.list).mockResolvedValue([])
  vi.mocked(centerClosuresApi.preview).mockResolvedValue(preview)
  vi.mocked(centerClosuresApi.apply).mockResolvedValue({ id: 'closure', repeated: false, cancelled: 2, autoMoved: 1, pendingMakeups: 1, compensatedTickets: 1, heldOrdersReleased: 0, manualSessions: 0, trialSessions: 0 })
})
async function show() {
  render(<MemoryRouter><CenterClosurePanel /></MemoryRouter>)
  fireEvent.change(screen.getByLabelText('Nghỉ từ ngày'), { target: { value: preview.fromDate } })
  fireEvent.change(screen.getByLabelText('Nghỉ đến hết ngày'), { target: { value: preview.toDate } })
  fireEvent.change(screen.getByLabelText('Lý do trung tâm nghỉ'), { target: { value: preview.reason } })
  fireEvent.click(screen.getByRole('button', { name: 'Xem trước tác động' }))
  return screen.findByRole('button', { name: 'Xác nhận nghỉ và bù quyền lợi' })
}
it('does not mutate when previewing and invalidates confirmation when the input changes', async () => {
  await show()
  expect(centerClosuresApi.apply).not.toHaveBeenCalled()
  fireEvent.change(screen.getByLabelText('Nghỉ đến hết ngày'), { target: { value: '2027-01-05' } })
  expect(screen.queryByRole('button', { name: 'Xác nhận nghỉ và bù quyền lợi' })).toBeNull()
})
it('reuses the exact key after an uncertain network response and reports pending makeups honestly', async () => {
  vi.mocked(centerClosuresApi.apply).mockRejectedValueOnce(new Error('Mất mạng'))
  fireEvent.click(await show())
  await screen.findByText('Mất mạng')
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận nghỉ và bù quyền lợi' }))
  await screen.findByRole('status')
  expect(vi.mocked(centerClosuresApi.apply).mock.calls[0]).toEqual(vi.mocked(centerClosuresApi.apply).mock.calls[1])
  expect(screen.getByRole('status')).toHaveTextContent('1 buổi chờ Coach')
})
it('requires another preview if server impact has changed', async () => {
  vi.mocked(centerClosuresApi.apply).mockRejectedValueOnce(new AppApiError(409, { success: false, code: 'IMPACT_CHANGED', message: 'Xem trước lại' }))
  fireEvent.click(await show())
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Xác nhận nghỉ và bù quyền lợi' })).toBeNull())
  expect(screen.getByRole('button', { name: 'Xem trước tác động' })).toBeEnabled()
})
it('links existing session outcomes for manual review without automatically reversing them', async () => {
  vi.mocked(centerClosuresApi.preview).mockResolvedValue({ ...preview, manualCount: 1, manual: [{ id: 'existing-result', memberName: 'Minh Anh', startsAt: '2027-01-02T11:00:00Z', status: 'COMPLETED' }] })
  await show()
  fireEvent.click(screen.getByText('Xem các buổi cần xử lý riêng'))
  expect(screen.getByRole('link', { name: /Minh Anh/ })).toHaveAttribute('href', '/manager/sessions/existing-result')
  expect(centerClosuresApi.apply).not.toHaveBeenCalled()
})
