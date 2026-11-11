import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { CoachTrialRequests } from './trial-requests'
import { hybridGet, hybridSend } from '@/features/fixed-pt/hybrid-api'
vi.mock('@/features/fixed-pt/hybrid-api', () => ({ hybridGet: vi.fn(), hybridSend: vi.fn() }))
beforeEach(() => vi.clearAllMocks())
it('does not pretend REQUESTED contains accepted trials or fetch a STAFF list for the Coach', async () => {
  vi.mocked(hybridGet).mockResolvedValue([{ id: 'trial', fullName: 'Khách An', phone: '0901234567', coachDecision: null }])
  vi.mocked(hybridSend).mockImplementation(async () => { vi.mocked(hybridGet).mockResolvedValue([]); return {} as never })
  const view = render(<CoachTrialRequests compact />)
  fireEvent.click(await screen.findByRole('button', { name: 'Nhận khách' }))
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Nhận khách' })).toBeNull())
  const calls = vi.mocked(hybridGet).mock.calls.length
  view.rerender(<CoachTrialRequests compact waiting />)
  expect(screen.getByText(/Danh sách khách đã nhận nhưng chưa chốt giờ chưa được hỗ trợ/)).toBeInTheDocument()
  expect(hybridGet).toHaveBeenCalledTimes(calls)
  expect(vi.mocked(hybridGet).mock.calls.every(([url, params]) => url === '/coaches/me/trial-sessions' && (params as { status: string }).status === 'REQUESTED')).toBe(true)
})
it('does not even request an undecided list when opening the waiting group directly', () => {
  render(<CoachTrialRequests waiting />)
  expect(hybridGet).not.toHaveBeenCalled()
})
