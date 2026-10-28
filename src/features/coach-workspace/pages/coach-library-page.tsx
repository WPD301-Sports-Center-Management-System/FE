import { useMemo, useState } from 'react'
import { Archive, BookOpenText, Copy, Dumbbell, Eye, Leaf, Plus, Search, Send, Trash2 } from 'lucide-react'
import { Modal } from '@/shared/components/ui/modal'
import { useLoad, useSubmit } from '@/features/fixed-pt/hooks'
import { centerDate } from '@/shared/utils/date'
import { coachWs, type LibraryTemplate } from '../api'
import { Badge, Btn, Card, Dot, EmptyBox, ErrorBox, Field, InlineError, LinkBtn, PageHeader, Segmented, Skeleton, inputCls, textareaCls, useFlash } from '@/features/workspace/ui'
import { addDays, dayEnd, isUpcoming, relativeSlot } from '@/features/workspace/utils'

const exerciseNames = (t: LibraryTemplate) => t.items.map(i => i.exercise?.name ?? i.candidateNames[0] ?? i.roleName ?? '').filter(Boolean)

export function CoachLibraryPage() {
  const { flash, node } = useFlash()
  const templates = useLoad(() => coachWs.templates(), [])
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [view, setView] = useState<LibraryTemplate | null>(null)
  const [apply, setApply] = useState<LibraryTemplate | null>(null)
  const [create, setCreate] = useState(false)
  const list = templates.data ?? []
  const focuses = useMemo(() => [...new Set((templates.data ?? []).map(t => t.focus?.trim()).filter((f): f is string => !!f))].sort(), [templates.data])
  const tabs = [{ key: 'all', label: 'Tất cả', count: list.length }, { key: 'mine', label: 'Của tôi', count: list.filter(t => t.coachId).length }, ...focuses.slice(0, 6).map(f => ({ key: `f:${f}`, label: f, count: list.filter(t => t.focus === f).length }))]
  const term = q.trim().toLowerCase()
  const rows = list.filter(t => (tab === 'all' || (tab === 'mine' ? !!t.coachId : t.focus === tab.slice(2))) && (!term || [t.name, t.focus, ...exerciseNames(t)].some(v => v?.toLowerCase().includes(term))))
  const done = (m: string) => { flash(m); void templates.reload() }

  return <div>
    {node}
    <PageHeader title="Giáo án & thư viện mẫu" subtitle={<><span>{templates.data ? `${list.length} giáo án mẫu (hệ thống và của bạn)` : 'Đang tải…'}</span><Dot /><span>Nhân bản để chỉnh, rồi áp trực tiếp vào ca tập</span></>}
      actions={<Btn variant="primary" icon={<Plus aria-hidden className="h-4 w-4" />} onClick={() => setCreate(true)}>Tạo giáo án mới</Btn>} />
    <Card flush>
      <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle p-4">
        <Segmented label="Lọc giáo án" value={tab} onChange={setTab} items={tabs} />
        <label className="relative ml-auto min-w-56 flex-1 sm:max-w-xs"><span className="sr-only">Tìm giáo án</span><Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm giáo án, bài tập…" className={`${inputCls} pl-9`} /></label>
        <LinkBtn to="/coach/meal-plans" icon={<Leaf aria-hidden className="h-4 w-4" />}>Thực đơn</LinkBtn>
      </div>
      {templates.error ? <ErrorBox message={templates.error} onRetry={() => void templates.reload()} /> : !templates.data ? <Skeleton rows={4} /> : !rows.length
        ? <EmptyBox icon={<BookOpenText className="h-5 w-5" />} title={list.length ? 'Không có giáo án phù hợp' : 'Thư viện đang trống'} action={<Btn onClick={() => setCreate(true)}>Tạo giáo án mới</Btn>} />
        : <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {rows.map(t => <article key={t.id} className="flex flex-col rounded-xl border border-border-subtle bg-bg-surface p-4 transition-shadow hover:shadow-md">
            <div className="flex items-start gap-3">
              <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Dumbbell className="h-5 w-5" /></span>
              <div className="min-w-0"><h3 className="font-semibold leading-snug">{t.name}</h3><p className="mt-0.5 text-xs text-text-muted">{t.items.length} bài · phiên bản {t.version}</p></div>
            </div>
            {t.description && <p className="mt-2 line-clamp-2 text-sm text-text-muted">{t.description}</p>}
            <p className="mt-2 line-clamp-2 text-xs text-text-muted">{exerciseNames(t).join(' · ')}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">{t.focus && <Badge tone="info">{t.focus}</Badge>}<Badge tone={t.coachId ? 'violet' : 'neutral'}>{t.coachId ? 'Của tôi' : 'Mẫu hệ thống'}</Badge></div>
            <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
              <DuplicateBtn t={t} onDone={done} />
              <Btn size="sm" icon={<Eye aria-hidden className="h-3.5 w-3.5" />} onClick={() => setView(t)}>Xem</Btn>
              <Btn size="sm" variant="soft" icon={<Send aria-hidden className="h-3.5 w-3.5" />} onClick={() => setApply(t)}>Áp vào ca</Btn>
            </div>
          </article>)}
        </div>}
    </Card>
    {view && <ViewModal t={view} onClose={() => setView(null)} onDone={m => { setView(null); done(m) }} />}
    {apply && <ApplyModal t={apply} onClose={() => setApply(null)} onDone={m => { setApply(null); flash(m) }} />}
    <CreateModal open={create} onClose={() => setCreate(false)} onDone={m => { setCreate(false); done(m) }} />
  </div>
}

