import { apiClient } from '@/shared/api/client'
import type { ApiSuccess, Payment, Invoice } from '@/shared/types/api'
import type {
  PaymentQueryParams,
  CounterPaymentPayload,
  CounterPaymentResult,
  VNPayPaymentPayload,
  VNPayPaymentResponse,
  PaymentStatusResponse,
} from '../types/payments.types'

export const paymentsService = {
  /**
   * [1] GET /payments - List payments with filters & pagination (Staff / Manager)
   */
  async getPayments(params?: PaymentQueryParams): Promise<ApiSuccess<Payment[]>> {
    const res = await apiClient.get<ApiSuccess<Payment[]>>('/payments', { params })
    return res as unknown as ApiSuccess<Payment[]>
  },

  /**
   * [2] POST /payments/counter - Receptionist settles cash or bank transfer payment at counter
   */
  async payCounter(payload: CounterPaymentPayload): Promise<CounterPaymentResult> {
    const res = await apiClient.post<ApiSuccess<CounterPaymentResult>>('/payments/counter', payload)
    const data = res as unknown as ApiSuccess<CounterPaymentResult>
    return data.data ?? (data as unknown as CounterPaymentResult)
  },

  /**
   * [3] POST /payments/vnpay - Create VNPay payment URL for member/receptionist
   */
  async createVNPay(payload: VNPayPaymentPayload): Promise<VNPayPaymentResponse> {
    const res = await apiClient.post<ApiSuccess<VNPayPaymentResponse>>('/payments/vnpay', payload)
    const data = res as unknown as ApiSuccess<VNPayPaymentResponse>
    return data.data ?? (data as unknown as VNPayPaymentResponse)
  },

  /**
   * [4] GET /payments/{id} - Get payment transaction detail
   */
  async getPaymentById(id: string): Promise<Payment> {
    const res = await apiClient.get<ApiSuccess<Payment>>(`/payments/${id}`)
    const data = res as unknown as ApiSuccess<Payment>
    return data.data ?? (data as unknown as Payment)
  },

  /**
   * [5] GET /payments/{id}/status - Check lightweight payment status (polling/callback)
   */
  async getPaymentStatus(id: string): Promise<PaymentStatusResponse> {
    const res = await apiClient.get<ApiSuccess<PaymentStatusResponse>>(`/payments/${id}/status`)
    const data = res as unknown as ApiSuccess<PaymentStatusResponse>
    return data.data ?? (data as unknown as PaymentStatusResponse)
  },

  /**
   * Helper: GET /invoices/{id} - Get invoice details
   */
  async getInvoiceById(id: string): Promise<Invoice> {
    const res = await apiClient.get<ApiSuccess<Invoice>>(`/invoices/${id}`)
    const data = res as unknown as ApiSuccess<Invoice>
    return data.data ?? (data as unknown as Invoice)
  },

  /**
   * Helper: GET /me/payments - Logged-in member's payment transactions
   */
  async getMyPayments(params?: { page?: number; limit?: number }): Promise<ApiSuccess<Payment[]>> {
    const res = await apiClient.get<ApiSuccess<Payment[]>>('/me/payments', { params })
    return res as unknown as ApiSuccess<Payment[]>
  },
}
