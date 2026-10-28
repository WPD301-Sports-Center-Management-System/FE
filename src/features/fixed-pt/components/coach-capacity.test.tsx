import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { CoachCapacity } from './coach-capacity'
import { hybridApi, hybridGet } from '../hybrid-api'

vi.mock('../hybrid-api', () => ({
  hybridGet: vi.fn(),
  hybridApi: { setSettings: vi.fn() },
}))

describe('Coach capacity settings', () => {
  it('matches the API default of closed intake when service settings do not exist', async () => {
    vi.clearAllMocks()
    vi.mocked(hybridGet).mockImplementation(async url => url === '/coaches'
      ? [{ id: 'new-coach', fullName: 'Coach mới' }]
      : { activePurchases: 0, pendingPurchases: 0, unservedCredits: 0, rules: [{}], settings: null })
    render(<CoachCapacity />)
    fireEvent.change(await screen.findByLabelText('Coach'), { target: { value: 'new-coach' } })
    await screen.findByLabelText('Giới hạn gói đang hoạt động/chờ thanh toán mới')
    expect(screen.getByRole('checkbox')).not.toBeChecked()
    expect(screen.getByText(/Tạm ngừng nhận mới/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Lưu cấu hình Coach' }))
    await waitFor(() => expect(hybridApi.setSettings).toHaveBeenCalledWith('new-coach', { maxActivePurchases: null, acceptingNewMembers: false }))
  })
  it('preserves current capacity and accepting status when only buffer is changed', async () => {
    vi.mocked(hybridGet).mockImplementation(async (url) =>
      url === '/coaches'
        ? [{ id: 'coach', fullName: 'Coach Nam' }]
        : {
            activePurchases: 2,
            pendingPurchases: 1,
            unservedCredits: 10,
            rules: [],
            settings: {
              maxActivePurchases: 8,
              acceptingNewMembers: true,
              bufferMinutes: 15,
            },
          },
    )
    render(<CoachCapacity />)
    fireEvent.change(await screen.findByLabelText('Coach'), {
      target: { value: 'coach' },
    })
    const limit = await screen.findByLabelText(
      'Giới hạn gói đang hoạt động/chờ thanh toán mới',
    )
    expect(limit).toHaveValue(8)
    expect(screen.getByRole('checkbox')).toBeChecked()
    fireEvent.change(
      screen.getByLabelText(
        'Buffer riêng (phút; để trống giữ giá trị hiện tại)',
      ),
      { target: { value: '30' } },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Lưu cấu hình Coach' }))
    await waitFor(() =>
      expect(hybridApi.setSettings).toHaveBeenCalledWith('coach', {
        maxActivePurchases: 8,
        acceptingNewMembers: true,
        bufferMinutes: 30,
      }),
    )
  })
})
