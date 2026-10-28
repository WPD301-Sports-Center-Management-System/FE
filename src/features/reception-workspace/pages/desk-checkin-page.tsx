import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Clock, LogIn, LogOut, ScanLine, Ticket, Timer, Users, X } from 'lucide-react'
import { useLoad, useSubmit } from '@/features/fixed-pt/hooks'
import { centerDate } from '@/shared/utils/date'
import { PersonSearch, type PersonHit } from '@/features/workspace/person-search'
import { Async, Badge, Btn, Card, Dot, EmptyBox, InlineError, LinkBtn, PageHeader, Pagination, Person, Segmented, Skeleton, StatTile, Table, td, useFlash } from '@/features/workspace/ui'
import { dayEnd, dayStart, hhmm, minutesBetween, SESSION_LABEL } from '@/features/workspace/utils'
import { deskApi, type CheckInResult, type Visit } from '../api'
import { useDeskShell } from '../shell'
import { dmy, memberState } from '../labels'
import { InRoomRow, stayed } from './desk-home-page'

const PAGE = 10

export function DeskCheckinPage() {
  const { counts, refresh } = useDeskShell()
  const { flash, node } = useFlash()
  const today = centerDate()
  const recent = useLoad(() => deskApi.visits({}, 3), [])
  const sessions = useLoad(() => deskApi.sessions({ from: dayStart(today), to: dayEnd(today) }, 2), [today])
  const [picked, setPicked] = useState<PersonHit | null>(null)
  const [tab, setTab] = useState<'in' | 'log'>('in')
  const [page, setPage] = useState(1)
  const all = recent.data ?? []
  const inside = all.filter(v => v.status === 'OPEN')
  const todayLog = all.filter(v => centerDate(v.checkedInAt) === today || (v.checkedOutAt && centerDate(v.checkedOutAt) === today))
  const outToday = all.filter(v => v.checkedOutAt && centerDate(v.checkedOutAt) === today)
  const avg = outToday.length ? Math.round(outToday.reduce((n, v) => n + minutesBetween(v.checkedInAt, v.checkedOutAt!), 0) / outToday.length) : null
  const ptByMember = useMemo(() => new Map((sessions.data ?? []).filter(s => s.status !== 'COMPLETED').map(s => [s.memberId, s])), [sessions.data])
  const find = useCallback(async (term: string) => (await deskApi.members({ search: term, limit: 8 })).items
    .map(m => ({ id: m.id, name: m.user.fullName, sub: `${m.memberCode}${m.user.phone ? ` · ${m.user.phone}` : ''}`, avatarUrl: m.user.avatarUrl })), [])
  const reload = (m: string) => { flash(m); void recent.reload(); refresh() }
  const rows = tab === 'in' ? inside : todayLog

  return <div>
    {node}
    <PageHeader title="Check-in / Check-out" subtitle={<><span>Quầy lễ tân</span><Dot /><span>Hội viên cần vé gym còn hiệu lực hôm nay mới được check-in</span></>} />
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile label="Check-in hôm nay" icon={<LogIn className="h-[18px] w-[18px]" />} iconTone="info" value={counts?.checkinsToday ?? '—'} unit="lượt" />
      <StatTile label="Đang trong phòng" icon={<Users className="h-[18px] w-[18px]" />} iconTone="success" tone="success" value={counts?.insideGym ?? '—'} unit="người" />
      <StatTile label="Check-out hôm nay" icon={<LogOut className="h-[18px] w-[18px]" />} iconTone="violet" value={recent.data ? outToday.length : '—'} unit="lượt" hint="Tính trên 300 lượt gần nhất" />
      <StatTile label="Thời lượng trung bình" icon={<Timer className="h-[18px] w-[18px]" />} iconTone="warning" value={avg === null ? '—' : avg >= 60 ? `${Math.floor(avg / 60)}g ${avg % 60}p` : `${avg}p`} hint="Các lượt đã check-out hôm nay" />
    </div>

    <div className="grid gap-6 2xl:grid-cols-[400px_minmax(0,1fr)]">
      <Card title="Check-in tại quầy" subtitle="Tìm theo tên, số điện thoại hoặc email rồi xác nhận">
        <PersonSearch autoFocus className="" label="Tìm hội viên để check-in" placeholder="Nhập tên / SĐT hội viên…" find={find} onPick={setPicked} />
        {picked ? <CheckinPanel key={picked.id} hit={picked} openVisit={inside.find(v => v.memberId === picked.id)} onClose={() => setPicked(null)} onDone={m => { reload(m) }} />
          : <div className="mt-6 flex flex-col items-center rounded-xl border border-dashed border-border-strong px-6 py-10 text-center text-sm text-text-muted">
            <ScanLine aria-hidden className="mb-2 h-8 w-8 text-primary" />Chọn hội viên để xem tình trạng vé và buổi PT hôm nay.
          </div>}
      </Card>

      <Card flush title={tab === 'in' ? 'Đang trong phòng' : 'Nhật ký hôm nay'} badge={recent.data ? <Badge tone={tab === 'in' ? 'success' : 'neutral'}>{rows.length}</Badge> : null}
        actions={<Segmented label="Chế độ xem" value={tab} onChange={t => { setTab(t); setPage(1) }} items={[{ key: 'in', label: 'Đang trong phòng', count: inside.length }, { key: 'log', label: 'Nhật ký hôm nay', count: todayLog.length }]} />}>
        <Async state={recent} rows={6} empty={() => !rows.length && <EmptyBox icon={<Users className="h-5 w-5" />} title={tab === 'in' ? 'Không có ai trong phòng' : 'Chưa có lượt nào hôm nay'} />}>
          {() => <>{tab === 'in'
            ? <Table head={['Hội viên', 'Giờ vào', 'Đã ở', 'Buổi PT hôm nay', '']} minWidth={720}>{rows.slice((page - 1) * PAGE, page * PAGE).map(v => <InRoomRow key={v.id} v={v} pt={ptByMember.get(v.memberId)} onDone={reload} />)}</Table>
            : <Table head={['Hội viên', 'Vào', 'Ra', 'Thời lượng', 'Trạng thái']} minWidth={680} alignLast={false}>{rows.slice((page - 1) * PAGE, page * PAGE).map(v => <LogRow key={v.id} v={v} />)}</Table>}
            <Pagination page={page} pageSize={PAGE} total={rows.length} onChange={setPage} noun="lượt" /></>}
        </Async>
      </Card>
    </div>
  </div>
}

