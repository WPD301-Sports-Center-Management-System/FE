import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, BarChart3, CalendarDays, ClipboardCheck, Download, FileSpreadsheet, LifeBuoy, Scale, TrendingDown, TrendingUp, Users, Wallet, Wrench } from 'lucide-react'
import { Modal } from '@/shared/components/ui/modal'
import { useLoad, useSubmit } from '@/features/fixed-pt/hooks'
import { centerDate } from '@/shared/utils/date'
import { downloadBlob } from '@/shared/utils/download'
import { AreaChart, ChartLegend, SERIES_COLORS, StackedBarChart } from '@/features/workspace/charts'
import { Badge, Btn, Card, Dot, InlineError, PageHeader, Skeleton, StatTile, useFlash } from '@/features/workspace/ui'
import { fmtMoney, fmtNumber, longDate, weekdayOf } from '@/features/workspace/utils'
import { deskApi } from '@/features/reception-workspace/api'
import { mgrApi } from '../api'
import { useMgrShell } from '../shell'

const monthStart = (ym: string) => `${ym}-01`
const monthEnd = (ym: string) => { const [y, m] = ym.split('-').map(Number); return `${ym}-${String(new Date(Date.UTC(y!, m!, 0)).getUTCDate()).padStart(2, '0')}` }
const shiftMonth = (ym: string, n: number) => { const [y, m] = ym.split('-').map(Number); const d = new Date(Date.UTC(y!, m! - 1 + n, 1)); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}` }
const millions = (v: number) => `${fmtNumber(v / 1_000_000, v >= 10_000_000 ? 0 : 1)}tr`

export function MgrHomePage() {
  const { counts, pendingApprovals, refresh } = useMgrShell()
  const { flash, node } = useFlash()
  const [quickReviewOpen, setQuickReviewOpen] = useState(false)
  const today = centerDate()
  const ym = today.slice(0, 7)
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => shiftMonth(ym, i - 11)), [ym])
  const thisMonth = useLoad(() => mgrApi.revenue(monthStart(ym), today), [ym, today])
  const lastMonth = useLoad(() => mgrApi.revenue(monthStart(shiftMonth(ym, -1)), monthEnd(shiftMonth(ym, -1))), [ym])
  const yearly = useLoad(() => Promise.all(months.map(m => mgrApi.revenue(monthStart(m), m === ym ? today : monthEnd(m)))), [months.join(), today])
  const activeSubs = useLoad(() => mgrApi.subscriptions({ status: 'ACTIVE' }), [])
  const visits = useLoad(() => mgrApi.visits(10), [])
  const desk = useLoad(() => deskApi.dashboard(), [])
  const earnings = useLoad(() => mgrApi.earningSummary(), [])

  const rev = thisMonth.data, prev = lastMonth.data
  const monthRev = rev ? rev.membershipRevenue + rev.ptGross : null
  const prevRev = prev ? prev.membershipRevenue + prev.ptGross : null
  const mom = monthRev !== null && prevRev ? ((monthRev - prevRev) / prevRev) * 100 : null
  const activeMembers = activeSubs.data ? new Set(activeSubs.data.map(s => s.memberId)).size : null
  const ytd = (yearly.data ?? []).filter((_, i) => months[i]!.startsWith(ym.slice(0, 4))).reduce((n, r) => n + r.membershipRevenue + r.ptGross, 0)

  // Average check-ins per opening hour over the last 28 days, weekdays vs weekends.
  const peak = useMemo(() => {
    if (!visits.data) return null
    const since = new Date(Date.now() - 28 * 86_400_000).toISOString()
    const recent = visits.data.filter(v => v.checkedInAt >= since)
    const hours = Array.from({ length: 18 }, (_, i) => i + 5)
    const days = { wd: new Set<string>(), we: new Set<string>() }
    const count = { wd: new Array(18).fill(0) as number[], we: new Array(18).fill(0) as number[] }
    for (const v of recent) {
      const d = centerDate(v.checkedInAt); const wk = [0, 6].includes(weekdayOf(d)) ? 'we' : 'wd'
      const h = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit', hour12: false }).format(new Date(v.checkedInAt)))
      days[wk].add(d); if (h >= 5 && h <= 22) count[wk][h - 5]! += 1
    }
    const avg = (k: 'wd' | 'we') => count[k].map(n => days[k].size ? Math.round((n / days[k].size) * 10) / 10 : 0)
    const wd = avg('wd'), we = avg('we')
    const topWd = wd.indexOf(Math.max(...wd)), topWe = we.indexOf(Math.max(...we))
    return { labels: hours.map(h => `${h}h`), wd, we, total: recent.length, perDay: recent.length / 28, topIndex: topWd, top: hours[topWd]!, topWe: hours[topWe]!, peakWd: wd[topWd]!, peakWe: we[topWe]! }
  }, [visits.data])

  const pendingEarnings = earnings.data?.byStatus.PENDING_CONFIRMATION
  return <div className="flex flex-col">
    {node}
    <PageHeader title="Hôm nay tại trung tâm" subtitle={<><span>{longDate(today)}</span><Dot /><span>{counts ? `${fmtNumber(counts.coaches)} Coach · ${fmtNumber(counts.members)} hội viên` : 'Đang tải…'}</span><Dot /><span>Doanh thu tính theo tiền đã thu và áp vào đơn</span></>}
      actions={<ExportBtn type="revenue" label="Xuất báo cáo tháng" from={monthStart(ym)} to={today} primary />} />

    <div className="order-1 mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
      <StatTile label={`Doanh thu tháng ${ym.slice(5)}`} icon={<Wallet className="h-[18px] w-[18px]" />} iconTone="success" value={monthRev === null ? '—' : fmtNumber(monthRev / 1_000_000, 1)} unit="triệu ₫"
        hint={mom === null ? (rev ? `${rev.paymentCount} giao dịch` : undefined) : <span className={`inline-flex items-center gap-1 ${mom >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600'}`}>{mom >= 0 ? <TrendingUp aria-hidden className="h-3.5 w-3.5" /> : <TrendingDown aria-hidden className="h-3.5 w-3.5" />}{mom >= 0 ? '+' : ''}{fmtNumber(mom, 1)}% so với cả tháng trước</span>} />
      <StatTile label="Hội viên có vé hiệu lực" icon={<Users className="h-[18px] w-[18px]" />} iconTone="info" value={activeMembers === null ? '—' : <>{fmtNumber(activeMembers)}<span className="text-lg font-medium text-text-muted">/{fmtNumber(counts?.members ?? 0)}</span></>}
        hint={activeMembers !== null && counts?.members ? `${fmtNumber((activeMembers / counts.members) * 100, 1)}% tổng hội viên · ${desk.data?.expiringSubscriptions ?? '—'} vé hết hạn ≤ 7 ngày` : undefined} />
      <StatTile label="Buổi PT hôm nay" icon={<CalendarDays className="h-[18px] w-[18px]" />} iconTone="violet" value={counts?.bookingsToday ?? '—'} hint={counts ? `${counts.sessionsNeedingReview} buổi đang chờ kiểm tra` : undefined} />
      <StatTile label="Thu nhập Coach chờ chi" icon={<Scale className="h-[18px] w-[18px]" />} iconTone="warning" value={rev ? fmtNumber(rev.coachEligibleUnpaid / 1_000_000, 1) : '—'} unit="triệu ₫"
        hint={rev ? `Đã chi ${millions(rev.coachPaidOut)} · tạm giữ ${millions(rev.coachOnHold)}` : undefined} />
    </div>

    <div className="order-3 grid gap-6 xl:grid-cols-2">
      <Card title="Doanh thu theo kênh" subtitle="12 tháng gần nhất · tiền đã thu và áp vào đơn" badge={yearly.data ? <Badge>Từ đầu năm {millions(ytd)}</Badge> : null}>
        {yearly.error ? <p role="alert" className="text-sm text-red-600">{yearly.error}</p> : !yearly.data ? <Skeleton rows={6} className="p-0" /> : <>
          <ChartLegend items={[
            { label: 'Vé gym', color: SERIES_COLORS[0], value: rev ? millions(rev.membershipRevenue) : undefined, note: `T${Number(ym.slice(5))}` },
            { label: 'Gói PT', color: SERIES_COLORS[1], value: rev ? millions(rev.ptGross) : undefined, note: `T${Number(ym.slice(5))}` },
          ]} />
          <StackedBarChart title="Doanh thu vé gym và gói PT theo tháng" labels={months.map(m => `T${Number(m.slice(5))}`)} partial={11} format={v => millions(v)}
            series={[{ key: 'gym', label: 'Vé gym', values: yearly.data.map(r => r.membershipRevenue) }, { key: 'pt', label: 'Gói PT', values: yearly.data.map(r => r.ptGross) }]} />
        </>}
        {rev && <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3 text-xs text-text-muted">
          <span className="inline-flex items-center gap-2"><span aria-hidden className="h-3 w-3 rounded-sm bg-[repeating-linear-gradient(45deg,#EA580C_0_2px,#fdba74_2px_4px)]" />Cột có vạch chéo: tháng {Number(ym.slice(5))} tính tới hôm nay</span>
          <span>Chờ đối soát: <span className={`font-semibold tabular-nums ${rev.pendingReconciliation ? 'text-amber-700 dark:text-amber-400' : 'text-text-primary'}`}>{fmtMoney(rev.pendingReconciliation)}</span></span>
        </div>}
      </Card>
      <Card title="Khung giờ tập cao điểm" subtitle="Lượt check-in trung bình mỗi giờ · 28 ngày gần nhất" badge={peak?.total ? <Badge>{fmtNumber(peak.perDay, 1)} lượt/ngày</Badge> : null}>
        {visits.error ? <p role="alert" className="text-sm text-red-600">{visits.error}</p> : !peak ? <Skeleton rows={6} className="p-0" /> : !peak.total ? <p className="py-16 text-center text-sm text-text-muted">Chưa có lượt check-in trong 28 ngày qua.</p> : <>
          <ChartLegend items={[
            { label: 'Ngày thường', color: SERIES_COLORS[0], value: `${peak.top}h`, note: `cao điểm · ${fmtNumber(peak.peakWd, 1)} lượt` },
            { label: 'Cuối tuần', color: SERIES_COLORS[1], value: peak.peakWe > 0 ? `${peak.topWe}h` : '—', note: peak.peakWe > 0 ? `cao điểm · ${fmtNumber(peak.peakWe, 1)} lượt` : 'Chưa có lượt vào' },
          ]} />
          <AreaChart title="Lượt check-in trung bình theo giờ, ngày thường và cuối tuần" labels={peak.labels} format={v => fmtNumber(v, v > 0 && v < 10 ? 1 : 0)}
            mark={{ index: peak.topIndex, label: `Cao điểm ${peak.top}h` }}
            series={[{ key: 'wd', label: 'Ngày thường', values: peak.wd }, { key: 'we', label: 'Cuối tuần', values: peak.we }]} />
        </>}
        {peak && peak.total > 0 && <p className="mt-4 border-t border-border-subtle pt-3 text-xs text-text-muted">{fmtNumber(peak.total)} lượt check-in trong 28 ngày (tính trên 1.000 lượt gần nhất) · giờ mở cửa 5h–22h</p>}
      </Card>
    </div>

    <div className="order-2 mb-6 grid gap-6 xl:grid-cols-2">
      <Card flush title="Cần xử lý hôm nay" subtitle="Tổng hợp từ các phân hệ">
        <ul className="divide-y divide-border-subtle">
          <Todo to="/manager/pt-board?tab=review" icon={<AlertTriangle className="h-4 w-4" />} tone="text-red-600 bg-red-50 dark:bg-red-500/10" title="Buổi PT cần kiểm tra" n={counts?.sessionsNeedingReview} hint="Qua giờ chưa có kết quả hoặc đang dạy quá giờ" action="Xử lý" />
          <Todo to="/manager/approvals" icon={<ClipboardCheck className="h-4 w-4" />} tone="text-violet-600 bg-violet-50 dark:bg-violet-500/10" title="Coach chờ duyệt khóa / gói PT" n={pendingApprovals ?? undefined} hint="Đăng ký dạy khóa và đề xuất gói mới" action="Duyệt" onQuickAction={() => setQuickReviewOpen(true)} />
          <Todo to="/manager/coach-income?tab=pending" icon={<Wallet className="h-4 w-4" />} tone="text-amber-600 bg-amber-50 dark:bg-amber-500/10" title="Thu nhập Coach chờ xác nhận" n={pendingEarnings?.count} hint={pendingEarnings ? `${fmtMoney(pendingEarnings.amount)} từ buổi vắng / hủy muộn` : 'Buổi vắng, hủy muộn cần Manager công nhận'} action="Xác nhận" />
          <Todo to="/manager/payments?tab=reconciliation" icon={<Scale className="h-4 w-4" />} tone="text-sky-600 bg-sky-50 dark:bg-sky-500/10" title="Hồ sơ đối soát tiền nhận" n={counts?.openReconciliation} hint="Tiền đã nhận nhưng chưa áp vào đơn" action="Mở" />
          <Todo to="/manager/equipment" icon={<Wrench className="h-4 w-4" />} tone="text-orange-600 bg-orange-50 dark:bg-orange-500/10" title="Thiết bị bảo trì / ngưng hoạt động" n={counts?.equipmentIssues} hint="Thiết bị đang không phục vụ hội viên" action="Chi tiết" />
          <Todo to="/manager/support" icon={<LifeBuoy className="h-4 w-4" />} tone="text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" title="Yêu cầu hỗ trợ đang mở" n={desk.data?.openSupportRequests} hint="Lễ tân đang xử lý — theo dõi tồn đọng" action="Xem" />
        </ul>
      </Card>
      <Card flush title="Báo cáo nhanh" subtitle={`Số liệu tháng ${ym.slice(5)}/${ym.slice(0, 4)} · xuất CSV hoặc Excel`}>
        <ul className="divide-y divide-border-subtle">
          {[['revenue', 'Báo cáo doanh thu', rev ? `Đã thu ${millions(rev.totalReceived)} · áp vào đơn ${millions(rev.appliedToOrders)}` : 'Theo kênh và trạng thái áp đơn'],
            ['pt-packages', 'Gói PT & số buổi', 'Gói đã bán, buổi đã dùng / còn lại'],
            ['bookings', 'Buổi PT theo kết quả', 'Hoàn thành / vắng / hủy'],
            ['coaches', 'Hiệu suất Coach', 'Số buổi, đánh giá trung bình'],
            ['equipment', 'Thiết bị theo trạng thái', 'Hoạt động / bảo trì / ngưng']].map(([type, title, hint]) => <li key={type} className="flex flex-wrap items-center gap-3 px-5 py-3">
            <span aria-hidden className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><BarChart3 className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1"><p className="font-semibold">{title}</p><p className="text-xs text-text-muted">{hint}</p></div>
            <ExportBtn type={type!} label="CSV" from={monthStart(ym)} to={today} /><ExportBtn type={type!} label="Excel" format="xlsx" from={monthStart(ym)} to={today} />
          </li>)}
        </ul>
        <div className="border-t border-border-subtle px-5 py-3 text-right"><Link to="/manager/reports" className="text-sm font-semibold text-primary hover:underline">Mở trang báo cáo chi tiết</Link></div>
      </Card>
    </div>
    {quickReviewOpen && <QuickReviewModal open={quickReviewOpen} onClose={() => setQuickReviewOpen(false)} onDone={m => { flash(m); refresh() }} />}
  </div>
}

