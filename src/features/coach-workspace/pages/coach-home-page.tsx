import { CoachTrialRequests } from '../components/trial-requests'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CalendarDays, Check, Copy, Download, Eye, HeartPulse, Sparkles, TrendingDown, TrendingUp, Users, Wallet } from 'lucide-react'
import { useLoad } from '@/features/fixed-pt/hooks'
import type { Session } from '@/features/fixed-pt/types'
import { centerDate } from '@/shared/utils/date'
import { coachWs, type CoachPurchase } from '../api'
import { useCoachShell } from '../shell'
import { SessionActions } from '../components/session-actions'
import { Async, Badge, Btn, Card, Dot, EmptyBox, LinkBtn, PageHeader, Person, Segmented, Sparkline, StatTile, Table, td, useFlash } from '@/features/workspace/ui'
import {
  addDays, dayEnd, dayStart, downloadCsv, fmtMoney, fmtNumber, hhmm, isAbsent, isDone, isLive, isScheduled, isUpcoming, longDate, minutesBetween, num, relativeSlot,
  SESSION_LABEL, SESSION_TONE, signed,
} from '@/features/workspace/utils'

type Tab = 'all' | 'live' | 'upcoming' | 'done' | 'absent'
const TABS: { key: Tab; label: string; test: (s: Session) => boolean }[] = [
  { key: 'all', label: 'Tất cả', test: () => true },
  { key: 'live', label: 'Đang dạy', test: isLive },
  { key: 'upcoming', label: 'Sắp tới', test: isUpcoming },
  { key: 'done', label: 'Hoàn thành', test: isDone },
  { key: 'absent', label: 'Vắng', test: isAbsent },
]

