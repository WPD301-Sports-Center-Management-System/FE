import { PageHeader } from '@/features/workspace/ui'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ScheduleTools } from '@/features/fixed-pt/components/schedule-tools'
import { TabbedPage } from '@/features/workspace/tabbed-page'
import { CoachCalendarPage } from '@/features/fixed-pt/pages/coach-calendar-page'
import { CoachSchedulePage } from './coach-schedule-page'
import { CoachScheduleChangesPage } from './coach-schedule-changes-page'
import { CoachReadiness } from '../components/session-work-queue'

/** One destination for the teaching calendar, changes and availability; keep drafts on tab changes. */
export function CoachScheduleHubPage() {
  const [params] = useSearchParams()
  const [revision,setRevision]=useState(0)
  return <div className="[&_[role=tab]]:text-text-primary"><PageHeader title="Lịch dạy" subtitle="Theo dõi buổi tập, hoàn tất việc chờ và quản lý giờ nhận học viên." /><CoachReadiness /><TabbedPage bare title="Lịch dạy & giờ làm" tabs={[
    {key:'calendar',label:'Lịch dạy',render:()=> <CoachSchedulePage/>},
    {key:'changes',label:'Việc cần xử lý',render:()=> <CoachScheduleChangesPage key={revision}/>},
    {key:'shift',label:'Nghỉ & học bù',render:()=> <ScheduleTools key={params.get('purchaseId')??''} initialTool="ABSENCES" initialPurchaseId={params.get('purchaseId')??''} onChanged={()=>setRevision(v=>v+1)}/>},
    {key:'hours',label:'Giờ làm & nhận học viên',render:()=> <CoachCalendarPage settingsOnly/>},
  ]}/></div>
}
