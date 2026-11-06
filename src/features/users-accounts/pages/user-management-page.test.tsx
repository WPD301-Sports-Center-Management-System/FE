import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { UserManagementPage } from './user-management-page'
import { usersService } from '@/features/users-accounts/services/users.service'
import type { UserDetail } from '@/shared/types/api'

vi.mock('@/features/users-accounts/services/users.service', () => ({
  usersService: {
    getUsers: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    updateUserStatus: vi.fn(),
    resetUserPassword: vi.fn(),
    exportUsers: vi.fn(),
  },
}))

const mockUsers: UserDetail[] = [
  {
    id: 'u-1',
    fullName: 'Nguyễn Văn Coach',
    email: 'coach@gym.local',
    phone: '0912345678',
    role: 'COACH',
    status: 'ACTIVE',
    createdAt: '2026-10-09T10:00:00Z',
  },
  {
    id: 'u-2',
    fullName: 'Trần Thị Receptionist',
    email: 'rec@gym.local',
    phone: '0987654321',
    role: 'RECEPTIONIST',
    status: 'INACTIVE',
    createdAt: '2026-10-09T11:00:00Z',
  },
]

describe('UserManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usersService.getUsers).mockResolvedValue({
      success: true,
      message: 'Thành công.',
      data: mockUsers,
      meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
    })
  })

  it('renders user management page and loads user list', async () => {
    render(<UserManagementPage />)

    expect(screen.getByText(/Quản lý Tài Khoản & Nhân Sự/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn Coach')).toBeInTheDocument()
      expect(screen.getByText('coach@gym.local')).toBeInTheDocument()
      expect(screen.getByText('Trần Thị Receptionist')).toBeInTheDocument()
    })
  })

  it('opens create modal and creates a new user', async () => {
    const newUser: UserDetail = {
      id: 'u-3',
      fullName: 'Phạm Văn Mới',
      email: 'moi@gym.local',
      phone: '0933445566',
      role: 'COACH',
      status: 'ACTIVE',
      createdAt: '2026-10-09T12:00:00Z',
    }

    vi.mocked(usersService.createUser).mockResolvedValueOnce(newUser)

    render(<UserManagementPage />)

    const addBtn = screen.getByRole('button', { name: /Thêm tài khoản/i })
    fireEvent.click(addBtn)

    expect(screen.getByRole('heading', { name: /Tạo tài khoản người dùng/i })).toBeInTheDocument()

    const nameInput = screen.getByPlaceholderText('Nguyễn Văn A')
    const emailInput = screen.getByPlaceholderText('a.nguyen@sports.local')
    const phoneInput = screen.getByPlaceholderText('0912345678')

    fireEvent.change(nameInput, { target: { value: 'Phạm Văn Mới' } })
    fireEvent.change(emailInput, { target: { value: 'moi@gym.local' } })
    fireEvent.change(phoneInput, { target: { value: '0933445566' } })

    const submitBtn = screen.getByRole('button', { name: /^Tạo tài khoản$/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(usersService.createUser).toHaveBeenCalledWith({
        fullName: 'Phạm Văn Mới',
        email: 'moi@gym.local',
        phone: '0933445566',
        role: 'COACH',
        password: undefined,
      })
    })

    expect(await screen.findByText('Đã tạo thành công tài khoản cho Phạm Văn Mới')).toBeInTheDocument()
  })

  it('triggers password reset and displays generated temporary password', async () => {
    vi.mocked(usersService.resetUserPassword).mockResolvedValueOnce({
      temporaryPassword: 'TempGenPassword123',
    })

    render(<UserManagementPage />)

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn Coach')).toBeInTheDocument()
    })

    const resetButtons = screen.getAllByRole('button', { name: /Reset MK/i })
    fireEvent.click(resetButtons[0])

    await waitFor(() => {
      expect(usersService.resetUserPassword).toHaveBeenCalledWith('u-1')
      expect(screen.getByText('TempGenPassword123')).toBeInTheDocument()
    })
  })
})