export function CoachHomePage() {
  const { refreshBadges } = useCoachShell()
  const today = centerDate()
  const [tab, setTab] = useState<Tab>('all')
  const { flash, node } = useFlash()
  const sessions = useLoad(() => coachWs.sessions({ from: dayStart(today), to: dayEnd(today) }, 1), [today])
  const upcoming = useLoad(() => coachWs.sessions({ from: new Date().toISOString(), to: dayEnd(addDays(today, 14)) }, 2), [today])
  const purchases = useLoad(() => coachWs.purchases(), [])
  const summary = useLoad(() => coachWs.earningSummary(), [])
  const templates = useLoad(() => coachWs.templates(), [])
  const aiDrafts = useLoad(() => coachWs.aiDrafts(), [])

  const list = (sessions.data ?? []).filter(isScheduled)
  const counts = Object.fromEntries(TABS.map(t => [t.key, list.filter(t.test).length])) as Record<Tab, number>
  const rows = list.filter(TABS.find(t => t.key === tab)!.test)
  const active = (purchases.data ?? []).filter(p => p.status === 'ACTIVE')
  const activeMembers = new Set(active.map(p => p.memberId)).size
  const s = summary.data
  const payable = s ? (s.byStatus.ELIGIBLE?.amount ?? 0) + (s.byStatus.INCLUDED?.amount ?? 0) : null
  const pendingConfirm = s?.byStatus.PENDING_CONFIRMATION?.amount ?? 0

  const reloadAll = (message: string) => { flash(message); void sessions.reload(); void upcoming.reload(); void purchases.reload(); refreshBadges() }
  const exportToday = () => downloadCsv(`lich-day-${today}.csv`, ['Bắt đầu', 'Kết thúc', 'Học viên', 'Gói', 'Buổi', 'Trạng thái'],
    list.map(x => [hhmm(x.startsAt), hhmm(x.endsAt), x.memberName ?? '', x.purchase?.packageNameSnapshot ?? '', x.credit ? `${x.credit.creditIndex}/${x.purchase?.totalCredits ?? ''}` : '', SESSION_LABEL[x.status] ?? x.status]))

  return <div>
    <div className="mb-5"><CoachTrialRequests compact /></div>
    {node}
    <PageHeader title="Hôm nay của bạn"
      subtitle={<><span>{longDate(today)}</span><Dot /><span className="font-medium text-text-primary">{sessions.data ? (list.length ? `${list.length} ca dạy đã lên lịch` : 'Chưa có ca dạy hôm nay') : 'Đang tải lịch…'}</span></>}
      actions={<>
        <LinkBtn to="/coach/ai-recommendation" icon={<Sparkles aria-hidden className="h-4 w-4 text-violet-600" />}>Gợi ý AI {aiDrafts.data ? <Badge tone="violet">{aiDrafts.data} nháp</Badge> : null}</LinkBtn>
        <Btn title={!list.length ? 'Chưa có ca để xuất' : 'Tải lịch dạy hôm nay dạng CSV'} icon={<Download aria-hidden className="h-4 w-4" />} onClick={exportToday} disabled={!list.length}>Xuất lịch dạy</Btn>
      </>} />

    <CoachNextSteps />
    <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="min-w-0 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatTile label="Ca dạy hôm nay" icon={<CalendarDays className="h-[18px] w-[18px]" />} iconTone="info"
            value={sessions.data ? (list.length ? <>{counts.done}<span className="text-lg font-medium text-text-muted">/{list.length}</span></> : '—') : '—'} unit={sessions.data && list.length ? 'ca' : undefined}
            progress={sessions.data && list.length ? { value: counts.done, max: list.length } : undefined}
            hint={sessions.data ? (list.length ? `${counts.done} đã xong · ${counts.live} đang dạy` : 'Mở lịch tuần để xem và xếp ca') : undefined} />
          <StatTile label="Học viên đang quản lý" icon={<Users className="h-[18px] w-[18px]" />} iconTone="violet"
            value={purchases.data ? activeMembers : '—'} unit="người" hint={purchases.data ? `${active.length} gói PT đang dạy` : undefined} />
          <StatTile label="Thu nhập chờ chi trả" icon={<Wallet className="h-[18px] w-[18px]" />} iconTone="success" tone="success"
            value={payable === null ? '—' : fmtNumber(payable)} unit="₫"
            hint={s ? <>{pendingConfirm > 0 && <Badge tone="warning">{fmtMoney(pendingConfirm)} chờ xác nhận</Badge>}<span>Đã nhận {fmtMoney(s.paidOut)}</span></> : undefined} />
        </div>

        <Card flush title="Lịch dạy & Điểm danh hôm nay" badge={sessions.data ? <Badge>{list.length} ca</Badge> : null}
          subtitle={<span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Lễ tân ghi học viên đến; Coach bắt đầu và kết thúc ca để tính buổi.</span>}
          actions={<Segmented label="Lọc ca dạy" value={tab} onChange={setTab} items={TABS.map(t => ({ key: t.key, label: t.label, count: counts[t.key] }))} />}>
          <Async state={sessions} rows={5} empty={() => rows.length ? false : <EmptyBox title={list.length ? 'Không có ca ở trạng thái này' : 'Hôm nay chưa có ca dạy'} hint={list.length ? undefined : 'Mở lịch tuần để xem buổi sắp tới, hoặc mở giờ làm việc để học viên chọn khi mua gói.'} action={!list.length && <div className="flex flex-wrap justify-center gap-2"><LinkBtn to="/coach/schedule" size="sm">Xem lịch tuần</LinkBtn><LinkBtn to="/coach/slots" size="sm" variant="soft">Mở khung giờ làm việc</LinkBtn></div>} />}>
            {() => <Table head={['Khung giờ', 'Học viên', 'Gói PT', 'Buổi tập', 'Trạng thái', '']} minWidth={920}>
              {rows.map(x => { const mins = minutesBetween(x.startsAt, x.endsAt); const left = isLive(x) ? minutesBetween(new Date().toISOString(), x.endsAt) : null
                return <tr key={x.id} className="hover:bg-bg-surface-muted/40">
                  <td className={td}><p className="whitespace-nowrap font-semibold tabular-nums">{hhmm(x.startsAt)} – {hhmm(x.endsAt)}</p><p className="whitespace-nowrap text-xs text-text-muted">{mins} phút{left !== null && left > 0 ? ` · còn ${left}'` : ''}</p></td>
                  <td className={td}><Link to={`/coach/sessions/${x.id}`} className="flex items-center gap-3 hover:text-primary"><Person name={x.memberName} /><span><span className="block whitespace-nowrap font-semibold">{x.memberName}</span><span className="text-xs text-text-muted">{x.bookingCode}</span></span></Link></td>
                  <td className={td}><Badge tone="violet">{x.purchase?.packageNameSnapshot ?? x.courseName}</Badge></td>
                  <td className={td}><p>{x.credit ? `Buổi ${x.credit.creditIndex}/${x.purchase?.totalCredits ?? '?'}` : 'Buổi PT'}{x.isMakeup && <Badge tone="info" className="ml-2">Học bù</Badge>}</p>
                    <p className="text-xs text-text-muted">{x.arrivedAt ? `Đã đến ${hhmm(x.arrivedAt)}` : x.courseName}{x.actualStartedAt ? ` · bắt đầu ${hhmm(x.actualStartedAt)}` : ''}</p></td>
                  <td className={td}><Badge tone={SESSION_TONE[x.status]} dot={isLive(x)}>{SESSION_LABEL[x.status] ?? x.status}</Badge></td>
                  <td className={`${td} text-right`}><div className="flex items-center justify-end gap-1.5"><SessionActions compact session={x} onDone={reloadAll} /><LinkBtn size="sm" variant="ghost" to={`/coach/sessions/${x.id}`} icon={<Eye aria-hidden className="h-4 w-4" />}><span className="sr-only">Mở buổi {x.memberName}</span></LinkBtn></div></td>
                </tr> })}
            </Table>}
          </Async>
        </Card>
      </div>

      <div className="grid min-w-0 content-start gap-6 lg:grid-cols-2 2xl:grid-cols-1">
        <AttentionCard purchases={purchases} upcoming={upcoming.data} />
        <Card flush title="Lối tắt giáo án mẫu" subtitle="Nhân bản về thư viện của bạn để chỉnh rồi áp vào ca tập">
          <Async state={templates} rows={4} empty={t => !t.length && <EmptyBox title="Chưa có giáo án mẫu" action={<LinkBtn size="sm" to="/coach/library">Mở thư viện</LinkBtn>} />}>
            {t => <><ul className="divide-y divide-border-subtle">{t.slice(0, 5).map(x => <li key={x.id} className="flex items-center gap-3 px-5 py-3">
              <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><HeartPulse className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{x.name}</p><p className="truncate text-xs text-text-muted">{x.items.length} bài tập{x.focus ? ` · ${x.focus}` : ''}{x.coachId ? '' : ' · mẫu hệ thống'}</p></div>
              <DuplicateButton id={x.id} name={x.name} onDone={m => { flash(m); void templates.reload() }} />
            </li>)}</ul>
              <div className="border-t border-border-subtle p-3 text-center"><LinkBtn size="sm" to="/coach/library">Xem tất cả trong Thư viện ({t.length})</LinkBtn></div></>}
          </Async>
        </Card>
      </div>
    </div>
  </div>
}

