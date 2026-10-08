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
  headers: { 'Content-Type': 'application/json' },
})

// Mock request adapter interceptor
if (appConfig.useMock) {
  apiClient.interceptors.request.use(async (config) => {
    // Override the adapter to route locally via mock handler
    config.adapter = async (cfg) => handleMockRequest(cfg)
    return config
  })
}

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = authStorage.getAccessToken()
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Refresh Token Queue state
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

// Response Interceptor: Unwrap data & Refresh Token rotation
apiClient.interceptors.response.use(
  (response) => {
    return response.data
  },
  async (error: AxiosError<ApiErrorPayload>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
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
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const refreshResponse = await axios.post(`${appConfig.apiBaseUrl}/auth/refresh-token`, {
          refreshToken,
        })
        const newSession = refreshResponse.data?.data
        authStorage.setSession(newSession)
        processQueue(null, newSession.accessToken)

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newSession.accessToken}`
        }
        return apiClient(originalRequest)
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        authStorage.clearSession()
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    const status = error.response?.status || 500
    const errorPayload: ApiErrorPayload = error.response?.data || {
      success: false,
      code: 'NETWORK_ERROR',
      message: error.message || 'Không thể kết nối đến máy chủ',
    }

    return Promise.reject(new AppApiError(status, errorPayload))
  }
)
