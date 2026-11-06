import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TrialPTArrangement } from './trial-pt-arrangement'
import type { TrialSession } from '../api'

vi.mock('../api', () => ({ deskApi: { coaches: vi.fn().mockResolvedValue([{ id: 'new-coach', user: { fullName: 'PT Bình', phone: '0902000000' }, specialization: 'Sức mạnh' }]) } }))
const session: TrialSession = { id: 'trial', fullName: 'An', phone: '0901000000', type: 'PT', status: 'REQUESTED', coachId: 'old-coach', coachName: 'PT An', coachDecision: 'PENDING', scheduledAt: null, durationMinutes: 60 }
afterEach(cleanup)

describe('reception confirms PT and appointment in one exchange', () => {
  it('saves consent and agreed time together without requiring a PT-to-customer phone call', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    render(<TrialPTArrangement session={session} busy={false} onSave={save} />)
    fireEvent.change(screen.getByLabelText(/Giờ đã thống nhất/), { target: { value: '2026-11-07T09:00' } })
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận PT và lịch hẹn' }))
    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ coachDecision: 'ACCEPTED', scheduledAt: '2026-11-07T02:00:00.000Z' })))
  })
  it('requires a reason when PT cannot receive the guest', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    render(<TrialPTArrangement session={session} busy={false} onSave={save} />)
    fireEvent.change(screen.getByLabelText('Kết quả trao đổi'), { target: { value: 'DECLINED' } })
    expect(screen.getByRole('button', { name: 'Lưu để khách chọn PT khác' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText(/Lý do chưa nhận khách/), { target: { value: 'Không còn giờ rảnh' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu để khách chọn PT khác' }))
    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ coachDecision: 'DECLINED', coachResponse: 'Không còn giờ rảnh', scheduledAt: undefined })))
  })
  it('selects a replacement coach and confirms that coach’s appointment in the same save', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    render(<TrialPTArrangement session={{ ...session, coachDecision: 'DECLINED' }} busy={false} onSave={save} />)
    fireEvent.click(await screen.findByRole('radio', { name: 'PT Bình' }))
    expect(screen.getAllByRole('link', { name: 'Gọi PT: 0902000000' }).at(-1)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/Giờ đã thống nhất/), { target: { value: '2026-11-07T09:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận PT và lịch hẹn' }))
    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ coachId: 'new-coach', coachDecision: 'ACCEPTED', scheduledAt: '2026-11-07T02:00:00.000Z' })))
  })
})
