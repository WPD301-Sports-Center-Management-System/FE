import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authService } from './auth.service'
import { apiClient } from '@/shared/api/client'
import { refreshSessionTokens } from '@/shared/api/refresh-session'
vi.mock('@/shared/api/refresh-session', () => ({ refreshSessionTokens: vi.fn() }))

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls POST /auth/login with credentials and returns auth session', async () => {
    const mockSession = {
      user: { id: 'u-1', email: 'test@gym.local', role: 'MANAGER', status: 'ACTIVE', fullName: 'Manager User', phone: '0912345678' },
      accessToken: 'access-123',
      refreshToken: 'refresh-123',
      tokenType: 'Bearer',
      expiresIn: '15m',
    }

    vi.mocked(apiClient.post).mockResolvedValueOnce({
      success: true,
      message: 'Thành công.',
      data: mockSession,
    } as any)

    const result = await authService.login({ identifier: 'test@gym.local', password: 'Password@123' })
    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
      identifier: 'test@gym.local',
      password: 'Password@123',
    }, { timeout: 90_000 })
    expect(result).toEqual(mockSession)
  })

  it('calls GET /auth/me and returns current user', async () => {
    const mockUser = {
      id: 'u-1',
      email: 'test@gym.local',
      role: 'MANAGER',
      status: 'ACTIVE',
      fullName: 'Manager User',
      phone: '0912345678',
    }

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      message: 'Thành công.',
      data: mockUser,
    } as any)

    const result = await authService.getCurrentUser()
    expect(apiClient.get).toHaveBeenCalledWith('/auth/me')
    expect(result).toEqual(mockUser)
  })

  it('calls POST /auth/refresh and returns new tokens', async () => {
    const mockRefresh = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      tokenType: 'Bearer',
      expiresIn: '15m',
    }

    vi.mocked(refreshSessionTokens).mockResolvedValueOnce(mockRefresh)

    const result = await authService.refreshToken('old-refresh-token')
    expect(refreshSessionTokens).toHaveBeenCalledWith('old-refresh-token')
    expect(result).toEqual(mockRefresh)
  })

  it('calls POST /auth/logout with refreshToken payload', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      success: true,
      message: 'Thành công.',
      data: { revoked: true },
    } as any)

    const result = await authService.logout('current-refresh-token')
    expect(apiClient.post).toHaveBeenCalledWith('/auth/logout', {
      refreshToken: 'current-refresh-token',
    })
    expect(result.revoked).toBe(true)
  })

  it('calls POST /auth/forgot-password with email', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      success: true,
      message: 'Email khôi phục đã được gửi.',
      data: null,
    } as any)

    const result = await authService.forgotPassword({ email: 'user@example.com' })
    expect(apiClient.post).toHaveBeenCalledWith('/auth/forgot-password', {
      email: 'user@example.com',
    })
    expect(result.message).toBe('Email khôi phục đã được gửi.')
  })
})
