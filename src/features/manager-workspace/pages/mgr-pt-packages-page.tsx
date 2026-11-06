import { useMemo, useState } from 'react'
import { AlertTriangle, Package, Plus, Search, TrendingUp, Users } from 'lucide-react'
import { Modal } from '@/shared/components/ui/modal'
import { useLoad, useSubmit } from '@/features/fixed-pt/hooks'
import { centerDate } from '@/shared/utils/date'
import { Async, Badge, Btn, Card, Dot, EmptyBox, Field, InlineError, PageHeader, Segmented, StatTile, Table, inputCls, td, useFlash } from '@/features/workspace/ui'
import { fmtMoney, fmtNumber } from '@/features/workspace/utils'
import { mgrApi, type PackageOption } from '../api'

type Tab = 'selling' | 'pending' | 'off' | 'all'
const APPROVAL = { PENDING: { label: 'Chờ duyệt', tone: 'warning' }, APPROVED: { label: 'Đã duyệt', tone: 'success' }, REJECTED: { label: 'Bị từ chối', tone: 'danger' } } as const

export function MgrPtPackagesPage() {
  const { flash, node } = useFlash()
  const options = useLoad(() => mgrApi.options(), [])
  const purchases = useLoad(() => mgrApi.purchases({}, 10), [])
  const [tab, setTab] = useState<Tab>('selling')
  const [q, setQ] = useState('')
  const [create, setCreate] = useState(false)
  const month = centerDate().slice(0, 7)
  const stats = useMemo(() => {
    const m = new Map<string, { active: number; month: number; revenue: number }>()
    for (const p of purchases.data ?? []) {
      if (!p.packageOptionId) continue
      const s = m.get(p.packageOptionId) ?? { active: 0, month: 0, revenue: 0 }
      if (p.status === 'ACTIVE') s.active++
      if (!['PENDING_PAYMENT', 'CANCELLED'].includes(p.status) && centerDate(p.createdAt).startsWith(month)) { s.month++; s.revenue += Number(p.priceSnapshot) }
      m.set(p.packageOptionId, s)
    }
    return m
  }, [purchases.data, month])
  const list = options.data ?? []
  const selling = (o: PackageOption) => o.approvalStatus === 'APPROVED' && o.isActive
  const test: Record<Tab, (o: PackageOption) => boolean> = { selling, pending: o => o.approvalStatus === 'PENDING', off: o => !selling(o) && o.approvalStatus !== 'PENDING', all: () => true }
  const term = q.trim().toLowerCase()
  const rows = list.filter(o => test[tab](o) && (!term || [o.name, o.course?.name, o.coach?.user.fullName].some(v => v?.toLowerCase().includes(term))))
  const active = (purchases.data ?? []).filter(p => p.status === 'ACTIVE')
  const monthRevenue = [...stats.values()].reduce((n, s) => n + s.revenue, 0)
  const low = active.filter(p => p.totalCredits - p.consumedCredits <= 2).length

  return <div>
    {node}
    <PageHeader title="Quản lý gói PT" subtitle={<><span>Gói chung của trung tâm và gói do Coach đề xuất</span><Dot /><span>Đơn đã bán giữ nguyên giá tại thời điểm mua</span></>}
      actions={<Btn variant="primary" icon={<Plus aria-hidden className="h-4 w-4" />} onClick={() => setCreate(true)}>Tạo gói trung tâm</Btn>} />
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile label="Gói đang bán" icon={<Package className="h-[18px] w-[18px]" />} iconTone="info" value={options.data ? list.filter(selling).length : '—'} hint={options.data ? `${list.filter(o => o.approvalStatus === 'PENDING').length} gói Coach đề xuất chờ duyệt` : undefined} />
      <StatTile label="Gói đang hoạt động" icon={<Users className="h-[18px] w-[18px]" />} iconTone="violet" value={purchases.data ? active.length : '—'} hint={purchases.data ? `${new Set(active.map(p => p.memberId)).size} học viên đang tập PT` : undefined} />
      <StatTile label={`Giá trị bán tháng ${month.slice(5)}`} icon={<TrendingUp className="h-[18px] w-[18px]" />} iconTone="success" tone="success" value={purchases.data ? fmtNumber(monthRevenue / 1_000_000, 1) : '—'} unit="triệu ₫" hint="Theo giá đơn đã thanh toán / kích hoạt" />
      <StatTile label="Gói sắp hết buổi" icon={<AlertTriangle className="h-[18px] w-[18px]" />} iconTone="warning" tone="warning" value={purchases.data ? low : '—'} hint="Còn ≤ 2 buổi — cơ hội gia hạn" />
    </div>
    <p className="mb-6 text-sm text-text-muted">Tạo gói với khóa tập, số buổi, nhịp tuần và giá bán cụ thể. Coach chỉ cần nhận dạy; gói riêng do Coach đề xuất cần bạn duyệt. Giáo án được chuẩn bị riêng theo từng học viên.</p>
    <Card flush>
      <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle p-4">
        <Segmented label="Lọc gói" value={tab} onChange={setTab} items={[{ key: 'selling' as Tab, label: 'Đang bán', count: list.filter(selling).length }, { key: 'pending' as Tab, label: 'Chờ duyệt', count: list.filter(test.pending).length }, { key: 'off' as Tab, label: 'Ngừng / từ chối', count: list.filter(test.off).length }, { key: 'all' as Tab, label: 'Tất cả', count: list.length }]} />
        <label className="relative ml-auto min-w-56 flex-1 sm:max-w-xs"><span className="sr-only">Tìm gói</span><Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Tên gói, khóa, Coach…" className={`${inputCls} pl-9`} /></label>
      </div>
      <Async state={options} rows={6} empty={() => !rows.length && <EmptyBox icon={<Package className="h-5 w-5" />} title="Không có gói phù hợp" />}>
        {() => <Table head={['Gói PT', 'Số buổi', 'Giá bán', 'Đơn giá / buổi', 'Đang dạy', `Bán T${Number(month.slice(5))}`, 'Trạng thái', 'Thao tác']} minWidth={1080}>
          {rows.map(o => { const s = stats.get(o.id); return <tr key={o.id} className="hover:bg-bg-surface-muted/40">
            <td className={td}><p className="font-semibold">{o.name}</p><p className="text-xs text-text-muted">{o.course?.name} · {o.coach ? `Coach ${o.coach.user.fullName}` : 'Gói trung tâm'} · {o.sessionsPerWeek ?? 3} buổi/tuần</p></td>
            <td className={`${td} tabular-nums`}>{o.sessionCount}</td>
            <td className={`${td} whitespace-nowrap font-semibold tabular-nums`}>{fmtMoney(o.price)}</td>
            <td className={`${td} whitespace-nowrap tabular-nums text-text-muted`}>{fmtMoney(Number(o.price) / o.sessionCount)}</td>
            <td className={`${td} tabular-nums`}>{purchases.data ? `${s?.active ?? 0} gói` : '…'}</td>
            <td className={`${td} tabular-nums`}>{purchases.data ? s?.month ?? 0 : '…'}</td>
            <td className={td}><Badge tone={APPROVAL[o.approvalStatus].tone}>{APPROVAL[o.approvalStatus].label}</Badge>{o.approvalStatus === 'APPROVED' && <Badge tone={o.isActive ? 'info' : 'neutral'} className="ml-1">{o.isActive ? 'Đang bán' : 'Ngừng bán'}</Badge>}
              {o.rejectionReason && o.approvalStatus === 'REJECTED' && <p className="mt-1 max-w-56 text-xs text-red-600">{o.rejectionReason}</p>}</td>
            <td className={`${td} text-right`}>{!o.coachId ? <ToggleSale o={o} onDone={m => { flash(m); void options.reload() }} /> : o.approvalStatus === 'PENDING' ? <ReviewOption o={o} onDone={m => { flash(m); void options.reload() }} /> : <span className="text-xs text-text-muted">Coach quản lý</span>}</td>
          </tr> })}
        </Table>}
      </Async>
    </Card>
    <CreateOptionModal open={create} onClose={() => setCreate(false)} onDone={m => { setCreate(false); flash(m); void options.reload() }} />
  </div>
}

