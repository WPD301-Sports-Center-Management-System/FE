import { useEffect, useId, useMemo, useState } from 'react'
import { JourneyStartGate } from '@/features/goal-lab/journey-pages'
import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeftRight, ArrowRight, ClipboardCheck, Pencil, Plus, Printer, Save, Send, Trash2, User } from 'lucide-react'
import { Modal } from '@/shared/components/ui/modal'
import { useLoad, useSubmit } from '@/features/fixed-pt/hooks'
import type { ContentItem } from '@/features/fixed-pt/types'
import { centerDate, centerInstant, formatDateTime } from '@/shared/utils/date'
import { coachWs, type Assessment, type Exercise, type LibraryTemplate } from '../api'
import { useCoachShell } from '../shell'
import { SessionActions } from '../components/session-actions'
import { Badge, Btn, Card, EmptyBox, ErrorBox, Field, InlineError, LinkBtn, PageHeader, Person, Skeleton, inputCls, td, textareaCls, th, useFlash } from '@/features/workspace/ui'
import { fmtNumber, hhmm, isLive, longDate, minutesBetween, num, SESSION_LABEL, SESSION_TONE, signed } from '@/features/workspace/utils'

const CONTENT_LABEL = { DRAFT: 'Bản nháp', ASSIGNED: 'Đã giao cho học viên', LOCKED: 'Đã khóa khi bắt đầu buổi' } as const