function DuplicateBtn({ t, onDone }: { t: LibraryTemplate; onDone: (m: string) => void }) {
  const submit = useSubmit()
  return <>
    <Btn size="sm" icon={<Copy aria-hidden className="h-3.5 w-3.5" />} busy={submit.busy}
      onClick={async () => { if (await submit.run(() => coachWs.duplicateTemplate(t.id))) onDone(`Đã nhân bản “${t.name}” vào mục Của tôi.`) }}>Nhân bản</Btn>
    {submit.error && <p role="alert" className="basis-full text-xs text-red-600">{submit.error}</p>}
  </>
}

function ViewModal({ t, onClose, onDone }: { t: LibraryTemplate; onClose: () => void; onDone: (m: string) => void }) {
  const submit = useSubmit()
  const [confirm, setConfirm] = useState(false)
  return <Modal isOpen onClose={onClose} maxWidth="xl" title={t.name} description={[t.focus, `${t.items.length} bài`, t.coachId ? 'Của tôi' : 'Mẫu hệ thống'].filter(Boolean).join(' · ')}>
    {t.description && <p className="mb-3 text-sm text-text-muted">{t.description}</p>}
    <ol className="divide-y divide-border-subtle rounded-lg border border-border-subtle">{t.items.map((i, k) => <li key={i.id} className="flex gap-3 px-3 py-2.5 text-sm">
      <span className="w-6 shrink-0 text-right font-semibold tabular-nums text-text-muted">{k + 1}.</span>
      <div><p className="font-semibold">{i.exercise?.name ?? i.candidateNames.join(' / ') ?? '—'}</p>
        <p className="text-xs text-text-muted">{[i.roleName, i.phase, i.exercise ? null : 'chưa gán bài trong thư viện'].filter(Boolean).join(' · ')}</p></div>
    </li>)}</ol>
    <p className="mt-3 text-xs text-text-muted">Mức tạ/rep không tự điền khi áp vào ca — bạn xác nhận cho từng học viên.</p>
    <InlineError message={submit.error} />
    {t.coachId && <div className="mt-4 flex justify-end gap-2 border-t border-border-subtle pt-4">
      {confirm ? <><span className="mr-auto self-center text-sm">Lưu trữ giáo án này? Buổi đã giao không bị ảnh hưởng.</span><Btn onClick={() => setConfirm(false)}>Không</Btn>
        <Btn variant="danger" busy={submit.busy} onClick={async () => { if (await submit.run(() => coachWs.archiveTemplate(t.id))) onDone('Đã lưu trữ giáo án.') }}>Lưu trữ</Btn></>
        : <Btn variant="danger" icon={<Archive aria-hidden className="h-4 w-4" />} onClick={() => setConfirm(true)}>Lưu trữ</Btn>}
    </div>}
  </Modal>
}

/** Applies the template to one of the Coach's upcoming sessions (replaces that session's draft). */
function ApplyModal({ t, onClose, onDone }: { t: LibraryTemplate; onClose: () => void; onDone: (m: string) => void }) {
  const today = centerDate()
  const sessions = useLoad(() => coachWs.sessions({ from: new Date().toISOString(), to: dayEnd(addDays(today, 14)) }, 2), [today])
  const submit = useSubmit()
  const [id, setId] = useState('')
  const upcoming = (sessions.data ?? []).filter(isUpcoming)
  return <Modal isOpen onClose={onClose} title={`Áp “${t.name}” vào ca`} description="Chọn một ca trong 14 ngày tới. Giáo án nháp hiện có của ca sẽ được thay bằng mẫu này.">
    <form className="space-y-4" onSubmit={async e => { e.preventDefault(); if (await submit.run(() => coachWs.applyTemplate(id, t.id))) onDone('Đã áp giáo án — mở ca để xác nhận mức tạ rồi giao cho học viên.') }}>
      <Field label="Ca tập" required error={sessions.error}>
        <select required value={id} onChange={e => setId(e.target.value)} className={inputCls} disabled={!sessions.data}>
          <option value="">{sessions.data ? (upcoming.length ? 'Chọn ca…' : 'Không có ca sắp tới') : 'Đang tải…'}</option>
          {upcoming.map(s => <option key={s.id} value={s.id}>{relativeSlot(s.startsAt)} · {s.memberName} · {s.credit ? `buổi ${s.credit.creditIndex}` : s.courseName}</option>)}
        </select>
      </Field>
      <InlineError message={submit.error} />
      <div className="flex justify-end gap-2"><Btn onClick={onClose}>Hủy</Btn><Btn type="submit" variant="primary" busy={submit.busy} disabled={!id}>Áp vào ca</Btn></div>
    </form>
  </Modal>
}

