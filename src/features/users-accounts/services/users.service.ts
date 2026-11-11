import { apiClient } from '@/shared/api/client'
import type { ApiSuccess, UserDetail, UserStatus } from '@/shared/types/api'
import type {
  CreateUserPayload,
  UpdateUserPayload,
  UserQueryParams,
  ResetPasswordResponse,
} from '@/features/users-accounts/types/users.types'

export const usersService = {
  /**
   * Get paginated list of users with optional filtering
   */
  async getUsers(params?: UserQueryParams): Promise<ApiSuccess<UserDetail[]>> {
    const res = await apiClient.get<ApiSuccess<UserDetail[]>>('/users', {
      params,
    })
    return res as unknown as ApiSuccess<UserDetail[]>
  },

  /**
   * Get single user by ID
   */
  async getUserById(userId: string): Promise<UserDetail> {
    const res = await apiClient.get<ApiSuccess<UserDetail>>(`/users/${userId}`)
    const payload = res as unknown as ApiSuccess<UserDetail>
    return payload.data
  },

  /**
   * Create a new staff/member account
   */
  async createUser(payload: CreateUserPayload): Promise<UserDetail> {
    const res = await apiClient.post<ApiSuccess<{ user: UserDetail }>>('/users', payload)
    const data = res as unknown as ApiSuccess<{ user: UserDetail }>
    return data.data.user
  },

  /**
   * Update user details (fullName, phone, avatar, role)
   */
  async updateUser(userId: string, payload: UpdateUserPayload): Promise<UserDetail> {
    const res = await apiClient.patch<ApiSuccess<UserDetail>>(`/users/${userId}`, payload)
    const data = res as unknown as ApiSuccess<UserDetail>
    return data.data
  },

  /**
   * Update user status (ACTIVE, INACTIVE, SUSPENDED)
   */
  async updateUserStatus(userId: string, status: UserStatus): Promise<UserDetail> {
    const res = await apiClient.patch<ApiSuccess<UserDetail>>(`/users/${userId}/status`, {
      status,
    })
    const data = res as unknown as ApiSuccess<UserDetail>
    return data.data
  },

  /**
   * Reset user password by manager and generate temporary password
   */
  async resetUserPassword(userId: string): Promise<ResetPasswordResponse> {
    const res = await apiClient.post<ApiSuccess<ResetPasswordResponse>>(
      `/users/${userId}/reset-password`,
      {}
    )
    const data = res as unknown as ApiSuccess<ResetPasswordResponse>
    return data.data
  },

  /**
   * Export user list as CSV blob file
   */
  async exportUsers(params?: UserQueryParams): Promise<Blob> {
    const res = await apiClient.get('/users/export', {
      params,
      responseType: 'blob',
    })
    return res as unknown as Blob
  },

  /**
   * Soft delete an account (DELETE /users/{id}). Different from locking: the account leaves every list and cannot sign in;
   * history is kept. The BE refuses self-delete, the last active Manager and accounts with running orders (409).
   */
  async deleteUser(userId: string): Promise<void> {
    await apiClient.delete(`/users/${userId}`)
  },
}
