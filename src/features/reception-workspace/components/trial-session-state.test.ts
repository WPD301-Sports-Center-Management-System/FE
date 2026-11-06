import { describe, expect, it } from 'vitest'
import type { TrialSession } from '../api'
import { oppositeTrialType, trialEnded, trialNextAction } from './trial-session-state'

const gym: TrialSession = { id: 'gym', type: 'GYM', status: 'COMPLETED', fullName: 'An', phone: '0901234567', scheduledAt: '2026-11-06T01:00:00Z', checkedOutAt: '2026-11-06T02:00:00Z', durationMinutes: 60, trial: { phone: '0901234567', mode: 'GYM', remainingDays: 3, canRegister: true, canCheckIn: true, days: [], usedDays: 1, startsOn: '2026-11-06', expiresOn: '2026-11-08', registeredTypes: ['GYM'] } }

describe('trial attendance actions after checkout', () => {
  it('keeps checkout guests active with the same check-in label today and tomorrow', () => {
    expect(trialEnded(gym, '2026-11-06')).toBe(false)
    expect(trialNextAction(gym, '2026-11-06')).toBe('Check-in')
    expect(trialNextAction(gym, '2026-11-07')).toBe('Check-in')
    expect(oppositeTrialType(gym, '2026-11-07')).toBe('PT')
  })
  it('hides the registration shortcut when both types already exist', () => {
    const both = { ...gym, trial: { ...gym.trial!, mode: 'BOTH' as const, registeredTypes: ['GYM', 'PT'] as const } }
    expect(oppositeTrialType({ ...both, trial: { ...both.trial, registeredTypes: [...both.trial.registeredTypes] } }, '2026-11-07')).toBeNull()
  })
  it('closes expired trials but always permits the final checkout of an open visit', () => {
    expect(trialEnded(gym, '2026-11-09')).toBe(true)
    expect(trialNextAction(gym, '2026-11-09')).toBeNull()
    expect(oppositeTrialType(gym, '2026-11-09')).toBe('PT')
    expect(trialNextAction({ ...gym, status: 'CHECKED_IN' }, '2026-11-09')).toBe('Checkout')
  })
  it('books a new PT appointment rather than reusing yesterday’s coach slot', () => {
    expect(trialNextAction({ ...gym, type: 'PT' }, '2026-11-07')).toBe('Xếp buổi tiếp')
  })
  it('offers the opposite experience for both scheduled and checked-in guests', () => {
    expect(oppositeTrialType({ ...gym, status: 'SCHEDULED' }, '2026-11-06')).toBe('PT')
    expect(oppositeTrialType({ ...gym, status: 'CHECKED_IN' }, '2026-11-06')).toBe('PT')
    const pt = { ...gym, type: 'PT' as const, status: 'SCHEDULED' as const, trial: { ...gym.trial!, mode: 'PT' as const, registeredTypes: ['PT' as const] } }
    expect(oppositeTrialType(pt, '2026-11-06')).toBe('GYM')
    expect(oppositeTrialType({ ...pt, status: 'CHECKED_IN' }, '2026-11-06')).toBe('GYM')
  })
  it('keeps remaining PT visits available after gym expiration and closes only after three visits', () => {
    const pt: TrialSession = { ...gym, type: 'PT', trial: { ...gym.trial!, pt: { totalSessions: 3, usedSessions: 2, remainingSessions: 1, canCheckIn: true } } }
    expect(trialEnded(pt, '2026-12-01')).toBe(false)
    expect(trialNextAction(pt, '2026-12-01')).toBe('Xếp buổi tiếp')
    expect(trialNextAction({ ...pt, status: 'CANCELLED' }, '2026-12-01')).toBe('Xếp buổi tiếp')
    const exhausted: TrialSession = { ...pt, trial: { ...pt.trial!, pt: { totalSessions: 3, usedSessions: 3, remainingSessions: 0, canCheckIn: false } } }
    expect(trialEnded(exhausted, '2026-12-01')).toBe(true)
    expect(trialNextAction(exhausted, '2026-12-01')).toBeNull()
    expect(trialNextAction({ ...exhausted, status: 'CHECKED_IN' }, '2026-12-01')).toBe('Checkout')
  })
})
