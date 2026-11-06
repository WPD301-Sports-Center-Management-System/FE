import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, Check, ShieldCheck, Sparkles, Trash2, X } from 'lucide-react'
import { Modal } from '@/shared/components/ui/modal'
import { UnsavedChanges } from '@/shared/components/ui/unsaved-changes'
import { useLoad, useSubmit } from '@/features/fixed-pt/hooks'
import { coachWs } from '@/features/coach-workspace/api'
import { Async, Badge, Btn, Card, Dot, EmptyBox, Field, InlineError, PageHeader, Segmented, btnCls, inputCls, textareaCls, useFlash } from '@/features/workspace/ui'
import { formatDate } from '@/shared/utils/date'
import { mealPlansService } from '../services/meal-plans.service'
import {
  AI_KIND_LABEL, aiRecommendationsService, type AiKind, type AiRecommendation, type DraftContent, type MealPlanDraft, type ProgressSummaryDraft, type TrainingPlanDraft,
} from '../services/ai-recommendations.service'

// Every AI output is a draft: the Coach reads, edits and approves it into a real record (library template,
// meal plan draft, progress report). Only library exercises/foods can be used; the server checks every id.
const KIND_HINT: Record<AiKind, string> = {
  TRAINING_PLAN: 'AI chọn bài trong thư viện bài tập của trung tâm. Duyệt xong thành giáo án mẫu trong thư viện của bạn để áp vào buổi.',
  PROGRESS_SUMMARY: 'AI tóm tắt kết quả các buổi đã công bố và số đo. Duyệt xong thành nhận xét tiến độ (gửi học viên nếu bạn chọn).',
  MEAL_PLAN: 'AI ghép món trong thư viện món theo kcal mục tiêu; dinh dưỡng do hệ thống tính lại. Duyệt xong thành thực đơn nháp.',
}
const STATUS = { DRAFT: { label: 'Chờ duyệt', tone: 'warning' }, APPROVED: { label: 'Đã duyệt', tone: 'success' }, REJECTED: { label: 'Đã bỏ', tone: 'neutral' } } as const
type Filter = 'DRAFT' | 'APPROVED' | 'REJECTED'

/** `kind` fixes the draft type when the page is a tab of Giáo án / Tiến độ / Thực đơn. */
export function CoachAiRecommendationPage({ kind }: { kind?: AiKind } = {}) {
  const { flash, node } = useFlash()
  const status = useLoad(() => aiRecommendationsService.status(), [])
  const [filter, setFilter] = useState<Filter>('DRAFT')
  const list = useLoad(() => aiRecommendationsService.getRecommendations({ status: filter, kind, limit: 50 }), [filter, kind])
  const [open, setOpen] = useState<AiRecommendation | null>(null)
  const configured = status.data?.configured

  return <div>
    {node}
    {!kind && <PageHeader title="Gợi ý AI" subtitle={<><span>AI soạn nháp, bạn quyết định</span><Dot /><span>Dùng dữ liệu tập luyện trong hồ sơ học viên</span></>} />}
    {status.error && <div className="mb-4"><InlineError message={status.error} /><Btn onClick={() => void status.reload()}>Kiểm tra lại AI</Btn></div>}
    {status.data && !configured && <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
      <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
      <span>AI chưa sẵn sàng. Vui lòng liên hệ quản trị viên để bật tính năng. Bạn vẫn có thể xem và duyệt các bản nháp đã tạo.</span>
    </div>}
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <CreateCard fixedKind={kind} disabled={!configured} onCreated={rec => { setFilter('DRAFT'); void list.reload(); setOpen(rec) }} />
      <Card flush title="Bản nháp AI" actions={<Segmented label="Lọc" value={filter} onChange={setFilter} items={(['DRAFT', 'APPROVED', 'REJECTED'] as const).map(k => ({ key: k, label: STATUS[k].label }))} />}>
        <Async state={list} rows={5} empty={l => !l.length && <EmptyBox icon={<Sparkles className="h-5 w-5" />} title={filter === 'DRAFT' ? 'Không có nháp chờ duyệt' : 'Chưa có mục nào'} />}>
          {items => <ul className="divide-y divide-border-subtle">{items.map(r => { const c = (r.editedContent ?? r.generatedContent) as { title?: string }; return <li key={r.id}>
            <button type="button" onClick={() => setOpen(r)} className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left hover:bg-bg-surface-muted/40">
              <span className="min-w-0"><span className="block truncate text-sm font-semibold">{c?.title ?? 'Bản nháp'}</span>
                <span className="text-xs text-text-muted">{AI_KIND_LABEL[r.kind] ?? r.kind} · {r.member?.user.fullName ?? 'Học viên'} · {formatDate(r.createdAt)}</span></span>
              <Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge>
            </button></li> })}</ul>}
        </Async>
      </Card>
    </div>
    {open && <DraftModal key={open.id} rec={open} onClose={() => setOpen(null)} onReviewed={r => { setOpen(r); void list.reload() }} onChanged={m => { flash(m); setOpen(null); void list.reload() }} />}
  </div>
}

