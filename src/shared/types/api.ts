export type ApiSuccess<T> = {
  success: true
  message: string
  data: T
  meta?: { page: number; limit: number; total: number; totalPages: number }
}

export type ApiError = {
  success: false
  code: string
  message: string
  errors?: Array<{ field: string; message: string }>
}
