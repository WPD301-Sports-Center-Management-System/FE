import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TrialPTArrangement } from './trial-pt-arrangement'
import type { TrialSession } from '../api'
vi.mock('../api', () => ({ deskApi: { coaches: async () => [{ id: 'new', user: { fullName: 'PT Bình' } }] } }))
const session: TrialSession = { id: 'trial', fullName: 'An', phone: '0901000000', type: 'PT', status: 'REQUESTED', coachId: 'old', coachName: 'PT An', coachDecision: 'PENDING', scheduledAt: null, durationMinutes: 60 }
describe('Reception continues after the Coach decision', () => {
  it('preserves appointment and note inputs when the open record refreshes', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const accepted = { ...session, coachDecision: 'ACCEPTED' as const }
    const view = render(<TrialPTArrangement session={accepted} busy={false} onSave={save} />)
    fireEvent.change(screen.getByLabelText('Giờ đã thống nhất với khách'), { target: { value: '2026-11-12T09:00' } })
    fireEvent.change(screen.getByLabelText('Ghi chú lịch hẹn (không bắt buộc)'), { target: { value: 'Khách muốn tập buổi sáng' } })
    view.rerender(<TrialPTArrangement session={{ ...accepted, coachResponse: 'Đã nhận khách' }} busy={false} onSave={save} />)
    expect(screen.getByLabelText('Giờ đã thống nhất với khách')).toHaveValue('2026-11-12T09:00')
    expect(screen.getByLabelText('Ghi chú lịch hẹn (không bắt buộc)')).toHaveValue('Khách muốn tập buổi sáng')
    fireEvent.click(screen.getByRole('button', { name: 'Chốt lịch tập thử' }))
    await waitFor(() => expect(save).toHaveBeenCalledWith({ scheduledAt: '2026-11-12T02:00:00.000Z', note: 'Khách muốn tập buổi sáng' }))
  })
  it('cannot record a Coach decision or schedule while waiting', () => {
    render(<TrialPTArrangement session={session} busy={false} onSave={vi.fn()} />)
    expect(screen.getByText(/Đang chờ PT trả lời/)).toBeInTheDocument()
    expect(screen.queryByLabelText('Kết quả trao đổi')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Giờ đã thống nhất với khách')).not.toBeInTheDocument()
  })
  it('sends only the appointment after the Coach has accepted', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    render(<TrialPTArrangement session={{ ...session, coachDecision: 'ACCEPTED' }} busy={false} onSave={save} />)
    fireEvent.change(screen.getByLabelText('Giờ đã thống nhất với khách'), { target: { value: '2026-11-12T09:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Chốt lịch tập thử' }))
    await waitFor(() => expect(save).toHaveBeenCalledWith({ scheduledAt: '2026-11-12T02:00:00.000Z' }))
  })
  it('reselects a Coach without answering on their behalf', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    render(<TrialPTArrangement session={{ ...session, coachDecision: 'DECLINED' }} busy={false} onSave={save} />)
    fireEvent.click(await screen.findByRole('radio', { name: 'PT Bình' }))
    fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu cho PT mới' }))
    await waitFor(() => expect(save).toHaveBeenCalledWith({ coachId: 'new' }))
  })
})
