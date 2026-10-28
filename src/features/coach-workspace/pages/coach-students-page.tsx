import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Search, User, Users } from 'lucide-react'
import { useLoad } from '@/features/fixed-pt/hooks'
import type { Session } from '@/features/fixed-pt/types'
import { centerDate } from '@/shared/utils/date'
import { coachWs, type CoachPurchase } from '../api'
import { Badge, Btn, Card, Dot, EmptyBox, ErrorBox, LinkBtn, PageHeader, Pagination, Person, ProgressBar, Skeleton, Table, inputCls, td } from '@/features/workspace/ui'
import { addDays, dayEnd, downloadCsv, isUpcoming, relativeSlot, type Tone } from '@/features/workspace/utils'

const PAGE = 8
type Status = { key: string; label: string; tone: Tone }
const STATUSES: Status[] = [
  { key: 'ok', label: 'Đúng tiến độ', tone: 'success' }, { key: 'low', label: 'Sắp hết gói', tone: 'warning' }, { key: 'expiring', label: 'Sắp hết hạn', tone: 'danger' },
  { key: 'attention', label: 'Cần chú ý', tone: 'danger' }, { key: 'unscheduled', label: 'Chưa xếp lịch', tone: 'info' }, { key: 'finished', label: 'Đã xong gói', tone: 'neutral' },
]
export interface StudentRow { memberId: string; name: string; code: string; phone?: string | null; avatarUrl?: string | null; purchase: CoachPurchase; packages: number; next: Session | null; attendance: number | null; status: Status }

/** One row per member: their current package with this Coach, next session, attendance and a status. */
export function buildStudents(purchases: CoachPurchase[], sessions: Session[]): StudentRow[] {
  const today = centerDate()
  const now = Date.now()
  const byMember = new Map<string, CoachPurchase[]>()
  for (const p of purchases.filter(x => x.status === 'ACTIVE' || x.status === 'COMPLETED' || x.status === 'EXPIRED')) byMember.set(p.memberId, [...(byMember.get(p.memberId) ?? []), p])
  return [...byMember.values()].map(list => {
    const sorted = [...list].sort((a, b) => (a.status === 'ACTIVE' ? 0 : 1) - (b.status === 'ACTIVE' ? 0 : 1) || b.createdAt.localeCompare(a.createdAt))
    const p = sorted[0]!
    const mine = sessions.filter(s => s.memberId === p.memberId)
    const next = mine.filter(s => isUpcoming(s) && new Date(s.endsAt).getTime() > now).sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0] ?? null
    const past = mine.filter(s => ['COMPLETED', 'NO_SHOW', 'CANCELLED_LATE'].includes(s.status))
    const attendance = past.length ? Math.round((past.filter(s => s.status === 'COMPLETED').length / past.length) * 100) : null
    const remaining = p.totalCredits - p.consumedCredits
    const key = p.status !== 'ACTIVE' ? 'finished'
      : p.expiresAt && centerDate(p.expiresAt) <= addDays(today, 14) ? 'expiring'
      : remaining <= 2 ? 'low'
      : attendance !== null && attendance < 70 ? 'attention'
      : !next && p.availableCredits > 0 ? 'unscheduled' : 'ok'
    return { memberId: p.memberId, name: p.memberName, code: p.memberCode, phone: p.phone, avatarUrl: p.avatarUrl, purchase: p, packages: list.length, next, attendance, status: STATUSES.find(s => s.key === key)! }
  }).sort((a, b) => a.name.localeCompare(b.name, 'vi'))
}

export function useStudentData() {
  const today = centerDate()
  const purchases = useLoad(() => coachWs.purchases(), [])
  const sessions = useLoad(() => coachWs.sessions({ from: `${addDays(today, -60)}T00:00:00+07:00`, to: dayEnd(addDays(today, 30)) }, 10), [today])
  const rows = useMemo(() => purchases.data && sessions.data ? buildStudents(purchases.data, sessions.data) : null, [purchases.data, sessions.data])
  return { purchases, sessions, rows, error: purchases.error ?? sessions.error, reload: () => { void purchases.reload(); void sessions.reload() } }
}

