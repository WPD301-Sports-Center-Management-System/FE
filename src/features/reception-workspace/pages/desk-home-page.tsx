import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, LifeBuoy, LogOut, ReceiptText, RotateCw, ScanLine, Ticket, UserPlus, Users } from 'lucide-react'
import { useAuth } from '@/features/auth/context/auth-context'
import { useLoad, useSubmit } from '@/features/fixed-pt/hooks'
import type { Session } from '@/features/fixed-pt/types'
import { centerDate } from '@/shared/utils/date'
import { Async, Badge, Btn, Card, Dot, EmptyBox, LinkBtn, PageHeader, Pagination, Person, Table, td, useFlash } from '@/features/workspace/ui'
import { dayEnd, dayStart, fmtNumber, hhmm, isUpcoming, longDate, minutesBetween, SESSION_LABEL, SESSION_TONE } from '@/features/workspace/utils'
import { deskApi, type Visit } from '../api'
import { useDeskShell } from '../shell'

const PAGE = 8
export const stayed = (from: string, to = new Date().toISOString()) => { const m = Math.max(0, minutesBetween(from, to)); return m >= 60 ? `${Math.floor(m / 60)}g ${m % 60}p` : `${m} phút` }

export function DeskHomePage() {
  const { user } = useAuth()
  const { counts, newTrials, refresh } = useDeskShell()
  const { flash, node } = useFlash()
  const today = centerDate()
  const visits = useLoad(() => deskApi.visits({ status: 'OPEN' }), [])
  const sessions = useLoad(() => deskApi.sessions({ from: dayStart(today), to: dayEnd(today) }, 2), [today])
  const paid = useLoad(() => deskApi.payments({ status: 'PAID' }, 1), [])
  const [page, setPage] = useState(1)
  const todayPaid = (paid.data ?? []).filter(p => p.paidAt && centerDate(p.paidAt) === today)
  const revenue = todayPaid.reduce((n, p) => n + Number(p.amount), 0)
  const list = sessions.data ?? []
  const live = list.filter(s => s.status === 'IN_PROGRESS').length
  const coming = list.filter(isUpcoming).filter(s => new Date(s.endsAt).getTime() > Date.now()).sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  const coachByMember = useMemo(() => new Map((sessions.data ?? []).filter(s => s.status !== 'COMPLETED').map(s => [s.memberId, s])), [sessions.data])
  const reload = (m?: string) => { if (m) flash(m); void visits.reload(); void sessions.reload(); void paid.reload(); refresh() }

  return <div>
    {node}
    <PageHeader title="Hôm nay tại quầy" subtitle={<><span>{longDate(today)}</span><Dot /><span>Lễ tân: <span className="font-medium text-text-primary">{user?.fullName}</span></span></>}
      actions={<><Btn icon={<RotateCw aria-hidden className="h-4 w-4" />} onClick={() => reload('Đã làm mới số liệu.')}>Làm mới</Btn><LinkBtn to="/receptionist/support" icon={<LifeBuoy aria-hidden className="h-4 w-4" />}>Hỗ trợ hội viên</LinkBtn></>} />

    <div className="mb-4 max-w-sm sm:hidden">
      <QuickAction to="/receptionist/check-in" icon={<ScanLine className="h-6 w-6" />} title="Ghi nhận vào tập" primary />
    </div>

    <dl className="mb-6 grid gap-4 rounded-xl border border-border-subtle bg-bg-surface px-5 py-4 sm:grid-cols-3 sm:divide-x sm:divide-border-subtle sm:gap-0">
      <div className="sm:pr-5"><dt className="text-sm text-text-muted">Khách đang trong phòng gym</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{counts?.insideGym ?? '—'} <span className="text-sm font-normal">người</span></dd>{counts && <p className="mt-1 text-xs text-text-muted">{counts.checkinsToday} lượt check-in hôm nay</p>}</div>
      <div className="sm:px-5"><dt className="text-sm text-text-muted">Ca PT hôm nay</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{sessions.data ? list.filter(s => !['CANCELLED_EARLY', 'COACH_CANCELLED', 'RESCHEDULED'].includes(s.status)).length : '—'}</dd>{sessions.data && <p className="mt-1 text-xs text-text-muted">{live} đang diễn ra · {coming.length} sắp tới · {list.filter(s => s.status === 'COMPLETED').length} xong · tối đa 200 buổi đã tải</p>}</div>
      <div className="sm:pl-5"><dt className="text-sm text-text-muted">Tiền đã thu hôm nay</dt><dd className="mt-1 text-xl font-semibold tabular-nums">{paid.data ? fmtNumber(revenue) : '—'} ₫</dd>{paid.data && <p className="mt-1 text-xs text-text-muted">{todayPaid.length} giao dịch · trong 100 giao dịch đã thanh toán gần nhất</p>}</div>
    </dl>

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Card flush title="Người đang trong phòng gym" subtitle="Tối đa 300 lượt đang mở đã tải" badge={visits.data ? <Badge tone="success" dot>{visits.data.length} đã tải</Badge> : null}
        actions={<LinkBtn size="sm" to="/receptionist/check-in">Ghi nhận vào / ra</LinkBtn>}>
        <Async state={visits} rows={5} empty={v => !v.length && <EmptyBox icon={<Users className="h-5 w-5" />} title="Phòng tập đang trống" />}>
          {v => <><InRoomCards visits={v.slice((page - 1) * PAGE, page * PAGE)} sessions={coachByMember} onDone={reload} /><div className="hidden 2xl:block"><Table head={['Hội viên', 'Giờ vào', 'Đã ở', 'Buổi PT hôm nay', '']} minWidth={720}>
            {v.slice((page - 1) * PAGE, page * PAGE).map(x => <InRoomRow key={x.id} v={x} pt={coachByMember.get(x.memberId)} onDone={reload} />)}
          </Table></div><Pagination page={page} pageSize={PAGE} total={v.length} onChange={setPage} noun="người" /></>}
        </Async>
      </Card>

      <div className="grid content-start gap-6 lg:grid-cols-2 xl:grid-cols-1">
        <Card flush title="Lịch hẹn PT sắp tới" badge={sessions.data ? <Badge>{coming.length} buổi</Badge> : null} actions={<LinkBtn size="sm" to="/receptionist/calendar">Cả ngày</LinkBtn>}>
          <Async state={sessions} rows={4} empty={() => !coming.length && <EmptyBox title="Không còn buổi PT nào hôm nay" />}>
            {() => <ul className="divide-y divide-border-subtle">{coming.slice(0, 6).map(s => <ApptRow key={s.id} s={s} onDone={reload} />)}</ul>}
          </Async>
        </Card>
        <Card title="Cần xử lý">
          <ul className="space-y-2">
            <Todo to="/receptionist/members?state=expiring" icon={<Ticket className="h-4 w-4" />} label="Vé gym hết hạn trong 7 ngày" n={counts?.expiringSubscriptions} />
            <Todo to="/receptionist/payments?status=PENDING" icon={<ReceiptText className="h-4 w-4" />} label="Giao dịch chờ thanh toán" n={counts?.pendingPayments} />
            <Todo to="/receptionist/support" icon={<LifeBuoy className="h-4 w-4" />} label="Yêu cầu hỗ trợ đang mở" n={counts?.openSupportRequests} />
            <Todo to="/receptionist/trial-requests" icon={<UserPlus className="h-4 w-4" />} label="Khách tập thử chưa gọi" n={newTrials ?? undefined} />
          </ul>
        </Card>
      </div>
    </div>
  </div>
}

