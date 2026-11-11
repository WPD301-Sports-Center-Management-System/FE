// A bounded, per-tab draft for the external gym-payment round trip. Never stores consent, prices or auth.
export interface PtDraft {
  memberId: string; coachId: string; optionId: string; startDate: string
  pattern: { weekday: number; startTime: string }[]; purchaseId?: string
}
export interface PtContinuation {
  version: 1; ownerId: string; role: 'MEMBER' | 'RECEPTIONIST'; paymentId: string; subscriptionId: string
  expiresAt: number; draft: PtDraft
}
const PREFIX = 'sc_pt_continuation:'
const MAX_AGE = 2 * 60 * 60 * 1000
const id = (v: unknown): v is string => typeof v === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(v)
export function validPtDraft(value: unknown): value is PtDraft {
  if (!value || typeof value !== 'object') return false
  const d = value as PtDraft
  return id(d.memberId) && id(d.coachId) && id(d.optionId) && (d.purchaseId == null || id(d.purchaseId)) &&
    typeof d.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.startDate) &&
    Array.isArray(d.pattern) && d.pattern.length > 0 && d.pattern.length <= 7 && d.pattern.every(p =>
      p && Number.isInteger(p.weekday) && p.weekday >= 1 && p.weekday <= 7 && typeof p.startTime === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(p.startTime))
}
export function clearPtContinuations(keepOwnerId?: string) {
  try {
    for (const key of Object.keys(sessionStorage).filter(k => k.startsWith(PREFIX))) {
      let keep = false
      if (keepOwnerId) { try { keep = JSON.parse(sessionStorage.getItem(key) ?? 'null')?.ownerId === keepOwnerId } catch { /* discard */ } }
      if (!keep) sessionStorage.removeItem(key)
    }
  } catch { /* Storage can be disabled by the browser. */ }
}
export function savePtContinuation(input: { ownerId: string; role: PtContinuation['role']; paymentId: string; subscriptionId: string; draft: unknown }): boolean {
  if (!['MEMBER', 'RECEPTIONIST'].includes(input.role) || !id(input.ownerId) || !id(input.paymentId) || !id(input.subscriptionId) || !validPtDraft(input.draft)) return false
  const d = input.draft
  const record: PtContinuation = {
    version: 1, ownerId: input.ownerId, role: input.role, paymentId: input.paymentId, subscriptionId: input.subscriptionId,
    expiresAt: Date.now() + MAX_AGE,
    // Whitelist fields. History state must never smuggle tokens, banking data, a redirect URL or old consent.
    draft: { memberId: d.memberId, coachId: d.coachId, optionId: d.optionId, startDate: d.startDate,
      pattern: d.pattern.map(p => ({ weekday: p.weekday, startTime: p.startTime })), ...(d.purchaseId ? { purchaseId: d.purchaseId } : {}) },
  }
  try {
    clearPtContinuations(input.ownerId)
    const keys = Object.keys(sessionStorage).filter(k => k.startsWith(PREFIX))
    for (const key of keys) {
      try { if (JSON.parse(sessionStorage.getItem(key)!).expiresAt <= Date.now()) sessionStorage.removeItem(key) } catch { sessionStorage.removeItem(key) }
    }
    const remaining = Object.keys(sessionStorage).filter(k => k.startsWith(PREFIX))
    while (remaining.length >= 5) sessionStorage.removeItem(remaining.shift()!)
    sessionStorage.setItem(PREFIX + input.paymentId, JSON.stringify(record))
    return true
  } catch { return false }
}
export function readPtContinuation(ownerId: string, paymentId: string, role: string, memberId?: string): PtContinuation | null {
  try {
    const key = PREFIX + paymentId
    const value = JSON.parse(sessionStorage.getItem(key) ?? 'null') as PtContinuation | null
    if (!value) return null
    if (value.version !== 1 || value.ownerId !== ownerId || value.paymentId !== paymentId || value.role !== role ||
      !id(value.subscriptionId) || !Number.isFinite(value.expiresAt) || value.expiresAt <= Date.now() || value.expiresAt > Date.now() + MAX_AGE ||
      !validPtDraft(value.draft) || (role === 'MEMBER' && memberId && value.draft.memberId !== memberId)) {
      sessionStorage.removeItem(key); return null
    }
    return value
  } catch { return null }
}
