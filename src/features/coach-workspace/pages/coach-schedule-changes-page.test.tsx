import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Link, MemoryRouter, useNavigate } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import { CoachScheduleChangesPage } from './coach-schedule-changes-page'
import { coachWs } from '../api'
vi.mock('../api', () => ({ coachWs: { scheduleChanges: vi.fn(), purchases: vi.fn() } }))
vi.mock('../shell', () => ({ useCoachShell: () => ({ refreshBadges: vi.fn() }) }))
vi.mock('@/features/fixed-pt/components/schedule-tools', () => ({ ScheduleTools: () => null }))
vi.mock('../components/session-work-queue', () => ({ SessionWorkQueue: () => <Link to="?requestId=r1">Xem đề xuất</Link> }))
const proposal = { id: 'r1', code: 'DC-1', type: 'RESCHEDULE', status: 'PROPOSED', purchaseId: 'p1', createdAt: '2026-11-09T01:00:00Z', items: [], purchase: { id: 'p1', packageNameSnapshot: 'PT 12 buổi', purchaseCode: 'PT-1' } }
function Back() { const navigate = useNavigate(); return <button onClick={() => navigate(-1)}>Back</button> }
beforeEach(() => { vi.clearAllMocks(); vi.mocked(coachWs.scheduleChanges).mockResolvedValue([proposal] as never); vi.mocked(coachWs.purchases).mockResolvedValue([]) })
it('opens the targeted proposal from an already mounted REQUESTED inbox, focuses it, and preserves Back', async () => {
  render(<MemoryRouter initialEntries={['/coach/schedule?tab=changes']}><Back /><CoachScheduleChangesPage /></MemoryRouter>)
  await screen.findByText('Không có yêu cầu nào')
  expect(screen.getByRole('tab', { name: /Chờ xử lý/ })).toHaveAttribute('aria-selected', 'true')
  fireEvent.click(screen.getByRole('link', { name: 'Xem đề xuất' }))
  await screen.findByRole('button', { name: 'Rút đề xuất' })
  expect(screen.getByRole('tab', { name: /Tất cả/ })).toHaveAttribute('aria-selected', 'true')
  await waitFor(() => expect(screen.getByRole('row', { name: 'Yêu cầu DC-1' })).toHaveFocus())
  fireEvent.click(screen.getByRole('button', { name: 'Back' }))
  await screen.findByText('Không có yêu cầu nào')
  expect(screen.getByRole('tab', { name: /Chờ xử lý/ })).toHaveAttribute('aria-selected', 'true')
  expect(coachWs.scheduleChanges).toHaveBeenCalledTimes(1)
})
it('shows the proposal when opened directly by requestId', async () => {
  render(<MemoryRouter initialEntries={['/coach/schedule?tab=changes&requestId=r1']}><CoachScheduleChangesPage /></MemoryRouter>)
  expect(await screen.findByRole('button', { name: 'Rút đề xuất' })).toBeInTheDocument()
  await waitFor(() => expect(screen.getByRole('row', { name: 'Yêu cầu DC-1' })).toHaveFocus())
})
