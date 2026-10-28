import { apiClient } from '@/shared/api/client'
import type {
  ApiSuccess,
  MemberDetail,
  MemberSummary,
  BodyAssessment,
  TrainingResult,
  FitnessGoal,
} from '@/shared/types/api'
import type {
  CreateMemberPayload,
  UpdateMemberPayload,
  MemberQueryParams,
  CreateMemberResponseData,
  MemberHistoryResponseData,
  MemberProgressResponseData,
  CreateBodyAssessmentPayload,
  CreateFitnessGoalPayload,
} from '@/features/memberships/types/members.types'

export const membersService = {
  /**
   * [1] GET /members - Get paginated list of gym members
   */
  async getMembers(params?: MemberQueryParams): Promise<ApiSuccess<MemberSummary[]>> {
    const res = await apiClient.get<ApiSuccess<any[]>>('/members', {
      params,
    })
    const raw = res as unknown as ApiSuccess<any[]>
    const normalizedData = (raw.data || []).map((m: any) => ({
      ...m,
      userId: m.userId || m.user?.id || '',
      fullName: m.fullName || m.user?.fullName || 'Hội viên',
      email: m.email || m.user?.email || '',
      phone: m.phone || m.user?.phone || '',
      avatarUrl: m.avatarUrl || m.user?.avatarUrl,
      membershipStatus: m.membershipStatus || (m.user?.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'),
    }))
    return {
      ...raw,
      data: normalizedData as MemberSummary[],
    }
  },

  /**
   * [2] POST /members - Register a new member at reception
   */
  async createMember(payload: CreateMemberPayload): Promise<CreateMemberResponseData> {
    const res = await apiClient.post<ApiSuccess<CreateMemberResponseData>>('/members', payload)
    const data = res as unknown as ApiSuccess<CreateMemberResponseData>
    return data.data
  },

  /**
   * [3] GET /members/{memberId} - Get full member details
   */
  async getMemberById(memberId: string): Promise<MemberDetail> {
    const res = await apiClient.get<ApiSuccess<MemberDetail>>(`/members/${memberId}`)
    const data = res as unknown as ApiSuccess<MemberDetail>
    return data.data
  },

  /**
   * [4] PATCH /members/{memberId} - Update member profile info
   */
  async updateMember(memberId: string, payload: UpdateMemberPayload): Promise<MemberDetail> {
    const res = await apiClient.patch<ApiSuccess<MemberDetail>>(`/members/${memberId}`, payload)
    const data = res as unknown as ApiSuccess<MemberDetail>
    return data.data
  },

  /**
   * [5] GET /members/{memberId}/history - Get member overall history
   */
  async getMemberHistory(memberId: string): Promise<MemberHistoryResponseData> {
    const res = await apiClient.get<ApiSuccess<MemberHistoryResponseData>>(
      `/members/${memberId}/history`
    )
    const data = res as unknown as ApiSuccess<MemberHistoryResponseData>
    return data.data
  },

  /**
   * [6] GET /members/{memberId}/training-history - Get PT training history
   */
  async getMemberTrainingHistory(
    memberId: string,
    params?: { page?: number; limit?: number }
  ): Promise<ApiSuccess<TrainingResult[]>> {
    const res = await apiClient.get<ApiSuccess<TrainingResult[]>>(
      `/members/${memberId}/training-history`,
      { params }
    )
    return res as unknown as ApiSuccess<TrainingResult[]>
  },

  /**
   * [7] GET /members/{memberId}/body-assessments - Get InBody assessments list
   */
  async getMemberBodyAssessments(
    memberId: string,
    params?: { page?: number; limit?: number }
  ): Promise<ApiSuccess<BodyAssessment[]>> {
    const res = await apiClient.get<ApiSuccess<BodyAssessment[]>>(
      `/members/${memberId}/body-assessments`,
      { params }
    )
    return res as unknown as ApiSuccess<BodyAssessment[]>
  },

  /**
   * [8] POST /members/{memberId}/body-assessments - Record new body assessment
   */
  async createMemberBodyAssessment(
    memberId: string,
    payload: CreateBodyAssessmentPayload
  ): Promise<BodyAssessment> {
    const res = await apiClient.post<ApiSuccess<BodyAssessment>>(
      `/members/${memberId}/body-assessments`,
      payload
    )
    const data = res as unknown as ApiSuccess<BodyAssessment>
    return data.data
  },

  /** PATCH /body-assessments/{id} - Correct a recorded assessment (BMI is recalculated by the server) */
  async updateBodyAssessment(id: string, payload: Partial<CreateBodyAssessmentPayload>): Promise<BodyAssessment> {
    const res = await apiClient.patch<ApiSuccess<BodyAssessment>>(`/body-assessments/${id}`, payload)
    return (res as unknown as ApiSuccess<BodyAssessment>).data
  },

  /** PATCH /fitness-goals/{id} - Update progress, targets or status of a goal */
  async updateFitnessGoal(
    id: string,
    payload: Partial<CreateFitnessGoalPayload> & { status?: 'ACTIVE' | 'ACHIEVED' | 'CANCELLED' }
  ): Promise<FitnessGoal> {
    const res = await apiClient.patch<ApiSuccess<FitnessGoal>>(`/fitness-goals/${id}`, payload)
    return (res as unknown as ApiSuccess<FitnessGoal>).data
  },

  /**
   * [9] GET /members/{memberId}/fitness-goals - Get fitness goals
   */
  async getMemberFitnessGoals(
    memberId: string,
    params?: { page?: number; limit?: number }
  ): Promise<ApiSuccess<FitnessGoal[]>> {
    const res = await apiClient.get<ApiSuccess<FitnessGoal[]>>(
      `/members/${memberId}/fitness-goals`,
      { params }
    )
    return res as unknown as ApiSuccess<FitnessGoal[]>
  },

  /**
   * [10] POST /members/{memberId}/fitness-goals - Create new fitness goal
   */
  async createMemberFitnessGoal(
    memberId: string,
    payload: CreateFitnessGoalPayload
  ): Promise<FitnessGoal> {
    const res = await apiClient.post<ApiSuccess<FitnessGoal>>(
      `/members/${memberId}/fitness-goals`,
      payload
    )
    const data = res as unknown as ApiSuccess<FitnessGoal>
    return data.data
  },

  /**
   * [11] GET /members/{memberId}/progress - Get aggregated member progress data
   */
  async getMemberProgress(memberId: string): Promise<MemberProgressResponseData> {
    const res = await apiClient.get<ApiSuccess<MemberProgressResponseData>>(
      `/members/${memberId}/progress`
    )
    const data = res as unknown as ApiSuccess<MemberProgressResponseData>
    return data.data
  },
}
