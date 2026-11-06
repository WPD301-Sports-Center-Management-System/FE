import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { coachWs, type MemberDetail } from '../api'
import { CoachStudentDetailPage } from './coach-student-detail-page'

vi.mock('../api', () => ({
  coachWs: {
    member: vi.fn(), progress: vi.fn(), purchases: vi.fn(),
    sessions: vi.fn(), results: vi.fn(),
  },
}))
vi.mock('@/features/goal-lab/journey-pages', () => ({ JourneyForPurchase: () => null }))

const member: MemberDetail = {
  id: 'member-1', memberCode: 'HV001', createdAt: '2026-11-01T00:00:00Z',
  user: { fullName: 'Demo Student' },
}

function renderPage() {
  return render(<MemoryRouter initialEntries={['/coach/students/member-1']}>
    <Routes><Route path="/coach/students/:memberId" element={<CoachStudentDetailPage />} /></Routes>
  </MemoryRouter>)
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(coachWs.progress).mockResolvedValue({ assessments: [], results: [] })
  vi.mocked(coachWs.purchases).mockResolvedValue([])
  vi.mocked(coachWs.sessions).mockResolvedValue([])
  vi.mocked(coachWs.results).mockResolvedValue([])
})
afterEach(cleanup)

describe('Coach student detail hook order', () => {
  it('renders the student after the initial loading state', async () => {
    let resolveMember!: (value: MemberDetail) => void
    vi.mocked(coachWs.member).mockReturnValue(new Promise(resolve => { resolveMember = resolve }))
    renderPage()
    expect(screen.queryByRole('heading', { name: member.user.fullName })).not.toBeInTheDocument()

    await act(async () => { resolveMember(member) })

    expect(screen.getAllByRole('heading', { name: member.user.fullName }).length).toBeGreaterThan(0)
    expect(coachWs.member).toHaveBeenCalledWith(member.id)
  })

  it('renders the student after retrying a failed request', async () => {
    vi.mocked(coachWs.member).mockRejectedValueOnce(new Error('Cannot load student')).mockResolvedValueOnce(member)
    renderPage()
    expect(await screen.findByText('Cannot load student')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /thử lại/i }))

    expect((await screen.findAllByRole('heading', { name: member.user.fullName })).length).toBeGreaterThan(0)
    expect(coachWs.member).toHaveBeenCalledTimes(2)
  })
})
