import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '@/shared/api/client'
import { checkInsService } from './check-ins.service'
import type { CheckIn } from '../types/check-ins.types'

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('checkInsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockCheckIn: CheckIn = {
    id: 'chk-01',
    memberId: 'mem-01',
    checkedInBy: 'usr-rec-01',
    checkedInAt: '2026-10-10T08:00:00.000Z',
    note: 'Check-in tại quầy',
    member: {
      id: 'mem-01',
      userId: 'usr-01',
      memberCode: 'MEM-001',
      fullName: 'Nguyen Van A',
      phone: '0901234567',
      membershipStatus: 'ACTIVE',
    },
  }

  it('getCheckIns should call GET /check-ins with params', async () => {
    const mockResponse = {
      success: true,
      message: 'OK',
      data: [mockCheckIn],
      meta: { page: 1, limit: 10, total: 1 },
    }
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse as never)

    const params = { page: 1, limit: 10, memberId: 'mem-01' }
    const result = await checkInsService.getCheckIns(params)

    expect(apiClient.get).toHaveBeenCalledWith('/check-ins', { params })
    expect(result).toEqual(mockResponse)
  })

  it('createCheckIn should call POST /check-ins with payload and return data', async () => {
    const mockResponse = {
      success: true,
      message: 'OK',
      data: mockCheckIn,
    }
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse as never)

    const payload = { memberId: 'mem-01', note: 'Check-in sáng' }
    const result = await checkInsService.createCheckIn(payload)

    expect(apiClient.post).toHaveBeenCalledWith('/check-ins', payload)
    expect(result).toEqual(mockCheckIn)
  })
})
