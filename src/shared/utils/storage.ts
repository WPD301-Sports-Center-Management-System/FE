import type { AuthSession } from '@/shared/types/api'

const TOKEN_KEY = 'sc_access_token'
const REFRESH_KEY = 'sc_refresh_token'
const USER_KEY = 'sc_auth_user'

export const authStorage = {
  getAccessToken: (): string | null => localStorage.getItem(TOKEN_KEY),
  getRefreshToken: (): string | null => localStorage.getItem(REFRESH_KEY),
  getUser: () => {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as AuthSession['user']
    } catch {
      return null
    }
  },
  setSession: (session: AuthSession) => {
    localStorage.setItem(TOKEN_KEY, session.accessToken)
    localStorage.setItem(REFRESH_KEY, session.refreshToken)
    localStorage.setItem(USER_KEY, JSON.stringify(session.user))
  },
  clearSession: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
  },
}
