import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { AppApiError } from '@/shared/api/api-error'
import { MgrPtPackagesPage } from './mgr-pt-packages-page'
import { mgrApi } from '../api'

vi.mock('../api', () => ({ mgrApi: { options: vi.fn(), deleteOption: vi.fn(), setOptionActive: vi.fn(), createOption: vi.fn(), updateOption: vi.fn() } }))
const pkg = { id: 'p-1', name: 'Gói Starter', minCoachTier: 'STANDARD' as const, sessionCount: 10, durationMinutes: 60, price: '1000000', priceFrom: '1000000', prices: { STANDARD: '1000000', ADVANCED: '1200000', EXPERT: '1500000' }, isActive: true }
beforeEach(() => { vi.resetAllMocks(); vi.mocked(mgrApi.options).mockResolvedValueOnce([pkg]).mockResolvedValue([]) })

describe('MgrPtPackagesPage delete', () => {
  it('confirms, calls DELETE for that package, shows a notice and reloads the list; stop-sale button remains', async () => {
    vi.mocked(mgrApi.deleteOption).mockResolvedValue(undefined)
    render(<MgrPtPackagesPage />)
    expect(await screen.findByRole('button', { name: 'Ngừng bán' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Xóa gói Gói Starter' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('“Gói Starter”')).toBeInTheDocument()
    expect(within(dialog).getByText(/Đơn đã mua giữ nguyên giá/)).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xóa' }))
    await waitFor(() => expect(mgrApi.deleteOption).toHaveBeenCalledWith('p-1'))
    expect(await screen.findByText('Đã xóa gói “Gói Starter”.')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('Gói Starter')).toBeNull())
    expect(mgrApi.options).toHaveBeenCalledTimes(2)
  })

  it('shows the BE refusal (open orders) and keeps the package', async () => {
    vi.mocked(mgrApi.deleteOption).mockRejectedValue(new AppApiError(409, { code: 'IN_USE', message: 'Gói đang có 2 đơn chưa kết thúc. Hãy ngừng bán gói thay vì xóa.' } as never))
    render(<MgrPtPackagesPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Xóa gói Gói Starter' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xóa' }))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('2 đơn chưa kết thúc')
    expect(mgrApi.options).toHaveBeenCalledTimes(1)
  })
})
