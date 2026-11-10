import { CoachReadiness } from '@/features/coach-workspace/components/session-work-queue'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/auth-context'
import { fixedPtApi } from '../api'
import { useLoad } from '../hooks'
import { money } from '../components/ui'
import { tierLabel } from '@/shared/utils/coach-tier'
import { Async, Card, EmptyBox } from '@/features/workspace/ui'

export function PackageCatalogPage() { return <Navigate to="/coach/packages?view=catalog" replace /> }
export function CoachCatalog() {
  const { user } = useAuth()
  const coachId = user?.coachProfilesUserId?.id ?? ''
  const options = useLoad(() => fixedPtApi.optionsForCoach(coachId), [coachId], !!coachId)
  return <div className="space-y-6"><CoachReadiness />
    <Card title="Gói PT đang bán" subtitle="Bạn tự động bán gói đang mở có bậc tối thiểu không cao hơn bậc của bạn, khi đủ điều kiện nhận học viên.">
      <Async state={options} rows={3} empty={rows => !rows.length && <EmptyBox title="Chưa có gói có thể bán" hint="Kiểm tra giờ làm, trạng thái nhận học viên và gói đang mở bán của trung tâm." />}>
        {rows => <ul className="divide-y divide-border-subtle">{rows.map(p => <li key={p.id} className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
          <div><p className="font-semibold">{p.name}</p><p className="mt-1 text-sm text-text-muted">{p.sessionCount} buổi · {p.durationMinutes} phút/buổi</p></div>
          <div className="text-right"><p className="font-semibold tabular-nums">{money(p.price)}</p><p className="text-sm text-text-muted">{tierLabel(p.coachTier)}</p></div>
        </li>)}</ul>}
      </Async>
    </Card>
  </div>
}