function Todo({ to, icon, tone, title, n, hint, action, onQuickAction }: { to: string; icon: ReactNode; tone: string; title: string; n?: number; hint: string; action: string; onQuickAction?: () => void }) {
  return <li className="flex items-center gap-3 px-5 py-3.5">
    <span aria-hidden className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tone}`}>{icon}</span>
    <div className="min-w-0 flex-1"><p className="flex items-center gap-2 font-semibold">{title}<Badge tone={n ? 'warning' : 'neutral'}>{n ?? '—'}</Badge></p><p className="text-xs text-text-muted">{hint}</p></div>
    {onQuickAction && (n ?? 0) > 0 ? (
      <button type="button" onClick={onQuickAction} className="rounded-lg border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/15">Duyệt nhanh</button>
    ) : (
      <Link to={to} className="rounded-lg border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/15">{action}</Link>
    )}
  </li>
}

function QuickReviewModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: (m: string) => void }) {
  const options = useLoad(() => mgrApi.options('PENDING'), [open], open)
  const submit = useSubmit()
  const pendingOptions = (options.data ?? []).filter(o => o.coachId)
  return (
    <Modal isOpen={open} onClose={onClose} title="Duyệt nhanh gói tùy chỉnh của Coach">
      <div className="space-y-4">
        {options.error ? (
          <InlineError message={options.error} />
        ) : !options.data ? (
          <Skeleton rows={3} />
        ) : !pendingOptions.length ? (
          <div className="py-8 text-center text-sm text-text-muted">Không có gói nào đang chờ duyệt.</div>
        ) : (
          <ul className="max-h-96 divide-y divide-border-subtle overflow-y-auto">
            {pendingOptions.map(p => (
              <li key={p.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-text-muted">{p.coach?.user?.fullName ?? 'Coach'} · {p.sessionCount} buổi · {fmtMoney(p.price)} · {p.validityDays} ngày</p>
                </div>
                <div className="flex items-center gap-2">
                  <Btn
                    size="sm"
                    variant="primary"
                    busy={submit.busy}
                    onClick={async () => {
                      await submit.run(() => mgrApi.approveOption(p.id))
                      onDone(`Đã duyệt gói ${p.name}!`)
                      void options.reload()
                    }}
                  >
                    Duyệt
                  </Btn>
                  <Btn
                    size="sm"
                    variant="outline"
                    busy={submit.busy}
                    onClick={async () => {
                      await submit.run(() => mgrApi.rejectOption(p.id, 'Chưa phù hợp với định hướng trung tâm'))
                      onDone(`Đã từ chối gói ${p.name}.`)
                      void options.reload()
                    }}
                  >
                    Từ chối
                  </Btn>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center justify-between border-t border-border-subtle pt-3">
          <Link to="/manager/approvals" onClick={onClose} className="text-xs font-semibold text-primary hover:underline">
            Mở toàn bộ trang duyệt hồ sơ Coach & gói →
          </Link>
          <Btn size="sm" variant="ghost" onClick={onClose}>Đóng</Btn>
        </div>
      </div>
    </Modal>
  )
}

function ExportBtn({ type, label, format = 'csv', from, to, primary }: { type: string; label: string; format?: 'csv' | 'xlsx'; from: string; to: string; primary?: boolean }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  return <span className="inline-flex flex-col items-end">
    <Btn size={primary ? 'md' : 'sm'} variant={primary ? 'primary' : 'outline'} busy={busy} icon={primary ? <Download aria-hidden className="h-4 w-4" /> : <FileSpreadsheet aria-hidden className="h-3.5 w-3.5" />}
      onClick={async () => { setBusy(true); setError(null); try { await downloadBlob(await mgrApi.exportReport(type, format, from, to), `${type}-${from.slice(0, 7)}.${format}`) } catch (e) { setError(e instanceof Error ? e.message : 'Không xuất được.') } finally { setBusy(false) } }}>{label}</Btn>
    {error && <span role="alert" className="mt-1 text-xs text-red-600">{error}</span>}
  </span>
}
