import { CoachTrialRequests } from './trial-requests'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { hybridGet } from '@/features/fixed-pt/hybrid-api'
import { useLoad } from '@/features/fixed-pt/hooks'
import { Async, Card, LinkBtn, Segmented } from '@/features/workspace/ui'
import { formatDateTime } from '@/shared/utils/date'

type Person = { user: { fullName: string } }
type Task = { id: string; purchaseId: string; plannedStartsAt: string; status: string; member: Person }
export type SessionTasks = {
  overdue: Task[]; missingSheets: Task[]; missingJourney: Task[]
  pendingScheduling: { id: string; packageNameSnapshot: string; status: string; member: Person; _count: { credits: number } }[]
  absences: { id: string; purchaseId: string; status: string; fromDate: string; toDate: string; purchase: { member: Person } }[]
}

export function CoachReadiness() {
  const state = useLoad(() => hybridGet<{ ready: boolean; missing: { key: string; label: string }[] }>('/coaches/me/schedule-readiness'))
  const { reload } = state
  useEffect(() => { const refresh = () => void reload(); window.addEventListener('coach-readiness-changed', refresh); window.addEventListener('focus', refresh); return () => { window.removeEventListener('coach-readiness-changed', refresh); window.removeEventListener('focus', refresh) } }, [reload])
  return <div className="mb-4 rounded-xl border border-border-subtle bg-bg-surface p-4 text-sm" role="status">
    {state.error ? <button className="text-primary underline" onClick={() => void state.reload()}>Không tải được điều kiện nhận học viên. Thử lại</button> : state.data ? <>
      <strong>{state.data.ready ? 'Đã đủ điều kiện nhận học viên mới.' : 'Còn bước để nhận học viên mới:'}</strong>
      {state.data.missing.length > 0 && <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-2">{state.data.missing.map(m => <li key={m.key}><Link className="text-primary underline" to={m.key === 'PRODUCT' ? '/coach/packages' : m.key === 'PROFILE' ? '/coach/profile' : '/coach/schedule?tab=hours'}>{m.label}</Link></li>)}</ul>}
      {state.data.ready && <span className="ml-2 text-text-muted">Học viên chọn đủ chuỗi buổi còn trống trước khi thanh toán.</span>}
    </> : 'Đang kiểm tra điều kiện nhận học viên…'}
  </div>
}

export interface CoachTodo { id: string; kind: string; label: string; waitingOn: 'COACH' | 'MEMBER' | 'DONE'; memberName?: string; packageName?: string; purchaseId: string; bookingId?: string; scheduleRequestId?: string; absenceId?: string; creditCount?: number; at?: string }
function todoLink(t: CoachTodo) {
  if (t.kind === 'FORM2_MISSING') return '/coach/goals/sheet/' + t.bookingId
  if (t.bookingId) return '/coach/sessions/' + t.bookingId
  const q = new URLSearchParams({ tab: 'changes', purchaseId: t.purchaseId })
  if (t.absenceId) q.set('absenceId', t.absenceId)
  if (t.scheduleRequestId) q.set('requestId', t.scheduleRequestId)
  if (t.kind === 'SCHEDULE_PENDING' || t.kind === 'ABSENCE_RESCHEDULE') q.set('tool', 'SCHEDULE_PENDING')
  return '/coach/schedule?' + q
}
export function SessionWorkQueue({ additional = [] }: { additional?: CoachTodo[] } = {}) {
  const state = useLoad(() => hybridGet<SessionTasks & { todo?: CoachTodo[] }>('/coaches/me/session-tasks'))
  const [view, setView] = useState<'COACH' | 'MEMBER' | 'DONE'>('COACH')
  const tasks = state.data?.todo ?? []
  const rows = [...tasks, ...additional.filter(t => !tasks.some(x => x.scheduleRequestId && x.scheduleRequestId === t.scheduleRequestId))].filter(t => t.waitingOn === view)
  return <div className="space-y-5"><Card title="Việc cần xử lý" subtitle="Mỗi việc dẫn tới đúng học viên, gói hoặc buổi tập." actions={<LinkBtn to="/coach/schedule?tab=calendar">Về lịch dạy</LinkBtn>}>
    <Segmented label="Trạng thái công việc" value={view} onChange={setView} items={[{ key: 'COACH', label: 'Cần bạn làm' }, { key: 'MEMBER', label: 'Chờ người khác' }, { key: 'DONE', label: 'Đã xử lý' }]} />
    {view !== 'DONE' && <div className="mt-4"><CoachTrialRequests compact waiting={view === 'MEMBER'} /></div>}
    {view === 'DONE' && <p className="mt-4 text-sm text-text-muted">Lịch sử xử lý yêu cầu lịch tập. Kết quả buổi và phiếu đã lưu nằm trong từng buổi tập.</p>}<Async state={state} rows={3}>{() => !state.data?.todo ? <p className="mt-4 text-sm text-text-muted">Chưa có dữ liệu phân công công việc. Xem lịch và hộp thư để xử lý từng hồ sơ.</p> : !rows.length ? <p className="mt-4 text-sm text-text-muted">Không có việc chờ trong danh sách này.</p> : <ul className="mt-4 divide-y divide-border-subtle">{rows.map(t => <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><div className="min-w-0 flex-1"><p className="font-semibold">{t.memberName ?? 'Học viên'} · {t.packageName}</p><p>{t.label}{t.creditCount != null ? ' · ' + t.creditCount + ' buổi' : ''}</p>{t.at && <p className="text-text-muted">{formatDateTime(t.at)}</p>}</div><LinkBtn size="sm" to={todoLink(t)}>{t.waitingOn === 'MEMBER' ? 'Xem đề xuất' : t.kind === 'FORM2_MISSING' ? 'Ghi phiếu' : 'Mở xử lý'}</LinkBtn></li>)}</ul>}</Async>
  </Card></div>
}
