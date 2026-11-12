import { PurchasePicker } from '../components/purchase-picker'
import { useState, type ReactNode } from 'react'
import { Modal } from '@/shared/components/ui/modal'
import { hybridSend } from '../hybrid-api'
import { Button } from '@/shared/components/ui/button'
import { centerDateTimeInput, formatDateTime, formatTime, formatWeekdayDateTime } from '@/shared/utils/date'
import { fixedPtApi } from '../api'
import { useLoad, useSubmit } from '../hooks'
import type { Disruption, Session } from '../types'
import { ErrorBanner, Field, inputCls, Loadable, Notice, Page, Panel, Status, Table, td } from '../components/ui'
import { ReasonDialog } from '../components/widgets'
import { localInputToIso } from './coach-sessions-page'

type Dialog = { kind: 'reverse' | 'override' | 'resolve' | 'noShow' | 'cancel' | 'end' | 'interrupt'; session: Session }
// Manager: sessions that need a decision (no outcome after end, legacy overlaps), corrections of a
// wrongly counted outcome, and service disruptions (the package always keeps its Coach).
export function ManagerSessionsPage() {
  const review = useLoad(() => fixedPtApi.sessions({ needsReview: 'true', limit: 100 }), [])
  const [recentStatus, setRecentStatus] = useState('NO_SHOW')
  const recent = useLoad(() => fixedPtApi.sessions({ status: recentStatus, order: 'desc', limit: 50 }), [recentStatus])
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [confirmAbsent, setConfirmAbsent] = useState(false)
  const [record, setRecord] = useState<Session | null>(null)
  const act = useSubmit()
  const done = async () => { setDialog(null); await Promise.all([review.reload(), recent.reload()]) }
  const row = (s: Session, actions: ReactNode) => <tr key={s.id}>
    <td className={td}>{formatWeekdayDateTime(s.startsAt)}–{formatTime(s.endsAt)}</td><td className={td}>{s.memberName}<div className="text-xs text-text-muted">{s.coachName}</div></td>
    <td className={td}><Status value={s.status} />{s.reviewReason && <div className="text-xs text-amber-700 dark:text-amber-300">{s.reviewReason === 'LEGACY_OVERLAP' ? 'Lịch cũ trùng giờ' : s.reviewReason === 'NO_OUTCOME_AFTER_END' ? 'Đã qua giờ, chưa có kết quả' : s.reviewReason}</div>}{s.outcomeReversedAt && <div className="text-xs text-text-muted">Đã đảo kết quả</div>}</td>
    <td className={td}><div className="flex flex-wrap gap-1.5">{actions}</div></td></tr>
  return (
    <Page title="Buổi cần xử lý & gián đoạn dịch vụ">
      <ErrorBanner message={act.error} />
      <Panel title="Buổi cần xử lý">
        <Loadable state={review} empty="Không có buổi cần xử lý.">{items => (
          <Table head={['Thời gian', 'Member / Coach', 'Trạng thái', 'Quyết định']}>
            {items.map(s => row(s, <>
              {s.allowedActions.noShow && <Button size="sm" variant="ghost" onClick={() => setDialog({ kind: 'noShow', session: s })}>Ghi vắng</Button>}
              {s.allowedActions.coachCancel && <Button size="sm" variant="ghost" onClick={() => setDialog({ kind: 'cancel', session: s })}>Gym hủy (hoàn buổi)</Button>}
              {s.status === 'CONFIRMED' && <Button size="sm" variant="ghost" onClick={() => setDialog({ kind: 'override', session: s })}>Ngoại lệ vé gym</Button>}
              {s.allowedActions.recordCompleted && <Button size="sm" onClick={() => setRecord(s)}>Xác nhận đã tập (giờ thực)</Button>}
              {s.allowedActions.end && <Button size="sm" onClick={() => setDialog({ kind: 'end', session: s })}>Kết thúc buổi đang tập</Button>}
              {s.allowedActions.interrupt && <Button size="sm" variant="danger" onClick={() => setDialog({ kind: 'interrupt', session: s })}>Dừng sự cố, hoàn buổi</Button>}
              {!['CONFIRMED', 'ARRIVED', 'IN_PROGRESS'].includes(s.status) && <Button size="sm" variant="secondary" onClick={() => setDialog({ kind: 'resolve', session: s })}>Đóng cờ</Button>}</>))}
          </Table>
        )}</Loadable>
      </Panel>
      <Panel title="Đảo kết quả tính buổi" actions={<select aria-label="Trạng thái" className={inputCls} value={recentStatus} onChange={e => setRecentStatus(e.target.value)}><option value="NO_SHOW">Vắng</option><option value="CANCELLED_LATE">Nghỉ muộn</option><option value="COMPLETED">Hoàn thành</option></select>}>
        <Notice>Đảo kết quả giữ lịch sử buổi, hoàn buổi cho Member kèm quyền học bù, và xử lý dòng tiền theo giai đoạn (chưa chi: hủy; đã chi: tạo khoản thu hồi; đối trừ ứng: hoàn lại khoản ứng).</Notice>
        <Loadable state={recent} empty="Không có buổi.">{items => (
          <Table head={['Thời gian', 'Member / Coach', 'Trạng thái', '']}>
            {items.map(s => row(s, s.allowedActions.reverse && <Button size="sm" variant="danger" onClick={() => setDialog({ kind: 'reverse', session: s })}>Đảo kết quả</Button>))}
          </Table>
        )}</Loadable>
      </Panel>
      {record && <RecordCompleted key={record.id} session={record} onClose={() => setRecord(null)} onDone={() => { setRecord(null); void done() }} />}
      <DisruptionPanel />
      <ReasonDialog open={!!dialog} danger={dialog?.kind === 'reverse' || dialog?.kind === 'noShow'} busy={act.busy} error={act.code === 'MEMBER_PRESENT' ? 'Member có lượt vào gym trong khung giờ. Chỉ ghi vắng khi đã xác minh (D-15) — tích xác nhận bên dưới.' : act.error}
        title={{ reverse: 'Đảo kết quả buổi', override: 'Duyệt ngoại lệ vé gym cho buổi', resolve: 'Đóng cờ cần xử lý', noShow: 'Ghi Member vắng', cancel: 'Gym hủy buổi (hoàn buổi + học bù)', end: 'Kết thúc buổi đang tập', interrupt: 'Dừng sự cố: hoàn credit, không tạo thu nhập' }[dialog?.kind ?? 'resolve']}
        extra={dialog?.kind === 'noShow' && act.code === 'MEMBER_PRESENT' ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={confirmAbsent} onChange={e => setConfirmAbsent(e.target.checked)} />Đã xác minh Member có vào gym nhưng không đến buổi PT</label> : undefined}
        onClose={() => { setDialog(null); setConfirmAbsent(false); act.clear() }}
        onConfirm={reason => void act.run(async () => {
          const id = dialog!.session.id
          if (dialog!.kind === 'end') await fixedPtApi.end(id, { note: reason, earlyEndReason: reason })
          if (dialog!.kind === 'interrupt') await hybridSend('post', `/pt-bookings/${id}/interrupt`, { reason })
          if (dialog!.kind === 'reverse') await fixedPtApi.reverseOutcome(id, reason)
          if (dialog!.kind === 'override') await fixedPtApi.membershipOverride(id, reason)
          if (dialog!.kind === 'resolve') await fixedPtApi.resolveReview(id, reason)
          if (dialog!.kind === 'cancel') await fixedPtApi.coachCancel(id, reason)
          if (dialog!.kind === 'noShow') await fixedPtApi.noShow(id, { reason, confirmAbsentDespiteVisit: confirmAbsent || undefined })
          await done()
        })} />
    </Page>
  )
}