function QuickAction({ to, icon, title, hint, primary }: { to: string; icon: ReactNode; title: string; hint?: string; primary?: boolean }) {
  return <Link to={to} className={`group flex items-center gap-3 rounded-xl border p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring/50 ${primary ? 'border-primary bg-primary/5 hover:bg-primary/10' : 'border-border-subtle bg-bg-surface hover:border-border-strong'}`}>
    <span aria-hidden className={`shrink-0 ${primary ? 'text-primary' : 'text-text-muted'}`}>{icon}</span>
    <span className="min-w-0 flex-1"><span className="block font-semibold">{title}</span>{hint && <span className="mt-1 block text-sm text-text-muted">{hint}</span>}</span>
    <ChevronRight aria-hidden className="h-5 w-5 shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5" />
  </Link>
}

function Todo({ to, icon, label, n }: { to: string; icon: ReactNode; label: string; n?: number }) {
  return <li><Link to={to} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-bg-surface-muted">
    <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-bg-surface-muted text-text-muted">{icon}</span>
    <span className="flex-1 text-sm">{label}</span>
    <Badge tone={n ? 'warning' : 'neutral'}>{n ?? '—'}</Badge>
  </Link></li>
}

export function InRoomRow({ v, pt, onDone }: { v: Visit; pt?: Session; onDone: (m: string) => void }) {
  const submit = useSubmit()
  const name = v.member?.fullName ?? 'Hội viên'
  return <tr className="hover:bg-bg-surface-muted/40">
    <td className={td}><Link to={`/receptionist/members/${v.memberId}`} className="flex items-center gap-3 hover:text-primary"><Person name={name} src={v.member?.avatarUrl} /><span><span className="block whitespace-nowrap font-semibold">{name}</span><span className="text-xs text-text-muted">{v.member?.memberCode}{v.member?.phone ? ` · ${v.member.phone}` : ''}</span></span></Link></td>
    <td className={`${td} tabular-nums`}>{hhmm(v.checkedInAt)}</td>
    <td className={`${td} tabular-nums`}>{stayed(v.checkedInAt)}</td>
    <td className={td}>{pt ? <><p className="whitespace-nowrap">{hhmm(pt.startsAt)} · {pt.coachName}</p><p className="text-xs text-text-muted">{SESSION_LABEL[pt.status]}</p></> : <span className="text-text-muted">—</span>}</td>
    <td className={`${td} text-right`}><Btn size="sm" icon={<LogOut aria-hidden className="h-3.5 w-3.5" />} busy={submit.busy} onClick={async () => { if (await submit.run(() => deskApi.checkOut(v.id))) onDone(`Đã ghi nhận ra về cho ${name}.`) }}>Ghi nhận ra về</Btn>
      {submit.error && <p role="alert" className="mt-1 text-xs text-red-600">{submit.error}</p>}</td>
  </tr>
}

