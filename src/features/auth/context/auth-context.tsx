import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import type { UserDetail, UserRole } from '@/shared/types/api'
import type {
  LoginCredentials,
  AuthResponseData,
  UpdateProfilePayload,
  CurrentUserResponseData,
} from '@/features/auth/types/auth.types'
import { authStorage } from '@/shared/utils/storage'
import { authService } from '@/features/auth/services/auth.service'
import { queryClient } from '@/shared/api/query-client'

interface AuthContextType {
  user: UserDetail | null
  role: UserRole | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitializing: boolean
  login: (credentials: LoginCredentials) => Promise<AuthResponseData>
  logout: () => Promise<void>
  logoutAll: () => Promise<void>
  refreshSession: () => Promise<void>
  updateUserProfile: (payload: UpdateProfilePayload) => Promise<void>
  hasRole: (roles: UserRole | UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function mapCurrentUserToUserDetail(data: CurrentUserResponseData): UserDetail {
  return {
    id: data.id,
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    avatarUrl: data.avatarUrl || undefined,
    role: data.role,
    status: data.status,
    createdAt: data.createdAt || new Date().toISOString(),
    lastLoginAt: data.lastLoginAt,
    profile: (data.memberProfilesUserId || data.coachProfilesUserId || undefined) as
      | UserDetail['profile']
      | undefined,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDetail | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  // Initialize authentication on app mount
  const initializeAuth = useCallback(async () => {
    const token = authStorage.getAccessToken()
    const refreshToken = authStorage.getRefreshToken()

    if (!token && !refreshToken) {
      setUser(null)
      setIsInitializing(false)
      return
    }

    try {
      if (token) {
        try {
          const userData = await authService.getCurrentUser()
          const mapped = mapCurrentUserToUserDetail(userData)
          setUser(mapped)
          authStorage.setUser(mapped)
          setIsInitializing(false)
          return
        } catch {
          // Token might be expired, proceed to attempt refresh
        }
      }

      if (refreshToken && refreshToken.length >= 20) {
        const refreshRes = await authService.refreshToken(refreshToken)
        authStorage.setTokens({
          accessToken: refreshRes.accessToken,
          refreshToken: refreshRes.refreshToken || refreshToken,
        })
        const userData = await authService.getCurrentUser()
        const mapped = mapCurrentUserToUserDetail(userData)
        setUser(mapped)
        authStorage.setUser(mapped)
      } else {
        authStorage.clearSession()
        setUser(null)
      }
    } catch {
      authStorage.clearSession()
      setUser(null)
    } finally {
      setIsInitializing(false)
    }
  }, [])

  useEffect(() => {
    initializeAuth()

    const handleUnauthorized = () => {
      authStorage.clearSession()
      setUser(null)
      queryClient.clear()
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [initializeAuth])

  const login = async (credentials: LoginCredentials): Promise<AuthResponseData> => {
    setIsLoading(true)
    try {
      const data = await authService.login(credentials)
      const userDetail: UserDetail = {
        ...data.user,
        createdAt: data.user.createdAt || new Date().toISOString(),
      }
      authStorage.setSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: userDetail,
      })
      queryClient.clear()
      setUser(userDetail)
      return data
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    setIsLoading(true)
    const refreshToken = authStorage.getRefreshToken() || undefined
    try {
      await authService.logout(refreshToken)
    } catch {
      // Ignore network errors on logout to allow clean client-side exit
    } finally {
      authStorage.clearSession()
      queryClient.clear()
      setUser(null)
      setIsLoading(false)
    }
  }

  const logoutAll = async (): Promise<void> => {
    setIsLoading(true)
    try {
      await authService.logoutAll()
    } catch {
      // Allow clean client-side exit
    } finally {
      authStorage.clearSession()
      queryClient.clear()
      setUser(null)
      setIsLoading(false)
    }
  }

  const refreshSession = async (): Promise<void> => {
    const refreshToken = authStorage.getRefreshToken()
    if (!refreshToken) {
      throw new Error('Không có refresh token')
    }
    const res = await authService.refreshToken(refreshToken)
    authStorage.setTokens({
      accessToken: res.accessToken,
      refreshToken: res.refreshToken || refreshToken,
    })
    const userData = await authService.getCurrentUser()
    const mapped = mapCurrentUserToUserDetail(userData)
    setUser(mapped)
    authStorage.setUser(mapped)
  }

  const updateUserProfile = async (payload: UpdateProfilePayload): Promise<void> => {
    setIsLoading(true)
    try {
      const res = await authService.updateProfile(payload)
      const mapped = mapCurrentUserToUserDetail(res)
      setUser(mapped)
      authStorage.setUser(mapped)
    } finally {
      setIsLoading(false)
    }
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
        isInitializing,
        login,
        logout,
        logoutAll,
        refreshSession,
        updateUserProfile,
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