export function DisruptionPanel({ initialPurchaseId = '', bookingId, from = '', to = '', supportRequestId }: { initialPurchaseId?: string; bookingId?: string; from?: string; to?: string; supportRequestId?: string } = {}) {
  const list = useLoad(() => fixedPtApi.disruptions(), [])
  const [form, setForm] = useState({ purchaseId: initialPurchaseId, reason: '', from, to })
  const [applying, setApplying] = useState<Disruption | null>(null)
  const [resolving, setResolving] = useState<Disruption | null>(null)
  const act = useSubmit()
  return (
    <Panel title="Gián đoạn dịch vụ">
      <div className="mb-3 grid gap-2 sm:grid-cols-5">
        <Field label="Học viên và gói">{initialPurchaseId ? <p className="text-sm">Đã chọn gói từ hồ sơ đang xem.</p> : <PurchasePicker value={form.purchaseId} onChange={id => setForm({ ...form, purchaseId: id })} />}</Field>
        <Field label="Lý do"><input className={inputCls} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></Field>
        <Field label="Từ"><input type="datetime-local" className={inputCls} value={form.from} onChange={e => setForm({ ...form, from: e.target.value })} /></Field>
        <Field label="Đến"><input type="datetime-local" className={inputCls} value={form.to} onChange={e => setForm({ ...form, to: e.target.value })} /></Field>
        <div className="flex items-end"><Button disabled={!form.purchaseId || !form.reason || !form.from || !form.to || act.busy} onClick={() => void act.run(async () => { await fixedPtApi.createDisruption({ purchaseId: form.purchaseId, supportRequestId, bookingId, reason: form.reason, scopeFrom: localInputToIso(form.from), scopeTo: localInputToIso(form.to) }); setForm({ purchaseId: initialPurchaseId, reason: '', from, to }); await list.reload() })}>Lưu hồ sơ chờ áp dụng</Button></div>
      </div>
      <ErrorBanner message={act.error} />
      <Loadable state={list} empty="Chưa có hồ sơ gián đoạn.">{items => (
        <Table head={['Hồ sơ', 'Gói / Coach', 'Phạm vi', 'Trạng thái', '']}>
          {items.filter(d => !initialPurchaseId || d.purchaseId === initialPurchaseId).map(d => <tr key={d.id}>
            <td className={td}>{d.code}<div className="text-xs text-text-muted">{d.reason}</div></td>
            <td className={td}>{d.purchase.purchaseCode}<div className="text-xs text-text-muted">{d.purchase.coachNameSnapshot} (giữ nguyên Coach)</div></td>
            <td className={td}>{formatDateTime(d.scopeFrom)} → {formatDateTime(d.scopeTo)}<div className="text-xs text-text-muted">{d.bookings.length} buổi trong phạm vi</div></td>
            <td className={td}><Status value={d.status} />{d.resolution && <div className="text-xs text-text-muted">{d.resolution}</div>}</td>
            <td className={td}><div className="flex flex-wrap gap-1.5">
              {d.status === 'OPEN' && <Button size="sm" disabled={act.busy} onClick={() => setApplying(d)}>Xem và áp dụng</Button>}
              {['OPEN', 'APPROVED'].includes(d.status) && <Button size="sm" variant="secondary" onClick={() => setResolving(d)}>Kết thúc</Button>}
            </div></td>
          </tr>)}
        </Table>
      )}</Loadable>
      {applying && <Modal isOpen title="Xác nhận áp dụng gián đoạn" onClose={() => { if (!act.busy) setApplying(null) }}><div className="space-y-3"><p>{applying.purchase.purchaseCode} · {formatDateTime(applying.scopeFrom)} → {formatDateTime(applying.scopeTo)}</p><p>Buổi đã lên lịch hoặc đã đến trong phạm vi sẽ bị hủy; buổi tập được giữ lại để Coach xếp lại, không trừ lượt nghỉ. Không tự phục hồi khi đóng hồ sơ.</p><ul>{applying.bookings.map(b => <li key={b.id}>{formatDateTime(b.plannedStartsAt)} · <Status value={b.status} /></li>)}</ul><Notice>Danh sách phản ánh lần tải gần nhất. Kiểm tra lại phạm vi trước khi áp dụng; các buổi còn lịch trong phạm vi này sẽ bị hủy.</Notice><ErrorBanner message={act.error} /><Button disabled={act.busy} onClick={() => void act.run(async () => { await fixedPtApi.disruptionAction(applying.id, 'approve'); setApplying(null); await list.reload() })}>Xác nhận áp dụng</Button></div></Modal>}
      <ReasonDialog open={!!resolving} title="Kết thúc hồ sơ gián đoạn" busy={act.busy} error={act.error} description="Đóng gián đoạn để Coach tiếp tục xếp buổi bù. Các buổi đã hủy không tự phục hồi." onClose={() => setResolving(null)} onConfirm={resolution => void act.run(async () => { await fixedPtApi.disruptionAction(resolving!.id, 'resolve', { resolution }); setResolving(null); await list.reload() })} />
    </Panel>
  )
}