function LogRow({ v }: { v: Visit }) {
  const name = v.member?.fullName ?? 'Hội viên'
  return <tr>
    <td className={td}><Link to={`/receptionist/members/${v.memberId}`} className="flex items-center gap-3 hover:text-primary"><Person name={name} src={v.member?.avatarUrl} size={32} /><span><span className="block font-semibold">{name}</span><span className="text-xs text-text-muted">{v.member?.memberCode}</span></span></Link></td>
    <td className={`${td} tabular-nums`}>{hhmm(v.checkedInAt)}</td>
    <td className={`${td} tabular-nums`}>{v.checkedOutAt ? hhmm(v.checkedOutAt) : '—'}</td>
    <td className={`${td} tabular-nums`}>{stayed(v.checkedInAt, v.checkedOutAt ?? undefined)}</td>
    <td className={td}><Badge tone={v.status === 'OPEN' ? 'success' : v.status === 'AUTO_CLOSED' ? 'warning' : 'neutral'}>{v.status === 'OPEN' ? 'Đang tập' : v.status === 'AUTO_CLOSED' ? 'Tự đóng cuối ngày' : 'Đã ra'}</Badge></td>
  </tr>
}

/** Ticket status, today's PT sessions and the check-in action for one member. */
function CheckinPanel({ hit, openVisit, onClose, onDone }: { hit: PersonHit; openVisit?: Visit; onClose: () => void; onDone: (m: string) => void }) {
  const subs = useLoad(() => deskApi.subscriptions({ memberId: hit.id }, 1), [hit.id])
  const submit = useSubmit()
  const [result, setResult] = useState<CheckInResult | null>(null)
  const state = subs.data ? memberState(subs.data) : null
  const canEnter = state?.key === 'active' || state?.key === 'expiring'
  const checkIn = async () => { const r = await submit.run(() => deskApi.checkIn(hit.id)); if (r) { setResult(r); onDone(r.reused ? `${hit.name} đã ở trong phòng từ ${hhmm(r.checkedInAt)}.` : `Đã check-in ${hit.name}.`) } }
  return <div className="mt-5 rounded-xl border border-border-subtle p-4">
    <div className="flex items-start gap-3">
      <Person name={hit.name} src={hit.avatarUrl} size={48} />
      <div className="min-w-0 flex-1"><p className="font-semibold">{hit.name}</p><p className="text-xs text-text-muted">{hit.sub}</p>
        {state && <div className="mt-1.5 flex flex-wrap gap-1.5"><Badge tone={state.tone}>{state.label}</Badge>{state.sub && <Badge>{state.sub.planNameSnapshot} · đến {dmy(state.sub.endDate)}</Badge>}</div>}</div>
      <button type="button" onClick={onClose} aria-label="Bỏ chọn hội viên" className="rounded-lg p-1.5 text-text-muted hover:bg-bg-surface-muted"><X className="h-4 w-4" /></button>
    </div>
    {subs.error && <InlineError message={subs.error} />}
    {!subs.data && !subs.error && <Skeleton rows={1} className="px-0" />}
    {result ? <div role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
      <p className="flex items-center gap-2 font-semibold"><CheckCircle2 aria-hidden className="h-4 w-4" />{result.reused ? `Đã ở trong phòng từ ${hhmm(result.checkedInAt)}` : `Check-in thành công lúc ${hhmm(result.checkedInAt)}`}</p>
      {result.todaySessions.length > 0 && <ul className="mt-2 space-y-1">{result.todaySessions.map(s => <li key={s.id} className="flex items-center gap-2"><Clock aria-hidden className="h-3.5 w-3.5" />Buổi PT {hhmm(s.plannedStartsAt)} với {s.coach?.user?.fullName ?? 'Coach'} · {SESSION_LABEL[s.status] ?? s.status}</li>)}</ul>}
      {result.todaySessions.length > 0 && <p className="mt-2 text-xs">Ghi “Đã đến” cho buổi PT ở mục Lịch PT & điểm danh.</p>}
    </div> : <>
      {openVisit && <p className="mt-4 rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-800 dark:bg-sky-500/10 dark:text-sky-200">Hội viên đang trong phòng từ {hhmm(openVisit.checkedInAt)}.</p>}
      {state && !canEnter && <div className="mt-4 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" /><div><p className="font-semibold">Chưa có vé gym hiệu lực hôm nay</p><p>{state.key === 'pending' ? 'Vé đã tạo nhưng chưa thanh toán.' : 'Cần bán vé mới hoặc gia hạn trước khi cho vào.'}</p>
          <LinkBtn size="sm" variant="primary" className="mt-2" to={`/receptionist/membership-sale?memberId=${hit.id}`} icon={<Ticket aria-hidden className="h-3.5 w-3.5" />}>{state.key === 'pending' ? 'Thu tiền vé' : 'Bán vé'}</LinkBtn></div>
      </div>}
      <InlineError message={submit.code === 'MEMBERSHIP_REQUIRED' ? 'Hội viên chưa có vé gym còn hiệu lực hôm nay.' : submit.error} />
      <div className="mt-4 flex flex-wrap gap-2">
        <Btn variant="primary" className="flex-1" icon={<LogIn aria-hidden className="h-4 w-4" />} busy={submit.busy} disabled={!subs.data || !!openVisit} onClick={() => void checkIn()}>Xác nhận check-in</Btn>
        <LinkBtn to={`/receptionist/members/${hit.id}`}>Hồ sơ</LinkBtn>
      </div>
    </>}
  </div>
}
