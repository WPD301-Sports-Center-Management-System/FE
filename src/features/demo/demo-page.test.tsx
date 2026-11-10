import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { DemoPage } from './demo-page'
import { hybridGet, hybridSend } from '@/features/fixed-pt/hybrid-api'
vi.mock('@/features/fixed-pt/hybrid-api', () => ({ hybridGet: vi.fn(), hybridSend: vi.fn() }))
const scenario = {
  purchases: [{ id: 'purchase', code: 'PT-DEMO', status: 'ACTIVE', memberName: 'Học viên demo', memberEmail: 'demo.member1@apexfit.demo', coachName: 'Coach demo', coachEmail: 'demo.coach@apexfit.demo', gymValid: true, formReady: false }],
  sessions: [{ id: 'slot', purchaseId: 'purchase', status: 'SCHEDULED', startsAt: '2026-11-12T09:00:00+07:00', endsAt: '2026-11-12T10:00:00+07:00' }], serverNow: '2026-11-09T09:00:00+07:00',
}
beforeEach(() => { vi.clearAllMocks(); vi.mocked(hybridGet).mockResolvedValue(scenario) })
afterEach(cleanup)
const mount = () => render(<MemoryRouter><DemoPage /></MemoryRouter>)
it('shows prerequisites and requires explicit confirmation before moving the selected session', async () => {
  vi.mocked(hybridSend).mockResolvedValue({ startsAt: '2026-11-09T09:00:00+07:00' })
  mount()
  await screen.findByText('Coach cần hoàn thành')
  fireEvent.click(screen.getByRole('button', { name: 'Đưa buổi kế tiếp về hiện tại' }))
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  expect(hybridSend).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Chuyển lịch demo' }))
  await waitFor(() => expect(hybridSend).toHaveBeenCalledWith('post', '/demo/sessions/slot/warp', {}))
  await screen.findByRole('status')
})
it('keeps a failed request visible and permits retry without closing the dialog', async () => {
  vi.mocked(hybridSend).mockRejectedValue(new Error('Khung giờ trùng lịch'))
  mount()
  fireEvent.click(await screen.findByRole('button', { name: 'Đưa buổi kế tiếp về hiện tại' }))
  fireEvent.click(screen.getByRole('button', { name: 'Chuyển lịch demo' }))
  await waitFor(() => expect(screen.getByRole('dialog')).toHaveTextContent('Khung giờ trùng lịch'))
  expect(screen.getByRole('button', { name: 'Chuyển lịch demo' })).toBeEnabled()
})
it('blocks another time shift while a session is running', async () => {
  vi.mocked(hybridGet).mockResolvedValue({ ...scenario, sessions: [...scenario.sessions, { ...scenario.sessions[0], id: 'running', status: 'IN_PROGRESS' }] })
  mount()
  await screen.findByText('Đang tập')
  expect(screen.getByRole('button', { name: 'Đưa buổi kế tiếp về hiện tại' })).toBeDisabled()
})
