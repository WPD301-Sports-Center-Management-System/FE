import type { Session } from '@/features/fixed-pt/types'
import type { CoachTrialSession } from './api'

export type CalendarSession = Pick<Session, 'id' | 'status' | 'startsAt' | 'endsAt' | 'memberName' | 'courseName' | 'purchase' | 'credit' | 'isMakeup'> & { trialPhone?: string }

export function calendarSessions(paid: Session[], trials: CoachTrialSession[]): CalendarSession[] {
  const trialStatus = { SCHEDULED: 'CONFIRMED', CHECKED_IN: 'IN_PROGRESS', COMPLETED: 'COMPLETED', NO_SHOW: 'NO_SHOW', CANCELLED: 'COACH_CANCELLED', CONVERTED: 'COMPLETED' } as const
  return [...paid, ...trials.map(t => ({
    id: `trial-${t.id}`, status: trialStatus[t.status], startsAt: t.scheduledAt,
    endsAt: new Date(Date.parse(t.scheduledAt) + t.durationMinutes * 60_000).toISOString(),
    memberName: t.fullName, courseName: 'Tập thử PT', trialPhone: t.phone, isMakeup: false,
  }))].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
}
