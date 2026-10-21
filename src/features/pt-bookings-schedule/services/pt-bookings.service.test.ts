import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ptBookingsService } from './pt-bookings.service'
import { apiClient } from '@/shared/api/client'

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('ptBookingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('[1] getBookings calls GET /pt-bookings', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ success: true, data: [] } as any)
    const result = await ptBookingsService.getBookings({ status: 'CONFIRMED' })
    expect(apiClient.get).toHaveBeenCalledWith('/pt-bookings', {
      params: { status: 'CONFIRMED' },
    })
    expect(result).toEqual({ success: true, data: [] })
  })

  it('[2] createBooking calls POST /pt-bookings', async () => {
    const payload = { memberId: 'm-1', purchaseId: 'p-1', slotId: 's-1' }
    vi.mocked(apiClient.post).mockResolvedValueOnce({ success: true, data: { id: 'b-1', status: 'CONFIRMED' } } as any)
    const result = await ptBookingsService.createBooking(payload)
    expect(apiClient.post).toHaveBeenCalledWith('/pt-bookings', payload)
    expect(result.id).toBe('b-1')
  })

  it('[3] getBookingById calls GET /pt-bookings/{id}', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ success: true, data: { id: 'b-1', status: 'CONFIRMED' } } as any)
    const result = await ptBookingsService.getBookingById('b-1')
    expect(apiClient.get).toHaveBeenCalledWith('/pt-bookings/b-1')
    expect(result.id).toBe('b-1')
  })

  it('[4] cancelBooking calls POST /pt-bookings/{id}/cancel', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ success: true, data: { creditImpact: 'RETURNED' } } as any)
    await ptBookingsService.cancelBooking('b-1', { reason: 'Bận đột xuất' })
    expect(apiClient.post).toHaveBeenCalledWith('/pt-bookings/b-1/cancel', { reason: 'Bận đột xuất' })
  })

  it('[5] coachCancelBooking calls POST /pt-bookings/{id}/coach-cancel', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ success: true } as any)
    await ptBookingsService.coachCancelBooking('b-1', { reason: 'HLV ốm' })
    expect(apiClient.post).toHaveBeenCalledWith('/pt-bookings/b-1/coach-cancel', { reason: 'HLV ốm' })
  })

  it('[6] completeBooking calls POST /pt-bookings/{id}/complete with force=true', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ success: true, data: { status: 'COMPLETED' } } as any)
    await ptBookingsService.completeBooking('b-1')
    expect(apiClient.post).toHaveBeenCalledWith('/pt-bookings/b-1/complete', { force: true })
  })

  it('[7] noShowBooking calls POST /pt-bookings/{id}/no-show with force=true', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ success: true } as any)
    await ptBookingsService.noShowBooking('b-1', { reason: 'Không đến' })
    expect(apiClient.post).toHaveBeenCalledWith('/pt-bookings/b-1/no-show', { reason: 'Không đến', force: true })
  })

  it('[8] createTrainingResult calls POST /pt-bookings/{id}/training-result', async () => {
    const payload = {
      performedAt: '2026-10-10T10:00:00Z',
      result: [{ exerciseId: 'e-1', sets: [{ reps: 10, weight: 50, rpe: 8 }], completed: true }],
      coachComment: 'Tập tốt',
      progressScore: 90,
    }
    vi.mocked(apiClient.post).mockResolvedValueOnce({ success: true, data: { id: 'tr-1' } } as any)
    await ptBookingsService.createTrainingResult('b-1', payload)
    expect(apiClient.post).toHaveBeenCalledWith('/pt-bookings/b-1/training-result', payload)
  })

  it('[10] getCoachRecurringMatrix calls GET /coaches/{coachId}/recurring-matrix', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ success: true, data: { coachId: 'c-1', matrix: [] } } as any)
    const result = await ptBookingsService.getCoachRecurringMatrix('c-1', { startDate: '2026-10-26', totalWeeks: 4 })
    expect(apiClient.get).toHaveBeenCalledWith('/coaches/c-1/recurring-matrix', {
      params: { startDate: '2026-10-26', totalWeeks: 4 },
    })
    expect(result.coachId).toBe('c-1')
  })

  it('[11] previewFixedSchedule calls POST /pt-package-purchases/{id}/fixed-schedule/preview', async () => {
    const payload = { startDate: '2026-10-26', daysOfWeek: [1, 3, 5], slotIndex: 4 }
    vi.mocked(apiClient.post).mockResolvedValueOnce({ success: true, data: { isAvailable: true, totalSessions: 12 } } as any)
    const result = await ptBookingsService.previewFixedSchedule('p-1', payload)
    expect(apiClient.post).toHaveBeenCalledWith('/pt-package-purchases/p-1/fixed-schedule/preview', payload)
    expect(result.isAvailable).toBe(true)
  })

  it('[12] bookFixedSchedule calls POST /pt-package-purchases/{id}/fixed-schedule/book', async () => {
    const payload = { startDate: '2026-10-26', daysOfWeek: [1, 3, 5], slotIndex: 4 }
    vi.mocked(apiClient.post).mockResolvedValueOnce({ success: true, data: { success: true, totalBooked: 12 } } as any)
    const result = await ptBookingsService.bookFixedSchedule('p-1', payload)
    expect(apiClient.post).toHaveBeenCalledWith('/pt-package-purchases/p-1/fixed-schedule/book', payload)
    expect(result.totalBooked).toBe(12)
  })
})

