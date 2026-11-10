import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MgrPtPackagesPage } from './mgr-pt-packages-page'
import { CoachTierPanel } from '../components/coach-tier-panel'
import { mgrApi } from '../api'
vi.mock('../api', () => ({ mgrApi: { options: vi.fn(), updateOption: vi.fn(), createOption: vi.fn(), coachApplications: vi.fn(), setCoachTier: vi.fn(), tierHistory: vi.fn() } }))
const pkg = { id: 'premium', name: 'Premium', minCoachTier: 'ADVANCED' as const, sessionCount: 30, sessionsPerWeek: 3, durationMinutes: 60, price: '10000000', priceFrom: '10000000', prices: { ADVANCED: '10000000', EXPERT: '14000000' }, isActive: true }
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(mgrApi.options).mockResolvedValue([pkg])
  vi.mocked(mgrApi.updateOption).mockResolvedValue(pkg)
  vi.mocked(mgrApi.coachApplications).mockResolvedValue([{ id: 'coach', tier: 'STANDARD', applicationStatus: 'APPROVED', yearsOfExperience: 4, completedSessions: 27, certificateUrls: [], averageRating: '4.5', reviewCount: 6, user: { fullName: 'Coach An' } }])
  vi.mocked(mgrApi.tierHistory).mockResolvedValue([])
  vi.mocked(mgrApi.setCoachTier).mockResolvedValue({ tier: 'EXPERT' })
})
describe('PT tier management', () => {
  it.each(['', '   ', '  Gói tập cá nhân  '])('creates a package with optional description %j and no weekly frequency', async description => {
    vi.mocked(mgrApi.createOption).mockResolvedValue(pkg)
    render(<MgrPtPackagesPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Tạo gói PT' }))
    expect(screen.queryByLabelText(/Buổi \/ tuần/)).toBeNull()
    fireEvent.change(screen.getByLabelText(/Tên gói/), { target: { value: 'Gói linh hoạt' } })
    fireEvent.change(screen.getByLabelText(/Số buổi/), { target: { value: '12' } })
    fireEvent.change(screen.getByLabelText(/Mô tả/), { target: { value: description } })
    for (const tier of ['Tiêu chuẩn', 'Nâng cao', 'Chuyên gia']) fireEvent.change(screen.getByLabelText(`Giá ${tier}`), { target: { value: '6000000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu gói PT' }))
    await waitFor(() => expect(mgrApi.createOption).toHaveBeenCalledOnce())
    expect(vi.mocked(mgrApi.createOption).mock.calls[0][0]).not.toHaveProperty('sessionsPerWeek')
    const body = vi.mocked(mgrApi.createOption).mock.calls[0][0]
    if (description.trim()) expect(body.description).toBe(description.trim())
    else expect(body).not.toHaveProperty('description')
    await screen.findByText(/Đã tạo gói/)
  })
  it('only submits prices at or above the minimum and requires newly enabled prices', async () => {
    render(<MgrPtPackagesPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Sửa gói và giá' }))
    expect(screen.queryByLabelText('Giá Tiêu chuẩn')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Bậc Coach tối thiểu'), { target: { value: 'STANDARD' } })
    expect(screen.getByRole('button', { name: 'Lưu gói PT' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Giá Tiêu chuẩn'), { target: { value: '8000000' } })
    expect(screen.getByRole('button', { name: 'Lưu gói PT' })).toBeEnabled()
    fireEvent.change(screen.getByLabelText('Bậc Coach tối thiểu'), { target: { value: 'EXPERT' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu gói PT' }))
    await waitFor(() => expect(mgrApi.updateOption).toHaveBeenCalledWith('premium', expect.objectContaining({ minCoachTier: 'EXPERT', prices: { EXPERT: 14000000 } })))
  })
  it('requires a different tier and a trimmed reason, and refreshes history after saving', async () => {
    render(<CoachTierPanel />)
    fireEvent.change(await screen.findByLabelText('Coach cần đổi bậc'), { target: { value: 'coach' } })
    const save = screen.getByRole('button', { name: 'Lưu bậc Coach' })
    fireEvent.change(screen.getByLabelText('Lý do đổi bậc'), { target: { value: '   ' } })
    fireEvent.change(screen.getByLabelText('Bậc giá Coach'), { target: { value: 'EXPERT' } })
    expect(save).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Lý do đổi bậc'), { target: { value: '  Đã đánh giá năng lực  ' } })
    fireEvent.click(save)
    await waitFor(() => expect(mgrApi.setCoachTier).toHaveBeenCalledWith('coach', 'EXPERT', 'Đã đánh giá năng lực'))
    await waitFor(() => expect(mgrApi.tierHistory).toHaveBeenCalledTimes(2))
  })
})
