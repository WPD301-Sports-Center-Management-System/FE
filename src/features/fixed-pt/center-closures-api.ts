import { hybridGet, hybridSend } from './hybrid-api'

export type ClosureInput = { fromDate: string; toDate: string; reason: string }
export type ClosurePreview = ClosureInput & {
  impactHash: string; sessionCount: number; purchaseCount: number; ticketCount: number; manualCount: number; trialCount: number; heldOrderCount: number
  tickets: { id: string; memberName?: string; planName?: string; startDate: string; endDate: string; newStart: string; newEnd: string }[]
  sessions: { id: string; startsAt: string; memberName: string; coachName: string }[]
  manual?: { id: string; startsAt: string; memberName: string; status: string }[]
}
export type ClosureSummary = { cancelled: number; autoMoved: number; pendingMakeups: number; compensatedTickets: number; heldOrdersReleased: number; manualSessions: number; trialSessions: number }
export type CenterClosure = ClosureInput & { id: string; createdAt: string; summary: ClosureSummary }
export const centerClosuresApi = {
  list: () => hybridGet<CenterClosure[]>('/center-closures'),
  preview: (input: ClosureInput) => hybridSend<ClosurePreview>('post', '/center-closures/preview', input, { timeout: 30_000 }),
  apply: (input: ClosureInput & { idempotencyKey: string; impactHash: string }) => hybridSend<ClosureSummary & { id: string; repeated: boolean }>('post', '/center-closures', input, { timeout: 120_000 }),
}
