export type NotificationType =
  | 'SYSTEM'
  | 'SLOT'
  | 'BOOKING'
  | 'MEMBERSHIP'
  | 'PAYMENT'
  | 'TRAINING'
  | 'MAINTENANCE'
  | 'SUPPORT'

export interface AppNotification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  relatedType?: string | null
  relatedId?: string | null
  readAt?: string | null
  createdAt: string
}

export interface NotificationQueryParams {
  read?: 'true' | 'false'
  type?: NotificationType
  page?: number
  limit?: number
}
