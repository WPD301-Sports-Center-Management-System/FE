import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TrialHistoryModal, TrialHistoryPanel } from './trial-history-panel'
import { deskApi, type TrialHistoryDetail } from '../api'

vi.mock('../api', () => ({ deskApi: { trialHistory: vi.fn(), trialHistoryDetail: vi.fn() } }))
const api = vi.mocked(deskApi)
const detail: TrialHistoryDetail = { id: 'reg', fullName: 'Khách Lịch Sử', phone: '0901234567', mode: 'GYM', createdAt: '2026-11-06T01:00:00Z', startsOn: '2026-11-06', expiresOn: '2026-11-08', types: ['GYM'], visitCount: 2, lastVisitAt: '2026-11-07T01:00:00Z', lastCheckoutAt: '2026-11-07T02:00:00Z', sessions: [
  { id: 's0', type: 'GYM', fullName: 'Khách Lịch Sử', status: 'COMPLETED', createdAt: '2026-11-06T01:00:00Z', scheduledAt: null, coachName: null, note: null, coachResponse: null, archived: false },
  { id: 's1', type: 'GYM', fullName: 'Khách Lịch Sử', status: 'COMPLETED', createdAt: '2026-11-06T01:00:00Z', scheduledAt: null, coachName: null, note: null, coachResponse: null, archived: true },
], visits: [
  { id: 'v1', type: 'GYM', coachName: null, checkedInAt: '2026-11-07T01:00:00Z', checkedOutAt: '2026-11-07T02:00:00Z', archived: false, isOpen: false },
  { id: 'v0', type: 'GYM', coachName: null, checkedInAt: '2026-11-06T01:00:00Z', checkedOutAt: '2026-11-06T02:00:00Z', archived: true, isOpen: false },
] }
beforeEach(() => { vi.resetAllMocks(); api.trialHistory.mockResolvedValue({ items: [detail], total: 1 }); api.trialHistoryDetail.mockResolvedValue(detail) })
afterEach(cleanup)
describe('trial history without customer-care or sales fields', () => {
  it('lists one phone profile and opens its full history', async () => {
    const select = vi.fn()
    render(<TrialHistoryPanel onSelect={select} />)
    expect(await screen.findByText('Khách Lịch Sử')).toBeInTheDocument()
    expect(screen.getAllByText('Khách Lịch Sử')).toHaveLength(1)
    expect(screen.getByText('2 lượt đến tập')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Xem lịch sử' }))
    expect(select).toHaveBeenCalledWith('0901234567')
  })
  it('preserves both visits and archived enrollment details in a read-only timeline', async () => {
    render(<TrialHistoryModal phone="0901234567" onClose={() => {}} />)
    const dialog = within(screen.getByRole('dialog'))
    expect(await dialog.findByText('Các lần đến tập (2)')).toBeInTheDocument()
    expect(dialog.getByText('Từ đăng ký cũ đã gộp')).toBeInTheDocument()
    expect(dialog.getByRole('link', { name: '0901234567' })).toHaveAttribute('href', 'tel:0901234567')
    expect(dialog.queryByRole('textbox')).not.toBeInTheDocument()
    expect(dialog.queryByRole('combobox')).not.toBeInTheDocument()
    expect(dialog.queryByRole('button', { name: /Lưu/ })).not.toBeInTheDocument()
    expect(dialog.queryByText('Ghi chú chăm sóc')).not.toBeInTheDocument()
    expect(dialog.queryByText('Trạng thái chốt gói')).not.toBeInTheDocument()
  })
  it('distinguishes unknown old checkout times from a currently open visit', async () => {
    api.trialHistoryDetail.mockResolvedValue({ ...detail, visits: [{ ...detail.visits[1]!, checkedOutAt: null, isOpen: false }] })
    render(<TrialHistoryModal phone="0901234567" onClose={() => {}} />)
    expect(await screen.findByText('Ra: Không ghi nhận giờ ra')).toBeInTheDocument()
    expect(screen.queryByText('Ra: Đang tập')).not.toBeInTheDocument()
  })
})
