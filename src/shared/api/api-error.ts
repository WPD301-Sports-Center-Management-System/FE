import type { ApiError as ApiErrorPayload } from '@/shared/types/api'

export class AppApiError extends Error {
  public readonly code: string
  public readonly status: number
  public readonly errors?: Array<{ field: string; message: string; reason?: string }>

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message || 'Đã có lỗi xảy ra từ máy chủ')
    this.name = 'AppApiError'
    this.status = status
    this.code = payload.code || 'UNKNOWN_ERROR'
    this.errors = payload.errors?.map((err) => ({
      field: err.field,
      message: err.message || err.reason || 'Dữ liệu không hợp lệ',
      reason: err.reason,
    }))
  }

  getFieldError(fieldName: string): string | undefined {
    return this.errors?.find((e) => e.field === fieldName)?.message
  }
}

export function isAppApiError(error: unknown): error is AppApiError {
  return error instanceof AppApiError
}
