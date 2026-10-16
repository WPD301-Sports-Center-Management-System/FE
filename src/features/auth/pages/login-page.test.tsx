import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LoginPage } from './login-page'
import * as authContext from '@/features/auth/context/auth-context'
import { AppApiError } from '@/shared/api/api-error'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: vi.fn(),
}))

describe('LoginPage', () => {
  const mockLogin = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authContext.useAuth).mockReturnValue({
      isAuthenticated: false,
      isInitializing: false,
      user: null,
      role: null,
      isLoading: false,
      login: mockLogin,
      logout: vi.fn(),
      logoutAll: vi.fn(),
      refreshSession: vi.fn(),
      updateUserProfile: vi.fn(),
      hasRole: vi.fn(),
    })
  })

  it('renders login form properly', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: /Đăng nhập tài khoản/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Email hoặc Số điện thoại/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Mật khẩu/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Đăng nhập ngay/i })).toBeInTheDocument()
  })

  it('validates empty inputs before submitting', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    const identifierInput = screen.getByLabelText(/Email hoặc Số điện thoại/i)
    const passwordInput = screen.getByLabelText(/Mật khẩu/i)

    fireEvent.change(identifierInput, { target: { value: '' } })
    fireEvent.change(passwordInput, { target: { value: '' } })

    const submitBtn = screen.getByRole('button', { name: /Đăng nhập ngay/i })
    fireEvent.click(submitBtn)

    expect(await screen.findByText(/Vui lòng nhập email hoặc số điện thoại/i)).toBeInTheDocument()
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('calls login on submit and redirects to role dashboard', async () => {
    mockLogin.mockResolvedValueOnce({
      user: { id: '1', role: 'MANAGER', fullName: 'Manager User', email: 'manager@sports.local', phone: '0912345678', status: 'ACTIVE' },
      accessToken: 'acc-1',
      refreshToken: 'ref-1',
      tokenType: 'Bearer',
      expiresIn: '15m',
    })

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    const identifierInput = screen.getByLabelText(/Email hoặc Số điện thoại/i)
    const passwordInput = screen.getByLabelText(/Mật khẩu/i)
    const submitBtn = screen.getByRole('button', { name: /Đăng nhập ngay/i })

    fireEvent.change(identifierInput, { target: { value: 'manager@sports.local' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        identifier: 'manager@sports.local',
        password: 'password123',
      })
      expect(mockNavigate).toHaveBeenCalledWith('/manager', { replace: true })
    })
  })

  it('displays user-friendly error message on invalid credentials', async () => {
    mockLogin.mockRejectedValueOnce(
      new AppApiError(401, {
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: 'Thông tin đăng nhập không đúng.',
      })
    )

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/Email hoặc Số điện thoại/i), {
      target: { value: 'manager@sports.local' },
    })
    fireEvent.change(screen.getByLabelText(/Mật khẩu/i), {
      target: { value: 'incorrect-password' },
    })
    const submitBtn = screen.getByRole('button', { name: /Đăng nhập ngay/i })
    fireEvent.change(screen.getByLabelText(/Email hoặc Số điện thoại/i), {
      target: { value: 'wrong@gym.local' },
    })
    fireEvent.change(screen.getByLabelText(/Mật khẩu/i), {
      target: { value: 'wrongpass' },
    })
    fireEvent.click(submitBtn)

    expect(await screen.findByText(/Tài khoản hoặc mật khẩu không chính xác/i)).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
