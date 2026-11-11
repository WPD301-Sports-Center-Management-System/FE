import { QrScanner } from '@/features/fixed-pt/components/qr-scanner'
import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Clock, LogIn, LogOut, ScanLine, Ticket, Timer, Users, X } from 'lucide-react'
import { useLoad, useSubmit } from '@/features/fixed-pt/hooks'
import { centerDate } from '@/shared/utils/date'
import { PersonSearch, type PersonHit } from '@/features/workspace/person-search'
import { Async, Badge, Btn, Card, Dot, EmptyBox, InlineError, LinkBtn, PageHeader, Pagination, Person, Segmented, Skeleton, StatTile, Table, td, useFlash } from '@/features/workspace/ui'
import { dayEnd, dayStart, fmtMoney, hhmm, minutesBetween, SESSION_LABEL } from '@/features/workspace/utils'
import { deskApi, type CheckInResult, type Visit } from '../api'
import { useDeskShell } from '../shell'
import { dmy, memberState } from '../labels'
import { InRoomCards, InRoomRow, stayed } from './desk-home-page'

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

  return <div className="flex flex-col">
    {node}
    <PageHeader title="Vào / ra phòng tập" subtitle={<><span>Quầy lễ tân</span><Dot /><span>Vé gym cần còn hiệu lực trong ngày vào tập</span></>} />
    <div className="order-2 mt-6 grid grid-cols-2 gap-4 xl:order-1 xl:mb-6 xl:mt-0 xl:grid-cols-4">
      <StatTile label="Lượt vào hôm nay" icon={<LogIn className="h-[18px] w-[18px]" />} iconTone="info" value={counts?.checkinsToday ?? '—'} unit="lượt" />
      <StatTile label="Đang trong phòng" icon={<Users className="h-[18px] w-[18px]" />} iconTone="success" tone="success" value={counts?.insideGym ?? '—'} unit="người" />
      <StatTile label="Lượt ra hôm nay" icon={<LogOut className="h-[18px] w-[18px]" />} iconTone="violet" value={recent.data ? outToday.length : '—'} unit="lượt" hint="Tính trên 300 lượt gần nhất" />
      <StatTile label="Thời lượng trung bình" icon={<Timer className="h-[18px] w-[18px]" />} iconTone="warning" value={avg === null ? '—' : avg >= 60 ? `${Math.floor(avg / 60)}g ${avg % 60}p` : `${avg}p`} hint="Các lượt đã ra về hôm nay" />
    </div>

    <div className="order-1 grid items-start gap-6 xl:order-2 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card title="Ghi nhận hội viên vào tập" subtitle="Tìm hội viên để kiểm tra vé tập">
        <PersonSearch className="" label="Tìm hội viên để vào tập" placeholder="Tên hoặc số điện thoại hội viên" find={find} onPick={setPicked} />
        {picked ? <CheckinPanel key={picked.id} hit={picked} openVisit={inside.find(v => v.memberId === picked.id)} onClose={() => setPicked(null)} onDone={m => { reload(m) }} />
          : <div className="mt-6 flex flex-col items-center rounded-xl border border-dashed border-border-strong px-6 py-10 text-center text-sm text-text-muted">
            <ScanLine aria-hidden className="mb-2 h-8 w-8 text-primary" />Chọn hội viên để xem tình trạng vé và buổi PT hôm nay.
          </div>}
        <details className="mt-5 border-t border-border-subtle pt-3">
          <summary className="cursor-pointer rounded-lg py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-focus-ring">Dùng mã QR hoặc mã 6 số</summary>
          <QrScanner onDone={reload} />
        </details>
      </Card>

      <Card flush title={tab === 'in' ? 'Đang trong phòng' : 'Nhật ký hôm nay'} badge={recent.data ? <Badge tone={tab === 'in' ? 'success' : 'neutral'}>{rows.length}</Badge> : null}
        actions={<Segmented label="Chế độ xem" value={tab} onChange={t => { setTab(t); setPage(1) }} items={[{ key: 'in', label: 'Đang trong phòng', count: inside.length }, { key: 'log', label: 'Nhật ký hôm nay', count: todayLog.length }]} />}>
        <Async state={recent} rows={6} empty={() => !rows.length && <EmptyBox icon={<Users className="h-5 w-5" />} title={tab === 'in' ? 'Không có ai trong phòng' : 'Chưa có lượt nào hôm nay'} />}>
          {() => <>{tab === 'in'
            ? <><InRoomCards visits={rows.slice((page - 1) * PAGE, page * PAGE)} sessions={ptByMember} onDone={reload} /><div className="hidden 2xl:block"><Table head={['Hội viên', 'Giờ vào', 'Đã ở', 'Buổi PT hôm nay', '']} minWidth={720}>{rows.slice((page - 1) * PAGE, page * PAGE).map(v => <InRoomRow key={v.id} v={v} pt={ptByMember.get(v.memberId)} onDone={reload} />)}</Table></div></>
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
  const plans = useLoad(() => deskApi.plans(), [])
  const submit = useSubmit()
  const quickSubmit = useSubmit()
  const [quickBuy, setQuickBuy] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState('')
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
      <p className="mt-2 text-xs">Coach có thể mở buổi PT đã chọn và bấm Bắt đầu khi đủ điều kiện.</p>
    </div> : <>
      {openVisit && <p className="mt-4 rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-800 dark:bg-sky-500/10 dark:text-sky-200">Hội viên đang trong phòng từ {hhmm(openVisit.checkedInAt)}.</p>}
      {state && !canEnter && <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        <div className="flex gap-2">
          <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Chưa có vé gym hiệu lực hôm nay</p>
            <p>{state.key === 'pending' ? 'Vé đã tạo nhưng chưa thanh toán.' : 'Cần bán vé mới, gia hạn hoặc ngoại lệ PT đã được Manager duyệt.'} Hệ thống sẽ kiểm tra lại khi xác nhận vào tập.</p>
            {!quickBuy ? (
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <Btn size="sm" variant="primary" icon={<Ticket aria-hidden className="h-3.5 w-3.5" />} onClick={() => setQuickBuy(true)}>
                  {state.key === 'pending' ? 'Thu tiền & Cho vào tập' : 'Gia hạn nhanh & Cho vào tập'}
                </Btn>
                <LinkBtn size="sm" variant="outline" to={`/receptionist/membership-sale?memberId=${hit.id}`}>
                  Mở trang bán đầy đủ
                </LinkBtn>
              </div>
            ) : (
              <div className="mt-3 rounded-lg border border-amber-300 bg-bg-surface p-3 text-text-primary shadow-xs">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Bán vé nhanh 1 chạm</p>
                {state.key === 'pending' && state.sub ? (
                  <div className="mb-3 text-xs">
                    <span>Thu tiền vé: <b>{state.sub.planNameSnapshot}</b> · </span>
                    <span className="font-bold tabular-nums text-primary">{fmtMoney(Number(state.sub.priceSnapshot))}</span>
                  </div>
                ) : (
                  <div className="mb-3 space-y-1">
                    <label className="block text-xs font-medium text-text-muted">Chọn gói tập</label>
                    <select
                      className="w-full rounded-md border border-border-strong bg-bg-surface px-2.5 py-1.5 text-xs focus:border-primary focus:outline-hidden"
                      value={selectedPlanId || plans.data?.[0]?.id || ''}
                      onChange={e => setSelectedPlanId(e.target.value)}
                      disabled={quickSubmit.busy}
                    >
                      {(plans.data ?? []).filter(p => p.isActive).map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.paidMonths} tháng{p.bonusMonths ? ` +${p.bonusMonths}T` : ''}) — {fmtMoney(p.price)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <InlineError message={quickSubmit.error} />
                <div className="mt-2 flex items-center gap-2">
                  <Btn
                    size="sm"
                    variant="primary"
                    busy={quickSubmit.busy}
                    icon={<LogIn aria-hidden className="h-3.5 w-3.5" />}
                    onClick={async () => {
                      const chosenPlan = (plans.data ?? []).find(p => p.id === (selectedPlanId || plans.data?.[0]?.id))
                      if (!chosenPlan && state.key !== 'pending') return
                      const r = await quickSubmit.run(async () => {
                        let subId = state.key === 'pending' && state.sub ? state.sub.id : undefined
                        const price = state.key === 'pending' && state.sub ? Number(state.sub.priceSnapshot) : Number(chosenPlan!.price)
                        if (!subId) {
                          const newSub = await deskApi.createSubscription({ memberId: hit.id, planId: chosenPlan!.id })
                          subId = newSub.id
                        }
                        await deskApi.payCounter({ subscriptionId: subId, method: 'CASH', receivedAmount: price })
                        const checkinRes = await deskApi.checkIn(hit.id)
                        return { checkinRes, planName: chosenPlan?.name ?? state.sub?.planNameSnapshot ?? 'vé gym' }
                      })
                      if (r) {
                        setResult(r.checkinRes)
                        onDone(`Đã thu tiền gói ${r.planName} và check-in cho ${hit.name}!`)
                        void subs.reload()
                        setQuickBuy(false)
                      }
                    }}
                  >
                    Bán vé & Vào tập ngay
                  </Btn>
                  <Btn size="sm" variant="ghost" disabled={quickSubmit.busy} onClick={() => setQuickBuy(false)}>
                    Hủy
                  </Btn>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>}
      <InlineError message={submit.code === 'MEMBERSHIP_REQUIRED' ? 'Hội viên chưa có vé gym còn hiệu lực hôm nay.' : submit.error} />
      <div className="mt-4 flex flex-wrap gap-2">
        <Btn variant="primary" className="flex-1" icon={<LogIn aria-hidden className="h-4 w-4" />} busy={submit.busy} disabled={!subs.data || !!openVisit} onClick={() => void checkIn()}>Xác nhận vào tập</Btn>
        <LinkBtn to={`/receptionist/members/${hit.id}`}>Hồ sơ</LinkBtn>
      </div>
    </>}
  </div>
}
