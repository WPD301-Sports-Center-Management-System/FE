import type { UserRole, UserStatus, UserDetail, MemberDetail, CoachDetail } from '@/shared/types/api'

export interface LoginCredentials {
  identifier: string
  password: string
}

export interface RegisterPayload {
  fullName: string
  email: string
  phone: string
  password: string
  acceptedTerms: boolean
}

export interface RefreshTokenPayload {
  refreshToken: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  resetToken: string
  newPassword: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export interface UpdateProfilePayload {
  fullName?: string
  phone?: string
  avatarUrl?: string
}

export interface AuthResponseData {
  user: UserDetail
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: string | number
}

export interface RefreshTokenResponseData {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: string | number
}

export interface CurrentUserResponseData {
  id: string
  email: string
  phone: string
  fullName: string
  avatarUrl?: string | null
  role: UserRole
  status: UserStatus
  createdAt?: string
  lastLoginAt?: string
  memberProfilesUserId?: MemberDetail | null
  coachProfilesUserId?: CoachDetail | null
}