function CreateCard({ fixedKind, disabled, onCreated }: { fixedKind?: AiKind; disabled?: boolean; onCreated: (r: AiRecommendation) => void }) {
  const members = useLoad(() => coachWs.members(), [])
  const purchases = useLoad(() => coachWs.purchases(), [])
  const submit = useSubmit()
  const [chosenKind, setKind] = useState<AiKind>('TRAINING_PLAN')
  const kind = fixedKind ?? chosenKind
  const [params] = useSearchParams()
  const [memberId, setMemberId] = useState(() => params.get('memberId') ?? '')
  const [purchaseId, setPurchaseId] = useState(() => params.get('purchaseId') ?? '')
  const [goal, setGoal] = useState('')
  const [context, setContext] = useState('')
  const [kcal, setKcal] = useState('')
  const [days, setDays] = useState('3')
  const [duration, setDuration] = useState('60')
  const suggestion = useLoad(() => mealPlansService.getCalorieSuggestion(memberId), [memberId], !!memberId && kind === 'MEAL_PLAN')
  const memberPackages = useMemo(() => (purchases.data ?? []).filter(p => p.memberId === memberId && ['ACTIVE', 'PAUSED', 'COMPLETED'].includes(p.status)), [purchases.data, memberId])
  const selectedPurchase = memberPackages.find(p => p.id === purchaseId) ?? memberPackages.find(p => p.status === 'ACTIVE') ?? memberPackages[0]
  const valid = members.data?.some(m => m.id === memberId) && !purchases.loading && !purchases.error && (kind !== 'MEAL_PLAN' || Number(kcal) >= 800 && Number(kcal) <= 6000)
  const s = suggestion.data?.suggestion

  return <Card title={kind === 'TRAINING_PLAN' ? 'Soạn giáo án nhanh' : 'Tạo bản nháp'} subtitle={kind === 'TRAINING_PLAN' ? 'Chọn học viên, AI dùng mục tiêu, trình độ và số đo đã có để soạn một buổi tập.' : KIND_HINT[kind]}>
    <form className="space-y-4" onSubmit={async e => {
      e.preventDefault()
      if (!valid || disabled) return
      const rec = await submit.run(() => aiRecommendationsService.createRecommendation({ kind, memberId, ptPurchaseId: selectedPurchase?.id, goal: goal.trim() || undefined, context: context.trim() || undefined,
        dailyCalorieTarget: kind === 'MEAL_PLAN' ? Number(kcal) : undefined, days: kind === 'MEAL_PLAN' ? Number(days) : undefined, durationMinutes: kind === 'TRAINING_PLAN' ? Number(duration) : undefined }))
      if (rec) {
        const member = members.data?.find(m => m.id === memberId)
        onCreated({ ...rec, member: member ? { memberCode: member.memberCode, user: { fullName: member.fullName ?? member.user?.fullName ?? 'Học viên' } } : rec.member })
      }
    }}>
      {!fixedKind && <Segmented label="Loại nháp" value={kind} onChange={setKind} items={(Object.keys(AI_KIND_LABEL) as AiKind[]).map(k => ({ key: k, label: AI_KIND_LABEL[k] }))} />}
      <fieldset disabled={submit.busy} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Học viên" required error={members.error}><select required value={memberId} onChange={e => { setMemberId(e.target.value); setPurchaseId('') }} className={inputCls}>
          <option value="">{members.data ? 'Chọn học viên…' : 'Đang tải…'}</option>{(members.data ?? []).map(m => <option key={m.id} value={m.id}>{m.fullName ?? m.user?.fullName} · {m.memberCode}</option>)}</select></Field>
        <Field label="Gói PT"><select value={selectedPurchase?.id ?? ''} onChange={e => setPurchaseId(e.target.value)} className={inputCls} disabled={!memberPackages.length}>
          {!memberPackages.length && <option value="">{purchases.loading ? 'Đang tải…' : 'Không có gói PT'}</option>}{memberPackages.map(p => <option key={p.id} value={p.id}>{p.packageNameSnapshot}</option>)}</select></Field>
      </div>
      {purchases.error && <div><InlineError message={purchases.error} /><Btn onClick={() => void purchases.reload()}>Tải lại gói PT</Btn></div>}
      {kind === 'TRAINING_PLAN' && <>
        <Field label="Thời lượng buổi tập"><select value={duration} onChange={e => setDuration(e.target.value)} className={inputCls}>{[30, 45, 60, 90, 120].map(n => <option key={n} value={n}>{n} phút</option>)}</select></Field>
        <div role="group" aria-label="Chọn nhanh mục tiêu" className="flex flex-wrap gap-2">{['Theo hồ sơ học viên', 'Giảm mỡ, giữ cơ', 'Tăng cơ toàn thân', 'Tăng sức bền', 'Vận động nhẹ'].map((label, i) => {
          const value = i === 0 ? '' : label
          return <button key={label} type="button" aria-pressed={goal === value} onClick={() => setGoal(value)} className={`rounded-lg border px-3 py-2 text-sm ${goal === value ? 'border-primary text-primary bg-primary/5' : 'border-border-subtle hover:bg-bg-surface-muted'}`}>{label}</button>
        })}</div>
      </>}
      {kind === 'TRAINING_PLAN' && <details className="rounded-lg border border-border-subtle p-3">
        <summary className="cursor-pointer text-sm font-medium">Mục tiêu riêng & lưu ý cho AI{context.trim() ? ' · Đã có ghi chú' : ''}</summary>
        <div className="mt-3 space-y-3">
          <Field label="Mục tiêu riêng (nếu cần)"><input value={goal} onChange={e => setGoal(e.target.value)} className={inputCls} placeholder="Để trống để dùng mục tiêu trong hồ sơ" /></Field>
          <Field label="Ghi chú cho AI" hint="Chấn thương, bài cần tránh, dụng cụ có sẵn…"><textarea rows={3} value={context} onChange={e => setContext(e.target.value)} className={textareaCls} /></Field>
        </div>
      </details>}
      {kind === 'MEAL_PLAN' && <Field label="Mục tiêu"><input value={goal} onChange={e => setGoal(e.target.value)} className={inputCls} placeholder="Giảm mỡ, giữ cơ" /></Field>}
      {kind === 'MEAL_PLAN' && <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Kcal mục tiêu / ngày" required><input type="number" min={800} max={6000} required value={kcal} onChange={e => setKcal(e.target.value)} className={inputCls} />
          {s && <span className="mt-1 flex flex-wrap gap-1.5 text-xs">{([['Giảm mỡ', s.fatLoss], ['Duy trì', s.maintain], ['Tăng cơ', s.muscleGain]] as const).map(([l, v]) => <button key={l} type="button" onClick={() => setKcal(String(v))} className="rounded-md border border-border-subtle px-1.5 py-0.5 hover:border-primary hover:text-primary">{l} {v.toLocaleString('vi-VN')}</button>)}</span>}
        </Field>
        <Field label="Số ngày"><select value={days} onChange={e => setDays(e.target.value)} className={inputCls}>{[1, 2, 3, 4, 5, 6, 7].map(d => <option key={d}>{d}</option>)}</select></Field>
      </div>}
      {kind !== 'TRAINING_PLAN' && <Field label="Ghi chú cho AI" hint={kind === 'MEAL_PLAN' ? 'Dị ứng, món không ăn, khẩu vị, giờ tập…' : 'Điều bạn muốn nhấn mạnh'}>
        <textarea rows={3} value={context} onChange={e => setContext(e.target.value)} className={textareaCls} /></Field>}
      </fieldset>
      <p className="flex items-start gap-1.5 text-xs text-text-muted"><ShieldCheck aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />Gửi cho AI: tuổi, giới tính, trình độ, số đo, mục tiêu và ghi chú bạn nhập. Tên, số điện thoại và ghi chú y tế trong hồ sơ không được tự động gửi.</p>
      <InlineError message={submit.error} />
      <div className="flex justify-end"><Btn type="submit" variant="primary" busy={submit.busy} disabled={!valid || disabled} icon={<Sparkles aria-hidden className="h-4 w-4" />}>{submit.busy ? 'AI đang soạn…' : 'Tạo bản nháp'}</Btn></div>
    </form>
  </Card>
}

