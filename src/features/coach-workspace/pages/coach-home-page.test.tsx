import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { CoachHomePage } from './coach-home-page'

vi.mock('../shell', () => ({ useCoachShell: () => ({ refreshBadges: vi.fn() }) }))
vi.mock('../components/trial-requests', () => ({ CoachTrialRequests: () => null }))
vi.mock('../api', () => ({ coachWs: {
  sessions: vi.fn().mockResolvedValue([]), purchases: vi.fn().mockResolvedValue([]),
  earningSummary: vi.fn().mockResolvedValue({ available: 0, unverified: 0, paidOut: 0, reserved: 0 }),
  templates: vi.fn().mockResolvedValue([]), aiDrafts: vi.fn().mockResolvedValue(0),
} }))

describe('CoachHomePage', () => {
  it('shows zero sessions after loading and states the scope of the loaded data', async () => {
    render(<MemoryRouter><CoachHomePage /></MemoryRouter>)
    expect(await screen.findByText('0 ca dạy hôm nay')).toBeInTheDocument()
    const tile = screen.getByText('Ca dạy hôm nay').parentElement!.parentElement!
    expect(within(tile).getByText('0')).toBeInTheDocument()
    expect(tile).toHaveTextContent(/0\s*ca/)
    expect(screen.getByText(/Dữ liệu đã tải: tối đa 100 buổi hôm nay/)).toBeInTheDocument()
  })
})
