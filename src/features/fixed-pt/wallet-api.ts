import { hybridGet, hybridSend } from './hybrid-api'
import { apiClient } from '@/shared/api/client'

export interface Withdrawal {
  id: string; code: string; coachId: string; amount: number
  status: 'REQUESTED' | 'PAID' | 'REJECTED' | 'CANCELLED'
  bankName?: string | null; accountNumber?: string | null; accountName?: string | null; note?: string | null
  requestKey?: string | null; transferRef?: string | null; sourceBank?: string | null
  closedReason?: string | null; createdAt: string; paidAt?: string | null; paidBy?: string | null
  coach?: { user: { fullName: string } }
  coverable?: number | null; transferAllowed?: boolean; shortfall?: number
  allowedActions?: ('TRANSFER' | 'MARK_PAID' | 'REJECT')[]
  actionReason?: 'ENTITLEMENT_REDUCED' | null
  warnings?: string[]; coachAvailable?: number; coachRecovery?: number
}
export interface CoachWallet {
  ledger: number; unverified: number; reserved: number; paid: number; available: number; recovery: number; balance: number
  packages: { purchaseId: string; purchaseCode: string; packageNameSnapshot: string; purchaseStatus: string; earned: number; awaitingDecision: number }[]
  withdrawals: Withdrawal[]
}
export type WithdrawalRequest = { amount: number; bankName: string; accountNumber: string; accountName: string; requestKey: string }
export type PaidWithdrawal = { transferRef: string; sourceBank?: string }
export type RejectWithdrawal = { reason: string }
export const withdrawalLabel: Record<Withdrawal['status'], string> = {
  REQUESTED: 'Chờ chuyển khoản', PAID: 'Đã chuyển', REJECTED: 'Đã từ chối', CANCELLED: 'Đã hủy',
}
export const isOpenWithdrawal = (w: Withdrawal) => w.status === 'REQUESTED'
export const withdrawalRequestKey = () => globalThis.crypto.randomUUID()
export const walletApi = {
  mine: () => hybridGet<CoachWallet>('/coaches/me/wallet'),
  request: (body: WithdrawalRequest) => hybridSend<Withdrawal>('post', '/coaches/me/withdrawals', body),
  list: async (coachId?: string) => {
    const result: Withdrawal[] = []
    for (let page = 1; ; page++) {
      const response = await apiClient.get('/coach-withdrawals', { params: { coachId, page, limit: 100 } }) as unknown as { data: Withdrawal[]; meta?: { total: number } }
      result.push(...response.data)
      if (response.data.length < 100 || result.length >= (response.meta?.total ?? Infinity)) return result
    }
  },
  paid: (id: string, body: PaidWithdrawal) => hybridSend<Withdrawal>('post', `/coach-withdrawals/${id}/mark-paid`, body),
  reject: (id: string, body: RejectWithdrawal) => hybridSend<Withdrawal>('post', `/coach-withdrawals/${id}/reject`, body),
}
