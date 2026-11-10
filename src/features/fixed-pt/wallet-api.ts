import { hybridGet, hybridSend } from './hybrid-api'
import { apiClient } from '@/shared/api/client'
export interface Withdrawal {
  id: string; code: string; coachId: string; amount: number; status: 'REQUESTED' | 'PAID' | 'REJECTED' | 'CANCELLED'
  bankName?: string | null; accountNumber?: string | null; accountName?: string | null; note?: string | null
  transferRef?: string | null; closedReason?: string | null; createdAt: string; paidAt?: string | null
  coach?: { user: { fullName: string } }; coachAvailable?: number
}
export interface CoachWallet {
  earned: number; accruing: number; requested: number; withdrawn: number; available: number; balance: number
  packages: { purchaseId: string; purchaseCode: string; packageNameSnapshot: string; earned: number; finished: boolean; awaitingDecision: number }[]
  withdrawals: Withdrawal[]
}
export type WithdrawalRequest = { amount: number; bankName: string; accountNumber: string; accountName: string }
export const withdrawalLabel: Record<Withdrawal['status'], string> = { REQUESTED: 'Chờ chuyển khoản', PAID: 'Đã chuyển', REJECTED: 'Đã từ chối', CANCELLED: 'Đã hủy' }
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
  paid: (id: string, transferRef: string) => hybridSend<Withdrawal>('post', `/coach-withdrawals/${id}/mark-paid`, { transferRef }),
  reject: (id: string, reason: string) => hybridSend<Withdrawal>('post', `/coach-withdrawals/${id}/reject`, { reason }),
}
