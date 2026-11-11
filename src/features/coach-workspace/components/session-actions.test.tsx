import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { SessionActions } from './session-actions'
import { coachWs } from '../api'
import type { Session } from '@/features/fixed-pt/types'

vi.mock('../api', () => ({ coachWs: { complete: vi.fn() } }))
const session = { id: 'booking', status: 'IN_PROGRESS', allowedActions: { end: true } } as Session
beforeEach(() => { vi.resetAllMocks() })
function open() { render(<MemoryRouter><Routes><Route path="/" element={<SessionActions session={session} onDone={vi.fn()} />} /><Route path="/coach/goals/sheet/:id" element={<h1>Đánh giá cuối buổi</h1>} /></Routes></MemoryRouter>) }
it('ends directly and opens the final assessment after the server confirms success', async () => {
  vi.mocked(coachWs.complete).mockResolvedValue({} as Session)
  open()
  fireEvent.click(screen.getByRole('button', { name: 'Kết thúc buổi' }))
  await screen.findByRole('heading', { name: 'Đánh giá cuối buổi' })
  expect(coachWs.complete).toHaveBeenCalledExactlyOnceWith('booking', {})
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
it('stays on the session and displays the error if completion fails', async () => {
  vi.mocked(coachWs.complete).mockRejectedValue(new Error('Mất kết nối'))
  open()
  fireEvent.click(screen.getByRole('button', { name: 'Kết thúc buổi' }))
  await screen.findByRole('alert')
  expect(screen.queryByRole('heading', { name: 'Đánh giá cuối buổi' })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Kết thúc buổi' })).toBeEnabled()
})
