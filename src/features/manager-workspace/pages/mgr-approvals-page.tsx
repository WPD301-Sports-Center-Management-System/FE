import { ApplicationsPanel } from '@/features/fixed-pt/pages/application-page'
import { useState } from 'react'
import { Check, CheckCircle2, Clock3, X, XCircle } from 'lucide-react'
import { Modal } from '@/shared/components/ui/modal'
import { useLoad, useSubmit } from '@/features/fixed-pt/hooks'
import { centerDate } from '@/shared/utils/date'
import { Async, Badge, Btn, Card, Dot, EmptyBox, Field, InlineError, PageHeader, Person, Segmented, StatTile, Table, td, textareaCls, useFlash } from '@/features/workspace/ui'
import { fmtMoney, hhmm, relativeAgo } from '@/features/workspace/utils'
import { mgrApi, type PackageOption } from '../api'
import { useMgrShell } from '../shell'
import { dmy } from '@/features/reception-workspace/labels'

type Status = 'PENDING' | 'APPROVED' | 'REJECTED'
type Item = { id: string; kind: 'option'; coach: string; status: Status; at: string; reason?: string | null; title: string; detail: string; note?: string | null }
const STATUS: Record<Status, { label: string; tone: 'warning' | 'success' | 'danger' }> = { PENDING: { label: 'Chờ duyệt', tone: 'warning' }, APPROVED: { label: 'Đã duyệt', tone: 'success' }, REJECTED: { label: 'Đã từ chối', tone: 'danger' } }

const fromOption = (p: PackageOption): Item => ({ id: p.id, kind: 'option', coach: p.coach?.user.fullName ?? 'Gói chung', status: p.approvalStatus, at: p.updatedAt ?? p.createdAt, reason: p.rejectionReason, title: p.name, detail: `${p.course?.name ?? ''} · ${p.sessionCount} buổi · ${fmtMoney(p.price)} · dùng trong ${p.validityDays} ngày` })

export function MgrApprovalsPage() {
  const { refresh } = useMgrShell()
  const { flash, node } = useFlash()
  const options = useLoad(() => mgrApi.options(), [])
  const [tab, setTab] = useState<'all' | Status>('PENDING')
  const [reject, setReject] = useState<Item | null>(null)
  const items = [ ...(options.data ?? []).filter(p => p.coachId).map(fromOption)].sort((a, b) => b.at.localeCompare(a.at))
  const pending = items.filter(i => i.status === 'PENDING').sort((a, b) => a.at.localeCompare(b.at))
  const month = centerDate().slice(0, 7)
  const rows = tab === 'PENDING' ? pending : items.filter(i => tab === 'all' || i.status === tab)
  const state = { data: options.data ? items : null, loading: options.loading, error: options.error, reload: () => { void options.reload() } }
  const done = (m: string) => { flash(m); setReject(null); state.reload(); refresh() }

  // Docs/UX_AUDIT_IA_2026-11.md §2.3: Coach applications (one-time) and custom packages; course offerings are
  // approved automatically once the Coach is approved, so they are no longer reviewed here.
  return <div>
    {node}
    <PageHeader title="Duyệt Coach" subtitle={<><span>Hồ sơ Coach duyệt một lần</span><Dot /><span>Gói trung tâm có giá chốt sẵn; gói riêng của Coach cần duyệt</span></>} />
    <div className="mb-6"><ApplicationsPanel onChange={refresh} /></div>
    <div className="mb-6 grid gap-4 md:grid-cols-3">
      <StatTile label="Chờ duyệt" icon={<Clock3 className="h-[18px] w-[18px]" />} iconTone="warning" tone="warning" value={state.data ? pending.length : '—'} hint={pending[0] ? `Cũ nhất gửi ${dmy(pending[0].at)}` : 'Không còn mục chờ'} />
      <StatTile label={`Đã duyệt tháng ${month.slice(5)}`} icon={<CheckCircle2 className="h-[18px] w-[18px]" />} iconTone="success" tone="success" value={state.data ? items.filter(i => i.status === 'APPROVED' && centerDate(i.at).startsWith(month)).length : '—'} />
      <StatTile label="Đã từ chối" icon={<XCircle className="h-[18px] w-[18px]" />} iconTone="danger" value={state.data ? items.filter(i => i.status === 'REJECTED').length : '—'} hint="Coach sửa và gửi lại trên cùng hồ sơ" />
    </div>
    <Card flush title="Gói tùy chỉnh" badge={state.data ? <Badge tone="warning">{pending.length} chờ</Badge> : null} subtitle="Gói Coach tự tạo ngoài gói mẫu hoặc ngoài khung giá"
      actions={<Segmented label="Lọc" value={tab} onChange={setTab} items={[{ key: 'PENDING' as const, label: 'Chờ duyệt', count: pending.length }, { key: 'APPROVED' as const, label: 'Đã duyệt', count: items.filter(i => i.status === 'APPROVED').length }, { key: 'REJECTED' as const, label: 'Từ chối', count: items.filter(i => i.status === 'REJECTED').length }, { key: 'all' as const, label: 'Tất cả', count: items.length }]} />}>
      <Async state={state} rows={5} empty={() => !rows.length && <EmptyBox icon={<CheckCircle2 className="h-5 w-5" />} title={tab === 'PENDING' ? 'Đã duyệt hết' : 'Không có mục nào'} />}>
        {() => <Table head={['Coach', 'Gói', 'Thời điểm', 'Trạng thái', 'Phản hồi']} minWidth={1000}>
          {rows.map(i => <Row key={`${i.kind}-${i.id}`} i={i} onReject={() => setReject(i)} onDone={done} />)}
        </Table>}
      </Async>
    </Card>
    {reject && <RejectModal i={reject} onClose={() => setReject(null)} onDone={done} />}
  </div>
}

