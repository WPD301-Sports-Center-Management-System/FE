import type React from 'react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Download, Eye, Package, TrendingUp } from 'lucide-react'
import { useLoad } from '@/features/fixed-pt/hooks'
import { centerDate } from '@/shared/utils/date'
import { coachWs, type CoachPurchase } from '../api'
import { CoachCatalog } from '@/features/fixed-pt/pages/package-catalog-page'
import { Async, Badge, Btn, Card, EmptyBox, LinkBtn, PageHeader, Pagination, Person, ProgressBar, Segmented, StatTile, Table, td } from '@/features/workspace/ui'
import { addDays, dayEnd, downloadCsv, fmtNumber, isUpcoming, PURCHASE_LABEL, relativeSlot, type Tone } from '@/features/workspace/utils'

const PAGE = 8
type Tab = 'PAUSED' | 'ACTIVE' | 'PENDING_PAYMENT' | 'ended' | 'all'
const TABS: { key: Tab; label: string; test: (p: CoachPurchase) => boolean }[] = [
  { key: 'ACTIVE', label: 'Đang dạy', test: p => p.status === 'ACTIVE' },
  { key: 'PAUSED', label: 'Tạm ngưng', test: p => p.status === 'PAUSED' },
  { key: 'PENDING_PAYMENT', label: 'Chờ thanh toán', test: p => p.status === 'PENDING_PAYMENT' },
  { key: 'ended', label: 'Đã kết thúc', test: p => ['COMPLETED', 'EXPIRED', 'CANCELLED'].includes(p.status) },
  { key: 'all', label: 'Tất cả', test: () => true },
]
const dmy = (iso?: string | null) => iso ? centerDate(iso).split('-').reverse().join('/') : '—'

type View = 'sold' | 'catalog'
/** Single "Gói PT" page (Docs/UX_AUDIT_IA_2026-11.md §2.1): packages for sale and packages students bought. */
export function CoachPackagesPage() {
  const [params, setParams] = useSearchParams()
  const view: View = params.get('view') === 'catalog' ? 'catalog' : 'sold'
  const switcher = <Segmented label="Chế độ xem" value={view} onChange={v => setParams(v === 'catalog' ? { view: v } : {}, { replace: true })} items={[{ key: 'sold' as const, label: 'Học viên đã mua' }, { key: 'catalog' as const, label: 'Gói mở bán' }]} />
  if (view === 'catalog') return <div>
    <PageHeader title="Gói PT" actions={switcher} />
    <CoachCatalog />
  </div>
  return <SoldPackages switcher={switcher} />
}

