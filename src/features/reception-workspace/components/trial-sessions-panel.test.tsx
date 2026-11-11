import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TrialSessionsPanel } from './trial-sessions-panel'
import { deskApi } from '../api'

vi.mock('../api', () => ({ deskApi: { trialSessions: vi.fn(), trials: vi.fn(), coaches: vi.fn(), trialAllowance: vi.fn(), createTrialSession: vi.fn(), updateTrial: vi.fn(), updateTrialSession: vi.fn(), checkInTrialSession: vi.fn(), checkOutTrialSession: vi.fn() } }))
vi.mock('../shell', () => ({ useDeskShell: () => ({ refresh: vi.fn() }) }))
const api = vi.mocked(deskApi)

describe('focused trial desk', () => {
  it.each(['check-in', 'checkout'] as const)('ignores stale refresh before and during %s', async transition => {
    const initial = { id: 'gym', fullName: 'Khách Gym', phone: '0901234567', type: 'GYM' as const, status: transition === 'check-in' ? 'SCHEDULED' as const : 'CHECKED_IN' as const, scheduledAt: null, durationMinutes: 60 }
    const updated = { ...initial, status: transition === 'check-in' ? 'CHECKED_IN' as const : 'COMPLETED' as const }
    api.trialSessions.mockResolvedValue([initial])
    render(<TrialSessionsPanel />)
    if (transition === 'checkout') fireEvent.change(screen.getByLabelText('Lọc buổi tập thử'), { target: { value: 'inside' } })
    fireEvent.click(await screen.findByRole('button', { name: transition === 'check-in' ? 'Check-in' : 'Checkout' }))
    const modal = within(screen.getByRole('dialog'))
    const action = await modal.findByRole('button', { name: transition === 'check-in' ? 'Check-in khách' : 'Xác nhận checkout' })
    let resolveRead!: (value: typeof initial[]) => void
    api.trialSessions.mockImplementationOnce(() => new Promise(resolve => { resolveRead = resolve }))
    fireEvent.click(modal.getByRole('button', { name: 'Làm mới phản hồi PT' }))
    let resolveMutation!: (value: typeof updated) => void
    const mutation = transition === 'check-in' ? api.checkInTrialSession : api.checkOutTrialSession
    mutation.mockImplementationOnce(() => new Promise(resolve => { resolveMutation = resolve }))
    fireEvent.click(action)
    const readsWhileMutating = api.trialSessions.mock.calls.length
    act(() => { window.dispatchEvent(new Event('focus')) })
    expect(api.trialSessions).toHaveBeenCalledTimes(readsWhileMutating)
    await act(async () => resolveMutation(updated))
    await act(async () => resolveRead([initial]))
    if (transition === 'check-in') {
      expect(modal.getByRole('button', { name: 'Xác nhận checkout' })).toBeInTheDocument()
      expect(modal.queryByRole('button', { name: 'Check-in khách' })).toBeNull()
      expect(modal.queryByRole('button', { name: 'Hủy đăng ký' })).toBeNull()
    } else {
      expect(modal.queryByRole('button', { name: 'Xác nhận checkout' })).toBeNull()
      expect(modal.getByRole('button', { name: 'Chuyển thành Member' })).toBeInTheDocument()
    }
  })
  beforeEach(() => {
    vi.resetAllMocks()
    api.trialSessions.mockResolvedValue([])
    api.trials.mockResolvedValue([])
    api.coaches.mockResolvedValue([])
    api.trialAllowance.mockResolvedValue({ phone: '0901234567', mode: null, days: [], startsOn: null, expiresOn: null, usedDays: 0, remainingDays: 3, canCheckIn: true, canRegister: true })
  })
  afterEach(cleanup)

  it('shows the work list first and opens a single registration form on demand', async () => {
    render(<TrialSessionsPanel />)
    expect(await screen.findByText('Không có buổi thử trong mục này')).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: /Họ và tên/ })).not.toBeInTheDocument()
    expect(screen.queryByText('Chuyển đổi tháng')).not.toBeInTheDocument()
    expect(screen.queryByText('Ghi nhận khách cần tư vấn')).not.toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Đăng ký khách' })[0]!)
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    expect(screen.getByRole('textbox', { name: /Họ và tên/ })).toBeInTheDocument()
    expect(within(screen.getByRole('dialog')).getAllByRole('option').map(option => option.textContent)).toEqual(['Trải nghiệm phòng gym', 'Trải nghiệm phòng gym + PT'])
  })

  it('checks phone eligibility before saving a gym-only trial without loading coach profiles', async () => {
    api.createTrialSession.mockResolvedValue({ id: 'new', fullName: 'Khách Gym', phone: '0901234567', type: 'GYM', status: 'SCHEDULED', scheduledAt: null, durationMinutes: 60 })
    render(<TrialSessionsPanel />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Đăng ký khách' })[0]!)
    const dialog = within(screen.getByRole('dialog'))
    fireEvent.change(dialog.getByRole('textbox', { name: /Họ và tên/ }), { target: { value: 'Khách Gym' } })
    fireEvent.change(dialog.getByRole('textbox', { name: 'Số điện thoại khách' }), { target: { value: '0901234567' } })
    expect(dialog.getByRole('button', { name: 'Lưu đăng ký' })).toBeDisabled()
    fireEvent.click(dialog.getByRole('button', { name: 'Kiểm tra' }))
    await waitFor(() => expect(dialog.getByRole('button', { name: 'Lưu đăng ký' })).toBeEnabled())
    fireEvent.click(dialog.getByRole('button', { name: 'Lưu đăng ký' }))
    await waitFor(() => expect(api.createTrialSession).toHaveBeenCalledWith(expect.objectContaining({ type: 'GYM', mode: 'GYM', coachId: undefined, phone: '0901234567' })))
    expect(api.coaches).not.toHaveBeenCalled()
    expect(await screen.findByRole('button', { name: 'Check-in khách' })).toBeInTheDocument()
  })

  it('keeps online leads separate and prefills reception without starting the trial automatically', async () => {
    api.trials.mockResolvedValue([{ id: 'lead', fullName: 'Khách Online', phone: '0901234567', status: 'NEW', createdAt: '2026-11-06T01:00:00Z' }])
    render(<TrialSessionsPanel />)
    expect(screen.queryByText('Khách Online')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Khách online/ }))
    expect(await screen.findByText('Khách Online')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp nhận' }))
    const dialog = within(screen.getByRole('dialog'))
    expect(dialog.getByRole('textbox', { name: /Họ và tên/ })).toHaveValue('Khách Online')
    expect(dialog.getByRole('textbox', { name: 'Số điện thoại khách' })).toHaveValue('0901234567')
    expect(api.createTrialSession).not.toHaveBeenCalled()
  })

  it('invalidates phone eligibility after editing the phone', async () => {
    render(<TrialSessionsPanel />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Đăng ký khách' })[0]!)
    const dialog = within(screen.getByRole('dialog'))
    fireEvent.change(dialog.getByRole('textbox', { name: /Họ và tên/ }), { target: { value: 'Khách Gym' } })
    const phone = dialog.getByRole('textbox', { name: 'Số điện thoại khách' })
    fireEvent.change(phone, { target: { value: '0901234567' } })
    fireEvent.click(dialog.getByRole('button', { name: 'Kiểm tra' }))
    await waitFor(() => expect(dialog.getByRole('button', { name: 'Lưu đăng ký' })).toBeEnabled())
    fireEvent.change(phone, { target: { value: '0907654321' } })
    expect(dialog.getByRole('button', { name: 'Lưu đăng ký' })).toBeDisabled()
  })
  it('does not permit a new enrollment for a type that the phone already registered', async () => {
    api.trialAllowance.mockResolvedValue({ phone: '0901234567', mode: 'BOTH', registeredTypes: ['GYM', 'PT'], days: [], startsOn: '2026-11-06', expiresOn: '2026-11-08', usedDays: 1, remainingDays: 2, canRegister: true, canCheckIn: true })
    render(<TrialSessionsPanel />)
    fireEvent.click(screen.getByRole('button', { name: 'Đăng ký khách' }))
    const dialog = within(screen.getByRole('dialog'))
    fireEvent.change(dialog.getByRole('textbox', { name: /Họ và tên/ }), { target: { value: 'An' } })
    fireEvent.change(dialog.getByRole('textbox', { name: 'Số điện thoại khách' }), { target: { value: '0901234567' } })
    fireEvent.click(dialog.getByRole('button', { name: 'Kiểm tra' }))
    await screen.findByText(/Đã đăng ký: gym \+ PT/)
    expect(dialog.getByRole('button', { name: 'Lưu đăng ký' })).toBeDisabled()
    expect(api.createTrialSession).not.toHaveBeenCalled()
  })
  it('opens the normal registration form directly from beside check-in with customer and missing mode prefilled', async () => {
    api.trialSessions.mockResolvedValue([
      { id: 'gym', fullName: 'Khách Gym', phone: '0901000001', type: 'GYM', status: 'SCHEDULED', scheduledAt: null, durationMinutes: 60 },
      { id: 'pt', fullName: 'Khách PT', phone: '0901000002', type: 'PT', status: 'COMPLETED', scheduledAt: null, durationMinutes: 60 },
    ])
    api.trialAllowance.mockImplementation(async phone => ({ phone, mode: phone === '0901000001' ? 'GYM' : 'PT', registeredTypes: phone === '0901000001' ? ['GYM'] : ['PT'], days: [], startsOn: '2026-11-06', expiresOn: '2099-11-08', usedDays: 1, remainingDays: 2, canRegister: true, canCheckIn: true }))
    render(<TrialSessionsPanel />)
    const button = await screen.findByRole('button', { name: 'Đăng ký trải nghiệm PT' })
    expect(within(button.parentElement!).getByRole('button', { name: 'Check-in' })).toBeInTheDocument()
    fireEvent.click(button)
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    let dialog = within(screen.getByRole('dialog'))
    expect(dialog.getByRole('heading', { name: 'Đăng ký khách tập thử' })).toBeInTheDocument()
    expect(dialog.getByRole('textbox', { name: /Họ và tên/ })).toHaveValue('Khách Gym')
    expect(dialog.getByRole('textbox', { name: 'Số điện thoại khách' })).toHaveValue('0901000001')
    expect(dialog.getByRole('combobox', { name: /Hình thức/ })).toHaveValue('BOTH')
    await dialog.findByText(/Đã đăng ký: gym/)
    expect(dialog.getAllByRole('option')).toHaveLength(1)
    expect(dialog.getByRole('option', { name: 'Trải nghiệm phòng gym + PT' })).toBeInTheDocument()
    fireEvent.click(dialog.getByRole('button', { name: 'Đóng' }))
    fireEvent.click(screen.getByRole('button', { name: 'Trải nghiệm thêm' }))
    dialog = within(screen.getByRole('dialog'))
    expect(dialog.getByRole('textbox', { name: /Họ và tên/ })).toHaveValue('Khách PT')
    expect(dialog.getByRole('combobox', { name: /Hình thức/ })).toHaveValue('GYM')
    await waitFor(() => expect(dialog.getByRole('button', { name: 'Lưu đăng ký' })).toBeEnabled())
    expect(dialog.getAllByRole('option')).toHaveLength(1)
    expect(dialog.getByRole('option', { name: 'Trải nghiệm phòng gym' })).toBeInTheDocument()
    fireEvent.change(dialog.getByRole('textbox', { name: 'Số điện thoại khách' }), { target: { value: '0909999999' } })
    expect(dialog.getByRole('button', { name: 'Lưu đăng ký' })).toBeDisabled()
    expect(api.createTrialSession).not.toHaveBeenCalled()
  })

  it('does not offer duplicate registration if the phone already has both modes', async () => {
    const trial = { phone: '0901234567', mode: 'BOTH' as const, registeredTypes: ['GYM' as const, 'PT' as const], days: [], startsOn: '2026-11-06', expiresOn: '2099-11-08', usedDays: 1, remainingDays: 2, canRegister: true, canCheckIn: true }
    api.trialSessions.mockResolvedValue([{ id: 'gym', fullName: 'An', phone: trial.phone, type: 'GYM', status: 'SCHEDULED', scheduledAt: null, durationMinutes: 60, trial }])
    api.trialAllowance.mockResolvedValue(trial)
    render(<TrialSessionsPanel />)
    expect(await screen.findByRole('button', { name: 'Check-in' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Đăng ký trải nghiệm PT' })).not.toBeInTheDocument()
    expect(api.createTrialSession).not.toHaveBeenCalled()
  })
  it('allows a gym customer to register the missing PT experience after selecting a coach', async () => {
    api.trialSessions.mockResolvedValue([{ id: 'gym', fullName: 'An', phone: '0901234567', type: 'GYM', status: 'COMPLETED', scheduledAt: null, durationMinutes: 60 }])
    api.trialAllowance.mockResolvedValue({ phone: '0901234567', mode: 'GYM', registeredTypes: ['GYM'], days: [], startsOn: '2026-11-06', expiresOn: '2099-11-08', usedDays: 1, remainingDays: 2, canRegister: true, canCheckIn: true })
    api.coaches.mockResolvedValue([{ id: 'coach', user: { fullName: 'PT An' } }])
    api.createTrialSession.mockResolvedValue({ id: 'pt', fullName: 'An', phone: '0901234567', type: 'PT', status: 'REQUESTED', scheduledAt: null, durationMinutes: 60 })
    render(<TrialSessionsPanel />)
    fireEvent.click(await screen.findByRole('button', { name: 'Đăng ký trải nghiệm PT' }))
    const dialog = within(screen.getByRole('dialog'))
    await dialog.findByText(/Đã đăng ký: gym/)
    expect(dialog.getAllByRole('option')).toHaveLength(1)
    expect(dialog.getByRole('button', { name: 'Lưu đăng ký' })).toBeDisabled()
    fireEvent.click(await dialog.findByRole('radio', { name: 'PT An' }))
    expect(dialog.getByRole('button', { name: 'Lưu đăng ký' })).toBeEnabled()
    fireEvent.click(dialog.getByRole('button', { name: 'Lưu đăng ký' }))
    await waitFor(() => expect(api.createTrialSession).toHaveBeenCalledWith(expect.objectContaining({ phone: '0901234567', type: 'PT', mode: 'PT', coachId: 'coach' })))
  })
  it('adds PT after the gym trial expired without reopening or extending gym', async () => {
    const gym = { days: [], startsOn: '2020-01-01', expiresOn: '2020-01-03', usedDays: 1, remainingDays: 0, canRegister: false, canCheckIn: false }
    const trial = { ...gym, gym, phone: '0901234567', mode: 'GYM' as const, registeredTypes: ['GYM' as const], canRegister: true, pt: { totalSessions: 3, usedSessions: 0, remainingSessions: 3, canCheckIn: true } }
    api.trialSessions.mockResolvedValue([{ id: 'gym', fullName: 'An', phone: trial.phone, type: 'GYM', status: 'COMPLETED', scheduledAt: null, durationMinutes: 60, trial }])
    api.trialAllowance.mockResolvedValue(trial)
    api.coaches.mockResolvedValue([{ id: 'coach', user: { fullName: 'PT An' } }])
    api.createTrialSession.mockResolvedValue({ id: 'pt', fullName: 'An', phone: trial.phone, type: 'PT', status: 'REQUESTED', scheduledAt: null, durationMinutes: 60 })
    render(<TrialSessionsPanel />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Lọc buổi tập thử' }), { target: { value: 'closed' } })
    fireEvent.click(await screen.findByRole('button', { name: 'Đăng ký trải nghiệm PT' }))
    const dialog = within(screen.getByRole('dialog'))
    expect(await dialog.findByText(/PT: còn 3\/3 buổi/)).toBeInTheDocument()
    fireEvent.click(await dialog.findByRole('radio', { name: 'PT An' }))
    expect(dialog.getByRole('button', { name: 'Lưu đăng ký' })).toBeEnabled()
    fireEvent.click(dialog.getByRole('button', { name: 'Lưu đăng ký' }))
    await waitFor(() => expect(api.createTrialSession).toHaveBeenCalledWith(expect.objectContaining({ mode: 'PT', type: 'PT', phone: trial.phone })))
  })
  it('offers the remaining PT appointment after gym expiration and closes exhausted PT records', async () => {
    const trial = { phone: '0901234567', mode: 'BOTH' as const, days: [], startsOn: '2020-01-01', expiresOn: '2020-01-03', usedDays: 1, remainingDays: 0, canRegister: true, canCheckIn: false, pt: { totalSessions: 3, usedSessions: 2, remainingSessions: 1, canCheckIn: true } }
    api.trialSessions.mockResolvedValue([
      { id: 'pt', fullName: 'Còn một buổi', phone: trial.phone, type: 'PT', status: 'COMPLETED', scheduledAt: null, durationMinutes: 60, trial },
      { id: 'used', fullName: 'Đã dùng đủ', phone: '0901234568', type: 'PT', status: 'COMPLETED', scheduledAt: null, durationMinutes: 60, trial: { ...trial, pt: { totalSessions: 3, usedSessions: 3, remainingSessions: 0, canCheckIn: false } } },
    ])
    api.trialAllowance.mockResolvedValue(trial)
    render(<TrialSessionsPanel />)
    expect(await screen.findByText('Còn một buổi')).toBeInTheDocument()
    expect(screen.queryByText('Đã dùng đủ')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Xếp buổi tiếp' }))
    expect(await screen.findByText(/PT: đã dùng 2\/3 buổi, còn 1 buổi/)).toBeInTheDocument()
    expect(screen.getByText(/Đang chờ PT trả lời/)).toBeInTheDocument()
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Đóng' }))
    fireEvent.change(screen.getByRole('combobox', { name: 'Lọc buổi tập thử' }), { target: { value: 'closed' } })
    expect(screen.getByText('Đã dùng đủ')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Xếp buổi tiếp' })).not.toBeInTheDocument()
  })
})