type Row = { name: string; exerciseId: string | null; roleName: string }
function CreateModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: (m: string) => void }) {
  const exercises = useLoad(() => coachWs.exercises(), [], open)
  const submit = useSubmit()
  const [name, setName] = useState('')
  const [focus, setFocus] = useState('')
  const [description, setDescription] = useState('')
  const [rows, setRows] = useState<Row[]>([{ name: '', exerciseId: null, roleName: '' }])
  const set = (i: number, patch: Partial<Row>) => setRows(r => r.map((x, k) => k === i ? { ...x, ...patch } : x))
  const valid = name.trim() && rows.some(r => r.name.trim())
  return <Modal isOpen={open} onClose={onClose} maxWidth="2xl" title="Tạo giáo án mẫu" description="Chọn bài trong thư viện bài tập để kiểm tra hồi phục nhóm cơ; có thể ghi tên bài gợi ý nếu chưa có trong thư viện.">
    <form className="space-y-4" onSubmit={async e => {
      e.preventDefault()
      const items = rows.filter(r => r.name.trim()).map(r => ({ exerciseId: r.exerciseId, candidateNames: r.exerciseId ? [] : [r.name.trim()], roleName: r.roleName.trim() || undefined }))
      if (await submit.run(() => coachWs.createTemplate({ name: name.trim(), focus: focus.trim() || undefined, description: description.trim() || undefined, items }))) {
        setName(''); setFocus(''); setDescription(''); setRows([{ name: '', exerciseId: null, roleName: '' }]); onDone('Đã tạo giáo án mẫu.')
      }
    }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tên giáo án" required><input required maxLength={160} value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="Day A · Ngực – Vai – Tam đầu" /></Field>
        <Field label="Trọng tâm"><input maxLength={160} value={focus} onChange={e => setFocus(e.target.value)} className={inputCls} placeholder="Push, Pull, Legs, Cardio…" list="coach-focus-list" />
          <datalist id="coach-focus-list">{['Push', 'Pull', 'Legs', 'Cardio', 'Core', 'Recovery', 'Toàn thân'].map(f => <option key={f} value={f} />)}</datalist></Field>
      </div>
      <Field label="Mô tả"><textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} className={textareaCls} /></Field>
      <fieldset className="space-y-2"><legend className="mb-1 text-sm font-medium">Bài tập ({rows.length}/40)</legend>
        {rows.map((r, i) => <div key={i} className="flex gap-2">
          <input aria-label={`Bài ${i + 1}`} list="coach-template-exercises" value={r.name} maxLength={160} placeholder="Tên bài tập" className={`${inputCls} flex-[2]`}
            onChange={e => { const v = e.target.value; const m = exercises.data?.find(x => x.name.toLowerCase() === v.trim().toLowerCase()); set(i, { name: m ? m.name : v, exerciseId: m?.id ?? null }) }} />
          <input aria-label={`Vai trò bài ${i + 1}`} value={r.roleName} maxLength={160} placeholder="Vai trò (khởi động, chính…)" className={`${inputCls} flex-1`} onChange={e => set(i, { roleName: e.target.value })} />
          <button type="button" aria-label={`Xóa bài ${i + 1}`} disabled={rows.length === 1} onClick={() => setRows(x => x.filter((_, k) => k !== i))} className="rounded-lg p-2 text-text-muted hover:text-red-600 disabled:opacity-40"><Trash2 className="h-4 w-4" /></button>
        </div>)}
        <datalist id="coach-template-exercises">{(exercises.data ?? []).map(x => <option key={x.id} value={x.name} />)}</datalist>
        <Btn size="sm" icon={<Plus aria-hidden className="h-4 w-4" />} disabled={rows.length >= 40} onClick={() => setRows(r => [...r, { name: '', exerciseId: null, roleName: '' }])}>Thêm bài</Btn>
      </fieldset>
      <InlineError message={submit.error} />
      <div className="flex justify-end gap-2"><Btn onClick={onClose}>Hủy</Btn><Btn type="submit" variant="primary" busy={submit.busy} disabled={!valid}>Tạo giáo án</Btn></div>
    </form>
  </Modal>
}
