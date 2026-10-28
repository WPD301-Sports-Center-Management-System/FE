import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { CalendarClock, Download, Search, Ticket, TicketX, UserPlus, Users } from 'lucide-react'
import { Modal } from '@/shared/components/ui/modal'
import { useLoad, useSubmit } from '@/features/fixed-pt/hooks'
import { Badge, Btn, Card, Dot, EmptyBox, ErrorBox, Field, InlineError, LinkBtn, PageHeader, Pagination, Person, Segmented, Skeleton, StatTile, Table, inputCls, td, useFlash } from '@/features/workspace/ui'
import { downloadCsv, fmtNumber } from '@/features/workspace/utils'
import { deskApi, type MemberProfile, type Subscription } from '../api'
import { useDeskShell } from '../shell'
import { daysUntil, dmy, memberState } from '../labels'

const PAGE = 10
type Row = { id: string; name: string; code: string; phone?: string | null; email?: string | null; avatarUrl?: string | null; subs: Subscription[] }

export function DeskMembersPage() {
  const { counts } = useDeskShell()
  const { flash, node } = useFlash()
  const [params, setParams] = useSearchParams()
  const view = params.get('state') === 'expiring' ? 'expiring' : 'all'
  const [q, setQ] = useState('')
  const [term, setTerm] = useState('')
  const [page, setPage] = useState(1)
  const [create, setCreate] = useState(false)
  useEffect(() => { const t = setTimeout(() => { setTerm(q.trim()); setPage(1) }, 300); return () => clearTimeout(t) }, [q])
  const members = useLoad(() => deskApi.members({ search: term, page, limit: PAGE }), [term, page], view === 'all')
  const live = useLoad(async () => [...await deskApi.subscriptions({ status: 'ACTIVE' }), ...await deskApi.subscriptions({ status: 'PENDING' }, 2)], [])
  const expiredTotal = useLoad(() => deskApi.subscriptionTotal('EXPIRED'), [])
  const subsByMember = useMemo(() => { const m = new Map<string, Subscription[]>(); for (const s of live.data ?? []) m.set(s.memberId, [...(m.get(s.memberId) ?? []), s]); return m }, [live.data])
  const activeCount = new Set((live.data ?? []).filter(s => s.status === 'ACTIVE').map(s => s.memberId)).size
  const rows: Row[] | null = members.data ? members.data.items.map(m => ({ id: m.id, name: m.user.fullName, code: m.memberCode, phone: m.user.phone, email: m.user.email, avatarUrl: m.user.avatarUrl, subs: subsByMember.get(m.id) ?? [] })) : null

  return <div>
    {node}
    <PageHeader title="Danh sách hội viên" subtitle={<><span>{counts ? `${fmtNumber(counts.activeMembers)} tài khoản hội viên` : 'Đang tải…'}</span><Dot /><span>Trạng thái vé tính theo vé gym còn hiệu lực</span></>}
      actions={<Btn variant="primary" icon={<UserPlus aria-hidden className="h-4 w-4" />} onClick={() => setCreate(true)}>Thêm hội viên</Btn>} />
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile label="Tổng hội viên" icon={<Users className="h-[18px] w-[18px]" />} iconTone="info" value={counts ? fmtNumber(counts.activeMembers) : '—'} hint="Tài khoản đang hoạt động" />
      <StatTile label="Có vé gym hiệu lực" icon={<Ticket className="h-[18px] w-[18px]" />} iconTone="success" tone="success" value={live.data ? fmtNumber(activeCount) : '—'} hint={counts && live.data && counts.activeMembers ? `${Math.round((activeCount / counts.activeMembers) * 100)}% tổng hội viên` : undefined} />
      <StatTile label="Sắp hết hạn ≤ 7 ngày" icon={<CalendarClock className="h-[18px] w-[18px]" />} iconTone="warning" tone="warning" value={counts?.expiringSubscriptions ?? '—'} hint="Nên gọi nhắc gia hạn" />
      <StatTile label="Vé đã hết hạn" icon={<TicketX className="h-[18px] w-[18px]" />} iconTone="danger" value={expiredTotal.data ?? '—'} hint="Tổng số vé đã hết hạn (lịch sử)" />
    </div>
    <Card flush>
      <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle p-4">
        <Segmented label="Chế độ xem" value={view} onChange={v => { const p = new URLSearchParams(params); if (v === 'all') p.delete('state'); else p.set('state', v); setParams(p, { replace: true }) }}
          items={[{ key: 'all', label: 'Tất cả hội viên' }, { key: 'expiring', label: 'Sắp hết hạn', count: counts?.expiringSubscriptions }]} />
        {view === 'all' && <label className="relative min-w-60 flex-1 sm:max-w-md"><span className="sr-only">Tìm hội viên</span><Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm theo tên, email hoặc số điện thoại…" className={`${inputCls} pl-9`} /></label>}
      </div>
      {view === 'expiring' ? <ExpiringList subs={live.data} error={live.error} /> :
        members.error ? <ErrorBox message={members.error} onRetry={() => void members.reload()} /> : !rows ? <Skeleton rows={6} /> : !rows.length
          ? <EmptyBox icon={<Users className="h-5 w-5" />} title={term ? 'Không tìm thấy hội viên' : 'Chưa có hội viên'} action={<Btn onClick={() => setCreate(true)}>Thêm hội viên</Btn>} />
          : <><Table head={['Hội viên', 'Mã số', 'Vé gym', 'Hết hạn', 'Trạng thái', 'Thao tác']} minWidth={960}>
            {rows.map(r => { const st = memberState(r.subs); const left = st.sub && st.key !== 'pending' ? daysUntil(st.sub.endDate) : null; return <tr key={r.id} className="hover:bg-bg-surface-muted/40">
              <td className={td}><Link to={`/receptionist/members/${r.id}`} className="flex items-center gap-3 hover:text-primary"><Person name={r.name} src={r.avatarUrl} /><span><span className="block font-semibold">{r.name}</span><span className="text-xs text-text-muted">{r.phone ?? r.email}</span></span></Link></td>
              <td className={`${td} tabular-nums`}>{r.code}</td>
              <td className={td}>{st.sub ? <Badge tone="violet">{st.sub.planNameSnapshot}</Badge> : <span className="text-text-muted">—</span>}</td>
              <td className={td}>{st.sub && st.key !== 'pending' ? <><p className="tabular-nums">{dmy(st.sub.endDate)}</p><p className="text-xs text-text-muted">{left !== null && left >= 0 ? `còn ${left} ngày` : 'đã hết hạn'}</p></> : <span className="text-text-muted">—</span>}</td>
              <td className={td}><Badge tone={st.key === 'none' ? 'neutral' : st.tone}>{st.key === 'none' ? 'Không có vé hiệu lực' : st.label}</Badge></td>
              <td className={`${td} text-right`}><div className="flex justify-end gap-1.5"><LinkBtn size="sm" variant="soft" to={`/receptionist/members/${r.id}`}>Hồ sơ</LinkBtn>
                {(st.key === 'expiring' || st.key === 'none' || st.key === 'pending') && <LinkBtn size="sm" to={`/receptionist/membership-sale?memberId=${r.id}`}>{st.key === 'expiring' ? 'Gia hạn' : st.key === 'pending' ? 'Thu tiền' : 'Bán vé'}</LinkBtn>}</div></td>
            </tr> })}
          </Table><Pagination page={page} pageSize={PAGE} total={members.data?.total ?? 0} onChange={setPage} noun="hội viên" /></>}
    </Card>
    <CreateMemberModal open={create} onClose={() => setCreate(false)} onDone={m => { flash(m); void members.reload() }} />
  </div>
}

/** Members whose active ticket ends within 7 days (names loaded per member). */
function ExpiringList({ subs, error }: { subs: Subscription[] | null; error: string | null }) {
  const soon = (subs ?? []).filter(s => s.status === 'ACTIVE').map(s => ({ s, d: daysUntil(s.endDate) })).filter(x => x.d >= 0 && x.d <= 7).sort((a, b) => a.d - b.d)
  const ids = soon.map(x => x.s.memberId).join(',')
  const people = useLoad(async () => new Map((await Promise.all(ids.split(',').filter(Boolean).slice(0, 60).map(id => deskApi.member(id).catch(() => null)))).filter((m): m is MemberProfile => !!m).map(m => [m.id, m])), [ids], !!subs)
  if (error) return <ErrorBox message={error} />
  if (!subs || !people.data) return <Skeleton rows={5} />
  if (!soon.length) return <EmptyBox icon={<CalendarClock className="h-5 w-5" />} title="Không có vé nào hết hạn trong 7 ngày tới" />
  const exportCsv = () => downloadCsv('ve-sap-het-han.csv', ['Mã HV', 'Họ tên', 'SĐT', 'Vé', 'Hết hạn', 'Còn (ngày)'], soon.map(({ s, d }) => { const m = people.data!.get(s.memberId); return [m?.memberCode ?? '', m?.user.fullName ?? '', m?.user.phone ?? '', s.planNameSnapshot, dmy(s.endDate), d] }))
  return <><div className="flex justify-end px-4 pt-3"><Btn size="sm" icon={<Download aria-hidden className="h-3.5 w-3.5" />} onClick={exportCsv}>Xuất danh sách gọi</Btn></div>
    <Table head={['Hội viên', 'Vé gym', 'Hết hạn', 'Liên hệ', 'Thao tác']} minWidth={820}>
      {soon.map(({ s, d }) => { const m = people.data!.get(s.memberId); return <tr key={s.id}>
        <td className={td}><Link to={`/receptionist/members/${s.memberId}`} className="flex items-center gap-3 hover:text-primary"><Person name={m?.user.fullName} /><span><span className="block font-semibold">{m?.user.fullName ?? s.memberId.slice(0, 8)}</span><span className="text-xs text-text-muted">{m?.memberCode}</span></span></Link></td>
        <td className={td}><Badge tone="violet">{s.planNameSnapshot}</Badge></td>
        <td className={td}><p className="tabular-nums">{dmy(s.endDate)}</p><Badge tone={d <= 3 ? 'danger' : 'warning'}>{d === 0 ? 'hết hạn hôm nay' : `còn ${d} ngày`}</Badge></td>
        <td className={td}>{m?.user.phone ? <a href={`tel:${m.user.phone}`} className="font-medium text-primary hover:underline">{m.user.phone}</a> : '—'}</td>
        <td className={`${td} text-right`}><LinkBtn size="sm" variant="soft" to={`/receptionist/membership-sale?memberId=${s.memberId}`}>Gia hạn</LinkBtn></td>
      </tr> })}
    </Table></>
}

export function CreateMemberModal({ open, onClose, onDone, initial }: { open: boolean; onClose: () => void; onDone: (m: string, memberId?: string) => void; initial?: Record<string, string> }) {
  const submit = useSubmit()
  const navigate = useNavigate()
  const [v, setV] = useState<Record<string, string>>({})
  useEffect(() => { if (open && initial) setV(initial) }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const [created, setCreated] = useState<{ id: string; name: string; email: string; password?: string } | null>(null)
  const close = () => { setV({}); setCreated(null); submit.clear(); onClose() }
  const set = (k: string) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value })
  return <Modal isOpen={open} onClose={close} maxWidth="lg" title={created ? 'Đã tạo hội viên' : 'Thêm hội viên'} description={created ? undefined : 'Hội viên đăng nhập app bằng email (hoặc SĐT@member.gym.local nếu bỏ trống email) và mật khẩu tạm.'}>
    {created ? <div className="space-y-4">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-500/30 dark:bg-emerald-500/10">
        <p className="font-semibold">{created.name}</p><p>Tên đăng nhập: <span className="font-mono">{created.email}</span></p>
        {created.password && <p>Mật khẩu tạm: <span className="select-all font-mono font-semibold">{created.password}</span></p>}
        <p className="mt-2 text-xs text-text-muted">Đưa mật khẩu tạm cho hội viên; họ nên đổi mật khẩu sau lần đăng nhập đầu. Mật khẩu này chỉ hiện một lần.</p>
      </div>
      <div className="flex flex-wrap justify-end gap-2"><Btn onClick={close}>Đóng</Btn><Btn variant="soft" onClick={() => { close(); navigate(`/receptionist/members/${created.id}`) }}>Mở hồ sơ</Btn>
        <Btn variant="primary" icon={<Ticket aria-hidden className="h-4 w-4" />} onClick={() => { close(); navigate(`/receptionist/membership-sale?memberId=${created.id}`) }}>Bán vé ngay</Btn></div>
    </div> : <form className="space-y-4" onSubmit={async e => {
      e.preventDefault()
      const body = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, x.trim()]).filter(([, x]) => x)) as { fullName: string; phone: string }
      const r = await submit.run(() => deskApi.createMember(body))
      if (r) { setCreated({ id: r.member.id, name: r.user.fullName, email: r.user.email, password: r.temporaryPassword }); onDone(`Đã tạo hội viên ${r.user.fullName}.`, r.member.id) }
    }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Họ và tên" required><input required maxLength={120} value={v.fullName ?? ''} onChange={set('fullName')} className={inputCls} autoComplete="off" /></Field>
        <Field label="Số điện thoại" required><input required type="tel" inputMode="tel" value={v.phone ?? ''} onChange={set('phone')} className={inputCls} placeholder="09xx xxx xxx" /></Field>
        <Field label="Email"><input type="email" value={v.email ?? ''} onChange={set('email')} className={inputCls} /></Field>
        <Field label="Ngày sinh"><input type="date" value={v.dateOfBirth ?? ''} onChange={set('dateOfBirth')} className={inputCls} /></Field>
        <Field label="Giới tính"><select value={v.gender ?? ''} onChange={set('gender')} className={inputCls}><option value="">—</option><option>Nam</option><option>Nữ</option><option>Khác</option></select></Field>
        <Field label="SĐT người liên hệ khẩn cấp"><input type="tel" value={v.emergencyPhone ?? ''} onChange={set('emergencyPhone')} className={inputCls} /></Field>
      </div>
      <Field label="Địa chỉ"><input value={v.address ?? ''} onChange={set('address')} className={inputCls} /></Field>
      <InlineError message={submit.error} />
      <div className="flex justify-end gap-2"><Btn onClick={close}>Hủy</Btn><Btn type="submit" variant="primary" busy={submit.busy} disabled={!v.fullName?.trim() || !v.phone?.trim()}>Tạo hội viên</Btn></div>
    </form>}
  </Modal>
}
