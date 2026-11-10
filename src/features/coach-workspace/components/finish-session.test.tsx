import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { FinishSession } from './finish-session'
import { coachWs } from '../api'
import { journeyApi } from '@/features/goal-lab/journey-api'

vi.mock('../api', () => ({ coachWs: { complete: vi.fn() } }))
vi.mock('@/features/goal-lab/journey-api', () => ({ journeyApi: { session: vi.fn(), save: vi.fn(), finish: vi.fn() } }))
beforeEach(() => { vi.clearAllMocks(); vi.mocked(journeyApi.session).mockResolvedValue({ journey: { initial: {} } } as never); vi.mocked(coachWs.complete).mockResolvedValue({} as never) })
it('ends the session and saves the sheet in one request, and a retry after a failure repeats that same request', async () => {
  vi.mocked(journeyApi.finish).mockRejectedValueOnce(new Error('Mất mạng')).mockResolvedValueOnce({ resultId: 'sheet', alreadyEnded: false })
  const done = vi.fn()
  render(<MemoryRouter><FinishSession bookingId="booking" early={false} onDone={done} /></MemoryRouter>)
  fireEvent.change(await screen.findByLabelText('Nhận xét sau buổi (học viên xem được)'), { target: { value: 'Thực hiện tốt, tăng mức tạ buổi sau.' } })
  fireEvent.click(screen.getByRole('button', { name: 'Kết thúc & ghi phiếu' }))
  await screen.findByText('Mất mạng')
  expect(done).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Kết thúc & ghi phiếu' }))
  await waitFor(() => expect(done).toHaveBeenCalledOnce())
  expect(coachWs.complete).not.toHaveBeenCalled()
  expect(journeyApi.save).not.toHaveBeenCalled()
  expect(journeyApi.finish).toHaveBeenCalledTimes(2)
  expect(journeyApi.finish).toHaveBeenLastCalledWith('booking', { comment: 'Thực hiện tốt, tăng mức tạ buổi sau.', values: {}, earlyEndReason: undefined })
})
it('ends first and writes the sheet later: only the completion request runs, and its failure is shown', async () => {
  vi.mocked(coachWs.complete).mockRejectedValueOnce(new Error('Chưa kết thúc được'))
  const done = vi.fn()
  render(<MemoryRouter><FinishSession bookingId="booking" early={false} onDone={done} /></MemoryRouter>)
  fireEvent.click(await screen.findByRole('button', { name: 'Kết thúc trước, ghi phiếu sau' }))
  await screen.findByText('Chưa kết thúc được')
  expect(journeyApi.finish).not.toHaveBeenCalled()
  expect(done).not.toHaveBeenCalled()
})