const toLines = (s: string) => s.split('\n').map(x => x.trim()).filter(Boolean)

function DraftModal({ rec, onClose, onChanged, onReviewed }: { rec: AiRecommendation; onClose: () => void; onChanged: (m: string) => void; onReviewed: (r: AiRecommendation) => void }) {
  const [content, setContent] = useState<DraftContent>(() => structuredClone(rec.editedContent ?? rec.generatedContent))
  const [dirty, setDirty] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [confirmClose, setConfirmClose] = useState(false)
  const submit = useSubmit()
  const editable = rec.status === 'DRAFT'
  const edit = (next: DraftContent) => { setContent(next); setDirty(true) }
  const saveEdits = async () => { if (!dirty) return true; const r = await submit.run(() => aiRecommendationsService.updateRecommendation(rec.id, content)); if (r) { setContent(r.editedContent ?? content); setDirty(false) } return !!r }
  const approve = async (publish?: boolean) => {
    const r = await submit.run(async () => {
      if (dirty) {
        const saved = await aiRecommendationsService.updateRecommendation(rec.id, content)
        setContent(saved.editedContent ?? content); setDirty(false)
      }
      return aiRecommendationsService.approveRecommendation(rec.id, { publish })
    })
    if (r) {
      if (rec.kind === 'TRAINING_PLAN') onReviewed({ ...rec, ...r })
      else onChanged(rec.kind === 'MEAL_PLAN' ? 'Đã tạo thực đơn nháp. Mở “Thực đơn dinh dưỡng” để giao.' : publish ? 'Đã gửi nhận xét cho học viên.' : 'Đã lưu nhận xét nháp ở trang học viên.')
    }
  }
  const link = rec.status === 'APPROVED' && (rec.sessionTemplateId ? { to: `/coach/library?tab=templates&templateId=${rec.sessionTemplateId}`, label: 'Mở giáo án vừa lưu' } : rec.mealPlanId ? { to: '/coach/meal-plans?tab=plans', label: 'Mở thực đơn' } : rec.progressReportId ? { to: `/coach/students/${rec.memberId}`, label: 'Mở trang học viên' } : null)

  return <Modal isOpen onClose={() => { if (!submit.busy) { if (dirty) setConfirmClose(true); else onClose() } }} maxWidth={rec.kind === 'TRAINING_PLAN' ? '4xl' : 'xl'} title={`${AI_KIND_LABEL[rec.kind]} · ${rec.member?.user.fullName ?? 'Học viên'}`} description={`Tạo ${formatDate(rec.createdAt)}${editable ? ' · Sửa trực tiếp rồi duyệt' : ''}`}>
    <div className="space-y-4">
      <UnsavedChanges dirty={dirty && editable} busy={submit.busy} />
      {rec.status === 'APPROVED' && rec.kind === 'TRAINING_PLAN' && <p role="status" className="text-sm text-green-700">Đã lưu vào thư viện. Mở giáo án để áp cho gói học viên.</p>}
      {confirmClose && <div className="space-y-2 rounded-lg border border-border-subtle p-3"><p className="text-sm">Bạn còn chỉnh sửa chưa lưu.</p><div className="flex flex-wrap gap-2"><Btn onClick={() => setConfirmClose(false)}>Tiếp tục sửa</Btn><Btn busy={submit.busy} onClick={async () => { if (await saveEdits()) onClose() }}>Lưu và đóng</Btn><Btn disabled={submit.busy} onClick={onClose}>Bỏ chỉnh sửa và đóng</Btn></div></div>}
      {rec.kind === 'TRAINING_PLAN' && <TrainingEditor c={content as TrainingPlanDraft} editable={editable && !submit.busy} onChange={edit} />}
      {rec.kind === 'PROGRESS_SUMMARY' && <SummaryEditor c={content as ProgressSummaryDraft} editable={editable} onChange={edit} />}
      {rec.kind === 'MEAL_PLAN' && <MealViewer c={content as MealPlanDraft} editable={editable} onChange={edit} />}
      {rec.status === 'REJECTED' && rec.rejectionReason && <p className="text-sm text-text-muted">Lý do bỏ: {rec.rejectionReason}</p>}
      <InlineError message={submit.error} />
      <div className="flex flex-wrap justify-end gap-2 border-t border-border-subtle pt-3">
        {link && <Link to={link.to} onClick={onClose} className={btnCls('primary')}>{link.label}</Link>}
        {editable && !rejecting && <>
          <Btn icon={<X aria-hidden className="h-4 w-4" />} onClick={() => setRejecting(true)}>Bỏ nháp</Btn>
          {dirty && <Btn busy={submit.busy} onClick={() => void saveEdits()}>Lưu chỉnh sửa</Btn>}
          {rec.kind === 'PROGRESS_SUMMARY' ? <><Btn busy={submit.busy} onClick={() => void approve(false)}>Duyệt, lưu nháp</Btn><Btn variant="primary" busy={submit.busy} icon={<Check aria-hidden className="h-4 w-4" />} onClick={() => void approve(true)}>Duyệt & gửi học viên</Btn></>
            : <Btn variant="primary" busy={submit.busy} icon={<Check aria-hidden className="h-4 w-4" />} onClick={() => void approve()}>{rec.kind === 'TRAINING_PLAN' ? 'Lưu vào thư viện giáo án' : 'Duyệt'}</Btn>}
        </>}
        {rejecting && <div className="flex w-full items-end gap-2"><div className="flex-1"><Field label="Lý do bỏ" required><input value={reason} onChange={e => setReason(e.target.value)} className={inputCls} placeholder="Không phù hợp với chấn thương gối" /></Field></div>
          <Btn onClick={() => setRejecting(false)}>Hủy</Btn><Btn variant="danger" busy={submit.busy} disabled={!reason.trim()} onClick={async () => { if (await submit.run(() => aiRecommendationsService.rejectRecommendation(rec.id, reason.trim()))) onChanged('Đã bỏ bản nháp.') }}>Bỏ nháp</Btn></div>}
      </div>
    </div>
  </Modal>
}