export function CoachSessionPage() {
  const { id = '' } = useParams()
  const { refreshBadges } = useCoachShell()
  const { flash, node } = useFlash()
  const session = useLoad(() => coachWs.session(id), [id])
  const s = session.data
  const memberId = s?.memberId
  const progress = useLoad(() => coachWs.progress(memberId!), [memberId], !!memberId)
  const [reschedule, setReschedule] = useState(false)
  const sessionStatus = s?.status
  const reloadSession = session.reload
  useEffect(() => {
    if (!sessionStatus || !['CONFIRMED', 'ARRIVED', 'IN_PROGRESS'].includes(sessionStatus)) return
    const timer = window.setInterval(() => { if (!document.hidden) void reloadSession() }, 30_000)
    return () => window.clearInterval(timer)
  }, [sessionStatus, reloadSession])

  if (session.error) return <ErrorBox message={session.error} onRetry={() => void session.reload()} />
  if (!s) return <Skeleton rows={8} />
  const assessments = progress.data?.assessments ?? []
  const latest = assessments.at(-1)
  const weights = assessments.map(a => num(a.weightKg)).filter((v): v is number => v !== null)
  const title = `${s.credit ? `Buổi ${s.credit.creditIndex}/${s.purchase?.totalCredits ?? '?'}` : 'Buổi PT'} — ${s.courseName ?? s.purchase?.packageNameSnapshot ?? ''}`
  const after = (m: string) => { flash(m); void session.reload(); refreshBadges() }

  return <div className="print:p-0">
    {node}
    <PageHeader title={title} crumbs={[{ label: 'Lịch dạy', to: '/coach/schedule' }, { label: s.memberName ?? 'Học viên', to: `/coach/students/${s.memberId}` }, { label: title }]} />
    <section className="mb-6 rounded-xl border border-border-subtle bg-bg-surface shadow-sm">
      <div className="flex flex-wrap items-start gap-4 p-5">
        <Person name={s.memberName} size={64} />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold">{s.memberName} · {s.credit ? `Buổi ${s.credit.creditIndex}/${s.purchase?.totalCredits ?? '?'}` : 'Buổi PT'}</h1>
          <p className="mt-1 text-sm text-text-muted">{s.purchase?.packageNameSnapshot} · {longDate(centerDate(s.startsAt))} · {hhmm(s.startsAt)} – {hhmm(s.endsAt)} ({minutesBetween(s.startsAt, s.endsAt)} phút) · {s.bookingCode}</p>
          {s.actualStartedAt && s.plannedStartsAt && <p className="mt-1 text-xs text-text-muted">Lịch hẹn ban đầu: {longDate(centerDate(s.plannedStartsAt))} · {hhmm(s.plannedStartsAt)}</p>}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge tone={SESSION_TONE[s.status]} dot={isLive(s)}>{SESSION_LABEL[s.status] ?? s.status}</Badge>
            {s.arrivedAt && !s.actualStartedAt && <Badge tone="success">Đã đến {hhmm(s.arrivedAt)}</Badge>}
            {s.actualStartedAt && <Badge tone="info">Bắt đầu {hhmm(s.actualStartedAt)}</Badge>}
            {s.actualEndedAt && <Badge tone="info">Kết thúc {hhmm(s.actualEndedAt)}</Badge>}
            {s.isMakeup && <Badge tone="violet">Buổi học bù</Badge>}
            {s.needsReview && <Badge tone="warning">Cần rà soát{s.reviewReason ? `: ${s.reviewReason}` : ''}</Badge>}
          </div>
        </div>
        <dl className="flex gap-6 text-right">
          <Metric label="Cân nặng" value={latest?.weightKg ? `${fmtNumber(Number(latest.weightKg), 1)} kg` : '—'} />
          <Metric label={`Thay đổi · ${weights.length} lần đo`} value={weights.length > 1 ? `${signed(weights.at(-1)! - weights[0]!)} kg` : '—'} />
          <Metric label="Mỡ cơ thể" value={latest?.bodyFatPercent ? `${fmtNumber(Number(latest.bodyFatPercent), 1)}%` : '—'} />
        </dl>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-border-subtle px-5 py-4 print:hidden">
        <SessionActions size="md" session={s} onDone={after} />
        {s.status === 'CONFIRMED' && <Btn icon={<ArrowLeftRight aria-hidden className="h-4 w-4" />} onClick={() => setReschedule(true)}>Đổi lịch buổi này</Btn>}
        <Btn icon={<Printer aria-hidden className="h-4 w-4" />} onClick={() => window.print()}>In giáo án</Btn>
        {s.status === 'COMPLETED' && <LinkBtn to={`/coach/goals/sheet/${s.id}`} variant="primary" icon={<ClipboardCheck aria-hidden className="h-4 w-4" />}>Đánh giá cuối buổi</LinkBtn>}
        <LinkBtn to={`/coach/students/${s.memberId}`} icon={<User aria-hidden className="h-4 w-4" />}>Hồ sơ học viên</LinkBtn>
      </div>
    </section>

    {['CONFIRMED', 'ARRIVED'].includes(s.status) && <div className="mb-6"><JourneyStartGate bookingId={s.id} /></div>}
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <ContentEditor key={s.id} bookingId={s.id} memberId={s.memberId} purchaseId={s.purchaseId} started={['IN_PROGRESS', 'COMPLETED'].includes(s.status)} closed={!['CONFIRMED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'].includes(s.status)} onFlash={flash} />
      <div className="space-y-6">
        <Card title="Chỉ số mới nhất" subtitle={latest ? `Đo ngày ${centerDate(latest.assessedAt).split('-').reverse().join('/')}` : 'Chưa có lần đo nào'}>
          {progress.error ? <InlineError message={progress.error} /> : <AssessmentChips a={latest} prev={assessments.at(-2)} />}
          <Link to={`/coach/students/${s.memberId}`} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Xem lịch sử chỉ số & mục tiêu<ArrowRight aria-hidden className="h-4 w-4" /></Link>
        </Card>
        <Card title="Ghi chú chuyên môn">
          <dl className="space-y-3 text-sm">
            {s.member?.medicalNotes && <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"><AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" /><div><dt className="font-semibold">Lưu ý sức khỏe</dt><dd>{s.member.medicalNotes}</dd></div></div>}
            <Note label="Ghi chú khi kết thúc buổi" value={s.completionNote} />
            <Note label="Lý do kết thúc sớm" value={s.earlyEndReason} />
            <Note label="Lý do hủy / vắng" value={s.cancellationReason} />
            {!s.member?.medicalNotes && !s.completionNote && !s.earlyEndReason && !s.cancellationReason && <p className="text-text-muted">Nhận xét buổi tập được ghi tại “Đánh giá cuối buổi”.</p>}
          </dl>
        </Card>
      </div>
    </div>
    <SessionHistory key={`history-${s.id}`} bookingId={s.id} />
    <RescheduleModal key={s.id} open={reschedule} onClose={() => setReschedule(false)} session={s} onDone={m => { setReschedule(false); after(m) }} />
  </div>
}

