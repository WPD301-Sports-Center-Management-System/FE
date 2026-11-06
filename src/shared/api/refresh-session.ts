import axios from 'axios'
import { appConfig } from '@/app/config'
import { authStorage } from '@/shared/utils/storage'
import type { RefreshTokenResponseData } from '@/features/auth/types/auth.types'

let flight: { token: string; promise: Promise<RefreshTokenResponseData> } | undefined

// Share rotation between bootstrap, explicit refresh and 401 recovery. The BE revokes sessions
// when an already-rotated token is reused, so concurrent callers must send it only once.
export function refreshSessionTokens(token: string): Promise<RefreshTokenResponseData> {
  if (flight?.token === token) return flight.promise
  const promise = axios.post<{ data: RefreshTokenResponseData }>(`${appConfig.apiBaseUrl}/auth/refresh`, { refreshToken: token }, { timeout: 15_000 })
    .then(response => {
      const data = response.data?.data
      if (!data?.accessToken || !data.refreshToken) throw new Error('Phản hồi làm mới phiên không hợp lệ.')
      if (authStorage.getRefreshToken() !== token) throw new Error('Phiên đăng nhập đã thay đổi. Vui lòng thử lại.')
      authStorage.setTokens(data)
      return data
    }).finally(() => { if (flight?.promise === promise) flight = undefined })
  flight = { token, promise }
  return promise
}
