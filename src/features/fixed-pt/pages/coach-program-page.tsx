import { Link, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { Copy } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog'
import { formatTime, formatWeekdayDateTime } from '@/shared/utils/date'
import { fixedPtApi } from '../api'
import { useLoad, useSubmit } from '../hooks'
import type { SessionWithContent } from '../types'
import { Empty, ErrorBanner, Field, inputCls, label as statusLabel, Loadable, Notice, Page, Panel, Status, Table, td } from '../components/ui'
import { ProgramFillPanel } from '../components/program-fill-panel'

function contentState(s: SessionWithContent) {
  const c = s.content
  if (['COMPLETED', 'NO_SHOW', 'CANCELLED_LATE'].includes(s.status)) return c?.status === 'LOCKED' ? (c.startedWithout === 'NO_CONTENT' ? 'Đã tập – chưa có giáo án' : 'Đã khóa') : 'Không áp dụng'
  if (!c?.status) return 'Coach đang chuẩn bị'
  return { DRAFT: 'Bản nháp', ASSIGNED: 'Đã giao', LOCKED: 'Đã khóa' }[c.status]
}

// Coach: personal programme bound to the confirmed sessions of each package. Embedded as the
// "Theo gói học viên" tab of the Giáo án page; the template library lives in the next tab.
export function CoachProgramPage({ embedded = false }: { embedded?: boolean } = {}) {
  const packages = useLoad(async () => (await fixedPtApi.coachPackages()).filter(p => ['ACTIVE', 'COMPLETED', 'EXPIRED'].includes(p.status)), [])
  const [params] = useSearchParams()
  const [purchaseId, setPurchaseId] = useState(() => params.get('purchaseId') ?? '')
  const body = (
    <>
      <Panel title="Chọn gói học viên">
        <Loadable state={packages} empty="Chưa có gói đang phụ trách.">{items => (
          <select aria-label="Chọn gói" className={inputCls} value={purchaseId} onChange={e => setPurchaseId(e.target.value)}>
            <option value="">— Chọn —</option>
            {items.map(p => <option key={p.id} value={p.id}>{p.memberName} · {p.packageNameSnapshot} ({statusLabel(p.status)})</option>)}
          </select>
        )}</Loadable>
      </Panel>
      {purchaseId ? <PurchaseProgram key={purchaseId} purchaseId={purchaseId} /> : <Empty>Chọn một gói để soạn giáo án cho các buổi của gói đó.</Empty>}
    </>
  )
  return embedded ? <div className="space-y-5">{body}</div>
    : <Page title="Giáo án theo gói" subtitle="Giáo án gắn vào từng buổi đã chốt; đổi giờ thì giáo án đi theo buổi.">{body}</Page>
}

function PurchaseProgram({ purchaseId }: { purchaseId: string }) {
  const sessions = useLoad(() => fixedPtApi.purchaseSessions(purchaseId), [purchaseId])
  const [selected, setSelected] = useState<string[]>([])
  const [copyOverwrite, setCopyOverwrite] = useState(false)
  const [copy, setCopy] = useState({ source: '', target: '' })
  const act = useSubmit(); const [result, setResult] = useState<string | null>(null)
  const active = (sessions.data ?? []).filter(s => !['RESCHEDULED', 'CANCELLED_EARLY', 'COACH_CANCELLED'].includes(s.status))
  return (
    <>
      <details className="rounded-xl border border-border-subtle bg-bg-surface p-4"><summary className="cursor-pointer text-sm font-semibold">Điền nhanh nhiều buổi từ chu kỳ giáo án</summary><div className="mt-4"><ProgramFillPanel purchaseId={purchaseId} sessions={sessions} submit={act} onApplied={setResult} /></div></details>
      <details className="rounded-xl border border-border-subtle bg-bg-surface p-4">
        <summary className="cursor-pointer text-sm font-semibold">Đã có tuần tập phù hợp? Sao chép sang tuần khác</summary>
        <p className="mt-3 text-sm text-text-muted">Dùng lại giáo án từ các buổi đã có trong gói, thay vì điền theo chu kỳ.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Field label="Sao chép tuần bắt đầu"><input type="date" className={inputCls} value={copy.source} onChange={e => setCopy({ ...copy, source: e.target.value })} /></Field>
          <Field label="Sang tuần bắt đầu"><input type="date" className={inputCls} value={copy.target} onChange={e => setCopy({ ...copy, target: e.target.value })} /></Field>
          <div className="flex items-end"><Button variant="secondary" disabled={!copy.source || !copy.target || act.busy} onClick={() => void act.run(async () => { const r = await fixedPtApi.copyWeek(purchaseId, { sourceWeekStart: copy.source, targetWeekStart: copy.target, overwrite: copyOverwrite }); setResult(`Đã sao chép ${r.copied.length} buổi.`); await sessions.reload() })}><Copy className="h-4 w-4" aria-hidden />Sao chép tuần</Button></div>
        </div>
        <label className="mt-3 flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={copyOverwrite} disabled={act.busy} onChange={e => setCopyOverwrite(e.target.checked)} />Thay cả giáo án đã giao trong tuần nhận bản sao</label>
      </details>
      <div className="space-y-2"><ErrorBanner message={act.error} />{result && <Notice tone="success">{result}</Notice>}</div>
      <Panel title="Kiểm tra và giao giáo án từng buổi" actions={<Button variant="secondary" disabled={!selected.length || act.busy} onClick={() => void act.run(async () => { const r = await fixedPtApi.assignContents(purchaseId, selected); const failed = r.filter(x => !x.assigned); setResult(`Đã giao ${r.length - failed.length}/${r.length} buổi.${failed.length ? ' Chưa giao: ' + failed.map(f => f.message).join('; ') : ''}`); setSelected([]); await sessions.reload() })}>Giao {selected.length} buổi đã chọn</Button>}>
        <p className="text-sm text-text-muted">Mở “Kiểm tra / sửa” để xác nhận bài tập và mức tạ. Sau đó chọn những buổi đã sẵn sàng để giao cho học viên.</p>
        <Loadable state={sessions} empty="Gói chưa có buổi nào.">{() => (
          <Table head={['', 'Buổi', 'Thời gian', 'Trạng thái buổi', 'Giáo án', '']}>
            {active.map(s => (
              <tr key={s.id}>
                <td className={td}><input type="checkbox" aria-label={`Chọn buổi ${s.credit?.creditIndex ?? s.id}`} disabled={act.busy || !['CONFIRMED', 'ARRIVED'].includes(s.status)} checked={selected.includes(s.id)} onChange={e => setSelected(e.target.checked ? [...selected, s.id] : selected.filter(x => x !== s.id))} /></td>
                <td className={td}>{s.credit?.creditIndex ?? '—'}{s.content?.programLabel && <span className="ml-1 rounded bg-bg-surface-muted px-1.5 text-xs font-bold">{s.content.programLabel}</span>}</td>
                <td className={td}>{formatWeekdayDateTime(s.startsAt)}–{formatTime(s.endsAt)}</td>
                <td className={td}><Status value={s.status} /></td>
                <td className={td}>{contentState(s)}{s.content?.title && <div className="text-xs text-text-muted">{s.content.title}</div>}{s.content?.recoveryWarning && <div className="text-xs text-amber-700 dark:text-amber-300">{s.content.recoveryWarning}</div>}</td>
                <td className={td}><Link className="inline-flex min-h-11 items-center text-primary underline" to={`/coach/sessions/${s.id}`}>{['CONFIRMED', 'ARRIVED'].includes(s.status) ? 'Kiểm tra / sửa' : 'Xem / ghi thực tế'}</Link></td>
              </tr>
            ))}
          </Table>
        )}</Loadable>
      </Panel>
    </>
  )
}

export function ProgramLibrary() {
  const templates = useLoad(() => fixedPtApi.sessionTemplates(), [])
  const programs = useLoad(() => fixedPtApi.programTemplates(), [])
  const [name, setName] = useState(''); const [slots, setSlots] = useState<{ label: string; sessionTemplateId: string }[]>([{ label: 'A', sessionTemplateId: '' }])
  // null = creating a new program; otherwise the program being edited in the same form.
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null)
  const [archiving, setArchiving] = useState<{ id: string; name: string } | null>(null)
  const resetProgramForm = () => { setEditingProgramId(null); setName(''); setSlots([{ label: 'A', sessionTemplateId: '' }]) }
  const act = useSubmit()
  return (
    <Panel title="Chu kỳ giáo án cho nhiều buổi">
      <p className="text-sm text-text-muted">Ghép các giáo án một buổi theo thứ tự, ví dụ A = Thân trên, B = Thân dưới. Khi điền cho gói học viên, hệ thống lặp A → B → A → B…</p>
      <div className="grid gap-4 lg:grid-cols-2">
        <Loadable state={programs} empty="Chưa có chu kỳ. Ghép các giáo án ở phần bên cạnh để tạo chu kỳ đầu tiên.">{items => <ul className="space-y-1 text-sm">{items.map(p => <li key={p.id} className="flex items-center justify-between gap-2 rounded-lg border border-border-subtle px-3 py-1.5">
          <span>{p.name}: {p.slots.map(s => `${s.label}=${s.sessionTemplate.name}`).join(', ')}</span>
          <span className="flex shrink-0 gap-1">
            <Button size="sm" variant="ghost" onClick={() => { setEditingProgramId(p.id); setName(p.name); setSlots(p.slots.map(s => ({ label: s.label, sessionTemplateId: s.sessionTemplateId }))) }}>Sửa</Button>
            <Button size="sm" variant="ghost" disabled={act.busy} onClick={() => setArchiving({ id: p.id, name: p.name })}>Lưu trữ</Button>
          </span>
        </li>)}</ul>}</Loadable>
        <div className="space-y-2 rounded-xl border border-border-subtle p-3">
          {editingProgramId && <p className="text-sm font-medium text-text-primary">Đang sửa chu kỳ. Các buổi đã điền giáo án trước đó giữ nguyên.</p>}
          <Field label="Tên chu kỳ"><input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Tăng cơ 3 buổi/tuần" /></Field>
          {slots.map((s, i) => <div key={i} className="flex gap-2"><input aria-label="Nhãn" className={`${inputCls} w-16`} value={s.label} onChange={e => setSlots(slots.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))} />
            <select aria-label="Giáo án mẫu" className={inputCls} value={s.sessionTemplateId} onChange={e => setSlots(slots.map((x, idx) => idx === i ? { ...x, sessionTemplateId: e.target.value } : x))}><option value="">— Giáo án mẫu —</option>{(templates.data ?? []).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>)}
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setSlots([...slots, { label: String.fromCharCode(65 + slots.length), sessionTemplateId: '' }])}>Thêm buổi</Button>
            {editingProgramId && <Button size="sm" variant="ghost" onClick={resetProgramForm}>Hủy sửa</Button>}
            <Button size="sm" disabled={!name.trim() || slots.some(s => !s.sessionTemplateId) || act.busy} onClick={() => void act.run(async () => { if (editingProgramId) await fixedPtApi.updateProgram(editingProgramId, { name, slots }); else await fixedPtApi.createProgram({ name, slots }); resetProgramForm(); await programs.reload() })}>{editingProgramId ? 'Lưu thay đổi' : 'Tạo chu kỳ'}</Button>
          </div>
          <ErrorBanner message={act.error} />
        </div>
      </div>
      <ConfirmDialog
        isOpen={!!archiving}
        title="Lưu trữ chu kỳ?"
        message={<>“{archiving?.name}” sẽ không còn trong danh sách chọn. Các buổi đã áp không bị ảnh hưởng.</>}
        confirmLabel="Lưu trữ"
        isLoading={act.busy}
        onCancel={() => setArchiving(null)}
        onConfirm={() => archiving && void act.run(async () => { await fixedPtApi.updateProgram(archiving.id, { status: 'ARCHIVED' }); if (editingProgramId === archiving.id) resetProgramForm(); await programs.reload(); setArchiving(null) })}
      />
    </Panel>
  )
}