function DuplicateButton({ id, name, onDone }: { id: string; name: string; onDone: (m: string) => void }) {
  const [busy, setBusy] = useState(false)
  return <Btn size="sm" busy={busy} icon={<Copy aria-hidden className="h-3.5 w-3.5" />} aria-label={`Nhân bản ${name}`}
    onClick={async () => { setBusy(true); try { await coachWs.duplicateTemplate(id); onDone(`Đã nhân bản “${name}” vào thư viện của bạn.`) } catch (e) { onDone(e instanceof Error ? e.message : 'Không nhân bản được.') } finally { setBusy(false) } }}>Nhân bản</Btn>
}

type Flag = { label: string; tone: 'warning' | 'danger' | 'info' }
/** Members whose active package needs action: few sessions left, close to expiry, health notes, or nothing booked. */
function attention(purchases: CoachPurchase[], upcoming: Session[] | null) {
  const today = centerDate()
  return purchases.filter(p => p.status === 'ACTIVE').map(p => {
    const remaining = p.totalCredits - p.consumedCredits
    const next = upcoming?.find(s => s.purchaseId === p.id && isUpcoming(s)) ?? null
    const flags: Flag[] = []
    if (remaining <= 2) flags.push({ label: `Còn ${remaining} buổi`, tone: 'warning' })
    if (!p.seriesMode && p.expiresAt && centerDate(p.expiresAt) <= addDays(today, 14)) flags.push({ label: `Hạn gói ${centerDate(p.expiresAt).slice(8, 10)}/${centerDate(p.expiresAt).slice(5, 7)}`, tone: 'danger' })
    if (upcoming && !next && p.availableCredits > 0) flags.push({ label: 'Chưa có buổi sắp tới', tone: 'info' })
    return { p, next, flags, remaining }
  }).filter(x => x.flags.length || x.p.medicalNotes)
    .sort((a, b) => (a.next ? new Date(a.next.startsAt).getTime() : Infinity) - (b.next ? new Date(b.next.startsAt).getTime() : Infinity))
}

