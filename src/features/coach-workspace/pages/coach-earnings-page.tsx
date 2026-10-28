import { useMemo, useState } from 'react'
import { BadgeCheck, CalendarCheck, Download, Hourglass, Star, Wallet } from 'lucide-react'
import { useLoad } from '@/features/fixed-pt/hooks'
import type { EarningLine } from '@/features/fixed-pt/types'
import { centerDate } from '@/shared/utils/date'
import { coachWs } from '../api'
import { Async, Badge, Btn, Card, Dot, EmptyBox, PageHeader, Pagination, ProgressBar, Segmented, StatTile, Table, td, toneText } from '@/features/workspace/ui'
import { downloadCsv, fmtMillions, fmtMoney, fmtNumber, holdReasonLabel, isoWeek, mondayOf, addDays, shortDate, type Tone } from '@/features/workspace/utils'

const STATUS: Record<string, { label: string; tone: Tone }> = {
  PENDING_CONFIRMATION: { label: 'Chờ xác nhận', tone: 'warning' }, ELIGIBLE: { label: 'Đủ điều kiện', tone: 'info' }, ON_HOLD: { label: 'Tạm giữ', tone: 'danger' },
  INCLUDED: { label: 'Đã vào kỳ chi', tone: 'violet' }, PAID: { label: 'Đã chi', tone: 'success' }, SETTLED_BY_ADVANCE: { label: 'Cấn trừ tạm ứng', tone: 'neutral' }, VOIDED: { label: 'Đã hủy', tone: 'neutral' },
}
const OUTCOME: Record<string, string> = { COMPLETED: 'Buổi PT đã hoàn thành', NO_SHOW: 'Học viên vắng (vẫn tính buổi)', CANCELLED_LATE: 'Học viên hủy muộn (vẫn tính buổi)' }
const PERIOD: Record<string, { label: string; tone: Tone }> = { DRAFT: { label: 'Đang lập', tone: 'neutral' }, LOCKED: { label: 'Đã chốt', tone: 'info' }, PAID: { label: 'Đã chi trả', tone: 'success' }, CANCELLED: { label: 'Đã hủy', tone: 'neutral' } }
const PAGE = 10
const amount = (l: EarningLine) => Number(l.amount) || 0
const dayOf = (l: EarningLine) => centerDate(l.booking.plannedStartsAt)
const dmy = (iso?: string | null) => iso ? centerDate(iso).split('-').reverse().join('/') : '—'

