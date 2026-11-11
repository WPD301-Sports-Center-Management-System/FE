import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { MemberProposals } from './member-proposals'
import { fixedPtApi } from '../api'
vi.mock('../api', () => ({ fixedPtApi: { scheduleChanges: vi.fn(), scheduleChangeAction: vi.fn() } }))
it('separates free sessions waiting on the Coach from a proposal waiting on the Member', async () => {
  vi.mocked(fixedPtApi.scheduleChanges).mockResolvedValue([{ id: 'proposal', purchaseId: 'p', status: 'PROPOSED', items: [{ id: 'a', creditId: 'free-session', startsAt: '2026-12-01T02:00:00Z' }, { id: 'b', creditId: 'scheduled-session', sourceBookingId: 'old-booking', startsAt: '2026-12-02T02:00:00Z' }] }] as never)
  render(<MemberProposals purchaseId="p" available={3} onChanged={vi.fn()} />)
  await screen.findByText('2 buổi chưa có lịch. Đang chờ Coach sắp xếp.')
  expect(screen.getByText('Lịch tập đang chờ bạn xác nhận')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Xếp lịch' })).toBeNull()
  expect(fixedPtApi.scheduleChangeAction).not.toHaveBeenCalled()
})
