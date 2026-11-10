import { clearPtContinuations } from './pt-continuation'
import type { UserDetail } from '@/shared/types/api'

const TOKEN_KEY = 'sc_access_token'
const REFRESH_KEY = 'sc_refresh_token'
const USER_KEY = 'sc_auth_user'

export const authStorage = {
  getAccessToken: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },

  getRefreshToken: (): string | null => {
    try {
      return localStorage.getItem(REFRESH_KEY)
    } catch {
      return null
    }
  },

  getUser: (): UserDetail | null => {
    try {
      const raw = localStorage.getItem(USER_KEY)
      if (!raw) return null
      return JSON.parse(raw) as UserDetail
    } catch {
      return null
    }
  },

  setSession: (params: { accessToken: string; refreshToken: string; user: UserDetail }) => {
    clearPtContinuations(params.user.id)
    try {
      localStorage.setItem(TOKEN_KEY, params.accessToken)
      localStorage.setItem(REFRESH_KEY, params.refreshToken)
      localStorage.setItem(USER_KEY, JSON.stringify(params.user))
    } catch {
      // Ignore quota errors in private browsing modes
    }
  },

  setTokens: (tokens: { accessToken: string; refreshToken?: string }) => {
    try {
      localStorage.setItem(TOKEN_KEY, tokens.accessToken)
      if (tokens.refreshToken) {
        localStorage.setItem(REFRESH_KEY, tokens.refreshToken)
      }
    } catch {
      // Ignore quota errors
    }
  },

  setUser: (user: UserDetail) => {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } catch {
      // Ignore quota errors
    }
  },

  clearSession: () => {
    clearPtContinuations()
    try {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(REFRESH_KEY)
      localStorage.removeItem(USER_KEY)
    } catch {
      // Ignore storage errors
    }
  },
}
