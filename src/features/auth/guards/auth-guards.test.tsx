import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute, GuestRoute } from './auth-guards'
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
        switchRoleDemo: vi.fn(),
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
        switchRoleDemo: vi.fn(),
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
        switchRoleDemo: vi.fn(),
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
        switchRoleDemo: vi.fn(),
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
        switchRoleDemo: vi.fn(),
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
  })
})
