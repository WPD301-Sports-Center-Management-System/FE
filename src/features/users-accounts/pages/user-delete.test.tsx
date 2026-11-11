import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { AppApiError } from '@/shared/api/api-error'
import { UserManagementPage } from './user-management-page'
import { usersService } from '@/features/users-accounts/services/users.service'
import type { UserDetail } from '@/shared/types/api'

vi.mock('@/features/users-accounts/services/users.service', () => ({
  usersService: { getUsers: vi.fn(), createUser: vi.fn(), updateUser: vi.fn(), updateUserStatus: vi.fn(), resetUserPassword: vi.fn(), exportUsers: vi.fn(), deleteUser: vi.fn() },
}))
let currentUserId: string | undefined
vi.mock('@/features/auth/context/auth-context', () => ({ useCurrentUserId: () => currentUserId }))

const users: UserDetail[] = [
  { id: 'u-1', fullName: 'Nguyễn Văn Coach', email: 'coach@gym.local', phone: '0912345678', role: 'COACH', status: 'ACTIVE', createdAt: '2026-10-09T10:00:00Z' },
  { id: 'u-2', fullName: 'Trần Thị Quản Lý', email: 'boss@gym.local', phone: '0987654321', role: 'MANAGER', status: 'ACTIVE', createdAt: '2026-10-09T11:00:00Z' },
]
beforeEach(() => {
  vi.resetAllMocks()
  currentUserId = 'u-2'
  vi.mocked(usersService.getUsers).mockResolvedValue({ success: true, message: 'ok', data: users, meta: { page: 1, limit: 10, total: 2, totalPages: 1 } })
})

describe('UserManagementPage delete', () => {
  it('offers delete for others but never for the signed-in account', async () => {
    render(<UserManagementPage />)
    await screen.findByText('Nguyễn Văn Coach')
    expect(screen.getByRole('button', { name: 'Xóa tài khoản Nguyễn Văn Coach' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Xóa tài khoản Trần Thị Quản Lý' })).toBeNull()
    expect(screen.getAllByTitle('Tạm khóa tài khoản').length).toBeGreaterThan(0) // lock stays separate
  })

  it('confirms with the account name, deletes once, and removes the row', async () => {
    vi.mocked(usersService.deleteUser).mockResolvedValue(undefined)
    render(<UserManagementPage />)
    await screen.findByText('Nguyễn Văn Coach')
    fireEvent.click(screen.getByRole('button', { name: 'Xóa tài khoản Nguyễn Văn Coach' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('“Nguyễn Văn Coach”')).toBeInTheDocument()
    expect(within(dialog).getByText(/không thể đăng nhập/)).toBeInTheDocument()
    expect(usersService.deleteUser).not.toHaveBeenCalled()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xóa' }))
    await waitFor(() => expect(usersService.deleteUser).toHaveBeenCalledWith('u-1'))
    await waitFor(() => expect(screen.queryByText('coach@gym.local')).toBeNull())
    expect(screen.getByText('Đã xóa tài khoản Nguyễn Văn Coach.')).toBeInTheDocument()
  })

  it('shows the BE refusal in the dialog and keeps the row', async () => {
    vi.mocked(usersService.deleteUser).mockRejectedValue(new AppApiError(409, { code: 'ACCOUNT_IN_USE', message: 'Coach còn 2 gói PT chưa kết thúc. Hãy khóa tài khoản thay vì xóa.' } as never))
    render(<UserManagementPage />)
    await screen.findByText('Nguyễn Văn Coach')
    fireEvent.click(screen.getByRole('button', { name: 'Xóa tài khoản Nguyễn Văn Coach' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xóa' }))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Hãy khóa tài khoản thay vì xóa.')
    expect(screen.getByText('coach@gym.local')).toBeInTheDocument()
  })
})