function SessionHistory({ bookingId }: { bookingId: string }) {
  const [open, setOpen] = useState(false)
  const state = useLoad(() => coachWs.sessionHistory(bookingId), [bookingId], open)
  return <details className="mt-6 rounded-xl border border-border-subtle p-4 print:hidden" onToggle={e => setOpen(e.currentTarget.open)}>
    <summary className="cursor-pointer text-sm font-medium">Lịch sử buổi tập và giáo án</summary>
    <div className="mt-3">{state.error ? <ErrorBox message={state.error} onRetry={() => void state.reload()} /> : !state.data ? <Skeleton rows={2} /> : <ul className="space-y-2 text-sm">
      {state.data.events.map(e => <li key={e.id}>{formatDateTime(e.createdAt)} · {e.action} · {e.actor?.fullName ?? 'Hệ thống'}</li>)}
      {state.data.versions.map(v => <li key={v.id}>{formatDateTime(v.createdAt)} · Giáo án phiên bản {v.version} · {v.kind}</li>)}
      {state.data.changes.map(c => <li key={c.id}>{formatDateTime(c.createdAt)} · {c.code} · {c.status}</li>)}
      {!state.data.events.length && !state.data.versions.length && !state.data.changes.length && <li>Chưa có lịch sử thay đổi.</li>}
    </ul>}</div>
  </details>
}

const Metric = ({ label, value }: { label: string; value: string }) => <div><dd className="text-lg font-bold tabular-nums">{value}</dd><dt className="text-xs text-text-muted">{label}</dt></div>
const Note = ({ label, value }: { label: string; value?: string | null }) => value ? <div><dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</dt><dd className="mt-0.5 whitespace-pre-line">{value}</dd></div> : null

export function AssessmentChips({ a, prev }: { a?: Assessment; prev?: Assessment }) {
  if (!a) return <p className="text-sm text-text-muted">Học viên chưa có số đo cơ thể. Ghi chỉ số ở trang hồ sơ học viên.</p>
  const diff = (k: keyof Assessment) => { const x = num(a[k]), y = prev ? num(prev[k]) : null; return x !== null && y !== null && x !== y ? ` (${signed(x - y)})` : '' }
  const chips: [string, string | null | undefined, string, 'info' | 'success' | 'warning' | 'neutral'][] = [
    ['Cân', a.weightKg, ` kg${diff('weightKg')}`, 'info'], ['Cơ', a.muscleMassKg, ` kg${diff('muscleMassKg')}`, 'success'], ['Mỡ', a.bodyFatPercent, `%${diff('bodyFatPercent')}`, 'warning'],
    ['BMI', a.bmi, '', 'neutral'], ['Eo', a.waistCm, ' cm', 'neutral'],
  ]
  return <div className="flex flex-wrap gap-2">{chips.filter(c => c[1] !== null && c[1] !== undefined).map(([l, v, u, t]) => <Badge key={l} tone={t} className="px-2.5 py-1 text-[13px]">{l} {fmtNumber(Number(v), 1)}{u}</Badge>)}</div>
}

