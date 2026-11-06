import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { coachWs } from '../api'
import { CoachSchedulePage } from './coach-schedule-page'

vi.mock('../api', () => ({ coachWs: { sessions: vi.fn(), trialSessions: vi.fn(), timeOffs: vi.fn() } }))
vi.mock('../shell', () => ({ useCoachShell: () => ({ pendingChanges: 0 }) }))

beforeEach(() => {
  window.matchMedia = vi.fn().mockReturnValue({ matches: false })
  vi.mocked(coachWs.sessions).mockResolvedValue([])
  vi.mocked(coachWs.timeOffs).mockResolvedValue([])
  vi.mocked(coachWs.trialSessions).mockResolvedValue([
    { id: 'trial', fullName: 'Khách An', phone: '0901234567', scheduledAt: '2026-11-07T02:00:00Z', durationMinutes: 60, status: 'SCHEDULED' },
    { id: 'cancelled', fullName: 'Khách đã hủy', phone: '0901234568', scheduledAt: '2026-11-07T04:00:00Z', durationMinutes: 45, status: 'CANCELLED' },
  ])
})
afterEach(cleanup)

it('shows scheduled trials with customer details in both calendar views and filters cancelled trials', async () => {
  render(<MemoryRouter initialEntries={['/coach/schedule?day=2026-11-07&view=week']}><CoachSchedulePage /></MemoryRouter>)
  expect(await screen.findByText('Tập thử PT · Khách An')).toBeInTheDocument()
  expect(screen.getByText(/0901234567/)).toBeInTheDocument()
  expect(screen.queryByText('Tập thử PT · Khách đã hủy')).not.toBeInTheDocument()
  expect(screen.queryByRole('link', { name: /Khách An/ })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('checkbox'))
  expect(screen.getByText('Tập thử PT · Khách đã hủy')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('tab', { name: 'Ngày' }))
  expect(await screen.findByText('Tập thử PT · Khách An')).toBeInTheDocument()
})
