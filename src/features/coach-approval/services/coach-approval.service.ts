import { apiClient } from '@/shared/api/client'
import type { ApiSuccess, PackageOption } from '@/shared/types/api'
import type {
  OfferingDetail,
  CoachCourseOfferingQueryParams,
  CreateCoachCourseOfferingPayload,
  RejectOfferingPayload,
  ResubmitOfferingPayload,
  UpdateOfferingStatusPayload,
} from '../types/coach-approval.types'

export interface PtPackageOptionQueryParams {
  courseId?: string
  coachId?: string
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED'
  page?: number
  limit?: number
}

export interface CreatePtPackageOptionPayload {
  courseId: string
  coachId?: string | null
  name: string
  sessionCount: number
  validityDays: number
  price: string
  description?: string
}

export const coachApprovalService = {
  /**
   * [1] GET /coach-course-offerings - List coach course approval requests & statuses (Manager)
   */
  async getCoachCourseOfferings(
    params?: CoachCourseOfferingQueryParams
  ): Promise<ApiSuccess<OfferingDetail[]>> {
    const res = await apiClient.get<ApiSuccess<OfferingDetail[]>>('/coach-course-offerings', {
      params,
    })
    return res as unknown as ApiSuccess<OfferingDetail[]>
  },

  /**
   * [2] POST /coach-course-offerings - Coach applies to teach a training course
   */
  async createCoachCourseOffering(
    payload: CreateCoachCourseOfferingPayload
  ): Promise<OfferingDetail> {
    const res = await apiClient.post<ApiSuccess<OfferingDetail>>(
      '/coach-course-offerings',
      payload
    )
    const data = res as unknown as ApiSuccess<OfferingDetail>
    return data.data ?? (data as unknown as OfferingDetail)
  },

  /**
   * [3] PATCH /coach-course-offerings/{id}/approve - Manager approves teaching offering
   */
  async approveCoachCourseOffering(id: string): Promise<OfferingDetail> {
    const res = await apiClient.patch<ApiSuccess<OfferingDetail>>(
      `/coach-course-offerings/${id}/approve`
    )
    const data = res as unknown as ApiSuccess<OfferingDetail>
    return data.data ?? (data as unknown as OfferingDetail)
  },

  /**
   * [4] PATCH /coach-course-offerings/{id}/reject - Manager rejects offering with reason
   */
  async rejectCoachCourseOffering(
    id: string,
    payload: RejectOfferingPayload
  ): Promise<OfferingDetail> {
    const res = await apiClient.patch<ApiSuccess<OfferingDetail>>(
      `/coach-course-offerings/${id}/reject`,
      payload
    )
    const data = res as unknown as ApiSuccess<OfferingDetail>
    return data.data ?? (data as unknown as OfferingDetail)
  },

  /**
   * [5] PATCH /coach-course-offerings/{id}/resubmit - Coach updates experience notes and resubmits rejected offering
   */
  async resubmitCoachCourseOffering(
    id: string,
    payload: ResubmitOfferingPayload
  ): Promise<OfferingDetail> {
    const res = await apiClient.patch<ApiSuccess<OfferingDetail>>(
      `/coach-course-offerings/${id}/resubmit`,
      payload
    )
    const data = res as unknown as ApiSuccess<OfferingDetail>
    return data.data ?? (data as unknown as OfferingDetail)
  },

  /**
   * [6] PATCH /coach-course-offerings/{id}/status - Toggle offering active/inactive status (Manager / Coach)
   */
  async updateOfferingStatus(
    id: string,
    payload: UpdateOfferingStatusPayload
  ): Promise<OfferingDetail> {
    const res = await apiClient.patch<ApiSuccess<OfferingDetail>>(
      `/coach-course-offerings/${id}/status`,
      payload
    )
    const data = res as unknown as ApiSuccess<OfferingDetail>
    return data.data ?? (data as unknown as OfferingDetail)
  },

  /**
   * [7] GET /coaches/me/offerings - List offerings for current coach
   */
  async getMyOfferings(params?: {
    page?: number
    limit?: number
  }): Promise<ApiSuccess<OfferingDetail[]>> {
    const res = await apiClient.get<ApiSuccess<OfferingDetail[]>>('/coaches/me/offerings', {
      params,
    })
    return res as unknown as ApiSuccess<OfferingDetail[]>
  },

  /**
   * [8] GET /pt-package-options - List PT package options (Manager & public)
   */
  async getPtPackageOptions(
    params?: PtPackageOptionQueryParams
  ): Promise<ApiSuccess<PackageOption[]>> {
    const res = await apiClient.get<ApiSuccess<PackageOption[]>>('/pt-package-options', {
      params,
    })
    return res as unknown as ApiSuccess<PackageOption[]>
  },

  /**
   * [9] POST /pt-package-options - Propose or create new PT package option
   */
  async createPtPackageOption(
    payload: CreatePtPackageOptionPayload
  ): Promise<PackageOption> {
    const res = await apiClient.post<ApiSuccess<PackageOption>>('/pt-package-options', payload)
    const data = res as unknown as ApiSuccess<PackageOption>
    return data.data ?? (data as unknown as PackageOption)
  },

  /**
   * [10] PATCH /pt-package-options/{id}/approve - Manager approves coach proposed package
   */
  async approvePtPackageOption(id: string): Promise<PackageOption> {
    const res = await apiClient.patch<ApiSuccess<PackageOption>>(
      `/pt-package-options/${id}/approve`
    )
    const data = res as unknown as ApiSuccess<PackageOption>
    return data.data ?? (data as unknown as PackageOption)
  },

  /**
   * [11] PATCH /pt-package-options/{id}/reject - Manager rejects package with reason
   */
  async rejectPtPackageOption(
    id: string,
    payload: { rejectionReason: string }
  ): Promise<PackageOption> {
    const res = await apiClient.patch<ApiSuccess<PackageOption>>(
      `/pt-package-options/${id}/reject`,
      payload
    )
    const data = res as unknown as ApiSuccess<PackageOption>
    return data.data ?? (data as unknown as PackageOption)
  },

  /**
   * [12] GET /pt-package-options/{id} - Get single package option detail
   */
  async getPtPackageOptionById(id: string): Promise<PackageOption> {
    const res = await apiClient.get<ApiSuccess<PackageOption>>(`/pt-package-options/${id}`)
    const data = res as unknown as ApiSuccess<PackageOption>
    return data.data ?? (data as unknown as PackageOption)
  },

  /**
   * [13] PATCH /pt-package-options/{id} - Coach/Manager updates package details
   */
  async updatePtPackageOption(
    id: string,
    payload: {
      name?: string
      sessionCount?: number
      validityDays?: number
      price?: number
      description?: string
    }
  ): Promise<PackageOption> {
    const res = await apiClient.patch<ApiSuccess<PackageOption>>(
      `/pt-package-options/${id}`,
      payload
    )
    const data = res as unknown as ApiSuccess<PackageOption>
    return data.data ?? (data as unknown as PackageOption)
  },

  /**
   * [14] PATCH /pt-package-options/{id}/status - Toggle package option active/inactive
   */
  async updatePtPackageOptionStatus(
    id: string,
    payload: { isActive: boolean }
  ): Promise<PackageOption> {
    const res = await apiClient.patch<ApiSuccess<PackageOption>>(
      `/pt-package-options/${id}/status`,
      payload
    )
    const data = res as unknown as ApiSuccess<PackageOption>
    return data.data ?? (data as unknown as PackageOption)
  },
}