function CoachNextSteps() {
  return <Card className="mb-6" title="Lộ trình & đánh giá cuối buổi"><div className="flex flex-wrap gap-3"><LinkBtn to="/coach/progress?tab=goals">Mở lộ trình học viên</LinkBtn><LinkBtn to="/coach/progress?tab=results">Ghi số đo và nhận xét cuối buổi</LinkBtn></div></Card>
}

function AttentionCard({ purchases, upcoming }: { purchases: { data: CoachPurchase[] | null; loading: boolean; error: string | null; reload: () => void }; upcoming: Session[] | null }) {
  const list = useMemo(() => attention(purchases.data ?? [], upcoming), [purchases.data, upcoming])
  return <Card flush title="Việc cần xử lý" badge={purchases.data ? <Badge tone={list.length ? 'warning' : 'success'}>{list.length}</Badge> : null} subtitle="Học viên chưa có lịch, gói sắp hết hoặc có lưu ý sức khỏe">
    <Async state={purchases} rows={3} empty={() => !list.length && <EmptyBox title="Không có gói cần nhắc ở mục này" hint="Xem mục tiêu, phiếu và phản ánh trong danh sách công việc để kiểm tra các việc còn lại." icon={<Check className="h-5 w-5" />} />}>
      {() => <ul className="divide-y divide-border-subtle">{list.slice(0, 4).map(({ p, next, flags }) => <li key={p.id} className="space-y-2.5 px-5 py-4">
        <div className="flex items-start gap-3">
          <Person name={p.memberName} src={p.avatarUrl} size={40} />
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2"><Link to={`/coach/students/${p.memberId}`} className="font-semibold hover:text-primary">{p.memberName}</Link><Badge tone="violet">{p.packageNameSnapshot}</Badge></p>
            <p className="mt-0.5 text-xs text-text-muted">{next ? <>Ca tiếp theo <span className="font-semibold text-text-primary">{relativeSlot(next.startsAt)}</span>{next.credit ? ` · Buổi ${next.credit.creditIndex}/${p.totalCredits}` : ''}</> : `${p.consumedCredits}/${p.totalCredits} buổi đã dùng`}</p>
          </div>
          <MemberTrend memberId={p.memberId} />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">{flags.map(f => <Badge key={f.label} tone={f.tone}>{f.label}</Badge>)}{flags.some(f => f.label === 'Chưa có buổi sắp tới') && <LinkBtn to="/coach/schedule" size="sm" variant="soft">Xếp lịch</LinkBtn>}</div>
        {p.medicalNotes && <p className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"><AlertTriangle aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span><span className="font-semibold">Lưu ý sức khỏe:</span> {p.medicalNotes}</span></p>}
      </li>)}</ul>}
    </Async>
  </Card>
}

/** Weight trend from the member's body assessments (only rendered when there are at least two). */
function MemberTrend({ memberId }: { memberId: string }) {
  const progress = useLoad(() => coachWs.progress(memberId), [memberId])
  const series = (progress.data?.assessments ?? []).map(a => num(a.weightKg)).filter((v): v is number => v !== null).slice(-8)
  if (series.length < 2) return null
  const delta = series.at(-1)! - series[0]!
  return <div className="hidden shrink-0 text-right sm:block" title={`Cân nặng ${series.length} lần đo gần nhất`}>
    <Sparkline values={series} />
    <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-text-muted">{delta <= 0 ? <TrendingDown aria-hidden className="h-3 w-3" /> : <TrendingUp aria-hidden className="h-3 w-3" />}{signed(delta)} kg · {series.length} lần đo</p>
  </div>
}