export function CoachEarningsWorkspacePage() {
  const summary = useLoad(() => coachWs.earningSummary(), [])
  const lines = useLoad(() => coachWs.earnings(), [])
  const periods = useLoad(() => coachWs.payoutPeriods(), [])
  const all = lines.data ?? []
  const effective = all.filter(l => l.effective && l.status !== 'VOIDED')
  const months = useMemo(() => [...new Set([centerDate().slice(0, 7), ...effective.map(l => dayOf(l).slice(0, 7))])].sort().reverse(), [effective])
  const [month, setMonth] = useState(() => centerDate().slice(0, 7))
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const s = summary.data
  const payable = s ? (s.byStatus.ELIGIBLE?.amount ?? 0) + (s.byStatus.INCLUDED?.amount ?? 0) : null
  const inMonth = effective.filter(l => dayOf(l).startsWith(month))
  const monthTotal = inMonth.reduce((n, l) => n + amount(l), 0)
  const avg = effective.length ? effective.reduce((n, l) => n + amount(l), 0) / effective.length : null
  const bySource = Object.entries(inMonth.reduce<Record<string, { n: number; sum: number }>>((m, l) => { const k = l.outcome; m[k] = { n: (m[k]?.n ?? 0) + 1, sum: (m[k]?.sum ?? 0) + amount(l) }; return m }, {}))
  const thisMonday = mondayOf(centerDate())
  const weeks = Array.from({ length: 6 }, (_, i) => addDays(thisMonday, (i - 5) * 7)).map(w => ({ w, end: addDays(w, 6), sum: effective.filter(l => dayOf(l) >= w && dayOf(l) <= addDays(w, 6)).reduce((n, l) => n + amount(l), 0) }))
  const maxWeek = Math.max(1, ...weeks.map(w => w.sum))
  const filtered = filter === 'all' ? all : all.filter(l => l.status === filter)
  const shown = filtered.slice((page - 1) * PAGE, page * PAGE)
  const [y, mo] = month.split('-')
  const exportCsv = () => downloadCsv(`thu-nhap-${month}.csv`, ['Ngày buổi', 'Mã buổi', 'Học viên', 'Gói', 'Buổi', 'Kết quả', 'Số tiền', 'Trạng thái'],
    filtered.map(l => [dmy(l.booking.plannedStartsAt), l.booking.bookingCode, l.purchase.member.user.fullName, l.purchase.packageNameSnapshot, l.credit.creditIndex, OUTCOME[l.outcome] ?? l.outcome, amount(l), STATUS[l.status]?.label ?? l.status]))

  return <div>
    <PageHeader title="Thu nhập Coach" subtitle={<><span>Tính theo từng buổi đã dạy, đối soát theo kỳ chi trả</span><Dot /><span>Tháng đang xem: {mo}/{y}</span></>}
      actions={<>
        <label><span className="sr-only">Chọn tháng</span><select value={month} onChange={e => setMonth(e.target.value)} className="h-9 rounded-lg border border-border-subtle bg-bg-input px-2 text-sm">{months.map(m => <option key={m} value={m}>Tháng {m.slice(5)}/{m.slice(0, 4)}</option>)}</select></label>
        <Btn icon={<Download aria-hidden className="h-4 w-4" />} onClick={exportCsv} disabled={!filtered.length}>Xuất báo cáo</Btn>
      </>} />
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile label={`Ghi nhận tháng ${mo}`} icon={<Wallet className="h-[18px] w-[18px]" />} iconTone="success" tone="success" value={lines.data ? fmtNumber(monthTotal) : '—'} unit="₫" hint={lines.data ? `${inMonth.length} buổi được tính` : undefined} />
      <StatTile label="Chờ chi trả" icon={<Hourglass className="h-[18px] w-[18px]" />} iconTone="info" value={payable === null ? '—' : fmtNumber(payable)} unit="₫"
        hint={s ? <>{(s.byStatus.PENDING_CONFIRMATION?.amount ?? 0) > 0 && <Badge tone="warning">{fmtMoney(s.byStatus.PENDING_CONFIRMATION!.amount)} chờ xác nhận</Badge>}{(s.byStatus.ON_HOLD?.amount ?? 0) > 0 && <Badge tone="danger">{fmtMoney(s.byStatus.ON_HOLD!.amount)} tạm giữ</Badge>}</> : undefined} />
      <StatTile label="Đã nhận" icon={<BadgeCheck className="h-[18px] w-[18px]" />} iconTone="violet" value={s ? fmtNumber(s.paidOut) : '—'} unit="₫" hint={s && s.recoveryOutstanding > 0 ? <span className="text-red-600">Khấu trừ còn lại {fmtMoney(s.recoveryOutstanding)}</span> : 'Qua các kỳ đã chi'} />
      <StatTile label="Thu nhập / buổi TB" icon={<Star className="h-[18px] w-[18px]" />} iconTone="warning" value={avg === null ? '—' : fmtNumber(avg / 1000)} unit="nghìn ₫" hint={lines.data ? `${effective.length} buổi đã ghi nhận` : undefined} />
    </div>

    <div className="mb-6 grid gap-6 xl:grid-cols-2">
      <Card flush title={`Nguồn thu tháng ${mo}/${y}`} subtitle="Theo kết quả buổi; số tiền do hệ thống tính theo giá gói tại thời điểm mua">
        <Async state={lines} rows={4} empty={() => !inMonth.length && <EmptyBox icon={<CalendarCheck className="h-5 w-5" />} title="Chưa có buổi được tính trong tháng này" />}>
          {() => <><Table head={['Hạng mục', 'Số lượng', 'Đơn giá TB', 'Thành tiền']} minWidth={520}>
            {bySource.map(([k, v]) => <tr key={k}><td className={`${td} font-medium`}>{OUTCOME[k] ?? k}</td><td className={`${td} tabular-nums`}>{v.n} buổi</td><td className={`${td} tabular-nums`}>{fmtMoney(v.sum / v.n)}</td><td className={`${td} text-right font-semibold tabular-nums`}>{fmtMoney(v.sum)}</td></tr>)}
            {s && s.advanceRemaining > 0 && <tr><td className={`${td} font-medium`}>Tạm ứng còn cấn trừ</td><td className={td}>—</td><td className={td}>—</td><td className={`${td} text-right font-semibold tabular-nums text-red-600`}>−{fmtMoney(s.advanceRemaining)}</td></tr>}
          </Table>
            <div className="flex items-center justify-between border-t border-border-subtle px-5 py-4"><span className="text-sm text-text-muted">Tổng ghi nhận trong tháng</span><span className={`text-xl font-bold tabular-nums ${toneText.success}`}>{fmtMoney(monthTotal)}</span></div></>}
        </Async>
      </Card>
      <Card title="Thu nhập theo tuần" subtitle="6 tuần gần nhất, theo ngày diễn ra buổi (triệu ₫)">
        {!lines.data ? <div className="h-40 animate-pulse rounded-lg bg-bg-surface-muted" /> : <ul className="space-y-4">{weeks.map(w => <li key={w.w}>
          <div className="mb-1.5 flex justify-between text-sm"><span>Tuần {isoWeek(w.w)} · {shortDate(w.w)}–{shortDate(w.end)}</span><span className="font-semibold tabular-nums">{fmtMillions(w.sum)}</span></div>
          <ProgressBar value={w.sum} max={maxWeek} tone={w.w === thisMonday ? 'warning' : 'primary'} label={`Tuần ${isoWeek(w.w)}`} />
        </li>)}</ul>}
        <p className="mt-4 border-t border-dashed border-border-subtle pt-3 text-sm text-text-muted">Tuần hiện tại (màu vàng) chỉ gồm các buổi đã diễn ra.</p>
      </Card>
    </div>

    <Card flush className="mb-6" title="Chi tiết từng buổi" actions={<Segmented label="Lọc trạng thái" value={filter} onChange={f => { setFilter(f); setPage(1) }}
      items={[{ key: 'all', label: 'Tất cả', count: all.length }, ...['PENDING_CONFIRMATION', 'ELIGIBLE', 'ON_HOLD', 'INCLUDED', 'PAID'].map(k => ({ key: k, label: STATUS[k]!.label, count: all.filter(l => l.status === k).length }))]} />}>
      <Async state={lines} rows={5} empty={() => !filtered.length && <EmptyBox title="Không có dòng thu nhập" />}>
        {() => <><Table head={['Ngày buổi', 'Học viên', 'Gói · buổi', 'Kết quả', 'Trạng thái', 'Số tiền']} minWidth={900}>
          {shown.map(l => <tr key={l.id}>
            <td className={`${td} tabular-nums`}>{dmy(l.booking.plannedStartsAt)}<p className="text-xs text-text-muted">{l.booking.bookingCode}</p></td>
            <td className={td}>{l.purchase.member.user.fullName}<p className="text-xs text-text-muted">{l.purchase.member.memberCode}</p></td>
            <td className={td}>{l.purchase.packageNameSnapshot}<p className="text-xs text-text-muted">Buổi {l.credit.creditIndex}</p></td>
            <td className={td}>{OUTCOME[l.outcome] ?? l.outcome}{l.holdReason && <p className="text-xs text-red-600">{holdReasonLabel(l.holdReason)}</p>}</td>
            <td className={td}><Badge tone={STATUS[l.status]?.tone ?? 'neutral'}>{STATUS[l.status]?.label ?? l.status}</Badge>{!l.effective && <p className="mt-1 text-xs text-text-muted">kết quả đã đảo</p>}</td>
            <td className={`${td} text-right font-semibold tabular-nums ${l.effective ? '' : 'text-text-muted line-through'}`}>{fmtMoney(amount(l))}</td>
          </tr>)}
        </Table><Pagination page={page} pageSize={PAGE} total={filtered.length} onChange={setPage} noun="dòng" /></>}
      </Async>
    </Card>

    <Card flush title="Kỳ chi trả" subtitle="Manager lập và chốt kỳ; tiền chuyển theo mã tham chiếu">
      <Async state={periods} rows={3} empty={p => !p.length && <EmptyBox title="Chưa có kỳ chi trả" hint="Khi Manager lập kỳ chi, các khoản đủ điều kiện sẽ được đưa vào kỳ." />}>
        {p => <Table head={['Kỳ', 'Thời gian', 'Tổng', 'Cấn trừ', 'Thực nhận', 'Trạng thái']} minWidth={760}>
          {p.map(x => <tr key={x.id}>
            <td className={`${td} font-semibold`}>{x.code}</td><td className={`${td} tabular-nums`}>{dmy(x.periodFrom)} – {dmy(x.periodTo)}</td>
            <td className={`${td} tabular-nums`}>{fmtMoney(x.grossAmount)}</td><td className={`${td} tabular-nums text-red-600`}>{Number(x.offsetAmount) ? `−${fmtMoney(x.offsetAmount)}` : '—'}</td>
            <td className={`${td} font-semibold tabular-nums`}>{fmtMoney(x.netAmount)}</td>
            <td className={`${td} text-right`}><Badge tone={PERIOD[x.status]?.tone ?? 'neutral'}>{PERIOD[x.status]?.label ?? x.status}</Badge>{x.paidAt && <p className="mt-1 text-xs text-text-muted">{dmy(x.paidAt)}{x.transferRef ? ` · ${x.transferRef}` : ''}</p>}</td>
          </tr>)}
        </Table>}
      </Async>
    </Card>
  </div>
}
