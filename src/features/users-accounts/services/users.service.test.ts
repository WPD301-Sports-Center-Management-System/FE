import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usersService } from './users.service'
import { apiClient } from '@/shared/api/client'

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('usersService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls GET /users with params and returns paginated list', async () => {
    const mockUsers = [
      { id: '1', fullName: 'User 1', email: 'u1@gym.local', phone: '0912345678', role: 'COACH', status: 'ACTIVE' },
    ]

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      message: 'Thành công.',
      data: mockUsers,
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    } as any)

    const result = await usersService.getUsers({ role: 'COACH', status: 'ACTIVE' })
    expect(apiClient.get).toHaveBeenCalledWith('/users', {
      params: { role: 'COACH', status: 'ACTIVE' },
    })
    expect(result.data).toEqual(mockUsers)
  })

  it('calls GET /users/:id and returns user detail', async () => {
    const mockUser = { id: 'u-123', fullName: 'User Detail', email: 'u@gym.local', role: 'MANAGER', status: 'ACTIVE' }

    vi.mocked(apiClient.get).mockResolvedValueOnce({
      success: true,
      message: 'Thành công.',
      data: mockUser,
    } as any)

    const result = await usersService.getUserById('u-123')
    expect(apiClient.get).toHaveBeenCalledWith('/users/u-123')
    expect(result).toEqual(mockUser)
  })

  it('calls POST /users and returns created user', async () => {
    const mockCreated = { id: 'new-1', fullName: 'New Coach', email: 'coach@gym.local', phone: '0911223344', role: 'COACH', status: 'ACTIVE' }

    vi.mocked(apiClient.post).mockResolvedValueOnce({
      success: true,
      message: 'Thành công.',
      data: { user: mockCreated },
    } as any)

    const result = await usersService.createUser({
      fullName: 'New Coach',
      email: 'coach@gym.local',
      phone: '0911223344',
      role: 'COACH',
    })

    expect(apiClient.post).toHaveBeenCalledWith('/users', {
      fullName: 'New Coach',
      email: 'coach@gym.local',
      phone: '0911223344',
      role: 'COACH',
    })
    expect(result).toEqual(mockCreated)
  })

  it('calls PATCH /users/:id and returns updated user', async () => {
    const mockUpdated = { id: 'u-1', fullName: 'Updated Name', phone: '0999999999', role: 'COACH', status: 'ACTIVE' }

    vi.mocked(apiClient.patch).mockResolvedValueOnce({
      success: true,
      message: 'Thành công.',
      data: mockUpdated,
    } as any)

    const result = await usersService.updateUser('u-1', { fullName: 'Updated Name', phone: '0999999999' })
    expect(apiClient.patch).toHaveBeenCalledWith('/users/u-1', {
      fullName: 'Updated Name',
      phone: '0999999999',
    })
    expect(result).toEqual(mockUpdated)
  })

  it('calls PATCH /users/:id/status and updates status', async () => {
    const mockUpdated = { id: 'u-1', fullName: 'User', role: 'COACH', status: 'SUSPENDED' }

    vi.mocked(apiClient.patch).mockResolvedValueOnce({
      success: true,
      message: 'Thành công.',
      data: mockUpdated,
    } as any)

    const result = await usersService.updateUserStatus('u-1', 'SUSPENDED')
    expect(apiClient.patch).toHaveBeenCalledWith('/users/u-1/status', {
      status: 'SUSPENDED',
    })
    expect(result.status).toBe('SUSPENDED')
  })

  it('calls POST /users/:id/reset-password and returns temporary password', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      success: true,
      message: 'Thành công.',
      data: { temporaryPassword: 'TempPassword123' },
    } as any)

    const result = await usersService.resetUserPassword('u-1')
    expect(apiClient.post).toHaveBeenCalledWith('/users/u-1/reset-password', {})
    expect(result.temporaryPassword).toBe('TempPassword123')
  })

  it('calls GET /users/export with responseType blob', async () => {
    const mockBlob = new Blob(['csv content'], { type: 'text/csv' })

    vi.mocked(apiClient.get).mockResolvedValueOnce(mockBlob as any)

    const result = await usersService.exportUsers({ role: 'COACH' })
    expect(apiClient.get).toHaveBeenCalledWith('/users/export', {
      params: { role: 'COACH' },
      responseType: 'blob',
    })
    expect(result).toEqual(mockBlob)
  })
})
