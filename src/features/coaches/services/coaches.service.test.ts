import { describe, it, expect, vi, beforeEach } from 'vitest'
import { coachesService } from './coaches.service'
import { apiClient } from '@/shared/api/client'

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('coachesService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('[1] calls GET /coaches with query params', async () => {
    const mockList = [{ id: 'c-1', fullName: 'Coach 1', rating: 4.8 }]
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockList,
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    } as any)

    const result = await coachesService.getCoaches({ search: 'Coach' })
    expect(apiClient.get).toHaveBeenCalledWith('/coaches', { params: { search: 'Coach' } })
    expect(result.data).toEqual(mockList)
  })

  it('[2] calls GET /coaches/:coachId for detail', async () => {
    const mockDetail = { id: 'c-1', fullName: 'Coach 1', bio: 'Expert PT' }
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockDetail,
    } as any)

    const result = await coachesService.getCoachById('c-1')
    expect(apiClient.get).toHaveBeenCalledWith('/coaches/c-1')
    expect(result).toEqual(mockDetail)
  })

  it('[3] calls PATCH /coaches/:coachId', async () => {
    const mockUpdated = { id: 'c-1', fullName: 'Coach 1', bio: 'Updated bio' }
    vi.mocked(apiClient.patch).mockResolvedValueOnce({
      success: true,
      data: mockUpdated,
    } as any)

    const result = await coachesService.updateCoach('c-1', { bio: 'Updated bio' })
    expect(apiClient.patch).toHaveBeenCalledWith('/coaches/c-1', { bio: 'Updated bio' })
    expect(result).toEqual(mockUpdated)
  })

  it('[4] calls GET /coaches/:coachId/availability', async () => {
    const mockSlots = [{ id: 'slot-1', date: '2026-10-10', startTime: '08:00', endTime: '09:00', isAvailable: true }]
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockSlots,
    } as any)

    const result = await coachesService.getCoachAvailability('c-1', { date: '2026-10-10' })
    expect(apiClient.get).toHaveBeenCalledWith('/coaches/c-1/availability', { params: { date: '2026-10-10' } })
    expect(result).toEqual(mockSlots)
  })

  it('[5] calls GET /coaches/me/members', async () => {
    const mockMembers = [{ id: 'm-1', fullName: 'Student 1' }]
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockMembers,
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    } as any)

    const result = await coachesService.getMyMembers()
    expect(apiClient.get).toHaveBeenCalledWith('/coaches/me/members', { params: undefined })
    expect(result.data).toEqual(mockMembers)
  })

  it('[6] calls GET /coaches/me/offerings', async () => {
    const mockOfferings = [{ id: 'off-1', courseName: 'Gym 101' }]
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockOfferings,
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    } as any)

    const result = await coachesService.getMyOfferings()
    expect(apiClient.get).toHaveBeenCalledWith('/coaches/me/offerings', { params: undefined })
    expect(result.data).toEqual(mockOfferings)
  })

  it('[7] calls GET /coaches/me/slots', async () => {
    const mockSlots = [{ id: 's-1', slotIndex: 1 }]
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockSlots,
    } as any)

    const result = await coachesService.getMySlots({ from: '2026-10-10', to: '2026-10-17' })
    expect(apiClient.get).toHaveBeenCalledWith('/coaches/me/slots', {
      params: { from: '2026-10-10', to: '2026-10-17' },
    })
    expect(result.data).toEqual(mockSlots)
  })

  it('[8] calls GET /coaches/me/pt-package-options', async () => {
    const mockOptions = [{ id: 'opt-1', name: 'Pack 12 Sessions' }]
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockOptions,
    } as any)

    const result = await coachesService.getMyPackageOptions()
    expect(apiClient.get).toHaveBeenCalledWith('/coaches/me/pt-package-options', { params: undefined })
    expect(result.data).toEqual(mockOptions)
  })

  it('[9] calls GET /coaches/me/pt-packages', async () => {
    const mockPackages = [{ id: 'pkg-1', remainingSessions: 8 }]
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockPackages,
    } as any)

    const result = await coachesService.getMyPackages()
    expect(apiClient.get).toHaveBeenCalledWith('/coaches/me/pt-packages', { params: undefined })
    expect(result.data).toEqual(mockPackages)
  })

  it('[10] calls GET /coaches/me/pt-bookings', async () => {
    const mockBookings = [{ id: 'b-1', status: 'CONFIRMED' }]
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockBookings,
    } as any)

    const result = await coachesService.getMyBookings()
    expect(apiClient.get).toHaveBeenCalledWith('/coaches/me/pt-bookings', { params: undefined })
    expect(result.data).toEqual(mockBookings)
  })

  it('[11] calls GET /coaches/me/payouts', async () => {
    const mockPayouts = [{ id: 'pay-1', amount: '5000000', status: 'PAID' }]
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockPayouts,
    } as any)

    const result = await coachesService.getMyPayouts()
    expect(apiClient.get).toHaveBeenCalledWith('/coaches/me/payouts', { params: undefined })
    expect(result.data).toEqual(mockPayouts)
  })

  it('[12] calls GET /coaches/:coachId/reviews', async () => {
    const mockReviews = [{ id: 'r-1', rating: 5, comment: 'Great coach!' }]
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockReviews,
    } as any)

    const result = await coachesService.getCoachReviews('c-1')
    expect(apiClient.get).toHaveBeenCalledWith('/coaches/c-1/reviews', { params: undefined })
    expect(result.data).toEqual(mockReviews)
  })
})