function ReviewOption({ o, onDone }: { o: PackageOption; onDone: (m: string) => void }) {
  const act = useSubmit()
  const [reject, setReject] = useState(false)
  const [reason, setReason] = useState('')
  return <>
    <div className="flex justify-end gap-2"><Btn size="sm" busy={act.busy} onClick={async () => { if (await act.run(() => mgrApi.approveOption(o.id))) onDone(`Đã duyệt và mở bán “${o.name}”.`) }}>Duyệt gói</Btn><Btn size="sm" variant="outline" busy={act.busy} onClick={() => setReject(true)}>Từ chối</Btn></div>
    <InlineError message={act.error} />
    <Modal isOpen={reject} onClose={() => setReject(false)} title={`Từ chối gói “${o.name}”`}>
      <div className="space-y-4"><Field label="Lý do để Coach điều chỉnh" required><textarea className={inputCls} maxLength={5000} value={reason} onChange={e => setReason(e.target.value)} /></Field><InlineError message={act.error} /><Btn variant="danger" busy={act.busy} disabled={!reason.trim()} onClick={async () => { if (await act.run(() => mgrApi.rejectOption(o.id, reason.trim()))) { setReject(false); onDone('Đã lưu lý do từ chối để Coach xem.') } }}>Xác nhận từ chối</Btn></div>
    </Modal>
  </>
}

