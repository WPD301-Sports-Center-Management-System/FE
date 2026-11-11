import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import { CoachSessionPage } from './coach-session-page'
import { coachWs } from '../api'

vi.mock('../api', () => ({ coachWs: { session: vi.fn(), progress: vi.fn(), content: vi.fn(), templates: vi.fn(), exercises: vi.fn(), saveContent: vi.fn() } }))
vi.mock('@/features/goal-lab/journey-pages', () => ({ JourneyStartGate: () => null }))
vi.mock('../components/session-actions', () => ({ SessionActions: () => null }))
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(coachWs.session).mockResolvedValue({ id: 'booking', memberId: 'member', purchaseId: 'purchase', status: 'CONFIRMED', startsAt: '2026-11-12T03:00:00Z', endsAt: '2026-11-12T04:00:00Z', allowedActions: {}, isMakeup: false } as never)
  vi.mocked(coachWs.progress).mockResolvedValue({ assessments: [], results: [] })
  vi.mocked(coachWs.templates).mockResolvedValue([])
  vi.mocked(coachWs.exercises).mockResolvedValue([{ id: 'exercise', name: 'Squat' }])
  vi.mocked(coachWs.content).mockResolvedValue({ content: { id: 'content', status: 'DRAFT', title: 'Giáo án AI' }, items: [{ exerciseId: 'exercise', name: 'Squat', sets: 3, reps: 12, confirmed: false }] })
  vi.mocked(coachWs.saveContent).mockResolvedValue({})
})
it('opens an AI draft for review immediately and saves confirmed exercises on a single save-and-assign action', async () => {
  render(<MemoryRouter initialEntries={['/coach/sessions/booking']}><Routes><Route path="/coach/sessions/:id" element={<CoachSessionPage />} /></Routes></MemoryRouter>)
  expect(await screen.findByLabelText('Tên bài tập')).toHaveValue('Squat')
  expect(screen.getByRole('link', { name: 'AI soạn cho buổi này' })).toHaveAttribute('href', '/coach/library?tab=ai&memberId=member&purchaseId=purchase&bookingId=booking')
  fireEvent.click(screen.getByRole('button', { name: 'Lưu và giao' }))
  await waitFor(() => expect(coachWs.saveContent).toHaveBeenCalledExactlyOnceWith('booking', { title: 'Giáo án AI', items: [{ exerciseId: 'exercise', name: 'Squat', sets: 3, reps: 12, confirmed: true }], assign: true }))
})
it('shows and preserves all applied AI values and instructions while editing and assigning', async () => {
  const item = { exerciseId: 'exercise', name: 'Squat', sets: 4, reps: 8, targetWeight: 12.5, restSeconds: 90, durationMinutes: 5, rpe: '7–8', notes: 'Giữ lưng thẳng', confirmed: false }
  vi.mocked(coachWs.content).mockResolvedValue({ content: { id: 'content', status: 'DRAFT', title: 'Giáo án AI' }, items: [item] })
  render(<MemoryRouter initialEntries={['/coach/sessions/booking']}><Routes><Route path="/coach/sessions/:id" element={<CoachSessionPage />} /></Routes></MemoryRouter>)
  expect(await screen.findByLabelText('Số set')).toHaveValue(4)
  expect(screen.getByLabelText('Số rep')).toHaveValue(8)
  expect(screen.getByLabelText('Khối lượng kg')).toHaveValue(12.5)
  expect(screen.getByLabelText('Nghỉ giây')).toHaveValue(90)
  expect(screen.getByLabelText('Thời lượng phút')).toHaveValue(5)
  expect(screen.getByLabelText('RPE')).toHaveValue('7–8')
  expect(screen.getByLabelText('Ghi chú bài tập')).toHaveValue('Giữ lưng thẳng')
  fireEvent.click(screen.getByRole('button', { name: 'Lưu và giao' }))
  await waitFor(() => expect(coachWs.saveContent).toHaveBeenCalledWith('booking', { title: 'Giáo án AI', items: [{ ...item, confirmed: true }], assign: true }))
})
