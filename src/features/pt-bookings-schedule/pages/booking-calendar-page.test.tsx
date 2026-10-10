import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { BookingCalendarPage } from './booking-calendar-page'
import { ptBookingsService } from '../services/pt-bookings.service'
import { coachSlotService } from '@/features/coach-slots/services/coach-slot-service'
import { membersService } from '@/features/memberships/services/members.service'
import { ptPurchasesService } from '@/features/pt-packages-sales/services/pt-purchases.service'
import type { Booking, CoachSlot, MemberSummary, Purchase } from '@/shared/types/api'

vi.mock('../services/pt-bookings.service', () => ({
  ptBookingsService: {
    getBookings: vi.fn(),
    createBooking: vi.fn(),
    cancelBooking: vi.fn(),
    coachCancelBooking: vi.fn(),
    completeBooking: vi.fn(),
    noShowBooking: vi.fn(),
  },
}))

vi.mock('@/features/coach-slots/services/coach-slot-service', () => ({
  coachSlotService: {
    getSlots: vi.fn(),
  },
}))

vi.mock('@/features/memberships/services/members.service', () => ({
  membersService: {
    getMembers: vi.fn(),
  },
}))

vi.mock('@/features/pt-packages-sales/services/pt-purchases.service', () => ({
  ptPurchasesService: {
    getPurchases: vi.fn(),
  },
}))

describe('BookingCalendarPage', () => {
  const mockMember: MemberSummary = {
    id: 'm-1',
    userId: 'u-1',
    memberCode: 'MEM-001',
    fullName: 'Nguyen Van A',
    membershipStatus: 'ACTIVE',
  }

  const mockPurchase: Purchase = {
    id: 'pur-1',
    purchaseCode: 'PUR-001',
    memberId: 'm-1',
    courseId: 'c-1',
    coachId: 'coa-1',
    packageOptionId: 'pkg-1',
    courseNameSnapshot: 'Khóa Tăng Cơ Chuyên Sâu',
    coachNameSnapshot: 'HLV Minh',
    priceSnapshot: '3000000',
    gymSharePercentSnapshot: 40,
    coachSharePercentSnapshot: 60,
    totalCredits: 10,
    reservedCredits: 0,
    consumedCredits: 2,
    availableCredits: 8,
    status: 'ACTIVE',
    pendingMakeupCount: 0,
  }

  const mockSlot: CoachSlot = {
    id: 'slot-1',
    coachId: 'coa-1',
    offeringId: 'off-1',
    startsAt: new Date(Date.now() + 24 * 3600000).toISOString(),
    endsAt: new Date(Date.now() + 25 * 3600000).toISOString(),
    status: 'OPEN',
    coachName: 'HLV Minh',
    courseName: 'Khóa Tăng Cơ',
  }

  const mockBooking: Booking = {
    id: 'b-1',
    purchaseId: 'pur-1',
    slotId: 'slot-existing',
    memberId: 'm-1',
    coachId: 'coa-1',
    courseId: 'c-1',
    status: 'CONFIRMED',
    startsAt: new Date(Date.now() + 24 * 3600000).toISOString(),
    endsAt: new Date(Date.now() + 25 * 3600000).toISOString(),
    creditReturned: false,
    memberName: 'Nguyen Van A',
    coachName: 'HLV Minh',
    courseName: 'Khóa Tăng Cơ',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(ptBookingsService.getBookings).mockResolvedValue({
      data: [mockBooking],
      total: 1,
      page: 1,
      limit: 100,
    } as any)
    vi.mocked(coachSlotService.getSlots).mockResolvedValue([mockSlot])
    vi.mocked(membersService.getMembers).mockResolvedValue({
      data: [mockMember],
      total: 1,
      page: 1,
      limit: 100,
    } as any)
    vi.mocked(ptPurchasesService.getPurchases).mockResolvedValue({
      data: [mockPurchase],
      total: 1,
      page: 1,
      limit: 100,
    } as any)
  })

  it('renders booking page with slots and confirmed bookings', async () => {
    render(
      <BrowserRouter>
        <BookingCalendarPage />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Lịch Huấn Luyện & Đặt Lịch Hộ (WEB-REC-07)')).toBeInTheDocument()
      expect(screen.getByText('Nguyen Van A')).toBeInTheDocument()
      expect(screen.getAllByText('HLV Minh').length).toBeGreaterThanOrEqual(1)
    })
  })

  it('opens booking modal when clicking "Đặt lịch cho hội viên"', async () => {
    render(
      <BrowserRouter>
        <BookingCalendarPage />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Đặt lịch cho hội viên')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Đặt lịch cho hội viên'))

    expect(screen.getByText('Xác nhận đặt lịch tập PT 1:1')).toBeInTheDocument()
    expect(screen.getByText('Thẻ Gym hợp lệ.')).toBeInTheDocument()
  })

  it('submits booking creation successfully', async () => {
    vi.mocked(ptBookingsService.createBooking).mockResolvedValueOnce({
      ...mockBooking,
      id: 'b-new',
    })

    render(
      <BrowserRouter>
        <BookingCalendarPage />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Đặt lịch cho hội viên')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Đặt lịch cho hội viên'))
    fireEvent.click(screen.getByText('Xác nhận Đặt Lịch'))

    await waitFor(() => {
      expect(ptBookingsService.createBooking).toHaveBeenCalledWith({
        memberId: 'm-1',
        purchaseId: 'pur-1',
        slotId: 'slot-1',
      })
    })
  })

  it('opens cancel modal and executes cancellation', async () => {
    vi.mocked(ptBookingsService.cancelBooking).mockResolvedValueOnce({
      data: { creditImpact: 'RETURNED' },
    } as any)

    render(
      <BrowserRouter>
        <BookingCalendarPage />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Hủy lịch')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Hủy lịch'))

    expect(screen.getByText('Xác nhận hủy buổi tập PT 1:1')).toBeInTheDocument()
    expect(screen.getByText('Đồng ý Hủy Buổi')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Đồng ý Hủy Buổi'))

    await waitFor(() => {
      expect(ptBookingsService.cancelBooking).toHaveBeenCalledWith('b-1', {
        reason: 'Hội viên bận đột xuất',
      })
    })
  })
})
