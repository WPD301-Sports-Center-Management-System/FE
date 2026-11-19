import { describe, expect, it } from 'vitest'
import { notificationTarget } from './notification-target'
import type { AppNotification } from './types/notifications.types'
const item = (relatedType: string, relatedId?: string) => ({ relatedType, relatedId, type:'TRAINING', message:'Nội dung mới' } as AppNotification)
describe('Notification navigation',()=>{
  it('uses role-appropriate pages for center closures rather than treating their IDs as bookings',()=>{
    expect(notificationTarget(item('CenterClosure','closure-1'),'MEMBER')).toBe('/member')
    expect(notificationTarget(item('CenterClosure','closure-1'),'MANAGER')).toBe('/manager/sessions')
    expect(notificationTarget(item('CenterClosure','closure-1'),'RECEPTIONIST')).toBe('/receptionist/calendar')
  })
  it('takes a Member to the exact result without interpreting message keywords',()=>{
    expect(notificationTarget(item('TrainingResult','r1'),'MEMBER')).toBe('/member/goals?resultId=r1')
  })
  it('replaces obsolete intake destinations with existing package areas',()=>{
    expect(notificationTarget(item('PtEnrollment','e1'),'COACH')).toBe('/coach/packages')
    expect(notificationTarget(item('PtEnrollment','e1'),'RECEPTIONIST')).toBe('/receptionist/members')
  })
  it('opens the Coach schedule-change inbox for Member reschedule requests and absences',()=>{
    expect(notificationTarget(item('PtScheduleChange','c1'),'COACH')).toBe('/coach/schedule-changes?requestId=c1')
    expect(notificationTarget(item('MemberAbsence','p1'),'COACH')).toBe('/coach/schedule-changes?inbox=1')
  })
  it('does not route Receptionists to health data or Managers to a missing calendar route',()=>{
    expect(notificationTarget(item('TrainingResult','r1'),'RECEPTIONIST')).toBeNull()
    expect(notificationTarget(item('PtScheduleChange','c1'),'MANAGER')).toBe('/manager/pt-board')
  })
})