function SoldPackages({ switcher }: { switcher: React.ReactNode }) {
  const today = centerDate()
  const purchases = useLoad(() => coachWs.purchases(), [])
  const upcoming = useLoad(() => coachWs.sessions({ from: new Date().toISOString(), to: dayEnd(addDays(today, 45)) }, 5), [today])
  const [tab, setTab] = useState<Tab>('ACTIVE')
  const [page, setPage] = useState(1)
  const all = purchases.data ?? []
  const active = all.filter(p => p.status === 'ACTIVE')
  const remainingOf = (p: CoachPurchase) => p.totalCredits - p.consumedCredits
  const low = active.filter(p => remainingOf(p) <= 2)
  const totalRemaining = active.reduce((n, p) => n + remainingOf(p), 0)
  const consumed = all.reduce((n, p) => n + p.consumedCredits, 0)
  const byCourse = Object.entries(active.reduce<Record<string, number>>((m, p) => ({ ...m, [p.courseNameSnapshot ?? 'PT 1:1']: (m[p.courseNameSnapshot ?? 'PT 1:1'] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1])
  const nextOf = useMemo(() => { const m = new Map<string, NonNullable<typeof upcoming.data>[number]>(); for (const s of upcoming.data ?? []) if ((isUpcoming(s) || s.status === 'IN_PROGRESS') && !m.has(s.purchaseId)) m.set(s.purchaseId, s); return m }, [upcoming.data])
  const rows = all.filter(TABS.find(t => t.key === tab)!.test)
  const shown = rows.slice((page - 1) * PAGE, page * PAGE)
  const statusOf = (p: CoachPurchase): { label: string; tone: Tone } => p.status !== 'ACTIVE' ? { label: PURCHASE_LABEL[p.status] ?? p.status, tone: p.status === 'PENDING_PAYMENT' ? 'warning' : 'neutral' }
    : remainingOf(p) <= 2 ? { label: 'Sắp hết buổi', tone: 'warning' } : p.expiresAt && centerDate(p.expiresAt) <= addDays(today, 14) ? { label: 'Sắp hết hạn', tone: 'danger' } : { label: 'Đang dạy', tone: 'info' }
  const exportCsv = () => downloadCsv('goi-pt.csv', ['Mã gói', 'Học viên', 'Mã HV', 'Gói', 'Khóa', 'Đã dùng', 'Tổng', 'Dự kiến hoàn thành', 'Trạng thái'],
    rows.map(p => [p.purchaseCode, p.memberName, p.memberCode, p.packageNameSnapshot, p.courseNameSnapshot ?? 'PT 1:1', p.consumedCredits, p.totalCredits, dmy(p.expiresAt), statusOf(p).label]))

  return <div>
    <PageHeader title="Gói PT" subtitle="Số liệu từ tối đa 1.000 gói và 500 buổi sắp tới đã tải"
      actions={<>{switcher}<Btn icon={<Download aria-hidden className="h-4 w-4" />} onClick={exportCsv} disabled={!rows.length}>Xuất dữ liệu đã tải</Btn></>} />
    <div className="mb-6 grid grid-cols-2 rounded-xl border border-border-subtle bg-bg-surface xl:grid-cols-4 [&>div]:rounded-none [&>div]:border-0 [&>div]:bg-transparent [&>div]:p-4">
      <StatTile label="Gói đang dạy" icon={<Package className="h-[18px] w-[18px]" />} iconTone="info" value={purchases.data ? active.length : '—'} hint={byCourse.slice(0, 3).map(([c, n]) => `${n} ${c}`).join(' · ') || undefined} />
      <StatTile label="Buổi còn lại" icon={<CheckCircle2 className="h-[18px] w-[18px]" />} iconTone="violet" value={purchases.data ? totalRemaining : '—'} hint={active.length ? `Trung bình ${fmtNumber(totalRemaining / active.length, 1)} buổi / gói` : undefined} />
      <StatTile label="Sắp hết buổi" icon={<AlertTriangle className="h-[18px] w-[18px]" />} iconTone="warning" tone="warning" value={purchases.data ? low.length : '—'} hint="Còn ≤ 2 buổi" />
      <StatTile label="Buổi đã dạy" icon={<TrendingUp className="h-[18px] w-[18px]" />} iconTone="success" value={purchases.data ? fmtNumber(consumed) : '—'} hint={purchases.data ? `${all.filter(p => p.status === 'COMPLETED').length} gói đã hoàn thành` : undefined} />
    </div>
    <Card flush actions={<Segmented label="Lọc gói" value={tab} onChange={t => { setTab(t); setPage(1) }} items={TABS.map(t => ({ key: t.key, label: t.label, count: all.filter(t.test).length }))} />} title="Danh sách gói">
      <Async state={purchases} rows={6} empty={() => !rows.length && <EmptyBox icon={<Package className="h-5 w-5" />} title="Không có gói nào ở mục này" hint="Gói PT xuất hiện khi học viên mua gói của bạn." />}>
        {() => <><Table head={['Học viên', 'Gói PT', 'Tiến độ buổi', 'Buổi tiếp theo', 'Hoàn thành / hạn', 'Trạng thái', 'Thao tác']} minWidth={1000}>
          {shown.map(p => { const next = nextOf.get(p.id); const st = statusOf(p); return <tr key={p.id} className="hover:bg-bg-surface-muted/40">
            <td className={td}><Link to={`/coach/students/${p.memberId}`} className="flex items-center gap-3 hover:text-primary"><Person name={p.memberName} src={p.avatarUrl} /><span><span className="block font-semibold">{p.memberName}</span><span className="text-xs text-text-muted">{p.memberCode}</span></span></Link></td>
            <td className={td}><Badge tone="violet">{p.packageNameSnapshot}</Badge><p className="mt-1 text-xs text-text-muted">{p.courseNameSnapshot ?? 'PT 1:1'} · {p.purchaseCode}</p></td>
            <td className={td}><div className="flex items-center gap-2"><ProgressBar className="w-32" value={p.consumedCredits} max={p.totalCredits} tone={remainingOf(p) <= 2 ? 'warning' : 'primary'} label="Buổi đã dùng" /><span className="text-xs tabular-nums text-text-muted">{p.consumedCredits}/{p.totalCredits}</span></div>
              {p.reservedCredits > 0 && <p className="mt-0.5 text-xs text-text-muted">{p.reservedCredits} buổi đã xếp lịch</p>}</td>
            <td className={td}>{next ? <><p className="font-semibold">{relativeSlot(next.startsAt)}</p><p className="text-xs text-text-muted">{next.status === 'IN_PROGRESS' ? 'đang diễn ra' : next.arrivedAt ? 'học viên đã đến' : 'đã xác nhận'}</p></> : <span className="text-text-muted">Chưa có lịch sắp tới</span>}</td>
            <td className={`${td} tabular-nums`}>{dmy(p.seriesMode ? p.expectedCompletionAt : p.expiresAt)}{p.seriesMode && <p className="text-xs text-text-muted">dự kiến hoàn thành</p>}</td>
            <td className={td}><Badge tone={st.tone}>{st.label}</Badge></td>
            <td className={`${td} text-right`}><div className="flex justify-end gap-1.5">
              {next?.status === 'IN_PROGRESS' && <LinkBtn size="sm" variant="soft" to={`/coach/sessions/${next.id}`} icon={<Eye aria-hidden className="h-3.5 w-3.5" />}>Buổi hiện tại</LinkBtn>}
              <LinkBtn size="sm" variant={next?.status === 'IN_PROGRESS' ? 'outline' : 'soft'} to={`/coach/pt-purchases/${p.id}`} icon={<Eye aria-hidden className="h-3.5 w-3.5" />}>Chi tiết</LinkBtn>
            </div></td>
          </tr> })}
        </Table><Pagination page={page} pageSize={PAGE} total={rows.length} onChange={setPage} noun="gói" /></>}
      </Async>
    </Card>
  </div>
}
