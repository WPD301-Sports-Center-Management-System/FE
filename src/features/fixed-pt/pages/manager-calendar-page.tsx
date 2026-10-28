import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { fixedPtApi } from '../api'
import { useSubmit } from '../hooks'
import { ErrorBanner, Page } from '../components/ui'
import { ViewToggle } from '../components/week-schedule'
import { StaffWeekCalendar } from './staff-calendar'

// Manager: every Coach's PT sessions by week. Decisions on flagged sessions stay on /manager/sessions.
export function ManagerCalendarPage() {
  const [view, setView] = useState<'week' | 'table'>('week')
  const act = useSubmit()
  return (
    <Page title="Lịch PT toàn trung tâm" subtitle="Lịch tất cả Coach theo tuần, giờ Việt Nam. Buổi cần xử lý được quyết định tại trang Buổi cần xử lý." actions={<ViewToggle value={view} onChange={setView} />}>
      <ErrorBanner message={act.error} />
      <StaffWeekCalendar view={view} actions={(s, reload) => <>
        {s.allowedActions.arrive && <Button size="sm" variant="secondary" disabled={act.busy} onClick={() => void act.run(async () => { await fixedPtApi.arrive(s.id); reload() })}>Đã đến</Button>}
        {s.needsReview && <Link className="self-center text-xs font-semibold text-primary underline" to="/manager/sessions">Xử lý buổi</Link>}
      </>} />
    </Page>
  )
}
