import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth-context'
import { authService } from '../services/auth.service'
import { CoachCalendarPage } from '@/features/fixed-pt/pages/coach-calendar-page'
import { hybridApi } from '@/features/fixed-pt/hybrid-api'

vi.mock('../services/auth.service', () => ({ authService: { getCurrentUser: vi.fn() } }))
vi.mock('@/shared/utils/storage', () => ({ authStorage: {
  getAccessToken: () => 'test-token', getRefreshToken: () => null,
  setUser: vi.fn(), clearSession: vi.fn(),
} }))
vi.mock('@/features/fixed-pt/hybrid-api', () => ({ hybridGet: vi.fn(), hybridApi: {
  calendar: vi.fn(), settings: vi.fn(), setSettings: vi.fn(),
} }))

function ProfileProbe() {
  const { user } = useAuth()
  return <output>{user?.memberProfilesUserId?.id ?? user?.coachProfilesUserId?.id ?? 'loading'}</output>
}
describe('Auth profile IDs reach Coach calendar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authService.getCurrentUser).mockResolvedValue({
      id: 'user-id', fullName: 'Coach Nam', email: 'coach@test.local', phone: '0900000000',
      role: 'COACH', status: 'ACTIVE', coachProfilesUserId: { id: 'coach-profile-id' },
    } as never)
    vi.mocked(hybridApi.calendar).mockResolvedValue({ timezone: 'Asia/Bangkok', rules: [], sessions: [], holds: [], exceptions: [], timeOffs: [] })
    vi.mocked(hybridApi.settings).mockResolvedValue({ acceptingNewMembers: false, bufferMinutes: 15 })
    vi.mocked(hybridApi.setSettings).mockResolvedValue({})
  })
  it('loads intake settings with the Coach profile ID and shows the enable action after auth', async () => {
    render(<MemoryRouter><AuthProvider><CoachCalendarPage /></AuthProvider></MemoryRouter>)
    expect(await screen.findByRole('button', { name: 'Bật nhận học viên mới' }, { timeout: 5000 })).toBeEnabled()
    expect(hybridApi.settings).toHaveBeenCalledWith('coach-profile-id')
    expect(hybridApi.settings).not.toHaveBeenCalledWith('user-id')
    vi.mocked(hybridApi.settings).mockResolvedValue({ acceptingNewMembers: true, bufferMinutes: 15 })
    fireEvent.click(screen.getByRole('button', { name: 'Bật nhận học viên mới' }))
    await waitFor(() => expect(hybridApi.setSettings).toHaveBeenCalledWith('coach-profile-id', { acceptingNewMembers: true }))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Bật nhận học viên mới' })).not.toBeInTheDocument())
    expect(screen.getByRole('checkbox')).toBeChecked()
  })
  it('also preserves the Member profile ID returned by auth/me', async () => {
    vi.mocked(authService.getCurrentUser).mockResolvedValue({
      id: 'member-user', fullName: 'Member', role: 'MEMBER', status: 'ACTIVE',
      memberProfilesUserId: { id: 'member-profile-id' }, coachProfilesUserId: null,
    } as never)
    render(<AuthProvider><ProfileProbe /></AuthProvider>)
    expect(await screen.findByText('member-profile-id')).toBeInTheDocument()
  })
})
