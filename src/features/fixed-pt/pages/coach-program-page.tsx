import { useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { Copy, Layers, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog'
import { coursesExercisesService } from '@/features/courses-exercises/services/courses-exercises.service'
import { formatTime, formatWeekdayDateTime } from '@/shared/utils/date'
import { fixedPtApi } from '../api'
import { useLoad, useSubmit } from '../hooks'
import type { ContentItem, SessionWithContent } from '../types'
import { Empty, ErrorBanner, Field, inputCls, Loadable, Notice, Page, Panel, Status, Table, td } from '../components/ui'

const LEVELS = [['', 'Không dùng gợi ý'], ['BEGINNER', 'Người mới'], ['INTERMEDIATE', 'Trung cấp'], ['ADVANCED', 'Nâng cao']] as const
function contentState(s: SessionWithContent) {
  const c = s.content
  if (['COMPLETED', 'NO_SHOW', 'CANCELLED_LATE'].includes(s.status)) return c?.status === 'LOCKED' ? (c.startedWithout === 'NO_CONTENT' ? 'Đã tập – chưa có giáo án' : 'Đã khóa') : 'Không áp dụng'
  if (!c?.status) return 'Coach đang chuẩn bị'
  return { DRAFT: 'Bản nháp', ASSIGNED: 'Đã giao', LOCKED: 'Đã khóa' }[c.status]
}

// Coach: personal programme bound to the confirmed sessions of each package.
export function CoachProgramPage() {
  const packages = useLoad(async () => (await fixedPtApi.coachPackages()).filter(p => ['ACTIVE', 'COMPLETED', 'EXPIRED'].includes(p.status)), [])
  const [params] = useSearchParams()
  const [purchaseId, setPurchaseId] = useState(() => params.get('purchaseId') ?? '')
  return (
    <Page title="Chương trình cá nhân theo buổi" subtitle="Giáo án gắn vào từng buổi đã chốt; đổi giờ thì giáo án đi theo buổi. Sửa mẫu không thay giáo án đã giao.">
      <Panel title="Chọn gói học viên">
        <Loadable state={packages} empty="Chưa có gói đang phụ trách.">{items => (
          <select aria-label="Chọn gói" className={inputCls} value={purchaseId} onChange={e => setPurchaseId(e.target.value)}>
            <option value="">— Chọn —</option>
            {items.map(p => <option key={p.id} value={p.id}>{p.memberName} · {p.packageNameSnapshot} ({p.status})</option>)}
          </select>
        )}</Loadable>
      </Panel>
      {purchaseId ? <PurchaseProgram key={purchaseId} purchaseId={purchaseId} /> : <Empty>Chọn một gói để soạn chương trình.</Empty>}
      <TemplateLibrary />
    </Page>
  )
}

function PurchaseProgram({ purchaseId }: { purchaseId: string }) {
  const sessions = useLoad(() => fixedPtApi.purchaseSessions(purchaseId), [purchaseId])
  const programs = useLoad(() => fixedPtApi.programTemplates(), [])
  const [selected, setSelected] = useState<string[]>([])
  const [programId, setProgramId] = useState(''); const [level, setLevel] = useState(''); const [overwrite, setOverwrite] = useState(false)
  const [editing, setEditing] = useState<SessionWithContent | null>(null)
  const [copy, setCopy] = useState({ source: '', target: '' })
  const act = useSubmit(); const [result, setResult] = useState<string | null>(null)
  const active = (sessions.data ?? []).filter(s => !['RESCHEDULED', 'CANCELLED_EARLY', 'COACH_CANCELLED'].includes(s.status))
  return (
    <>
      <Panel title={<span className="inline-flex items-center gap-2"><Layers className="h-4 w-4" aria-hidden />Áp dụng mẫu chương trình</span>}>
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Mẫu chương trình A/B/C"><select className={inputCls} value={programId} onChange={e => setProgramId(e.target.value)}><option value="">— Chọn —</option>{(programs.data ?? []).map(p => <option key={p.id} value={p.id}>{p.name} ({p.slots.map(s => s.label).join('/')})</option>)}</select></Field>
          <Field label="Gợi ý theo trình độ" hint="Chỉ gợi ý sets/reps; mức tạ do Coach nhập."><select className={inputCls} value={level} onChange={e => setLevel(e.target.value)}>{LEVELS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></Field>
          <label className="flex items-end gap-2 text-sm"><input type="checkbox" checked={overwrite} onChange={e => setOverwrite(e.target.checked)} />Ghi đè buổi đã giao</label>
          <div className="flex items-end"><Button disabled={!programId || act.busy} onClick={() => void act.run(async () => { const r = await fixedPtApi.applyProgram(purchaseId, { programTemplateId: programId, overwrite, level: level || undefined }); setResult(`Đã áp ${r.applied.length} buổi, bỏ qua ${r.skipped.length} buổi đã giao.`); await sessions.reload() })}>Áp dụng cho các buổi sắp tới</Button></div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          <Field label="Sao chép tuần bắt đầu"><input type="date" className={inputCls} value={copy.source} onChange={e => setCopy({ ...copy, source: e.target.value })} /></Field>
          <Field label="Sang tuần bắt đầu"><input type="date" className={inputCls} value={copy.target} onChange={e => setCopy({ ...copy, target: e.target.value })} /></Field>
          <div className="flex items-end"><Button variant="secondary" disabled={!copy.source || !copy.target || act.busy} onClick={() => void act.run(async () => { const r = await fixedPtApi.copyWeek(purchaseId, { sourceWeekStart: copy.source, targetWeekStart: copy.target, overwrite }); setResult(`Đã sao chép ${r.copied.length} buổi.`); await sessions.reload() })}><Copy className="h-4 w-4" aria-hidden />Sao chép tuần</Button></div>
          <div className="flex items-end"><Button variant="secondary" disabled={!selected.length || act.busy} onClick={() => void act.run(async () => { const r = await fixedPtApi.assignContents(purchaseId, selected); const failed = r.filter(x => !x.assigned); setResult(`Đã giao ${r.length - failed.length}/${r.length} buổi.${failed.length ? ' Chưa giao: ' + failed.map(f => f.message).join('; ') : ''}`); setSelected([]); await sessions.reload() })}>Giao {selected.length} buổi đã chọn</Button></div>
        </div>
        <div className="mt-3 space-y-2"><ErrorBanner message={act.error} />{result && <Notice tone="success">{result}</Notice>}</div>
      </Panel>
      <Panel title="Các buổi của gói">
        <Loadable state={sessions} empty="Gói chưa có buổi nào.">{() => (
          <Table head={['', 'Buổi', 'Thời gian', 'Trạng thái buổi', 'Giáo án', '']}>
            {active.map(s => (
              <tr key={s.id}>
                <td className={td}><input type="checkbox" aria-label="Chọn buổi" disabled={!['CONFIRMED', 'ARRIVED'].includes(s.status)} checked={selected.includes(s.id)} onChange={e => setSelected(e.target.checked ? [...selected, s.id] : selected.filter(x => x !== s.id))} /></td>
                <td className={td}>{s.credit?.creditIndex ?? '—'}{s.content?.programLabel && <span className="ml-1 rounded bg-bg-surface-muted px-1.5 text-xs font-bold">{s.content.programLabel}</span>}</td>
                <td className={td}>{formatWeekdayDateTime(s.startsAt)}–{formatTime(s.endsAt)}</td>
                <td className={td}><Status value={s.status} /></td>
                <td className={td}>{contentState(s)}{s.content?.title && <div className="text-xs text-text-muted">{s.content.title}</div>}{s.content?.recoveryWarning && <div className="text-xs text-amber-700 dark:text-amber-300">{s.content.recoveryWarning}</div>}</td>
                <td className={td}><Button size="sm" variant="ghost" onClick={() => setEditing(s)}>{['CONFIRMED', 'ARRIVED'].includes(s.status) ? 'Soạn' : 'Xem / ghi thực tế'}</Button></td>
              </tr>
            ))}
          </Table>
        )}</Loadable>
      </Panel>
      {editing && <ContentEditor session={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void sessions.reload() }} />}
    </>
  )
}

export function ContentEditor({ session, onClose, onSaved }: { session: SessionWithContent; onClose: () => void; onSaved: () => void }) {
  const exercises = useLoad(async () => (await coursesExercisesService.getExercises({ limit: 100 })).data ?? [], [])
  const templates = useLoad(() => fixedPtApi.sessionTemplates(), [])
  const locked = !['CONFIRMED', 'ARRIVED'].includes(session.status)
  const [title, setTitle] = useState(session.content?.title ?? '')
  const [items, setItems] = useState<ContentItem[]>((session.content?.items ?? []) as ContentItem[])
  const [templateId, setTemplateId] = useState(''); const [level, setLevel] = useState('')
  const [reason, setReason] = useState('')
  const act = useSubmit()
  const update = (i: number, patch: Partial<ContentItem>) => setItems(items.map((it, idx) => idx === i ? { ...it, ...patch } : it))
  const reloadContent = async () => { const c = await fixedPtApi.purchaseSessions(session.purchaseId); const me = c.find(x => x.id === session.id); setItems((me?.content?.items ?? []) as ContentItem[]); setTitle(me?.content?.title ?? '') }
  return (
    <Modal isOpen onClose={onClose} title={`Giáo án buổi ${formatWeekdayDateTime(session.startsAt)}`} maxWidth="2xl">
      <div className="space-y-3">
        {locked ? <Notice tone="info">Buổi đã bắt đầu/kết thúc: giáo án đã khóa. Bạn có thể ghi nội dung thực tế (tạo phiên bản mới, có lý do).</Notice>
          : <div className="grid gap-2 sm:grid-cols-3">
            <Field label="Áp mẫu buổi"><select className={inputCls} value={templateId} onChange={e => setTemplateId(e.target.value)}><option value="">— Chọn mẫu —</option>{(templates.data ?? []).map(t => <option key={t.id} value={t.id}>{t.presetKey ? '★ ' : ''}{t.name}</option>)}</select></Field>
            <Field label="Gợi ý trình độ"><select className={inputCls} value={level} onChange={e => setLevel(e.target.value)}>{LEVELS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></Field>
            <div className="flex items-end"><Button variant="secondary" disabled={!templateId || act.busy} onClick={() => void act.run(async () => { await fixedPtApi.applyTemplate(session.id, templateId, level || undefined); await reloadContent() })}>Áp mẫu</Button></div>
          </div>}
        {!locked && <Field label="Tiêu đề buổi"><input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} /></Field>}
        <div className="space-y-2">
          {items.length === 0 && <Empty>Chưa có bài tập.</Empty>}
          {items.map((it, i) => (
            <div key={i} className={`grid gap-2 rounded-xl border p-2 sm:grid-cols-12 ${it.needsExercise && !it.exerciseId ? 'border-amber-500/50' : 'border-border-subtle'}`}>
              <div className="sm:col-span-4"><Field label={it.roleName ?? `Bài ${i + 1}`} hint={it.needsExercise && !it.exerciseId ? 'Mẫu không có bài khớp – chọn bài cụ thể' : undefined}>
                <select className={inputCls} value={it.exerciseId ?? ''} onChange={e => { const ex = (exercises.data ?? []).find((x: { id: string }) => x.id === e.target.value); update(i, { exerciseId: e.target.value || null, name: ex?.name ?? it.name }) }}>
                  <option value="">— Chọn bài —</option>{(exercises.data ?? []).map((x: { id: string; name: string }) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select></Field></div>
              <div className="sm:col-span-1"><Field label="Sets"><input type="number" min={1} className={inputCls} value={it.sets ?? ''} onChange={e => update(i, { sets: e.target.value ? Number(e.target.value) : undefined })} /></Field></div>
              <div className="sm:col-span-1"><Field label="Reps"><input type="number" min={1} className={inputCls} value={it.reps ?? ''} onChange={e => update(i, { reps: e.target.value ? Number(e.target.value) : undefined })} /></Field></div>
              <div className="sm:col-span-2"><Field label="Tạ (kg)"><input type="number" min={0} step={0.5} className={inputCls} value={it.targetWeight ?? ''} onChange={e => update(i, { targetWeight: e.target.value ? Number(e.target.value) : undefined })} /></Field></div>
              <div className="sm:col-span-2"><Field label="Nghỉ (giây)"><input type="number" min={0} className={inputCls} value={it.restSeconds ?? ''} onChange={e => update(i, { restSeconds: e.target.value ? Number(e.target.value) : undefined })} /></Field></div>
              <div className="flex items-end gap-2 sm:col-span-2">
                {!locked && <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={it.confirmed} onChange={e => update(i, { confirmed: e.target.checked })} />Đã xác nhận</label>}
                <Button size="sm" variant="ghost" aria-label="Xóa bài" onClick={() => setItems(items.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4" aria-hidden /></Button>
              </div>
            </div>
          ))}
          <Button size="sm" variant="secondary" onClick={() => setItems([...items, { exerciseId: null, name: 'Bài tập', confirmed: false }])}><Plus className="h-4 w-4" aria-hidden />Thêm bài</Button>
        </div>
        {locked && <Field label="Lý do ghi nội dung thực tế"><input className={inputCls} value={reason} onChange={e => setReason(e.target.value)} /></Field>}
        <ErrorBanner message={act.error} />
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Đóng</Button>
          {locked ? <Button isLoading={act.busy} disabled={!reason.trim() || !items.length || items.some(i => !i.exerciseId)} onClick={() => void act.run(async () => { await fixedPtApi.saveActual(session.id, items, reason); onSaved() })}>Lưu nội dung thực tế</Button>
            : <>
              <Button variant="secondary" isLoading={act.busy} onClick={() => void act.run(async () => { await fixedPtApi.saveContent(session.id, { title: title || undefined, items }); onSaved() })}>Lưu nháp</Button>
              <Button isLoading={act.busy} disabled={!items.length || items.some(i => !i.exerciseId || !i.confirmed)} onClick={() => void act.run(async () => { await fixedPtApi.saveContent(session.id, { title: title || undefined, items }); await fixedPtApi.assignContent(session.id); onSaved() })}>Lưu & giao cho Member</Button>
            </>}
        </div>
      </div>
    </Modal>
  )
}

function TemplateLibrary() {
  const templates = useLoad(() => fixedPtApi.sessionTemplates(), [])
  const programs = useLoad(() => fixedPtApi.programTemplates(), [])
  const [name, setName] = useState(''); const [slots, setSlots] = useState<{ label: string; sessionTemplateId: string }[]>([{ label: 'A', sessionTemplateId: '' }])
  // null = creating a new program; otherwise the program being edited in the same form.
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null)
  const [renaming, setRenaming] = useState<{ id: string; name: string; focus: string } | null>(null)
  const [archiving, setArchiving] = useState<{ kind: 'template' | 'program'; id: string; name: string } | null>(null)
  const resetProgramForm = () => { setEditingProgramId(null); setName(''); setSlots([{ label: 'A', sessionTemplateId: '' }]) }
  const act = useSubmit()
  return (
    <Panel title="Thư viện mẫu">
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Mẫu buổi (★ mẫu hệ thống)</h3>
          <Loadable state={templates} empty="Chưa có mẫu.">{items => (
            <ul className="space-y-1 text-sm">{items.map(t => <li key={t.id} className="flex items-center justify-between rounded-lg border border-border-subtle px-3 py-1.5">
              <span>{t.presetKey ? '★ ' : ''}{t.name} <span className="text-xs text-text-muted">v{t.version} · {t.items.length} bài</span></span>
              <span className="flex gap-1">
                <Button size="sm" variant="ghost" disabled={act.busy} onClick={() => void act.run(async () => { await fixedPtApi.duplicateTemplate(t.id); await templates.reload() })}>Nhân bản</Button>
                {!t.presetKey && <Button size="sm" variant="ghost" disabled={act.busy} onClick={() => setRenaming({ id: t.id, name: t.name, focus: t.focus ?? '' })}>Sửa</Button>}
                {!t.presetKey && <Button size="sm" variant="ghost" disabled={act.busy} onClick={() => setArchiving({ kind: 'template', id: t.id, name: t.name })}>Lưu trữ</Button>}
              </span>
            </li>)}</ul>
          )}</Loadable>
        </div>
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Mẫu chương trình A/B/C</h3>
          <Loadable state={programs} empty="Chưa có mẫu chương trình.">{items => <ul className="mb-3 space-y-1 text-sm">{items.map(p => <li key={p.id} className="flex items-center justify-between gap-2 rounded-lg border border-border-subtle px-3 py-1.5">
            <span>{p.name}: {p.slots.map(s => `${s.label}=${s.sessionTemplate.name}`).join(', ')}</span>
            <span className="flex shrink-0 gap-1">
              <Button size="sm" variant="ghost" onClick={() => { setEditingProgramId(p.id); setName(p.name); setSlots(p.slots.map(s => ({ label: s.label, sessionTemplateId: s.sessionTemplateId }))) }}>Sửa</Button>
              <Button size="sm" variant="ghost" disabled={act.busy} onClick={() => setArchiving({ kind: 'program', id: p.id, name: p.name })}>Lưu trữ</Button>
            </span>
          </li>)}</ul>}</Loadable>
          <div className="space-y-2 rounded-xl border border-border-subtle p-3">
            {editingProgramId && <p className="text-sm font-medium text-text-primary">Đang sửa mẫu chương trình. Các buổi đã áp mẫu trước đó không bị thay đổi.</p>}
            <Field label="Tên mẫu chương trình"><input className={inputCls} value={name} onChange={e => setName(e.target.value)} /></Field>
            {slots.map((s, i) => <div key={i} className="flex gap-2"><input aria-label="Nhãn" className={`${inputCls} w-16`} value={s.label} onChange={e => setSlots(slots.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))} />
              <select aria-label="Mẫu buổi" className={inputCls} value={s.sessionTemplateId} onChange={e => setSlots(slots.map((x, idx) => idx === i ? { ...x, sessionTemplateId: e.target.value } : x))}><option value="">— Mẫu buổi —</option>{(templates.data ?? []).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>)}
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setSlots([...slots, { label: String.fromCharCode(65 + slots.length), sessionTemplateId: '' }])}>Thêm buổi</Button>
              {editingProgramId && <Button size="sm" variant="ghost" onClick={resetProgramForm}>Hủy sửa</Button>}
              <Button size="sm" disabled={!name.trim() || slots.some(s => !s.sessionTemplateId) || act.busy} onClick={() => void act.run(async () => { if (editingProgramId) await fixedPtApi.updateProgram(editingProgramId, { name, slots }); else await fixedPtApi.createProgram({ name, slots }); resetProgramForm(); await programs.reload() })}>{editingProgramId ? 'Lưu thay đổi' : 'Tạo mẫu chương trình'}</Button>
            </div>
          </div>
          <ErrorBanner message={act.error} />
        </div>
      </div>
      <Modal isOpen={!!renaming} title="Sửa mẫu buổi" onClose={() => setRenaming(null)}>
        {renaming && <div className="space-y-3">
          <Field label="Tên mẫu"><input className={inputCls} value={renaming.name} onChange={e => setRenaming({ ...renaming, name: e.target.value })} /></Field>
          <Field label="Trọng tâm"><input className={inputCls} value={renaming.focus} onChange={e => setRenaming({ ...renaming, focus: e.target.value })} /></Field>
          <p className="text-sm text-text-muted">Lưu sẽ tạo phiên bản mới. Nội dung đã áp vào các buổi trước đó giữ nguyên.</p>
          <ErrorBanner message={act.error} />
          <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setRenaming(null)}>Hủy</Button>
            <Button isLoading={act.busy} disabled={!renaming.name.trim()} onClick={() => void act.run(async () => { await fixedPtApi.updateTemplate(renaming.id, { name: renaming.name.trim(), focus: renaming.focus.trim() || undefined }); setRenaming(null); await templates.reload() })}>Lưu</Button></div>
        </div>}
      </Modal>
      <ConfirmDialog
        isOpen={!!archiving}
        title="Lưu trữ mẫu?"
        message={<>“{archiving?.name}” sẽ không còn hiện trong danh sách chọn mẫu. Các buổi đã áp mẫu này không bị ảnh hưởng.</>}
        confirmLabel="Lưu trữ"
        isLoading={act.busy}
        onCancel={() => setArchiving(null)}
        onConfirm={() => archiving && void act.run(async () => {
          if (archiving.kind === 'template') { await fixedPtApi.setTemplateStatus(archiving.id, 'ARCHIVED'); await templates.reload() }
          else { await fixedPtApi.updateProgram(archiving.id, { status: 'ARCHIVED' }); if (editingProgramId === archiving.id) resetProgramForm(); await programs.reload() }
          setArchiving(null)
        })}
      />
    </Panel>
  )
}
