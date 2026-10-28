import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute, GuestRoute, isPathAllowedForRole } from './auth-guards'
import * as authContext from '@/features/auth/context/auth-context'

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: vi.fn(),
}))

describe('Auth Guards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('ProtectedRoute', () => {
    it('shows loader while auth is initializing', () => {
      vi.mocked(authContext.useAuth).mockReturnValue({
        isAuthenticated: false,
        isInitializing: true,
        user: null,
        role: null,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        logoutAll: vi.fn(),
        refreshSession: vi.fn(),
        updateUserProfile: vi.fn(),
        hasRole: vi.fn(),
      })

      render(
        <MemoryRouter initialEntries={['/manager']}>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(screen.getByText(/Đang khởi tạo/i)).toBeInTheDocument()
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('redirects to /login when unauthenticated', () => {
      vi.mocked(authContext.useAuth).mockReturnValue({
        isAuthenticated: false,
        isInitializing: false,
        user: null,
        role: null,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        logoutAll: vi.fn(),
        refreshSession: vi.fn(),
        updateUserProfile: vi.fn(),
        hasRole: vi.fn(),
      })

      render(
        <MemoryRouter initialEntries={['/manager']}>
          <Routes>
            <Route
              path="/manager"
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      )

      expect(screen.getByText('Login Page')).toBeInTheDocument()
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('renders protected content when authenticated with correct role', () => {
      vi.mocked(authContext.useAuth).mockReturnValue({
        isAuthenticated: true,
        isInitializing: false,
        user: {
          id: '1',
          fullName: 'Manager',
          email: 'm@s.com',
          phone: '0912345678',
          role: 'MANAGER',
          status: 'ACTIVE',
          createdAt: '',
        },
        role: 'MANAGER',
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        logoutAll: vi.fn(),
        refreshSession: vi.fn(),
        updateUserProfile: vi.fn(),
        hasRole: vi.fn().mockReturnValue(true),
      })

      render(
        <MemoryRouter initialEntries={['/manager']}>
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <div>Manager Dashboard Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(screen.getByText('Manager Dashboard Content')).toBeInTheDocument()
    })

    it('redirects to /403 when user lacks required role', () => {
      vi.mocked(authContext.useAuth).mockReturnValue({
        isAuthenticated: true,
        isInitializing: false,
        user: {
          id: '1',
          fullName: 'Coach',
          email: 'c@s.com',
          phone: '0912345678',
          role: 'COACH',
          status: 'ACTIVE',
          createdAt: '',
        },
        role: 'COACH',
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        logoutAll: vi.fn(),
        refreshSession: vi.fn(),
        updateUserProfile: vi.fn(),
        hasRole: vi.fn().mockReturnValue(false),
      })

      render(
        <MemoryRouter initialEntries={['/manager']}>
          <Routes>
            <Route
              path="/manager"
              element={
                <ProtectedRoute allowedRoles={['MANAGER']}>
                  <div>Manager Only Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/403" element={<div>Access Denied 403</div>} />
          </Routes>
        </MemoryRouter>
      )

      expect(screen.getByText('Access Denied 403')).toBeInTheDocument()
      expect(screen.queryByText('Manager Only Content')).not.toBeInTheDocument()
    })
  })

  describe('GuestRoute', () => {
    it('redirects authenticated manager to /manager', () => {
      vi.mocked(authContext.useAuth).mockReturnValue({
        isAuthenticated: true,
        isInitializing: false,
        user: {
          id: '1',
          fullName: 'Manager',
          email: 'm@s.com',
          phone: '0912345678',
          role: 'MANAGER',
          status: 'ACTIVE',
          createdAt: '',
        },
        role: 'MANAGER',
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        logoutAll: vi.fn(),
        refreshSession: vi.fn(),
        updateUserProfile: vi.fn(),
        hasRole: vi.fn(),
      })

      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <div>Login Form</div>
                </GuestRoute>
              }
            />
            <Route path="/manager" element={<div>Manager Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      )

      expect(screen.getByText('Manager Dashboard')).toBeInTheDocument()
      expect(screen.queryByText('Login Form')).not.toBeInTheDocument()
    })

    it('redirects authenticated member to /member', () => {
      vi.mocked(authContext.useAuth).mockReturnValue({
        isAuthenticated: true,
        isInitializing: false,
        user: {
          id: '2',
          fullName: 'Member Test',
          email: 'member@gym.com',
          phone: '0987654321',
          role: 'MEMBER',
          status: 'ACTIVE',
          createdAt: '',
        },
        role: 'MEMBER',
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        logoutAll: vi.fn(),
        refreshSession: vi.fn(),
        updateUserProfile: vi.fn(),
        hasRole: vi.fn(),
      })

      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <div>Login Form</div>
                </GuestRoute>
              }
            />
            <Route path="/member" element={<div>Member Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      )

      expect(screen.getByText('Member Dashboard')).toBeInTheDocument()
      expect(screen.queryByText('Login Form')).not.toBeInTheDocument()
    })
  })

  describe('isPathAllowedForRole', () => {
    // Regression: a Manager who logged in after a session ended on /coach/* was sent back into the Coach workspace.
    it('never sends a Manager back into the Coach workspace', () => {
      expect(isPathAllowedForRole('/coach', 'MANAGER')).toBe(false)
      expect(isPathAllowedForRole('/coach/schedule', 'MANAGER')).toBe(false)
    })
    it('lets a Manager return to the manager console and the front desk', () => {
      expect(isPathAllowedForRole('/manager/pt-board', 'MANAGER')).toBe(true)
      expect(isPathAllowedForRole('/receptionist/payments', 'MANAGER')).toBe(true)
      expect(isPathAllowedForRole('/coaches/abc', 'MANAGER')).toBe(true)
    })
    it('keeps every other role inside its own area', () => {
      expect(isPathAllowedForRole('/manager', 'COACH')).toBe(false)
      expect(isPathAllowedForRole('/coach/students', 'COACH')).toBe(true)
      expect(isPathAllowedForRole('/coach', 'RECEPTIONIST')).toBe(false)
    })
  })

  it('GuestRoute sends a signed-in Manager to /manager even when the previous page was /coach', () => {
    vi.mocked(authContext.useAuth).mockReturnValue({ isAuthenticated: true, isInitializing: false, role: 'MANAGER' } as unknown as ReturnType<typeof authContext.useAuth>)
    render(
      <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: { pathname: '/coach/schedule' } } }]}>
        <Routes>
          <Route element={<GuestRoute />}><Route path="/login" element={<div>Login</div>} /></Route>
          <Route path="/manager" element={<div>Manager home</div>} />
          <Route path="/coach/schedule" element={<div>Coach schedule</div>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('Manager home')).toBeInTheDocument()
  })
})