function RecordCompleted({ session, onClose, onDone }: { session: Session; onClose: () => void; onDone: () => void }) {
  const local = (s: string) => centerDateTimeInput(s)
  const [from, setFrom] = useState(local(session.startsAt)), [to, setTo] = useState(local(session.endsAt))
  const [reason, setReason] = useState(''), [evidence, setEvidence] = useState('')
  const act = useSubmit()
  return <Modal isOpen onClose={onClose} title="Xác nhận buổi đã tập bị thiếu thao tác" description="Ghi đúng giờ thực tế theo giờ Việt Nam. Kết quả sẽ tính credit và thu nhập một lần; mọi căn cứ được lưu audit.">
    <form className="space-y-4" onSubmit={e => { e.preventDefault(); void act.run(async () => { await hybridSend('post', '/pt-bookings/' + session.id + '/record-completed', { actualStartedAt: localInputToIso(from), actualEndedAt: localInputToIso(to), reason: reason.trim(), evidence: evidence.trim() }); onDone() }) }}>
      <Field label="Bắt đầu thực tế"><input required type="datetime-local" className={inputCls} value={from} onChange={e => setFrom(e.target.value)} /></Field>
      <Field label="Kết thúc thực tế"><input required type="datetime-local" className={inputCls} value={to} onChange={e => setTo(e.target.value)} /></Field>
      <Field label="Lý do thiếu thao tác"><textarea required className={inputCls} value={reason} onChange={e => setReason(e.target.value)} /></Field>
      <Field label="Căn cứ xác minh (check-in, xác nhận học viên…)"><textarea required className={inputCls} value={evidence} onChange={e => setEvidence(e.target.value)} /></Field>
      <ErrorBanner message={act.error} />
      <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Quay lại</Button><Button type="submit" isLoading={act.busy} disabled={!from || !to || !reason.trim() || !evidence.trim()}>Xác nhận đã tập</Button></div>
    </form>
  </Modal>
}
