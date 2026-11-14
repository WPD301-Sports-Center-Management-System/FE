import { refreshSessionTokens } from '@/shared/api/refresh-session'
import { apiClient } from '@/shared/api/client'
import type { ApiSuccess } from '@/shared/types/api'
import type {
  LoginCredentials,
  RegisterPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  ChangePasswordPayload,
  UpdateProfilePayload,
  AuthResponseData,
  RefreshTokenResponseData,
  CurrentUserResponseData,
} from '@/features/auth/types/auth.types'

export const authService = {
  /**
   * Authenticate user with identifier (email/phone/username) and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponseData> {
    // A sleeping host may need a cold start; do not retry the login mutation automatically.
    const res = await apiClient.post<ApiSuccess<AuthResponseData>>('/auth/login', credentials, { timeout: 90_000 })
    const payload = res as unknown as ApiSuccess<AuthResponseData>
    return payload.data
  },

  /**
   * Retrieve current authenticated user profile
   */
  async getCurrentUser(): Promise<CurrentUserResponseData> {
    const res = await apiClient.get<ApiSuccess<CurrentUserResponseData>>('/auth/me')
    const payload = res as unknown as ApiSuccess<CurrentUserResponseData>
    return payload.data
  },

  /**
   * Renew access token and refresh token
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponseData> {
    return refreshSessionTokens(refreshToken)
  },

  /**
   * Logout current session
   */
  async logout(refreshToken?: string): Promise<{ revoked: boolean }> {
    const res = await apiClient.post<ApiSuccess<{ revoked: boolean }>>('/auth/logout', {
      refreshToken: refreshToken || '',
    })
    const payload = res as unknown as ApiSuccess<{ revoked: boolean }>
    return payload.data
  },

  /**
   * Logout all active sessions across devices
   */
  async logoutAll(): Promise<{ revoked: boolean }> {
    const res = await apiClient.post<ApiSuccess<{ revoked: boolean }>>('/auth/logout-all')
    const payload = res as unknown as ApiSuccess<{ revoked: boolean }>
    return payload.data
  },

  /**
   * Register a new member account
   */
  async register(payload: RegisterPayload): Promise<AuthResponseData> {
    const res = await apiClient.post<ApiSuccess<AuthResponseData>>('/auth/register', payload)
    const data = res as unknown as ApiSuccess<AuthResponseData>
    return data.data
  },

  /**
   * Request password recovery email
   */
  async forgotPassword(payload: ForgotPasswordPayload): Promise<{ message: string }> {
    const res = await apiClient.post<ApiSuccess<null>>('/auth/forgot-password', payload)
    const data = res as unknown as ApiSuccess<null>
    return { message: data.message }
  },

  /**
   * Reset password with reset token
   */
  async resetPassword(payload: ResetPasswordPayload): Promise<{ message: string }> {
    const res = await apiClient.post<ApiSuccess<null>>('/auth/reset-password', payload)
    const data = res as unknown as ApiSuccess<null>
    return { message: data.message }
  },

  /**
   * Change current user's password
   */
  async changePassword(payload: ChangePasswordPayload): Promise<{ message: string }> {
    const res = await apiClient.patch<ApiSuccess<null>>('/auth/change-password', payload)
    const data = res as unknown as ApiSuccess<null>
    return { message: data.message }
  },

  /**
   * Update current user's profile
   */
  async updateProfile(payload: UpdateProfilePayload): Promise<CurrentUserResponseData> {
    const res = await apiClient.patch<ApiSuccess<CurrentUserResponseData>>('/auth/me', payload)
    const data = res as unknown as ApiSuccess<CurrentUserResponseData>
    return data.data
  },
}