export function CoachStudentsPage() {
  const { rows, error, reload } = useStudentData()
  const [q, setQ] = useState('')
  const [pkg, setPkg] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const packages = useMemo(() => [...new Set((rows ?? []).map(r => r.purchase.packageNameSnapshot))].sort(), [rows])
  const term = q.trim().toLowerCase()
  const filtered = (rows ?? []).filter(r => (!term || [r.name, r.code, r.phone].some(v => v?.toLowerCase().includes(term))) && (!pkg || r.purchase.packageNameSnapshot === pkg) && (!status || r.status.key === status))
  const shown = filtered.slice((page - 1) * PAGE, page * PAGE)
  const active = (rows ?? []).filter(r => r.purchase.status === 'ACTIVE')
  const exportCsv = () => downloadCsv('hoc-vien.csv', ['Mã HV', 'Họ tên', 'SĐT', 'Gói', 'Đã dùng', 'Tổng buổi', 'Buổi tiếp theo', 'Chuyên cần %', 'Trạng thái'],
    filtered.map(r => [r.code, r.name, r.phone ?? '', r.purchase.packageNameSnapshot, r.purchase.consumedCredits, r.purchase.totalCredits, r.next ? relativeSlot(r.next.startsAt) : '', r.attendance ?? '', r.status.label]))

  return <div>
    <PageHeader title="Danh sách học viên"
      subtitle={rows ? <><span>{active.length} học viên đang tập</span><Dot /><span>{rows.length - active.length} đã xong gói</span><Dot /><span>Chuyên cần tính trên 60 ngày gần nhất</span></> : 'Đang tải…'}
      actions={<Btn icon={<Download aria-hidden className="h-4 w-4" />} onClick={exportCsv} disabled={!filtered.length}>Xuất CSV</Btn>} />
    <Card flush>
      <div className="flex flex-wrap items-end gap-3 border-b border-border-subtle p-4">
        <label className="relative min-w-60 flex-1"><span className="sr-only">Tìm học viên</span>
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input type="search" value={q} onChange={e => { setQ(e.target.value); setPage(1) }} placeholder="Tìm học viên theo tên / SĐT / mã…" className={`${inputCls} pl-9`} /></label>
        <label className="w-56"><span className="sr-only">Lọc theo gói PT</span><select value={pkg} onChange={e => { setPkg(e.target.value); setPage(1) }} className={inputCls}><option value="">Tất cả gói PT</option>{packages.map(p => <option key={p}>{p}</option>)}</select></label>
        <label className="w-48"><span className="sr-only">Lọc theo trạng thái</span><select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} className={inputCls}><option value="">Mọi trạng thái</option>{STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}</select></label>
      </div>
      {error ? <ErrorBox message={error} onRetry={reload} /> : !rows ? <Skeleton rows={6} /> : !filtered.length
        ? <EmptyBox icon={<Users className="h-5 w-5" />} title={rows.length ? 'Không có học viên phù hợp bộ lọc' : 'Bạn chưa có học viên'} hint={rows.length ? undefined : 'Học viên xuất hiện khi họ mua gói PT với bạn và thanh toán xong.'} />
        : <><Table head={['Học viên', 'Gói PT', 'Buổi đã dùng', 'Buổi tiếp theo', 'Chuyên cần', 'Trạng thái', 'Thao tác']} minWidth={1020}>
          {shown.map(r => { const p = r.purchase; const remaining = p.totalCredits - p.consumedCredits; return <tr key={r.memberId} className="hover:bg-bg-surface-muted/40">
            <td className={td}><Link to={`/coach/students/${r.memberId}`} className="flex items-center gap-3 hover:text-primary"><Person name={r.name} src={r.avatarUrl} /><span><span className="block font-semibold">{r.name}</span><span className="text-xs text-text-muted">{r.code}{r.phone ? ` · ${r.phone}` : ''}</span></span></Link></td>
            <td className={td}><Badge tone="violet">{p.packageNameSnapshot}</Badge>{r.packages > 1 && <p className="mt-1 text-xs text-text-muted">{r.packages} gói với bạn</p>}</td>
            <td className={td}><div className="flex items-center gap-2"><ProgressBar className="w-28" value={p.consumedCredits} max={p.totalCredits} tone={remaining <= 2 ? 'warning' : 'primary'} label={`${p.consumedCredits}/${p.totalCredits} buổi`} /><span className="text-xs tabular-nums text-text-muted">{p.consumedCredits}/{p.totalCredits}</span></div></td>
            <td className={td}>{r.next ? <><p className="font-semibold">{relativeSlot(r.next.startsAt)}</p><p className="text-xs text-text-muted">{r.next.credit ? `buổi ${r.next.credit.creditIndex}/${p.totalCredits}` : r.next.courseName}</p></> : <><p>—</p><p className="text-xs text-text-muted">{p.status === 'ACTIVE' ? 'chưa có buổi sắp tới' : 'đã kết thúc'}</p></>}</td>
            <td className={`${td} tabular-nums`}>{r.attendance === null ? <span className="text-text-muted">—</span> : `${r.attendance}%`}</td>
            <td className={td}><Badge tone={r.status.tone}>{r.status.label}</Badge></td>
            <td className={`${td} text-right`}><div className="flex justify-end gap-1.5"><LinkBtn size="sm" variant="soft" to={`/coach/students/${r.memberId}`} icon={<User aria-hidden className="h-3.5 w-3.5" />}>Hồ sơ</LinkBtn>
              {r.next && <LinkBtn size="sm" to={`/coach/sessions/${r.next.id}`}>Buổi tiếp</LinkBtn>}</div></td>
          </tr> })}
        </Table>
          <Pagination page={page} pageSize={PAGE} total={filtered.length} onChange={setPage} noun="học viên" /></>}
    </Card>
  </div>
}
