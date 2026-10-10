import { apiClient } from '@/shared/api/client'
import type { ApiSuccess, Purchase, CoachReview } from '@/shared/types/api'
import type {
  CreatePtPurchasePayload,
  PtPurchaseQueryParams,
  PurchaseDetail,
  MakeupEntitlement,
  CreateReviewPayload,
  CancelPurchasePayload,
} from '../types/pt-purchases.types'

export const ptPurchasesService = {
  /**
   * [1] GET /pt-package-purchases - List PT package purchases (Staff / Manager)
   */
  async getPurchases(params?: PtPurchaseQueryParams): Promise<ApiSuccess<Purchase[]>> {
    const res = await apiClient.get<ApiSuccess<Purchase[]>>('/pt-package-purchases', { params })
    return res as unknown as ApiSuccess<Purchase[]>
  },

  /**
   * [2] POST /pt-package-purchases - Create a new PT package purchase (Receptionist / Member)
   */
  async createPurchase(payload: CreatePtPurchasePayload): Promise<Purchase> {
    const res = await apiClient.post<ApiSuccess<Purchase>>('/pt-package-purchases', payload)
    const data = res as unknown as ApiSuccess<Purchase>
    return data.data ?? (data as unknown as Purchase)
  },

  /**
   * [3] GET /pt-package-purchases/{id} - Get single purchase detail with payments and credits
   */
  async getPurchaseById(id: string): Promise<PurchaseDetail> {
    const res = await apiClient.get<ApiSuccess<PurchaseDetail>>(`/pt-package-purchases/${id}`)
    const data = res as unknown as ApiSuccess<PurchaseDetail>
    return data.data ?? (data as unknown as PurchaseDetail)
  },

  /**
   * [4] GET /pt-package-purchases/{id}/makeup-entitlements - List makeup entitlements for package
   */
  async getMakeupEntitlements(
    id: string,
    params?: { status?: string; page?: number; limit?: number }
  ): Promise<ApiSuccess<MakeupEntitlement[]>> {
    const res = await apiClient.get<ApiSuccess<MakeupEntitlement[]>>(
      `/pt-package-purchases/${id}/makeup-entitlements`,
      { params }
    )
    return res as unknown as ApiSuccess<MakeupEntitlement[]>
  },

  /**
   * [5] PATCH /pt-package-purchases/{id}/cancel - Manager cancels unpaid PENDING_PAYMENT purchase
   */
  async cancelPurchase(id: string, payload: CancelPurchasePayload): Promise<Purchase> {
    const res = await apiClient.patch<ApiSuccess<Purchase>>(
      `/pt-package-purchases/${id}/cancel`,
      payload
    )
    const data = res as unknown as ApiSuccess<Purchase>
    return data.data ?? (data as unknown as Purchase)
  },

  /**
   * [6] GET /pt-package-purchases/{id}/review - Get existing review for completed purchase
   */
  async getPurchaseReview(id: string): Promise<CoachReview | null> {
    const res = await apiClient.get<ApiSuccess<CoachReview | null>>(
      `/pt-package-purchases/${id}/review`
    )
    const data = res as unknown as ApiSuccess<CoachReview | null>
    return data.data ?? (data as unknown as CoachReview | null)
  },

  /**
   * [7] POST /pt-package-purchases/{id}/review - Member creates review for completed package
   */
  async createPurchaseReview(id: string, payload: CreateReviewPayload): Promise<CoachReview> {
    const res = await apiClient.post<ApiSuccess<CoachReview>>(
      `/pt-package-purchases/${id}/review`,
      payload
    )
    const data = res as unknown as ApiSuccess<CoachReview>
    return data.data ?? (data as unknown as CoachReview)
  },

  /**
   * Settle payment at counter (POST /payments/counter) for PT Purchase
   */
  async payCounter(payload: {
    ptPurchaseId: string
    method: 'CASH' | 'BANK_TRANSFER'
    receivedAmount: number
    externalRef?: string
  }): Promise<any> {
    const res = await apiClient.post('/payments/counter', payload)
    return res?.data ?? res
  },
}
