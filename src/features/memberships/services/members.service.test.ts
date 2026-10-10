import { describe, it, expect, vi, beforeEach } from 'vitest'
import { membersService } from './members.service'
import { apiClient } from '@/shared/api/client'

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('membersService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('[1] calls GET /members with params', async () => {
    const mockMembers = [
      {
        id: 'm-1',
        userId: 'u-1',
        memberCode: 'MEM-001',
        fullName: 'Member 1',
        email: 'm1@example.com',
        phone: '0901234567',
        avatarUrl: undefined,
        membershipStatus: 'ACTIVE' as const,
      },
    ]
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      message: 'OK',
      data: mockMembers,
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    } as any)

    const result = await membersService.getMembers({ search: 'Member' })
    expect(apiClient.get).toHaveBeenCalledWith('/members', { params: { search: 'Member' } })
    expect(result.data).toEqual(mockMembers)
  })

  it('[2] calls POST /members to create member', async () => {
    const mockCreated = {
      member: { id: 'm-1', memberCode: 'MEM-001' },
      user: { id: 'u-1', fullName: 'Member 1' },
      temporaryPassword: 'temp-pw-123',
    }
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      success: true,
      data: mockCreated,
    } as any)

    const result = await membersService.createMember({
      fullName: 'Member 1',
      phone: '0912345678',
    })
    expect(apiClient.post).toHaveBeenCalledWith('/members', {
      fullName: 'Member 1',
      phone: '0912345678',
    })
    expect(result).toEqual(mockCreated)
  })

  it('[3] calls GET /members/:id', async () => {
    const mockDetail = { id: 'm-1', memberCode: 'MEM-001', fullName: 'Member 1' }
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockDetail,
    } as any)

    const result = await membersService.getMemberById('m-1')
    expect(apiClient.get).toHaveBeenCalledWith('/members/m-1')
    expect(result).toEqual(mockDetail)
  })

  it('[4] calls PATCH /members/:id', async () => {
    const mockUpdated = { id: 'm-1', address: 'Updated Address' }
    vi.mocked(apiClient.patch).mockResolvedValueOnce({
      success: true,
      data: mockUpdated,
    } as any)

    const result = await membersService.updateMember('m-1', { address: 'Updated Address' })
    expect(apiClient.patch).toHaveBeenCalledWith('/members/m-1', { address: 'Updated Address' })
    expect(result).toEqual(mockUpdated)
  })

  it('[5] calls GET /members/:id/history', async () => {
    const mockHistory = { bookings: [], assessments: [], results: [] }
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockHistory,
    } as any)

    const result = await membersService.getMemberHistory('m-1')
    expect(apiClient.get).toHaveBeenCalledWith('/members/m-1/history')
    expect(result).toEqual(mockHistory)
  })

  it('[6] calls GET /members/:id/training-history', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
    } as any)

    const result = await membersService.getMemberTrainingHistory('m-1')
    expect(apiClient.get).toHaveBeenCalledWith('/members/m-1/training-history', { params: undefined })
    expect(result.data).toEqual([])
  })

  it('[7] calls GET /members/:id/body-assessments', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
    } as any)

    const result = await membersService.getMemberBodyAssessments('m-1')
    expect(apiClient.get).toHaveBeenCalledWith('/members/m-1/body-assessments', { params: undefined })
    expect(result.data).toEqual([])
  })

  it('[8] calls POST /members/:id/body-assessments', async () => {
    const mockAssess = { id: 'a-1', weightKg: '70' }
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      success: true,
      data: mockAssess,
    } as any)

    const result = await membersService.createMemberBodyAssessment('m-1', {
      assessedAt: '2026-10-10T00:00:00Z',
      weightKg: '70',
    })
    expect(apiClient.post).toHaveBeenCalledWith('/members/m-1/body-assessments', {
      assessedAt: '2026-10-10T00:00:00Z',
      weightKg: '70',
    })
    expect(result).toEqual(mockAssess)
  })

  it('[9] calls GET /members/:id/fitness-goals', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
    } as any)

    const result = await membersService.getMemberFitnessGoals('m-1')
    expect(apiClient.get).toHaveBeenCalledWith('/members/m-1/fitness-goals', { params: undefined })
    expect(result.data).toEqual([])
  })

  it('[10] calls POST /members/:id/fitness-goals', async () => {
    const mockGoal = { id: 'g-1', title: 'Goal 1' }
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      success: true,
      data: mockGoal,
    } as any)

    const result = await membersService.createMemberFitnessGoal('m-1', {
      title: 'Goal 1',
    })
    expect(apiClient.post).toHaveBeenCalledWith('/members/m-1/fitness-goals', {
      title: 'Goal 1',
    })
    expect(result).toEqual(mockGoal)
  })

  it('[11] calls GET /members/:id/progress', async () => {
    const mockProgress = { assessments: [], results: [], goals: [] }
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockProgress,
    } as any)

    const result = await membersService.getMemberProgress('m-1')
    expect(apiClient.get).toHaveBeenCalledWith('/members/m-1/progress')
    expect(result).toEqual(mockProgress)
  })
})
