import { beforeEach, expect, it, vi } from 'vitest'
import { authStorage } from './storage'
import { clearPtContinuations, readPtContinuation, savePtContinuation } from './pt-continuation'
const draft = { memberId: 'member', coachId: 'coach', optionId: 'option', startDate: '2027-01-04', pattern: [{ weekday: 1, startTime: '18:00' }] }
const record = { ownerId: 'user', role: 'MEMBER' as const, paymentId: 'payment', subscriptionId: 'subscription', draft }
beforeEach(() => { sessionStorage.clear(); localStorage.clear(); vi.restoreAllMocks() })
it('stores only the draft fields and binds it to account, role and payment', () => {
  expect(savePtContinuation({ ...record, draft: { ...draft, accessToken: 'secret', bankAccount: 'private', acceptPolicy: true, preview: {}, returnTo: 'https://evil.example' } })).toBe(true)
  const raw = sessionStorage.getItem('sc_pt_continuation:payment')!
  for (const value of ['secret', 'private', 'acceptPolicy', 'preview', 'returnTo']) expect(raw).not.toContain(value)
  expect(readPtContinuation('user', 'payment', 'MEMBER', 'member')?.draft).toEqual(draft)
  expect(readPtContinuation('user', 'other-payment', 'MEMBER', 'member')).toBeNull()
  expect(readPtContinuation('another-user', 'payment', 'MEMBER', 'member')).toBeNull()
})
it('expires after two hours and is cleared by logout', () => {
  savePtContinuation(record)
  const now = Date.now()
  vi.spyOn(Date, 'now').mockReturnValue(now + 2 * 60 * 60 * 1000 + 1)
  expect(readPtContinuation('user', 'payment', 'MEMBER')).toBeNull()
  vi.restoreAllMocks()
  savePtContinuation(record)
  authStorage.clearSession()
  expect(readPtContinuation('user', 'payment', 'MEMBER')).toBeNull()
})
it('drops drafts of other accounts at login and rejects a mismatched member', () => {
  savePtContinuation(record)
  clearPtContinuations('another-user')
  expect(readPtContinuation('user', 'payment', 'MEMBER')).toBeNull()
  savePtContinuation(record)
  expect(readPtContinuation('user', 'payment', 'MEMBER', 'another-member')).toBeNull()
})
it('limits drafts and rejects malformed or unavailable storage', () => {
  for (let i = 0; i < 8; i++) savePtContinuation({ ...record, paymentId: 'pay' + i })
  expect(Object.keys(sessionStorage)).toHaveLength(5)
  expect(savePtContinuation({ ...record, draft: { ...draft, pattern: [{ weekday: 1, startTime: '99:99' }] } })).toBe(false)
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage disabled') })
  expect(savePtContinuation(record)).toBe(false)
})
it('uses the BE weekday convention 1 through 7, including Sunday', () => {
  expect(savePtContinuation({ ...record, draft: { ...draft, pattern: [{ weekday: 7, startTime: '18:00' }] } })).toBe(true)
  expect(readPtContinuation('user', 'payment', 'MEMBER')?.draft.pattern[0]?.weekday).toBe(7)
  expect(savePtContinuation({ ...record, draft: { ...draft, pattern: [{ weekday: 0, startTime: '18:00' }] } })).toBe(false)
})
