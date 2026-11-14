import type { UserRole } from '@/shared/types/api'
import type { AppNotification } from './types/notifications.types'

/** Object identifiers determine the destination; notification wording may change. */
export function notificationTarget(item: AppNotification, role?: UserRole | null): string | null {
  if (!role) return null
  const id = item.relatedId ? encodeURIComponent(item.relatedId) : null
  const member = role === 'MEMBER', coach = role === 'COACH', manager = role === 'MANAGER'
  const base = manager ? '/manager' : '/receptionist'
  switch (item.relatedType) {
    case 'CenterClosure': return member ? '/member' : coach ? '/coach/schedule' : manager ? '/manager/sessions' : '/receptionist/calendar'
    case 'PtPackagePurchase': return id ? `/pt-purchases/${id}` : coach ? '/coach/packages' : member ? '/member' : `${base}/members`
    case 'PtBooking': return id ? coach ? `/coach/sessions/${id}` : `/pt-sessions/${id}` : coach ? '/coach/schedule' : member ? '/member' : manager ? '/manager/pt-board' : '/receptionist/calendar'
    case 'PtEnrollment': return coach ? '/coach/packages' : member ? '/member' : `${base}/members`
    case 'TrainingResult': return member ? `/member/goals${id ? `?resultId=${id}` : ''}` : coach ? '/coach/goals' : manager ? '/manager/goals' : null
    case 'FitnessGoal': return member ? '/member/goals' : coach ? '/coach/goals' : manager ? '/manager/goals' : null
    case 'ResultDispute': return manager ? '/manager/goals' : coach ? '/coach/goals' : member ? '/member/goals' : null
    case 'PtScheduleChange': return coach ? '/coach/schedule-changes' : member ? '/member' : manager ? '/manager/pt-board' : '/receptionist/calendar?tab=changes'
    case 'CoachWithdrawal': return coach ? '/coach/earnings' : manager ? '/manager/coach-income' : null
    case 'ServiceDisruption': return member ? '/member' : coach ? '/coach/schedule-changes' : `${base}/support`
  }
  if (item.type === 'SUPPORT') return member ? '/member/support' : coach ? '/coach/goals' : `${base}/support`
  if (item.type === 'PAYMENT') return member ? '/member' : coach ? '/coach/earnings' : `${base}/payments`
  if (item.type === 'MEMBERSHIP') return member ? '/member' : coach ? null : `${base}/members`
  return null
}
