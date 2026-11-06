import { Link } from 'react-router-dom'
import { useEffect, type ReactNode } from 'react'
import { hybridGet } from '@/features/fixed-pt/hybrid-api'
import { useLoad } from '@/features/fixed-pt/hooks'
import { Async, Card, LinkBtn } from '@/features/workspace/ui'
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

const arrange = (purchaseId: string, absenceId?: string) => `/coach/schedule?tab=changes&purchaseId=${purchaseId}&tool=SCHEDULE_PENDING${absenceId ? `&absenceId=${absenceId}` : ''}`
export function SessionWorkQueue() {
  const state = useLoad(() => hybridGet<SessionTasks>('/coaches/me/session-tasks'))
  return <Card title="Việc cần xử lý" subtitle="Chọn đúng việc bên dưới; công cụ đổi lịch nâng cao nằm trong mục riêng." actions={<LinkBtn to="/coach/schedule?tab=calendar">Về lịch dạy</LinkBtn>}>
    <Async state={state} rows={3}>{() => state.data && <div className="grid gap-5 md:grid-cols-2">
      <TaskGroup title="Buổi quá giờ chưa chốt" empty={!state.data.overdue.length}>
        {state.data.overdue.map(b => <TaskRow key={b.id} title={`${b.member.user.fullName} · ${formatDateTime(b.plannedStartsAt)}`} hint={b.status === 'IN_PROGRESS' ? 'Kết thúc hoặc dừng do sự cố theo thực tế.' : 'Đã quá giờ Start. Nhờ Manager xác minh giờ thực hoặc hủy hoàn buổi.'} to={`/coach/sessions/${b.id}`} label="Xem buổi" />)}
      </TaskGroup>
      <TaskGroup title="Phiếu sau buổi chưa ghi" empty={!state.data.missingSheets.length}>
        {state.data.missingSheets.map(b => <TaskRow key={b.id} title={`${b.member.user.fullName} · ${formatDateTime(b.plannedStartsAt)}`} to={`/coach/goals/sheet/${b.id}`} label="Ghi phiếu" />)}
      </TaskGroup>
      <TaskGroup title="Gói chưa có Form 1" empty={!state.data.missingJourney.length}>
        {state.data.missingJourney.map(b => <TaskRow key={b.id} title={b.member.user.fullName} hint="Khởi tạo lộ trình trước buổi đầu." to={`/coach/sessions/${b.id}`} label="Khởi tạo" />)}
      </TaskGroup>
      <TaskGroup title="Buổi chờ xếp lại" empty={!state.data.pendingScheduling.length}>
        {state.data.pendingScheduling.map(p => <TaskRow key={p.id} title={`${p.member.user.fullName} · ${p._count.credits} buổi`} hint={`${p.packageNameSnapshot}${p.status === 'PAUSED' ? ' · Cần mở lại gói trước khi xếp.' : ''}`} to={arrange(p.id)} label="Xử lý gói" />)}
      </TaskGroup>
      <TaskGroup title="Báo nghỉ cần theo dõi" empty={!state.data.absences.length}>
        {state.data.absences.map(a => <TaskRow key={a.id} title={a.purchase.member.user.fullName} hint={`${a.fromDate.slice(0, 10)} → ${a.toDate.slice(0, 10)}${a.status === 'NEEDS_MANAGER' ? ' · Chờ Manager duyệt nghỉ dài.' : ' · Chỉ đóng khi đã xếp đủ buổi được giữ.'}`} to={arrange(a.purchaseId, a.id)} label="Xếp buổi đã giữ" />)}
      </TaskGroup>
    </div>}</Async>
  </Card>
}

function TaskGroup({ title, empty, children }: { title: string; empty: boolean; children: ReactNode }) {
  return <section><h3 className="mb-2 font-semibold">{title}</h3>{empty ? <p className="text-sm text-text-muted">Không có việc chờ.</p> : <ul className="max-h-80 space-y-3 overflow-y-auto">{children}</ul>}</section>
}
function TaskRow({ title, hint, to, label }: { title: string; hint?: string; to: string; label: string }) {
  return <li className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-3 text-sm"><div className="min-w-0 flex-1"><p className="font-medium">{title}</p>{hint && <p className="text-text-muted">{hint}</p>}</div><LinkBtn size="sm" to={to}>{label}</LinkBtn></li>
}
