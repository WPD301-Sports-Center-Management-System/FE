import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { UserDetail, UserRole, AuthSession } from '@/shared/types/api'
import { authStorage } from '@/shared/utils/storage'
import { apiClient } from '@/shared/api/client'
import { mockUsers } from '@/mocks/fixtures-base'

type AuthContextType = {
  user: UserDetail | null
  role: UserRole | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: { email?: string; phone?: string; password: string }) => Promise<void>
  logout: () => void
  switchRoleDemo: (role: UserRole) => void
  hasRole: (roles: UserRole | UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Restore session from localStorage or seed initial default demo user
    const savedUser = authStorage.getUser()
    if (savedUser) {
      setUser(savedUser)
    } else {
      // Default initial user for mock convenience
      const defaultUser = mockUsers[0]
      setUser(defaultUser)
      authStorage.setSession({
        accessToken: 'mock-initial-token',
        refreshToken: 'mock-initial-refresh',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: defaultUser,
      })
    }
    setIsLoading(false)
  }, [])

  const login = async (credentials: { email?: string; phone?: string; password: string }) => {
    const res = await apiClient.post<{ data: AuthSession }>('/auth/login', credentials)
    const session = (res as unknown as { data: AuthSession }).data
    authStorage.setSession(session)
    setUser(session.user)
  }

  const logout = () => {
    authStorage.clearSession()
    setUser(null)
  }

  const switchRoleDemo = (targetRole: UserRole) => {
    const matched = mockUsers.find((u) => u.role === targetRole) || mockUsers[0]
    authStorage.setSession({
      accessToken: 'mock-demo-token-' + targetRole,
      refreshToken: 'mock-demo-refresh-' + targetRole,
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: matched,
    })
    setUser(matched)
  }

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false
    const allowed = Array.isArray(roles) ? roles : [roles]
    return allowed.includes(user.role)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchRoleDemo,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