function ToggleSale({ o, onDone }: { o: PackageOption; onDone: (m: string) => void }) {
  const submit = useSubmit()
  return <><Btn size="sm" variant={o.isActive ? 'outline' : 'soft'} busy={submit.busy} onClick={async () => { if (await submit.run(() => mgrApi.setOptionActive(o.id, !o.isActive))) onDone(o.isActive ? `Đã ngừng bán “${o.name}”.` : `Đã mở bán “${o.name}”.`) }}>{o.isActive ? 'Ngừng bán' : 'Mở bán'}</Btn>
    {submit.error && <p role="alert" className="mt-1 text-xs text-red-600">{submit.error}</p>}</>
}

function CreateOptionModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: (m: string) => void }) {
  const courses = useLoad(() => mgrApi.courses(), [], open)
  const submit = useSubmit()
  const [v, setV] = useState<Record<string, string>>({ durationMinutes: '60', sessionsPerWeek: '3' })
  const set = (k: string) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value })
  const valid = v.courseId && v.name?.trim() && Number(v.sessionCount) > 0 && Number(v.sessionsPerWeek) >= 1 && Number(v.sessionsPerWeek) <= 6 && Number(v.price) > 0
  return <Modal isOpen={open} onClose={onClose} maxWidth="lg" title="Tạo gói PT trung tâm" description="Chốt đầy đủ thông tin và giá bán. Gói xuất hiện với học viên khi có Coach nhận dạy.">
    <form className="space-y-4" onSubmit={async e => {
      e.preventDefault()
      const r = await submit.run(() => mgrApi.createOption({ courseId: v.courseId!, name: v.name!.trim(), sessionCount: Number(v.sessionCount), sessionsPerWeek: Number(v.sessionsPerWeek), validityDays: 3650, price: Number(v.price), durationMinutes: Number(v.durationMinutes) as 60 | 90 | 120, description: v.description?.trim() || undefined }))
      if (r) { setV({ durationMinutes: '60', sessionsPerWeek: '3' }); onDone(`Đã tạo gói “${r.name}”. Coach có thể nhận dạy.`) }
    }}>
      <Field label="Khóa tập" required error={courses.error}><select required value={v.courseId ?? ''} onChange={set('courseId')} className={inputCls}><option value="">{courses.data ? 'Chọn khóa…' : 'Đang tải…'}</option>{(courses.data ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
      <Field label="Tên gói" required><input required maxLength={120} value={v.name ?? ''} onChange={set('name')} className={inputCls} placeholder="PT 1-1 · 12 buổi" /></Field>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Số buổi" required><input type="number" min={1} required value={v.sessionCount ?? ''} onChange={set('sessionCount')} className={inputCls} /></Field>
        <Field label="Phút / buổi"><select value={v.durationMinutes} onChange={set('durationMinutes')} className={inputCls}><option>60</option><option>90</option><option>120</option></select></Field>
        <Field label="Buổi / tuần" required><input type="number" min={1} max={6} required value={v.sessionsPerWeek ?? ''} onChange={set('sessionsPerWeek')} className={inputCls} /></Field>
        <Field label="Giá (₫)" required><input type="number" min={1000} step={1000} required value={v.price ?? ''} onChange={set('price')} className={inputCls} /></Field>
      </div>
      {Number(v.price) > 0 && Number(v.sessionCount) > 0 && <p className="text-xs text-text-muted">≈ {fmtMoney(Number(v.price) / Number(v.sessionCount))} / buổi</p>}
      <Field label="Mô tả"><textarea rows={2} value={v.description ?? ''} onChange={set('description')} className={inputCls + ' h-auto py-2'} /></Field>
      <InlineError message={submit.error} />
      <div className="flex justify-end gap-2"><Btn onClick={onClose}>Hủy</Btn><Btn type="submit" variant="primary" busy={submit.busy} disabled={!valid}>Tạo gói</Btn></div>
    </form>
  </Modal>
}