export function InRoomCards({ visits, sessions, onDone }: { visits: Visit[]; sessions: Map<string, Session>; onDone: (m: string) => void }) {
  return <ul className="divide-y divide-border-subtle 2xl:hidden">{visits.map(v => <InRoomCard key={v.id} visit={v} session={sessions.get(v.memberId)} onDone={onDone} />)}</ul>
}

function InRoomCard({ visit: v, session, onDone }: { visit: Visit; session?: Session; onDone: (m: string) => void }) {
  const submit = useSubmit()
  const name = v.member?.fullName ?? 'Hội viên'
  return <li className="space-y-3 p-5">
    <Link to={`/receptionist/members/${v.memberId}`} className="flex items-center gap-3 rounded-lg hover:text-primary">
      <Person name={name} src={v.member?.avatarUrl} />
      <span className="min-w-0"><span className="block font-semibold">{name}</span><span className="block text-sm text-text-muted">{v.member?.phone ?? v.member?.memberCode}</span></span>
    </Link>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-text-muted">Vào lúc <span className="tabular-nums text-text-primary">{hhmm(v.checkedInAt)}</span> · đã tập {stayed(v.checkedInAt)}</p>
      <Btn size="sm" busy={submit.busy} onClick={async () => { if (await submit.run(() => deskApi.checkOut(v.id))) onDone(`Đã ghi nhận ra về cho ${name}.`) }}>Ghi nhận ra về</Btn>
    </div>
    {session && <p className="text-sm text-text-muted">PT {hhmm(session.startsAt)} · {session.coachName} · {SESSION_LABEL[session.status]}</p>}
    {submit.error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{submit.error}</p>}
  </li>
}

export function ApptRow({ s }: { s: Session; onDone: (m: string) => void }) {
  return <li className="flex items-center gap-3 px-5 py-3">
    <div className="w-14 shrink-0 text-center"><p className="font-bold tabular-nums">{hhmm(s.startsAt)}</p><p className="text-xs text-text-muted">{minutesBetween(s.startsAt, s.endsAt)}'</p></div>
    <div className="min-w-0 flex-1">
      <p className="flex flex-wrap items-center gap-2"><Link to={`/receptionist/members/${s.memberId}`} className="truncate font-semibold hover:text-primary">{s.memberName}</Link><Badge tone={SESSION_TONE[s.status]}>{s.status === 'CONFIRMED' ? 'Chưa bắt đầu' : SESSION_LABEL[s.status]}</Badge>{s.isMakeup && <Badge tone="violet">Học bù</Badge>}</p>
      <p className="truncate text-xs text-text-muted">với {s.coachName} · {s.courseName}{s.credit ? ` · buổi ${s.credit.creditIndex}/${s.purchase?.totalCredits ?? '?'}` : ''}</p>
    </div>
  </li>
}
