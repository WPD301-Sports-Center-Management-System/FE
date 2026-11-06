import { centerDate } from '@/shared/utils/date'
import type { TrialSession } from '../api'

export function trialEnded(s: TrialSession, today = centerDate()) {
  if (s.status === 'CHECKED_IN') return false
  if (s.type === 'PT') return s.status === 'CONVERTED' || (s.trial?.pt?.remainingSessions ?? 3) <= 0
  return ['CANCELLED', 'NO_SHOW', 'CONVERTED'].includes(s.status) || !!s.trial?.expiresOn && s.trial.expiresOn < today
}

export function trialNextAction(s: TrialSession, today = centerDate()) {
  if (s.status === 'CHECKED_IN') return 'Checkout'
  if (trialEnded(s, today)) return null
  if (s.type === 'PT' && ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(s.status)) return 'Xếp buổi tiếp'
  if (s.status === 'COMPLETED') return 'Check-in'
  if (s.status === 'SCHEDULED') return 'Check-in'
  return s.coachDecision === 'DECLINED' ? 'Đổi PT & xếp lịch' : 'Trao đổi & xếp lịch'
}

export function oppositeTrialType(s: TrialSession, today = centerDate()) {
  // Eligibility belongs to the other service, independent of this service's expiration.
  if (s.status === 'CONVERTED') return null
  if (s.type === 'GYM') {
    if (s.trial?.registeredTypes?.includes('PT') || (s.trial?.pt?.remainingSessions ?? 3) <= 0) return null
    return 'PT'
  }
  if (s.trial?.registeredTypes?.includes('GYM') || s.trial?.gym?.canRegister === false) return null
  if (s.trial?.expiresOn && s.trial.expiresOn < today) return null
  return 'GYM'
}
