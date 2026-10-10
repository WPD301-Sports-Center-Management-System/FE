import { describe, it, expect, vi, beforeEach } from 'vitest'
import { coachApprovalService } from './coach-approval.service'
import { apiClient } from '@/shared/api/client'

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('coachApprovalService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('[1] calls GET /coach-course-offerings with params', async () => {
    const mockOfferings = [
      {
        id: 'off-1',
        coachId: 'coa-1',
        courseId: 'course-1',
        status: 'APPROVED',
        coach: { user: { fullName: 'Coach 1' } },
        course: { name: 'Chest Strength' },
      },
    ]

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockOfferings,
    } as any)

    const res = await coachApprovalService.getCoachCourseOfferings({ status: 'APPROVED' })
    expect(apiClient.get).toHaveBeenCalledWith('/coach-course-offerings', {
      params: { status: 'APPROVED' },
    })
    expect(res.data).toEqual(mockOfferings)
  })

  it('[2] calls POST /coach-course-offerings to apply for course teaching', async () => {
    const payload = {
      courseId: 'course-123',
      experienceNote: '3 năm dạy kickboxing',
    }
    const created = { id: 'off-created', ...payload, status: 'PENDING', isActive: false }
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      success: true,
      data: created,
    } as any)

    const res = await coachApprovalService.createCoachCourseOffering(payload)
    expect(apiClient.post).toHaveBeenCalledWith('/coach-course-offerings', payload)
    expect(res).toEqual(created)
  })

  it('[3] calls PATCH /coach-course-offerings/:id/approve to approve offering', async () => {
    const approved = { id: 'off-1', status: 'APPROVED', isActive: true }
    vi.mocked(apiClient.patch).mockResolvedValueOnce({
      success: true,
      data: approved,
    } as any)

    const res = await coachApprovalService.approveCoachCourseOffering('off-1')
    expect(apiClient.patch).toHaveBeenCalledWith('/coach-course-offerings/off-1/approve')
    expect(res).toEqual(approved)
  })

  it('[4] calls PATCH /coach-course-offerings/:id/reject with reason', async () => {
    const payload = { rejectionReason: 'Chưa đủ chứng chỉ yêu cầu' }
    const rejected = { id: 'off-1', status: 'REJECTED', isActive: false, rejectionReason: payload.rejectionReason }
    vi.mocked(apiClient.patch).mockResolvedValueOnce({
      success: true,
      data: rejected,
    } as any)

    const res = await coachApprovalService.rejectCoachCourseOffering('off-1', payload)
    expect(apiClient.patch).toHaveBeenCalledWith('/coach-course-offerings/off-1/reject', payload)
    expect(res).toEqual(rejected)
  })

  it('[5] calls PATCH /coach-course-offerings/:id/resubmit to resubmit rejected offering', async () => {
    const payload = { experienceNote: 'Đã bổ sung chứng chỉ NASM-CPT' }
    const resubmitted = { id: 'off-1', status: 'PENDING', experienceNote: payload.experienceNote, rejectionReason: null }
    vi.mocked(apiClient.patch).mockResolvedValueOnce({
      success: true,
      data: resubmitted,
    } as any)

    const res = await coachApprovalService.resubmitCoachCourseOffering('off-1', payload)
    expect(apiClient.patch).toHaveBeenCalledWith('/coach-course-offerings/off-1/resubmit', payload)
    expect(res).toEqual(resubmitted)
  })

  it('[6] calls PATCH /coach-course-offerings/:id/status to toggle active status', async () => {
    const payload = { isActive: false }
    const updated = { id: 'off-1', status: 'APPROVED', isActive: false }
    vi.mocked(apiClient.patch).mockResolvedValueOnce({
      success: true,
      data: updated,
    } as any)

    const res = await coachApprovalService.updateOfferingStatus('off-1', payload)
    expect(apiClient.patch).toHaveBeenCalledWith('/coach-course-offerings/off-1/status', payload)
    expect(res).toEqual(updated)
  })

  it('[7] calls GET /coaches/me/offerings for coach own offerings', async () => {
    const mockOfferings = [{ id: 'off-1', courseId: 'course-1', status: 'APPROVED' }]
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      data: mockOfferings,
    } as any)

    const res = await coachApprovalService.getMyOfferings({ limit: 20 })
    expect(apiClient.get).toHaveBeenCalledWith('/coaches/me/offerings', {
      params: { limit: 20 },
    })
    expect(res.data).toEqual(mockOfferings)
  })
})
