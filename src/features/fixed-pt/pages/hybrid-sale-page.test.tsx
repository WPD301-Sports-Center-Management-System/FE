import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HybridSalePage } from './hybrid-sale-page'
import { hybridGet, hybridSend } from '../hybrid-api'
import { fixedPtApi } from '../api'

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => ({ role: 'RECEPTIONIST' }),
}))
vi.mock('../hybrid-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../hybrid-api')>()),
  hybridGet: vi.fn(),
  hybridSend: vi.fn(),
}))
vi.mock('../api', () => ({ fixedPtApi: { payCounter: vi.fn() } }))
const slot = {
  startsAt: '2026-11-01T03:00:00Z',
  endsAt: '2026-11-01T04:30:00Z',
  available: true,
  reason: null,
}
const availability = {
  items: [slot],
  durationMinutes: 90,
  bufferMinutes: 15,
  policy: {
    holdMinutes: 15,
    bookingWindowDays: 28,
    activationDeadlineDays: 30,
    cancelCutoffHours: 4,
  },
}
const setup = async () => {
  render(
    <MemoryRouter>
      <HybridSalePage />
    </MemoryRouter>,
  )
  fireEvent.change(await screen.findByLabelText('Member'), {
    target: { value: 'member' },
  })
  fireEvent.change(screen.getByLabelText('Coach'), {
    target: { value: 'coach' },
  })
  fireEvent.change(await screen.findByLabelText('Gói đã duyệt'), {
    target: { value: 'option' },
  })
  fireEvent.change(screen.getByLabelText('Căn cứ Member đồng ý (bắt buộc)'), {
    target: { value: 'Đồng ý tại quầy' },
  })
}

describe('Reception hybrid purchase and booking flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(hybridGet).mockImplementation(async (url: string) => {
      if (url === '/members')
        return [
          { id: 'member', memberCode: 'M001', user: { fullName: 'Học viên' } },
        ]
      if (url === '/coaches') return [{ id: 'coach', fullName: 'Coach Nam' }]
      if (url === '/coaches/coach')
        return {
          availablePackageOptions: [
            {
              id: 'option',
              name: 'Gói 90 phút',
              price: '3000000',
              sessionCount: 12,
            },
          ],
        }
      if (url.includes('/availability')) return availability
      if (url === '/pt-package-purchases') return []
      throw new Error(`Unexpected request: ${url}`)
    })
  })
  it('uses the coach profile options and locks the sale after creating a purchase', async () => {
    vi.mocked(hybridSend).mockResolvedValue({ purchaseId: 'purchase' })
    await setup()
    fireEvent.click(screen.getByRole('button', { name: 'Tạo đơn mua gói' }))
    await screen.findByRole('heading', { name: 'Thu tiền tại quầy' })
    expect(screen.getByLabelText('Member')).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Mua gói mới' }),
    ).toBeDisabled()
    expect(
      screen.queryByRole('button', { name: 'Tạo đơn mua gói' }),
    ).not.toBeInTheDocument()
    expect(hybridGet).toHaveBeenCalledWith('/coaches/coach')
    expect(hybridSend).toHaveBeenCalledWith(
      'post',
      '/pt-purchases',
      expect.objectContaining({
        memberId: 'member',
        coachId: 'coach',
        packageOptionId: 'option',
        consentEvidence: 'Đồng ý tại quầy',
      }),
    )
  })
  it('normalizes weekly durations to the package and invalidates preview when consent changes', async () => {
    vi.mocked(hybridSend).mockResolvedValue({
      ...availability,
      canConfirmAll: true,
    })
    await setup()
    fireEvent.click(
      screen.getByRole('button', { name: 'Xếp lịch ngay' }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Xếp theo tuần' }))
    await screen.findByText('Thời lượng được lấy từ gói: 90 phút/buổi.')
    fireEvent.click(screen.getByRole('button', { name: 'Xem trước đợt đặt' }))
    await waitFor(() =>
      expect(hybridSend).toHaveBeenCalledWith(
        'post',
        '/pt-checkout/preview',
        expect.objectContaining({
          generate: expect.objectContaining({
            slots: [{ weekday: 1, startTime: '18:00', durationMinutes: 90 }],
          }),
        }),
      ),
    )
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Giữ lịch và tạo đơn' }),
      ).toBeEnabled(),
    )
    fireEvent.change(screen.getByLabelText('Căn cứ Member đồng ý (bắt buộc)'), {
      target: { value: 'Thay đổi yêu cầu' },
    })
    expect(
      screen.getByRole('button', { name: 'Giữ lịch và tạo đơn' }),
    ).toBeDisabled()
  })
  it('clears payment form after a receipt and moves to scheduling instead of creating the same purchase', async () => {
    vi.mocked(hybridSend).mockResolvedValue({ purchaseId: 'purchase' })
    vi.mocked(fixedPtApi.payCounter).mockResolvedValue({
      application: 'APPLIED',
      changeAmount: 0,
    } as never)
    await setup()
    fireEvent.click(screen.getByRole('button', { name: 'Tạo đơn mua gói' }))
    fireEvent.change(await screen.findByLabelText('Số tiền đã nhận'), {
      target: { value: '3000000' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Ghi nhận thanh toán' }))
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: 'Thu tiền tại quầy' }),
      ).not.toBeInTheDocument(),
    )
    expect(
      screen.queryByRole('button', { name: 'Tạo đơn mua gói' }),
    ).not.toBeInTheDocument()
    expect(fixedPtApi.payCounter).toHaveBeenCalledTimes(1)
    expect(screen.getByLabelText('Member')).toBeEnabled()
  })
})
