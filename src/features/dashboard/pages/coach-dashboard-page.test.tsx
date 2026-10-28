import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CoachDashboardPage } from './coach-dashboard-page'
import { fixedPtApi } from '@/features/fixed-pt/api'

vi.mock('@/features/auth/context/auth-context', () => ({ useAuth: () => ({ user: { fullName: 'Coach Nam' } }) }))
vi.mock('@/features/fixed-pt/api', () => ({ fixedPtApi: { coachSessions: vi.fn(), coachEnrollments: vi.fn(), scheduleChanges: vi.fn(), myEarningSummary: vi.fn() } }))
describe('Coach dashboard uses fixed PT work and per-session earnings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fixedPtApi.coachSessions).mockResolvedValue([])
    vi.mocked(fixedPtApi.coachEnrollments).mockResolvedValue([])
    vi.mocked(fixedPtApi.scheduleChanges).mockResolvedValue([])
    vi.mocked(fixedPtApi.myEarningSummary).mockResolvedValue({ byStatus: { ELIGIBLE: { amount: 120000, count: 1 }, INCLUDED: { amount: 120000, count: 1 } }, paidOut: 0, advanceAmount: 0, advanceRemaining: 0, recoveryOutstanding: 0 })
  })
  it('filters sessions to the center day and counts eligible and included amounts', async () => {
    render(<MemoryRouter><CoachDashboardPage /></MemoryRouter>)
    await waitFor(() => expect(screen.getByText('240.000 ₫')).toBeInTheDocument())
    expect(fixedPtApi.coachSessions).toHaveBeenCalledWith(expect.objectContaining({ from: expect.stringContaining('T00:00:00+07:00'), to: expect.stringContaining('T23:59:59.999+07:00') }))
    expect(screen.getByText('Hôm nay chưa có buổi PT.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Soạn chương trình' })).toHaveAttribute('href', '/coach/training-plans')
  })
  it('shows a receipt/earnings service failure instead of treating it as zero income', async () => {
    vi.mocked(fixedPtApi.myEarningSummary).mockRejectedValue(new Error('Không tải được đối soát'))
    render(<MemoryRouter><CoachDashboardPage /></MemoryRouter>)
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Không tải được đối soát'))
    expect(screen.queryByText('0 ₫')).not.toBeInTheDocument()
  })
})
