import { apiClient } from '@/shared/api/client'
import type { ApiSuccess, Subscription } from '@/shared/types/api'
import type {
  CreateSubscriptionPayload,
  RenewSubscriptionPayload,
  CancelSubscriptionPayload,
  SubscriptionQueryParams,
  SubscriptionDetail,
} from '../types/subscriptions.types'

export const subscriptionsService = {
  /**
   * [1] GET /subscriptions - List all subscriptions with filters & pagination
   */
  async getSubscriptions(params?: SubscriptionQueryParams): Promise<ApiSuccess<Subscription[]>> {
    const res = await apiClient.get<ApiSuccess<Subscription[]>>('/subscriptions', { params })
    return res as unknown as ApiSuccess<Subscription[]>
  },

  /**
   * [2] GET /subscriptions/{id} - Get detailed subscription info by ID
   */
  async getSubscriptionById(id: string): Promise<SubscriptionDetail> {
    const res = await apiClient.get<ApiSuccess<SubscriptionDetail>>(`/subscriptions/${id}`)
    const data = res as unknown as ApiSuccess<SubscriptionDetail>
    return data.data
  },

  /**
   * [3] POST /subscriptions - Create/Register a new gym membership subscription
   */
  async createSubscription(payload: CreateSubscriptionPayload): Promise<Subscription> {
    const res = await apiClient.post<ApiSuccess<Subscription>>('/subscriptions', payload)
    const data = res as unknown as ApiSuccess<Subscription>
    return data.data
  },

  /**
   * [4] POST /subscriptions/{id}/renew - Renew an existing subscription
   */
  async renewSubscription(id: string, payload?: RenewSubscriptionPayload): Promise<Subscription> {
    const res = await apiClient.post<ApiSuccess<Subscription>>(`/subscriptions/${id}/renew`, payload || {})
    const data = res as unknown as ApiSuccess<Subscription>
    return data.data
  },

  /**
   * [5] PATCH /subscriptions/{id}/cancel - Cancel a subscription with reason
   */
  async cancelSubscription(id: string, payload: CancelSubscriptionPayload): Promise<Subscription> {
    const res = await apiClient.patch<ApiSuccess<Subscription>>(`/subscriptions/${id}/cancel`, payload)
    const data = res as unknown as ApiSuccess<Subscription>
    return data.data
  },
}
