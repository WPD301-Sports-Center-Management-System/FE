import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { centerDate, formatDate, formatDateTime } from '@/shared/utils/date'
import { Button } from '@/shared/components/ui/button'
import { useLoad, useSubmit } from '../hooks'
import { centerClosuresApi, type ClosurePreview, type ClosureSummary } from '../center-closures-api'
import { ErrorBanner, Field, inputCls, Loadable, Notice, Panel, Table, td } from './ui'

export function CenterClosurePanel() {
  const [form, setForm] = useState({ fromDate: centerDate(), toDate: centerDate(), reason: '' })
  const [preview, setPreview] = useState<ClosurePreview | null>(null)
  const [result, setResult] = useState<ClosureSummary | null>(null)
  const key = useRef(crypto.randomUUID())
  const list = useLoad(() => centerClosuresApi.list(), [])
  const act = useSubmit()
  function change(field: keyof typeof form, value: string) {
    setForm(old => ({ ...old, [field]: value })); setPreview(null); setResult(null); key.current = crypto.randomUUID(); act.clear()
  }
  return <Panel title="Trung tâm nghỉ lễ / bảo trì">
    <p className="text-sm text-text-muted">Một đợt nghỉ áp dụng toàn trung tâm, theo ngày trọn vẹn. Vé gym được bù ngày; buổi PT tự nối vào cuối lịch theo giờ còn trống.</p>
    <fieldset disabled={act.busy} className="grid gap-4 sm:grid-cols-2">
      <Field label="Nghỉ từ ngày"><input required type="date" min={centerDate()} className={inputCls} value={form.fromDate} onChange={e => change('fromDate', e.target.value)} /></Field>
      <Field label="Nghỉ đến hết ngày"><input required type="date" min={form.fromDate || centerDate()} className={inputCls} value={form.toDate} onChange={e => change('toDate', e.target.value)} /></Field>
      <div className="sm:col-span-2"><Field label="Lý do trung tâm nghỉ"><textarea maxLength={5000} required rows={2} className={inputCls} value={form.reason} onChange={e => change('reason', e.target.value)} placeholder="Ví dụ: nghỉ lễ, bảo trì điện…" /></Field></div>
    </fieldset>
    <ErrorBanner message={act.error} />
    {!preview && <Button disabled={act.busy || !form.reason.trim() || !form.fromDate || form.toDate < form.fromDate} isLoading={act.busy} onClick={() => void act.run(async () => { setResult(null); setPreview(await centerClosuresApi.preview(form)) })}>Xem trước tác động</Button>}
    {preview && <section aria-label="Tác động đợt nghỉ" className="space-y-4 border-t border-border-subtle pt-4">
      <h3 className="font-semibold">{formatDate(preview.fromDate)} → {formatDate(preview.toDate)}</h3>
      <dl className="grid gap-3 text-sm sm:grid-cols-3">
        <div><dt className="text-text-muted">Buổi PT bị ảnh hưởng</dt><dd className="text-xl font-semibold tabular-nums">{preview.sessionCount}</dd></div>
        <div><dt className="text-text-muted">Vé gym cần bù / dịch kỳ</dt><dd className="text-xl font-semibold tabular-nums">{preview.ticketCount}</dd></div>
        <div><dt className="text-text-muted">Đơn đang giữ lịch cần nhả</dt><dd className="text-xl font-semibold tabular-nums">{preview.heldOrderCount}</dd></div>
      </dl>
      <p className="text-sm">Không trừ lượt nghỉ Member, không tạo thu nhập cho buổi bị hủy do trung tâm. Chỉ buổi không tìm được lịch cuối chuỗi phù hợp mới chờ Coach xếp bù. Hạn mục tiêu giữ nguyên.</p>
      {!!preview.sessions.length && <details><summary className="cursor-pointer text-sm font-medium">Xem {preview.sessionCount} buổi PT</summary><ul className="mt-2 space-y-1 text-sm">{preview.sessions.map(s => <li key={s.id}>{formatDateTime(s.startsAt)} · {s.memberName} · {s.coachName}</li>)}</ul></details>}
      {!!preview.tickets.length && <details><summary className="cursor-pointer text-sm font-medium">Xem ngày vé trước và sau điều chỉnh</summary><ul className="mt-2 space-y-3 text-sm">{preview.tickets.map(t => <li key={t.id}><p><strong>{t.memberName ?? t.id.slice(0, 8)}</strong>{t.planName && ` · ${t.planName}`}</p><p className="text-text-muted">Hiện tại: {formatDate(t.startDate)} → {formatDate(t.endDate)}</p><p>Sau điều chỉnh: {formatDate(t.newStart)} → {formatDate(t.newEnd)}</p></li>)}</ul></details>}
      {(preview.manualCount > 0 || preview.trialCount > 0) && <Notice>{preview.manualCount} buổi đang tập, đã có kết quả hoặc đã qua giờ cần Manager xử lý riêng; {preview.trialCount} lượt tập thử cần Lễ tân kiểm tra/xếp lại. Hệ thống không tự đảo kết quả hay kết thúc buổi đang tập.</Notice>}
      {!!preview.manual?.length && <details><summary className="cursor-pointer text-sm font-medium">Xem các buổi cần xử lý riêng</summary><ul className="mt-2 space-y-2 text-sm">{preview.manual.map(s => <li key={s.id}><Link className="underline" to={`/manager/sessions/${s.id}`}>{s.memberName} · {formatDateTime(s.startsAt)}</Link></li>)}</ul></details>}
      <Button disabled={act.busy} isLoading={act.busy} onClick={() => void act.run(async () => {
        try {
          const applied = await centerClosuresApi.apply({ fromDate: preview.fromDate, toDate: preview.toDate, reason: preview.reason, impactHash: preview.impactHash, idempotencyKey: key.current })
          setResult(applied); setPreview(null); key.current = crypto.randomUUID(); await list.reload()
        } catch (error) { if (error && typeof error === 'object' && 'code' in error && error.code === 'IMPACT_CHANGED') setPreview(null); throw error }
      })}>Xác nhận nghỉ và bù quyền lợi</Button>
    </section>}
    {result && <Notice tone="success">Đã áp dụng: {result.autoMoved}/{result.cancelled} buổi PT tự nối cuối; {result.pendingMakeups} buổi chờ Coach; {result.compensatedTickets} vé đã bù/dịch kỳ. Đã gửi thông báo.</Notice>}
    <details className="border-t border-border-subtle pt-4"><summary className="cursor-pointer text-sm font-semibold">Lịch sử trung tâm nghỉ</summary><div className="mt-3"><Loadable state={list} empty="Chưa có đợt nghỉ chung.">{items => <Table head={['Khoảng nghỉ', 'Lý do', 'Kết quả']}>
      {items.map(item => <tr key={item.id}><td className={td}>{formatDate(item.fromDate)} → {formatDate(item.toDate)}</td><td className={td}>{item.reason}</td><td className={td}>{item.summary.autoMoved}/{item.summary.cancelled} buổi tự nối · {item.summary.pendingMakeups} buổi chờ · {item.summary.compensatedTickets} vé</td></tr>)}
    </Table>}</Loadable></div></details>
  </Panel>
}
