import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NotificationBell } from './notification-bell'
import { notificationsService } from '../services/notifications.service'
import { MemoryRouter, useLocation } from 'react-router-dom'

function CurrentPath() { return <output data-testid="notification-path">{useLocation().pathname}</output> }

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'u-1', fullName: 'Test User', role: 'MEMBER' },
  }),
}))

vi.mock('../services/notifications.service', () => ({
  notificationsService: {
    getNotifications: vi.fn(),
    getUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}))

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(notificationsService.getUnreadCount).mockResolvedValue({ count: 2 })
  })

  it('renders unread count badge and opens dropdown with notification list', async () => {
    vi.mocked(notificationsService.getNotifications).mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 'n-1',
          userId: 'u-1',
          type: 'BOOKING',
          title: 'Lịch tập xác nhận',
          message: 'HLV đã nhận lịch hẹn',
          readAt: null,
          createdAt: '2026-10-10T08:00:00Z',
        },
      ],
    } as any)

    render(<MemoryRouter><NotificationBell /></MemoryRouter>)

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    const button = screen.getByRole('button', { name: /Thông báo/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Lịch tập xác nhận')).toBeInTheDocument()
      expect(screen.getByText('HLV đã nhận lịch hẹn')).toBeInTheDocument()
    })
  })

  it('marks a single notification as read when clicked', async () => {
    vi.mocked(notificationsService.getNotifications).mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 'n-1',
          userId: 'u-1',
          type: 'PAYMENT',
          title: 'Thanh toán thành công',
          message: 'Đã nhận 1,200,000 VND',
          readAt: null,
          createdAt: '2026-10-10T08:00:00Z',
        },
      ],
    } as any)
    vi.mocked(notificationsService.markAsRead).mockResolvedValueOnce({
      id: 'n-1',
      readAt: '2026-10-10T09:00:00Z',
    } as any)

    render(<MemoryRouter><NotificationBell /></MemoryRouter>)

    fireEvent.click(screen.getByRole('button', { name: /Thông báo/i }))

    await waitFor(() => {
      expect(screen.getByText('Thanh toán thành công')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Thanh toán thành công'))

    await waitFor(() => {
      expect(notificationsService.markAsRead).toHaveBeenCalledWith('n-1')
    })
  })
  it('opens the exact purchase deep link even when the notification was already read', async () => {
    vi.mocked(notificationsService.getNotifications).mockResolvedValueOnce({ success: true, data: [{ id: 'n-read', userId: 'u-1', type: 'BOOKING', title: 'Gói PT đã mua', message: 'Đặt buổi đầu', relatedType: 'PtPackagePurchase', relatedId: 'purchase-123', readAt: '2026-10-10T09:00:00Z', createdAt: '2026-10-10T08:00:00Z' }] } as any)
    render(<MemoryRouter><NotificationBell /><CurrentPath /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: /Thông báo/i }))
    fireEvent.click(await screen.findByText('Gói PT đã mua'))
    expect(screen.getByTestId('notification-path')).toHaveTextContent('/pt-purchases/purchase-123')
    expect(notificationsService.markAsRead).not.toHaveBeenCalled()
  })
})
