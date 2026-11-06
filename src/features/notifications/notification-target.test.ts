import { describe, expect, it } from 'vitest'
import { notificationTarget } from './notification-target'
import type { AppNotification } from './types/notifications.types'
const item = (relatedType: string, relatedId?: string) => ({ relatedType, relatedId, type:'TRAINING', message:'Nội dung mới' } as AppNotification)
describe('Notification navigation',()=>{
  it('takes a Member to the exact result without interpreting message keywords',()=>{
    expect(notificationTarget(item('TrainingResult','r1'),'MEMBER')).toBe('/member/goals?resultId=r1')
  })
  it('replaces obsolete intake destinations with existing package areas',()=>{
    expect(notificationTarget(item('PtEnrollment','e1'),'COACH')).toBe('/coach/packages')
    expect(notificationTarget(item('PtEnrollment','e1'),'RECEPTIONIST')).toBe('/receptionist/members')
  })
  it('does not route Receptionists to health data or Managers to a missing calendar route',()=>{
    expect(notificationTarget(item('TrainingResult','r1'),'RECEPTIONIST')).toBeNull()
    expect(notificationTarget(item('PtScheduleChange','c1'),'MANAGER')).toBe('/manager/pt-board')
  })
})
