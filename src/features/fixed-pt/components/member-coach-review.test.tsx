import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { MemberCoachReview } from './member-coach-review'
import { hybridGet, hybridSend } from '../hybrid-api'
vi.mock('../hybrid-api', () => ({ hybridGet: vi.fn(), hybridSend: vi.fn() }))
beforeEach(() => { vi.resetAllMocks(); vi.mocked(hybridGet).mockResolvedValue(null) })
it('requires a rating and shows the saved review after submission', async () => {
  render(<MemberCoachReview purchaseId="purchase" coachName="Minh" />)
  expect(await screen.findByRole('button', { name: 'Gửi đánh giá Coach' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: '5 sao' }))
  fireEvent.change(screen.getByLabelText('Nhận xét (không bắt buộc)'), { target: { value: 'Hướng dẫn tận tình' } })
  vi.mocked(hybridGet).mockResolvedValue({ id: 'review', rating: 5, comment: 'Hướng dẫn tận tình', editableUntil: '2099-01-01' })
  fireEvent.click(screen.getByRole('button', { name: 'Gửi đánh giá Coach' }))
  await screen.findByText('Đã gửi đánh giá · 5/5 sao')
  expect(hybridSend).toHaveBeenCalledWith('post', '/pt-package-purchases/purchase/review', { rating: 5, comment: 'Hướng dẫn tận tình' })
  expect(screen.queryByRole('button', { name: 'Gửi đánh giá Coach' })).not.toBeInTheDocument()
})
it('keeps the selected rating and comment when submission fails', async () => {
  vi.mocked(hybridSend).mockRejectedValue(new Error('Không gửi được'))
  render(<MemberCoachReview purchaseId="purchase" coachName="Minh" />)
  fireEvent.click(await screen.findByRole('button', { name: '4 sao' }))
  fireEvent.change(screen.getByLabelText('Nhận xét (không bắt buộc)'), { target: { value: 'Tập tốt' } })
  fireEvent.click(screen.getByRole('button', { name: 'Gửi đánh giá Coach' }))
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Không gửi được'))
  expect(screen.getByLabelText('Nhận xét (không bắt buộc)')).toHaveValue('Tập tốt')
  expect(screen.getByRole('button', { name: '4 sao' })).toHaveAttribute('aria-pressed', 'true')
})
