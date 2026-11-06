import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CalendarClock, CreditCard, Download, Ticket, UserPlus, Users } from 'lucide-react'
import { useLoad } from '@/features/fixed-pt/hooks'
import { centerDate } from '@/shared/utils/date'
import { Async, Badge, Btn, Card, Dot, EmptyBox, LinkBtn, PageHeader, Pagination, Person, Segmented, StatTile, Table, td } from '@/features/workspace/ui'
import { downloadCsv, fmtMoney, fmtNumber, hhmm, PURCHASE_LABEL, type Tone } from '@/features/workspace/utils'
import { deskApi } from '@/features/reception-workspace/api'
import { daysUntil, dmy, SUB_LABEL, TRIAL_LABEL } from '@/features/reception-workspace/labels'
import { mgrApi } from '../api'
import { useMgrShell } from '../shell'

const PAGE = 10
type Order = { id: string; kind: 'gym' | 'pt'; memberId: string; name: string; value: number; at: string; until?: string | null; label: string; tone: Tone; progress?: string }
type Who = { name: string; code: string; phone?: string | null }

export function MgrMembersPage() {
  const { counts } = useMgrShell()
  const [params, setParams] = useSearchParams()
  const tab = (['orders', 'expiring', 'trials'] as const).find(t => t === params.get('tab')) ?? 'orders'
  const [kind, setKind] = useState<'all' | 'gym' | 'pt'>('all')
  const [page, setPage] = useState(1)
  const subs = useLoad(() => mgrApi.subscriptions({}, 5), [])
  const pts = useLoad(() => mgrApi.purchases({}, 5), [])
  const desk = useLoad(() => deskApi.dashboard(), [])
  const trials = useLoad(() => deskApi.trials(), [], tab === 'trials')
  const month = centerDate().slice(0, 7)

  const orders: Order[] = useMemo(() => [
    ...(subs.data ?? []).map(s => ({ id: s.id, kind: 'gym' as const, memberId: s.memberId, name: s.planNameSnapshot, value: Number(s.priceSnapshot), at: s.createdAt, until: s.endDate, label: SUB_LABEL[s.status].label, tone: SUB_LABEL[s.status].tone })),
    ...(pts.data ?? []).map(p => ({ id: p.id, kind: 'pt' as const, memberId: p.memberId, name: p.packageNameSnapshot, value: Number(p.priceSnapshot), at: p.createdAt, until: p.expiresAt, label: PURCHASE_LABEL[p.status] ?? p.status,
      tone: (p.status === 'ACTIVE' ? 'info' : p.status === 'PENDING_PAYMENT' ? 'warning' : 'neutral') as Tone, progress: p.status === 'ACTIVE' ? `${p.consumedCredits}/${p.totalCredits} buổi` : undefined })),
  ].sort((a, b) => b.at.localeCompare(a.at)), [subs.data, pts.data])
  const paid = orders.filter(o => !['Chờ thanh toán', 'Đã hủy'].includes(o.label))
  const thisMonth = paid.filter(o => centerDate(o.at).startsWith(month))
  const activeMembers = new Set((subs.data ?? []).filter(s => s.status === 'ACTIVE').map(s => s.memberId)).size
  const top = Object.entries(thisMonth.reduce<Record<string, number>>((m, o) => ({ ...m, [o.name]: (m[o.name] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1])[0]
  const expiring = (subs.data ?? []).filter(s => s.status === 'ACTIVE').map(s => ({ s, d: daysUntil(s.endDate) })).filter(x => x.d >= 0 && x.d <= 14).sort((a, b) => a.d - b.d)

  const rows = tab === 'orders' ? orders.filter(o => kind === 'all' || o.kind === kind) : []
  const visibleIds = tab === 'orders' ? rows.slice((page - 1) * PAGE, page * PAGE).map(o => o.memberId) : expiring.map(x => x.s.memberId).slice(0, 60)
  const key = [...new Set(visibleIds)].join(',')
  const people = useLoad(async () => new Map((await Promise.all(key.split(',').filter(Boolean).map(id => mgrApi.memberName(id).catch(() => null)))).filter((x): x is NonNullable<typeof x> => !!x).map(x => [x.id, x as Who])), [key], !!key)
  const who = (id: string) => people.data?.get(id)
  const setTab = (t: string) => { const p = new URLSearchParams(params); p.set('tab', t); setParams(p, { replace: true }); setPage(1) }
  const state = { data: subs.data && pts.data ? orders : null, loading: subs.loading || pts.loading, error: subs.error ?? pts.error, reload: () => { void subs.reload(); void pts.reload() } }

  return <div>
    <PageHeader title="Quản lý hội viên & gói đã mua" subtitle={<><span>{counts ? `${fmtNumber(counts.members)} hội viên` : '…'}</span><Dot /><span>Giá trị đơn tháng {month.slice(5)}: {fmtMoney(thisMonth.reduce((n, o) => n + o.value, 0))}</span></>}
      actions={<><LinkBtn to="/manager/membership-plans" icon={<Ticket aria-hidden className="h-4 w-4" />}>Bảng giá vé gym</LinkBtn>
        <Btn icon={<Download aria-hidden className="h-4 w-4" />} disabled={!rows.length} onClick={() => downloadCsv('don-hang.csv', ['Loại', 'Mã HV', 'Gói', 'Giá trị', 'Ngày mua', 'Hạn', 'Trạng thái'],
          rows.map(o => [o.kind === 'gym' ? 'Vé gym' : 'Gói PT', o.memberId, o.name, o.value, dmy(o.at), dmy(o.until), o.label]))}>Xuất CSV</Btn></>} />
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile label="Tổng hội viên" icon={<Users className="h-[18px] w-[18px]" />} iconTone="info" value={counts ? fmtNumber(counts.members) : '—'} hint={desk.data ? `${desk.data.checkinsToday} lượt check-in hôm nay` : undefined} />
      <StatTile label="Có vé gym hiệu lực" icon={<Ticket className="h-[18px] w-[18px]" />} iconTone="success" tone="success" value={subs.data ? fmtNumber(activeMembers) : '—'} hint={counts?.members && subs.data ? `${fmtNumber((activeMembers / counts.members) * 100, 1)}% tổng hội viên` : undefined} />
      <StatTile label="Giá trị đơn trung bình" icon={<CreditCard className="h-[18px] w-[18px]" />} iconTone="violet" value={thisMonth.length ? fmtNumber(thisMonth.reduce((n, o) => n + o.value, 0) / thisMonth.length / 1_000_000, 1) : '—'} unit="tr ₫" hint={top ? `Bán chạy tháng này: ${top[0]} (${top[1]})` : 'Chưa có đơn tháng này'} />
      <StatTile label="Vé hết hạn ≤ 7 ngày" icon={<CalendarClock className="h-[18px] w-[18px]" />} iconTone="warning" tone="warning" value={desk.data?.expiringSubscriptions ?? '—'} hint="Lễ tân gọi nhắc gia hạn" />
    </div>
    <Card flush>
      <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle p-4">
        <Segmented label="Mục" value={tab} onChange={setTab} items={[{ key: 'orders', label: 'Đơn đã mua', count: orders.length }, { key: 'expiring', label: 'Vé sắp hết hạn', count: expiring.length }, { key: 'trials', label: 'Tập thử' }]} />
        {tab === 'orders' && <Segmented label="Loại đơn" value={kind} onChange={k => { setKind(k); setPage(1) }} items={[{ key: 'all' as const, label: 'Tất cả' }, { key: 'gym' as const, label: 'Vé gym', count: (subs.data ?? []).length }, { key: 'pt' as const, label: 'Gói PT', count: (pts.data ?? []).length }]} />}
      </div>
      {tab === 'orders' && <Async state={state} rows={8} empty={() => !rows.length && <EmptyBox title="Chưa có đơn nào" />}>
        {() => <><Table head={['Hội viên', 'Gói đã mua', 'Giá trị', 'Ngày mua', 'Hạn', 'Trạng thái', '']} minWidth={980}>
          {rows.slice((page - 1) * PAGE, page * PAGE).map(o => { const w = who(o.memberId); return <tr key={`${o.kind}-${o.id}`} className="hover:bg-bg-surface-muted/40">
            <td className={td}><Link to={`/manager/members/${o.memberId}`} className="flex items-center gap-3 hover:text-primary"><Person name={w?.name} size={32} /><span><span className="block whitespace-nowrap font-semibold">{w?.name ?? '…'}</span><span className="text-xs text-text-muted">{w?.code}</span></span></Link></td>
            <td className={td}><Badge tone={o.kind === 'pt' ? 'success' : 'violet'}>{o.name}</Badge><p className="mt-0.5 text-xs text-text-muted">{o.kind === 'pt' ? 'Gói PT' : 'Vé gym'}</p></td>
            <td className={`${td} whitespace-nowrap font-semibold tabular-nums`}>{fmtMoney(o.value)}</td>
            <td className={`${td} tabular-nums`}>{dmy(o.at)}<p className="text-xs text-text-muted">{hhmm(o.at)}</p></td>
            <td className={`${td} tabular-nums`}>{dmy(o.until)}</td>
            <td className={td}><Badge tone={o.tone}>{o.progress ? `${o.label} · ${o.progress}` : o.label}</Badge></td>
            <td className={`${td} text-right`}><LinkBtn size="sm" to={`/manager/members/${o.memberId}`}>Chi tiết</LinkBtn></td>
          </tr> })}
        </Table><Pagination page={page} pageSize={PAGE} total={rows.length} onChange={setPage} noun="đơn" /></>}
      </Async>}
      {tab === 'expiring' && <Async state={subs} rows={6} empty={() => !expiring.length && <EmptyBox icon={<CalendarClock className="h-5 w-5" />} title="Không có vé hết hạn trong 14 ngày tới" />}>
        {() => <Table head={['Hội viên', 'Vé', 'Hết hạn', 'Liên hệ', '']} minWidth={760}>
          {expiring.map(({ s, d }) => { const w = who(s.memberId); return <tr key={s.id}>
            <td className={td}><Link to={`/manager/members/${s.memberId}`} className="flex items-center gap-3 hover:text-primary"><Person name={w?.name} size={32} /><span className="font-semibold">{w?.name ?? '…'}</span></Link></td>
            <td className={td}><Badge tone="violet">{s.planNameSnapshot}</Badge></td>
            <td className={td}><p className="tabular-nums">{dmy(s.endDate)}</p><Badge tone={d <= 3 ? 'danger' : 'warning'}>{d === 0 ? 'hôm nay' : `còn ${d} ngày`}</Badge></td>
            <td className={td}>{w?.phone ?? '—'}</td>
            <td className={`${td} text-right`}><LinkBtn size="sm" to={`/manager/members/${s.memberId}`}>Hồ sơ</LinkBtn></td>
          </tr> })}
        </Table>}
      </Async>}
      {tab === 'trials' && <Async state={trials} rows={6} empty={t => !t.length && <EmptyBox icon={<UserPlus className="h-5 w-5" />} title="Chưa có đăng ký tập thử" />}>
        {t => { const mine = t.filter(x => centerDate(x.createdAt).startsWith(month)); const conv = mine.filter(x => x.status === 'CONVERTED').length
          return <>
            <div className="grid gap-4 border-b border-border-subtle p-4 sm:grid-cols-3">
              <div><p className="text-xs text-text-muted">Hồ sơ tháng {month.slice(5)}</p><p className="text-2xl font-bold tabular-nums">{mine.length}</p></div>
              <div><p className="text-xs text-text-muted">Tỷ lệ chuyển thành hội viên</p><p className="text-2xl font-bold tabular-nums">{mine.length ? `${Math.round((conv / mine.length) * 100)}%` : '—'}</p><p className="text-xs text-text-muted">{conv}/{mine.length} hồ sơ</p></div>
              <div><p className="text-xs text-text-muted">Chưa được gọi lại</p><p className="text-2xl font-bold tabular-nums text-amber-700 dark:text-amber-400">{t.filter(x => x.status === 'NEW').length}</p></div>
            </div>
            <Table head={['Khách hàng', 'Quan tâm', 'Coach chọn', 'Đăng ký', 'Trạng thái', 'Ghi chú lễ tân']} minWidth={900} alignLast={false}>
              {t.slice(0, 30).map(x => <tr key={x.id}>
                <td className={td}><p className="font-semibold">{x.fullName}</p><p className="text-xs text-text-muted">{x.phone}</p></td>
                <td className={td}>{x.interest ?? '—'}</td><td className={td}>{x.coachName ?? '—'}</td>
                <td className={`${td} tabular-nums`}>{dmy(x.createdAt)}</td>
                <td className={td}><Badge tone={TRIAL_LABEL[x.status].tone}>{TRIAL_LABEL[x.status].label}</Badge></td>
                <td className={`${td} max-w-64 text-xs text-text-muted`}>{x.staffNote ?? '—'}</td>
              </tr>)}
            </Table>
            <div className="border-t border-border-subtle px-5 py-3 text-right"><Link to="/receptionist/trial-requests" className="text-sm font-semibold text-primary hover:underline">Xử lý ở quầy lễ tân</Link></div>
          </> }}
      </Async>}
    </Card>
  </div>
}