const numIn = (v: number | undefined, on: (n: number | undefined) => void, editable: boolean, label: string) =>
  <input aria-label={label} type="number" min={0} disabled={!editable} value={v ?? ''} onChange={e => on(e.target.value === '' ? undefined : Number(e.target.value))} className={`${inputCls} h-8 min-w-16 w-16 px-2 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none`} />

function TrainingEditor({ c, editable, onChange }: { c: TrainingPlanDraft; editable: boolean; onChange: (c: TrainingPlanDraft) => void }) {
  const library = useLoad(() => coachWs.exercises(), [], editable)
  const setEx = (i: number, patch: Partial<TrainingPlanDraft['exercises'][number]>) => onChange({ ...c, exercises: c.exercises.map((e, j) => j === i ? { ...e, ...patch } : e) })
  const move = (i: number, offset: number) => {
    const exercises = [...c.exercises]
    ;[exercises[i], exercises[i + offset]] = [exercises[i + offset], exercises[i]]
    onChange({ ...c, exercises })
  }
  return <>
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Tên giáo án"><input disabled={!editable} value={c.title} onChange={e => onChange({ ...c, title: e.target.value })} className={inputCls} /></Field>
      <Field label="Mục tiêu"><input disabled={!editable} value={c.goal} onChange={e => onChange({ ...c, goal: e.target.value })} className={inputCls} /></Field>
    </div>
    <div className="overflow-x-auto rounded-xl border border-border-subtle"><table className="w-full text-sm">
      <caption className="px-3 py-2 text-left font-medium">{c.exercises.length} bài tập · Theo thứ tự thực hiện</caption>
      <thead className="bg-bg-surface-muted text-xs text-text-muted"><tr><th className="px-3 py-2 text-left">Bài tập</th><th className="px-2">Hiệp</th><th className="px-2">Lần</th><th className="px-2">Phút</th><th className="px-2">Nghỉ (s)</th><th className="px-3 text-left">Hướng dẫn</th><th /></tr></thead>
      <tbody className="divide-y divide-border-subtle">{c.exercises.map((e, i) => <tr key={e.exerciseId}>
        <td className="min-w-44 px-3 py-2 font-semibold">{i + 1}. {e.name}
          {editable && <div className="mt-1 flex gap-2 text-xs font-normal"><button type="button" disabled={i === 0} aria-label={`Đưa ${e.name} lên`} onClick={() => move(i, -1)} className="py-1 disabled:opacity-30">Lên</button><button type="button" disabled={i === c.exercises.length - 1} aria-label={`Đưa ${e.name} xuống`} onClick={() => move(i, 1)} className="py-1 disabled:opacity-30">Xuống</button></div>}
        </td>
        <td className="px-2 py-2">{numIn(e.sets, n => setEx(i, { sets: n }), editable, `Hiệp ${e.name}`)}</td>
        <td className="px-2 py-2">{numIn(e.reps, n => setEx(i, { reps: n }), editable, `Lần ${e.name}`)}</td>
        <td className="px-2 py-2">{numIn(e.durationMinutes, n => setEx(i, { durationMinutes: n }), editable, `Phút ${e.name}`)}</td>
        <td className="px-2 py-2">{numIn(e.restSeconds, n => setEx(i, { restSeconds: n }), editable, `Nghỉ ${e.name}`)}</td>
        <td className="min-w-48 px-3 py-2"><input aria-label={`Hướng dẫn ${e.name}`} disabled={!editable} value={e.instructions ?? ''} onChange={ev => setEx(i, { instructions: ev.target.value })} className={`${inputCls} h-8`} /></td>
        <td className="px-2">{editable && c.exercises.length > 1 && <button type="button" aria-label={`Bỏ ${e.name}`} onClick={() => onChange({ ...c, exercises: c.exercises.filter((_, j) => j !== i) })} className="text-text-muted hover:text-red-600"><Trash2 className="h-4 w-4" /></button>}</td>
      </tr>)}</tbody></table></div>
    {editable && <Field label="Thêm bài từ thư viện" error={library.error}><select className={inputCls} value="" disabled={!library.data || c.exercises.length >= 15} onChange={event => {
      const exercise = library.data?.find(e => e.id === event.target.value)
      if (exercise) onChange({ ...c, exercises: [...c.exercises, { exerciseId: exercise.id, name: exercise.name, sets: 3, reps: 12, restSeconds: 60 }] })
    }}><option value="">{library.loading ? 'Đang tải bài tập…' : c.exercises.length >= 15 ? 'Tối đa 15 bài mỗi giáo án' : 'Chọn bài để thêm…'}</option>{(library.data ?? []).filter(e => !c.exercises.some(x => x.exerciseId === e.id)).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></Field>}
    <Field label="Ghi chú"><textarea rows={2} disabled={!editable} value={c.notes ?? ''} onChange={e => onChange({ ...c, notes: e.target.value })} className={textareaCls} /></Field>
  </>
}

function SummaryEditor({ c, editable, onChange }: { c: ProgressSummaryDraft; editable: boolean; onChange: (c: ProgressSummaryDraft) => void }) {
  return <>
    <Field label="Tiêu đề"><input disabled={!editable} value={c.title} onChange={e => onChange({ ...c, title: e.target.value })} className={inputCls} /></Field>
    <Field label="Nhận xét"><textarea rows={5} disabled={!editable} value={c.summary} onChange={e => onChange({ ...c, summary: e.target.value })} className={textareaCls} /></Field>
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Điểm tốt" hint="Mỗi dòng một ý"><textarea rows={3} disabled={!editable} value={c.highlights.join('\n')} onChange={e => onChange({ ...c, highlights: toLines(e.target.value) })} className={textareaCls} /></Field>
      <Field label="Tập trung tiếp" hint="Mỗi dòng một ý"><textarea rows={3} disabled={!editable} value={c.focusNext.join('\n')} onChange={e => onChange({ ...c, focusNext: toLines(e.target.value) })} className={textareaCls} /></Field>
    </div>
  </>
}

function MealViewer({ c, editable, onChange }: { c: MealPlanDraft; editable: boolean; onChange: (c: MealPlanDraft) => void }) {
  const [day, setDay] = useState(c.days[0]?.dayNumber ?? 1)
  const d = c.days.find(x => x.dayNumber === day) ?? c.days[0]
  const kcal = (dd: MealPlanDraft['days'][number]) => dd.meals.reduce((n, m) => n + m.items.reduce((k, i) => k + i.estimatedCalories, 0), 0)
  // Servings edits are saved and the server recomputes nutrition from the library.
  const setServings = (mi: number, ii: number, servings: number) => onChange({ ...c, days: c.days.map(x => x.dayNumber !== day ? x : { ...x, meals: x.meals.map((m, a) => a !== mi ? m : { ...m, items: m.items.map((it, b) => b !== ii ? it : { ...it, estimatedCalories: Math.round(it.estimatedCalories / it.servings * servings), servings }) }) }) })
  const remove = (mi: number, ii: number) => onChange({ ...c, days: c.days.map(x => x.dayNumber !== day ? x : { ...x, meals: x.meals.map((m, a) => a !== mi ? m : { ...m, items: m.items.filter((_, b) => b !== ii) }).filter(m => m.items.length) }) })
  return <>
    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
      <Field label="Tên thực đơn"><input disabled={!editable} value={c.title} onChange={e => onChange({ ...c, title: e.target.value })} className={inputCls} /></Field>
      <div className="self-end pb-2 text-sm">Mục tiêu <strong>{c.dailyCalorieTarget.toLocaleString('vi-VN')}</strong> kcal/ngày</div>
    </div>
    <div className="flex flex-wrap gap-2">{c.days.map(x => <button key={x.dayNumber} type="button" onClick={() => setDay(x.dayNumber)}
      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${x.dayNumber === day ? 'border-primary bg-primary text-white' : 'border-border-subtle bg-bg-surface-muted text-text-muted'}`}>Ngày {x.dayNumber} · {kcal(x).toLocaleString('vi-VN')} kcal</button>)}</div>
    {d && <div className="max-h-[40vh] space-y-2 overflow-y-auto">{d.meals.map((m, mi) => <div key={mi} className="rounded-xl border border-border-subtle p-3">
      <p className="mb-1 text-xs font-bold">{m.mealType}</p>
      {m.items.map((it, ii) => <div key={ii} className="flex items-center gap-2 py-0.5 text-sm">
        <span className="flex-1">{it.foodName} <span className="text-xs text-text-muted">· {it.quantity}</span></span>
        {editable ? <input aria-label={`Khẩu phần ${it.foodName}`} type="number" min={0.25} step={0.25} value={it.servings} onChange={e => Number(e.target.value) > 0 && setServings(mi, ii, Number(e.target.value))} className={`${inputCls} h-8 w-20`} /> : <span className="text-xs">× {it.servings}</span>}
        <span className="w-16 text-right text-xs tabular-nums text-text-muted">{it.estimatedCalories} kcal</span>
        {editable && <button type="button" aria-label={`Bỏ ${it.foodName}`} onClick={() => remove(mi, ii)} className="text-text-muted hover:text-red-600"><Trash2 className="h-4 w-4" /></button>}
      </div>)}
    </div>)}</div>}
    {c.notes && <p className="text-sm text-text-muted">{c.notes}</p>}
  </>
}
