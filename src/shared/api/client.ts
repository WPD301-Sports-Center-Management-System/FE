import axios, { type InternalAxiosRequestConfig, type AxiosError } from 'axios'
import { appConfig } from '@/app/config'
import { authStorage } from '@/shared/utils/storage'
import { AppApiError } from '@/shared/api/api-error'
import { handleMockRequest } from '@/shared/api/mock-adapter'
import type { ApiError as ApiErrorPayload } from '@/shared/types/api'

export const apiClient = axios.create({
  baseURL: appConfig.apiBaseUrl,
  timeout: 15_000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Optional mock adapter interceptor for non-auth local prototyping
if (appConfig.useMock) {
  apiClient.interceptors.request.use(async (config) => {
    // Only mock non-auth endpoints if mock is explicitly enabled
    const url = config.url || ''
    const isAuthRoute = url.includes('/auth/') || url.startsWith('auth/')
    if (!isAuthRoute) {
      config.adapter = async (cfg) => handleMockRequest(cfg)
    }
    return config
  })
}

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = authStorage.getAccessToken()
  if (token && config.headers && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Refresh Token Queue state for concurrency / single-flight refresh
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token)
    } else {
      prom.reject(error)
    }
  })
  failedQueue = []
}

// Response Interceptor: Unwrap data & Auto-refresh Token on 401
apiClient.interceptors.response.use(
  (response) => {
    return response.data
  },
  async (error: AxiosError<ApiErrorPayload>) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined

    if (!originalRequest) {
      return Promise.reject(normalizeError(error))
    }

    const requestUrl = originalRequest.url || ''
    const isAuthEndpoint =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/refresh') ||
      requestUrl.includes('/auth/logout') ||
      requestUrl.includes('/auth/register')

    // Handle 401 Unauthenticated for protected resources
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`
              }
              resolve(apiClient(originalRequest))
            },
            reject: (err) => reject(err),
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = authStorage.getRefreshToken()
      if (!refreshToken) {
        authStorage.clearSession()
        window.dispatchEvent(new CustomEvent('auth:unauthorized'))
        isRefreshing = false
        return Promise.reject(normalizeError(error))
      }

      try {
        const refreshResponse = await axios.post<{
          success: boolean
          data: { accessToken: string; refreshToken: string; tokenType: string; expiresIn: string | number }
        }>(`${appConfig.apiBaseUrl}/auth/refresh`, {
          refreshToken,
        })

        const refreshedData = refreshResponse.data?.data
        if (refreshedData?.accessToken) {
          authStorage.setTokens({
            accessToken: refreshedData.accessToken,
            refreshToken: refreshedData.refreshToken || refreshToken,
          })

          processQueue(null, refreshedData.accessToken)

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${refreshedData.accessToken}`
          }
          return apiClient(originalRequest)
        } else {
          throw new Error('Malformed refresh token response')
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        authStorage.clearSession()
        window.dispatchEvent(new CustomEvent('auth:unauthorized'))
        return Promise.reject(normalizeError(refreshErr))
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(normalizeError(error))
  }
)

function normalizeError(error: unknown): AppApiError {
  if (error instanceof AppApiError) {
    return error
  }

  const axiosErr = error as AxiosError<ApiErrorPayload>
  const status = axiosErr.response?.status || (axiosErr.code === 'ECONNABORTED' ? 408 : 500)
  const responseData = axiosErr.response?.data

  const payload: ApiErrorPayload = {
    success: false,
    code: responseData?.code || (axiosErr.code === 'ECONNABORTED' ? 'TIMEOUT' : 'NETWORK_ERROR'),
    message: responseData?.message || axiosErr.message || 'Không thể kết nối đến máy chủ',
    errors: responseData?.errors,
  }

  return new AppApiError(status, payload)
}
