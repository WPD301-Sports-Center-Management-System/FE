import type { Payment, PaymentMethod, PaymentStatus, Invoice } from '@/shared/types/api'

export interface PaymentQueryParams {
  memberId?: string
  status?: PaymentStatus
  method?: PaymentMethod
  page?: number
  limit?: number
}

export interface CounterPaymentPayload {
  subscriptionId?: string
  ptPurchaseId?: string
  method: 'CASH' | 'BANK_TRANSFER'
  receivedAmount: number
  externalRef?: string
}

export interface CounterPaymentResult extends Payment {
  changeAmount: number
}

export interface VNPayPaymentPayload {
  subscriptionId?: string
  ptPurchaseId?: string
  returnTarget?: 'web' | 'mobile'
}

export interface VNPayPaymentResponse {
  paymentId: string
  paymentUrl: string
  expiresAt: string
}

export interface PaymentStatusResponse {
  id: string
  status: PaymentStatus
  application?: 'APPLIED' | 'PENDING_REVIEW' | 'UNAPPLIED' | null
  paidAt?: string
}

export type { Payment, Invoice }