function Row({ i, onReject, onDone }: { i: Item; onReject: () => void; onDone: (m: string) => void }) {
  const submit = useSubmit()
  return <tr className="align-top hover:bg-bg-surface-muted/40">
    <td className={td}><span className="flex items-center gap-2"><Person name={i.coach} size={32} /><span className="whitespace-nowrap font-semibold">{i.coach}</span></span></td>
    <td className={`${td} max-w-96`}><p className="font-semibold">{i.title}</p><p className="text-xs text-text-muted">{i.detail}</p>{i.note && <p className="mt-1 text-xs italic text-text-muted">“{i.note}”</p>}
      {i.status === 'REJECTED' && i.reason && <p className="mt-1 text-xs text-red-600">Lý do: {i.reason}</p>}</td>
    <td className={`${td} tabular-nums`}>{dmy(i.at)} {hhmm(i.at)}<p className="text-xs text-text-muted">{relativeAgo(i.at)}</p></td>
    <td className={td}><Badge tone={STATUS[i.status].tone}>{STATUS[i.status].label}</Badge></td>
    <td className={`${td} text-right`}>{i.status === 'PENDING' && <div className="flex justify-end gap-1.5">
      <Btn size="sm" variant="soft" busy={submit.busy} icon={<Check aria-hidden className="h-4 w-4" />} onClick={async () => { if (await submit.run(() => mgrApi.approveOption(i.id))) onDone(`Đã duyệt “${i.title}” của ${i.coach}.`) }}>Đồng ý</Btn>
      <Btn size="sm" icon={<X aria-hidden className="h-4 w-4" />} onClick={onReject}>Từ chối</Btn>
    </div>}
      {submit.error && <p role="alert" className="mt-1 text-xs text-red-600">{submit.error}</p>}</td>
  </tr>
}

function RejectModal({ i, onClose, onDone }: { i: Item; onClose: () => void; onDone: (m: string) => void }) {
  const submit = useSubmit()
  const [reason, setReason] = useState('')
  return <Modal isOpen onClose={onClose} title="Từ chối đăng ký" description={`${i.coach} · ${i.title}`}>
    <form className="space-y-4" onSubmit={async e => { e.preventDefault(); if (await submit.run(() => mgrApi.rejectOption(i.id, reason.trim()))) onDone('Đã từ chối và gửi lý do cho Coach.') }}>
      <Field label="Lý do (Coach sẽ thấy)" required hint="Nêu rõ cần bổ sung gì để Coach sửa và gửi lại."><textarea required rows={3} value={reason} onChange={e => setReason(e.target.value)} className={textareaCls} placeholder="VD: Thiếu chứng chỉ chuyên môn cho khóa này…" /></Field>
      <InlineError message={submit.error} />
      <div className="flex justify-end gap-2"><Btn onClick={onClose}>Quay lại</Btn><Btn type="submit" variant="danger" busy={submit.busy} disabled={!reason.trim()}>Từ chối</Btn></div>
    </form>
  </Modal>
}
