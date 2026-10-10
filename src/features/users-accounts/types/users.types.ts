import type { UserRole, UserStatus, UserDetail } from '@/shared/types/api'

export interface CreateUserPayload {
  fullName: string
  email: string
  phone: string
  role: UserRole
  password?: string
}

export interface UpdateUserPayload {
  fullName?: string
  phone?: string
  avatarUrl?: string
  role?: UserRole
}

export interface UserQueryParams {
  page?: number
  limit?: number
  role?: UserRole | ''
  status?: UserStatus | ''
  search?: string
}

export interface ResetPasswordResponse {
  temporaryPassword: string
}

export type { UserDetail, UserRole, UserStatus }