/** Session workout plan: draft → assign before the session; after it starts, edits are recorded as the actual content. */
function ContentEditor({ bookingId, memberId, purchaseId, started, closed, onFlash }: { bookingId: string; memberId: string; purchaseId: string; started: boolean; closed: boolean; onFlash: (m: string) => void }) {
  // No live refresh: each refresh replaces `items` (effect below) and would wipe the Coach's unsaved edits.
  const content = useLoad(() => coachWs.content(bookingId), [bookingId], true, false)
  const templates = useLoad(() => coachWs.templates(), [])
  const exercises = useLoad(() => coachWs.exercises(), [])
  const [items, setItems] = useState<ContentItem[] | null>(null)
  const [title, setTitle] = useState('')
  const [reason, setReason] = useState('')
  const [template, setTemplate] = useState('')
  const [editing, setEditing] = useState(false)
  const submit = useSubmit()
  useEffect(() => { if (content.data) { setItems(content.data.items.map(i => ({ ...i }))); setTitle(content.data.content?.title ?? '') } }, [content.data])
  const status = content.data?.content?.status
  const canEdit = !closed && items !== null
  // Read-only by default; an empty plan before the session opens straight in edit mode.
  const editable = canEdit && (editing || (!started && (items.length === 0 || status === 'DRAFT')))
  const reset = () => { setItems(content.data?.items.map(i => ({ ...i })) ?? []); setTitle(content.data?.content?.title ?? ''); setReason(''); setEditing(false); submit.clear() }
  const dirty = useMemo(() => JSON.stringify(items) !== JSON.stringify(content.data?.items ?? []) || title !== (content.data?.content?.title ?? ''), [items, title, content.data])

  const act = async (work: () => Promise<unknown>, message: string) => { const ok = await submit.run(async () => { await work(); return true }); if (ok) { onFlash(message); setReason(''); setEditing(false); await content.reload() } }
  const clean = (list: ContentItem[]) => list.filter(i => i.name.trim()).map(i => ({ ...i, name: i.name.trim(), confirmed: true }))
  const save = () => act(() => started ? coachWs.saveActual(bookingId, clean(items!), reason.trim()) : coachWs.saveContent(bookingId, { title: title.trim() || undefined, items: clean(items!) }), started ? 'Đã ghi nội dung thực tế của buổi.' : 'Đã lưu nháp giáo án.')
  const saveAndAssign = async () => {
    const ok = await submit.run(async () => {
      try { await coachWs.saveContent(bookingId, { title: title.trim() || undefined, items: clean(items!), assign: true }); return true }
      catch (error) {
        if ((error as { details?: { draftSaved?: boolean } }).details?.draftSaved) { onFlash('Đã lưu nháp; chưa giao được giáo án. Kiểm tra nội dung rồi giao lại.'); await content.reload() }
        throw error
      }
    })
    if (ok) { onFlash('Đã lưu và giao giáo án.'); setEditing(false); await content.reload() }
  }
  const update = (i: number, patch: Partial<ContentItem>) => setItems(list => list!.map((x, k) => k === i ? { ...x, ...patch } : x))

  return <Card flush title={content.data?.content?.title || 'Giáo án buổi tập'} badge={items ? <Badge>{items.length} bài</Badge> : null}
    subtitle={status ? CONTENT_LABEL[status] : 'Chưa soạn giáo án cho buổi này'}
    actions={canEdit && !editable ? <Btn size="sm" variant="soft" icon={<Pencil aria-hidden className="h-3.5 w-3.5" />} onClick={() => setEditing(true)} className="print:hidden">{started ? 'Ghi nội dung thực tế' : 'Soạn giáo án buổi này'}</Btn>
      : !started && editable && templates.data?.length ? <form className="flex items-center gap-2 print:hidden" onSubmit={e => { e.preventDefault(); if (template) void act(() => coachWs.applyTemplate(bookingId, template), 'Đã áp giáo án mẫu — hãy xác nhận mức tạ cho học viên rồi lưu.') }}>
      <select aria-label="Chọn giáo án mẫu" value={template} onChange={e => setTemplate(e.target.value)} className={`${inputCls} w-52`}><option value="">Áp từ giáo án mẫu…</option>{templates.data.map((t: LibraryTemplate) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
      <Btn type="submit" size="sm" disabled={!template} busy={submit.busy}>Áp dụng</Btn>
    </form> : null}>
    {canEdit && !started && !dirty && <div className="px-5 pt-4 print:hidden"><LinkBtn size="sm" to={`/coach/library?tab=ai&memberId=${memberId}&purchaseId=${purchaseId}&bookingId=${bookingId}`}>AI soạn cho buổi này</LinkBtn></div>}
    {!editable && !started && status === 'DRAFT' && items && items.length > 0 && <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle bg-amber-50/60 px-5 py-3 text-sm dark:bg-amber-500/10 print:hidden">
      <span>Giáo án đang là bản nháp — học viên chưa thấy.</span>
      <Btn size="sm" variant="primary" icon={<Send aria-hidden className="h-3.5 w-3.5" />} busy={submit.busy} onClick={() => void act(() => coachWs.assignContent(bookingId), 'Đã giao giáo án cho học viên.')}>Giao cho học viên</Btn>
    </div>}
    {!editable && <div className="px-5"><InlineError message={submit.error} /></div>}
    {content.error ? <ErrorBox message={content.error} onRetry={() => void content.reload()} /> : items === null ? <Skeleton rows={5} /> : <>
      {content.data?.content?.recoveryWarning && <p className="mx-5 mt-4 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"><AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />{content.data.content.recoveryWarning}</p>}
      {!started && editable && <div className="px-5 pt-4"><Field label="Tên giáo án buổi"><input value={title} onChange={e => setTitle(e.target.value)} className={inputCls} placeholder="VD: Cardio & Core" maxLength={160} /></Field></div>}
      {items.length === 0 && !editable ? <EmptyBox title="Buổi này không có giáo án" /> :
        <div className="overflow-x-auto"><table className="mt-2 w-full min-w-[1050px] border-collapse">
          <thead className="border-b border-border-subtle"><tr>{['Bài tập', 'Set × Rep', 'Khối lượng', 'Nghỉ', 'RPE / ghi chú', ''].map(h => <th key={h} scope="col" className={th}>{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-border-subtle">{items.map((it, i) => <tr key={i}>
            <td className={td}>{editable ? <ExerciseInput value={it.name} exercises={exercises.data ?? []} onChange={(name, exerciseId) => update(i, { name, exerciseId, needsExercise: !exerciseId })} /> : <span className="font-semibold">{it.name}</span>}
              {it.roleName && <p className="text-xs text-text-muted">{it.roleName}</p>}
              {it.needsExercise && <p className="text-xs text-amber-700 dark:text-amber-300">Chọn bài tập trong thư viện trước khi giao</p>}</td>
            <td className={`${td} min-w-40`}>{editable ? <div className="space-y-1"><span className="flex items-center gap-1 whitespace-nowrap"><NumIn label="Số set" value={it.sets} onChange={v => update(i, { sets: v })} />×<NumIn label="Số rep" value={it.reps} onChange={v => update(i, { reps: v })} /></span>{it.durationMinutes != null && <span className="flex items-center gap-1 whitespace-nowrap"><NumIn label="Thời lượng phút" value={it.durationMinutes} onChange={v => update(i, { durationMinutes: v })} />phút</span>}</div> : <span>{it.sets ?? '—'} × {it.reps ?? '—'}{it.durationMinutes != null && <span className="block text-xs text-text-muted">{it.durationMinutes} phút</span>}</span>}</td>
            <td className={`${td} min-w-32`}>{editable ? <span className="flex items-center gap-1 whitespace-nowrap"><NumIn label="Khối lượng kg" value={it.targetWeight} onChange={v => update(i, { targetWeight: v })} step={0.5} />kg</span> : it.targetWeight != null ? `${it.targetWeight} kg` : '—'}</td>
            <td className={`${td} min-w-28`}>{editable ? <span className="flex items-center gap-1 whitespace-nowrap"><NumIn label="Nghỉ giây" value={it.restSeconds} onChange={v => update(i, { restSeconds: v })} />s</span> : it.restSeconds != null ? `${it.restSeconds}s` : '—'}</td>
            <td className={td}>{editable ? <div className="space-y-2"><input aria-label="RPE" value={it.rpe ?? ''} onChange={e => update(i, { rpe: e.target.value || undefined })} className={`${inputCls} w-28`} maxLength={20} placeholder="RPE 7" /><textarea aria-label="Ghi chú bài tập" value={it.notes ?? ''} onChange={e => update(i, { notes: e.target.value || undefined })} className={`${textareaCls} min-w-40`} maxLength={2000} rows={2} placeholder="Hướng dẫn thực hiện" /></div> : <span className="whitespace-pre-wrap text-text-muted">{[it.rpe, it.notes].filter(Boolean).join(' · ') || '—'}</span>}</td>
            <td className={`${td} text-right`}>{editable ? <button type="button" aria-label={`Xóa ${it.name || 'dòng'}`} onClick={() => setItems(l => l!.filter((_, k) => k !== i))} className="rounded-lg p-1.5 text-text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
              : <Badge tone={it.confirmed ? 'success' : 'neutral'}>{it.confirmed ? 'đã xác nhận' : 'gợi ý'}</Badge>}</td>
          </tr>)}</tbody>
        </table></div>}
      {editable && <div className="space-y-3 border-t border-border-subtle p-5 print:hidden">
        <Btn size="sm" icon={<Plus aria-hidden className="h-4 w-4" />} disabled={items.length >= 40} onClick={() => { setEditing(true); setItems(l => [...l!, { exerciseId: null, name: '', sets: 3, reps: 10, restSeconds: 60, confirmed: true, needsExercise: true }]) }}>Thêm bài tập</Btn>
        {started && <Field label="Lý do điều chỉnh so với giáo án đã giao" required><textarea rows={2} value={reason} onChange={e => setReason(e.target.value)} className={textareaCls} placeholder="VD: HV đau vai, giảm tạ bài đẩy…" /></Field>}
        <InlineError message={submit.error} />
        <div className="flex flex-wrap justify-end gap-2">
          {(editing || items.length > 0) && <Btn variant="ghost" onClick={reset}>Hủy chỉnh sửa</Btn>}
          <Btn icon={<Save aria-hidden className="h-4 w-4" />} busy={submit.busy} disabled={!dirty || !items.some(i => i.name.trim()) || (started && !reason.trim())} onClick={() => void save()}>{started ? 'Lưu nội dung thực tế' : 'Lưu nháp'}</Btn>
          {!started && <Btn variant="primary" icon={<Send aria-hidden className="h-4 w-4" />} busy={submit.busy} disabled={!items.length || items.some(i => !i.exerciseId || !i.name.trim()) || (!dirty && status === 'ASSIGNED')}
            onClick={() => void saveAndAssign()}>{!dirty && status === 'ASSIGNED' ? 'Đã giao' : 'Lưu và giao'}</Btn>}
        </div>
      </div>}
    </>}
  </Card>
}

function NumIn({ value, onChange, label, step = 1 }: { value?: number; onChange: (v: number | undefined) => void; label: string; step?: number }) {
  return <input type="number" inputMode="decimal" aria-label={label} min={0} step={step} value={value ?? ''} onChange={e => onChange(e.target.value === '' ? undefined : Number(e.target.value))} className={`${inputCls.replace('w-full', '')} w-[4.5rem] shrink-0 text-center tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`} />
}

function ExerciseInput({ value, exercises, onChange }: { value: string; exercises: Exercise[]; onChange: (name: string, exerciseId: string | null) => void }) {
  const listId = useId()
  return <>
    <input list={listId} aria-label="Tên bài tập" value={value} maxLength={160} placeholder="Gõ để chọn bài tập…" className={`${inputCls} min-w-48`}
      onChange={e => { const name = e.target.value; const match = exercises.find(x => x.name.toLowerCase() === name.trim().toLowerCase()); onChange(match ? match.name : name, match?.id ?? null) }} />
    <datalist id={listId}>{exercises.map(x => <option key={x.id} value={x.name} />)}</datalist>
  </>
}

function RescheduleModal({ open, onClose, session, onDone }: { open: boolean; onClose: () => void; session: { id: string; purchaseId: string; startsAt: string; endsAt: string }; onDone: (m: string) => void }) {
  const [day, setDay] = useState(() => centerDate(session.startsAt))
  const [time, setTime] = useState(() => hhmm(session.startsAt))
  const [note, setNote] = useState('')
  const submit = useSubmit()
  const minutes = minutesBetween(session.startsAt, session.endsAt)
  return <Modal isOpen={open} onClose={onClose} title="Đề xuất đổi lịch buổi này" description="Học viên cần đồng ý; lịch cũ giữ nguyên cho tới khi học viên chấp nhận. Không đổi được khi còn dưới 4 giờ trước buổi.">
    <form className="space-y-4" onSubmit={async e => {
      e.preventDefault()
      const start = centerInstant(day, time)
      const ok = await submit.run(() => coachWs.proposeChange({ purchaseId: session.purchaseId, items: [{ bookingId: session.id, startsAt: start.toISOString(), endsAt: new Date(start.getTime() + minutes * 60_000).toISOString() }], note: note.trim() || undefined }))
      if (ok) onDone('Đã gửi đề xuất đổi lịch cho học viên.')
    }}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Ngày mới" required><input type="date" required value={day} min={centerDate()} onChange={e => setDay(e.target.value)} className={inputCls} /></Field>
        <Field label="Giờ bắt đầu" required hint={`Thời lượng giữ nguyên ${minutes} phút`}><input type="time" required value={time} onChange={e => setTime(e.target.value)} className={inputCls} /></Field>
      </div>
      <Field label="Lời nhắn cho học viên"><textarea rows={2} value={note} onChange={e => setNote(e.target.value)} className={textareaCls} /></Field>
      <InlineError message={submit.error} />
      <div className="flex justify-end gap-2"><Btn onClick={onClose}>Hủy</Btn><Btn type="submit" variant="primary" busy={submit.busy}>Gửi đề xuất</Btn></div>
    </form>
  </Modal>
}
