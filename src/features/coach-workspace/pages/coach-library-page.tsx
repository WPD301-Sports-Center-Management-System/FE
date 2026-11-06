import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Archive, BookOpenText, Copy, Dumbbell, Eye, Pencil, Plus, Search, Send, Trash2 } from 'lucide-react'
import { Modal } from '@/shared/components/ui/modal'
import { useLoad, useSubmit } from '@/features/fixed-pt/hooks'
import { fixedPtApi } from '@/features/fixed-pt/api'
import { ProgramLibrary } from '@/features/fixed-pt/pages/coach-program-page'
import { coachWs, type LibraryTemplate } from '../api'
import { Badge, Btn, Card, EmptyBox, ErrorBox, Field, InlineError, Segmented, Skeleton, inputCls, textareaCls, useFlash } from '@/features/workspace/ui'

const exerciseNames = (t: LibraryTemplate) => t.items.map(i => i.exercise?.name ?? i.candidateNames[0] ?? i.roleName ?? '').filter(Boolean)

/** Session templates (system + own) and A/B/C programmes. Shown as the "Thư viện giáo án" tab of Giáo án. */
export function CoachLibraryPage() {
  const { flash, node } = useFlash()
  const templates = useLoad(() => coachWs.templates(), [])
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [chosenView, setView] = useState<LibraryTemplate | null>(null)
  const [apply, setApply] = useState<LibraryTemplate | null>(null)
  const [create, setCreate] = useState(false)
  const [params, setParams] = useSearchParams()
  const templateId = params.get('templateId')
  const view = chosenView ?? templates.data?.find(t => t.id === templateId) ?? null
  const closeView = () => {
    setView(null)
    const next = new URLSearchParams(params)
    next.delete('templateId')
    setParams(next, { replace: true })
  }
  const list = templates.data ?? []
  const focuses = useMemo(() => [...new Set((templates.data ?? []).map(t => t.focus?.trim()).filter((f): f is string => !!f))].sort(), [templates.data])
  const tabs = [{ key: 'all', label: 'Tất cả', count: list.length }, { key: 'mine', label: 'Của tôi', count: list.filter(t => t.coachId).length }, ...focuses.slice(0, 6).map(f => ({ key: `f:${f}`, label: f, count: list.filter(t => t.focus === f).length }))]
  const term = q.trim().toLowerCase()
  const rows = list.filter(t => (tab === 'all' || (tab === 'mine' ? !!t.coachId : t.focus === tab.slice(2))) && (!term || [t.name, t.focus, ...exerciseNames(t)].some(v => v?.toLowerCase().includes(term))))
  const done = (m: string) => { flash(m); void templates.reload() }

  return <div>
    {node}
    <Card flush>
      <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle p-4">
        <Segmented label="Lọc giáo án" value={tab} onChange={setTab} items={tabs} />
        <label className="relative ml-auto min-w-56 flex-1 sm:max-w-xs"><span className="sr-only">Tìm giáo án</span><Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm giáo án, bài tập…" className={`${inputCls} pl-9`} /></label>
        <Btn variant="primary" icon={<Plus aria-hidden className="h-4 w-4" />} onClick={() => setCreate(true)}>Tạo giáo án mẫu</Btn>
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
              <Btn size="sm" variant="soft" icon={<Send aria-hidden className="h-3.5 w-3.5" />} onClick={() => setApply(t)}>Áp cho gói học viên</Btn>
            </div>
          </article>)}
        </div>}
    </Card>
    <div className="mt-6"><ProgramLibrary /></div>
    {view && <ViewModal t={view} onClose={closeView} onDone={m => { closeView(); done(m) }} />}
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
  const [edit, setEdit] = useState<{ name: string; focus: string } | null>(null)
  return <Modal isOpen onClose={onClose} maxWidth="xl" title={t.name} description={[t.focus, `${t.items.length} bài`, t.coachId ? 'Của tôi' : 'Mẫu hệ thống'].filter(Boolean).join(' · ')}>
    {t.description && <p className="mb-3 text-sm text-text-muted">{t.description}</p>}
    <ol className="divide-y divide-border-subtle rounded-lg border border-border-subtle">{t.items.map((i, k) => <li key={i.id} className="flex gap-3 px-3 py-2.5 text-sm">
      <span className="w-6 shrink-0 text-right font-semibold tabular-nums text-text-muted">{k + 1}.</span>
      <div><p className="font-semibold">{i.exercise?.name ?? i.candidateNames.join(' / ') ?? '—'}</p>
        <p className="text-xs text-text-muted">{[i.roleName, i.phase, i.exercise ? null : 'chưa gán bài trong thư viện'].filter(Boolean).join(' · ')}</p></div>
    </li>)}</ol>
    <p className="mt-3 text-xs text-text-muted">Mức tạ/rep không tự điền khi áp vào ca — bạn xác nhận cho từng học viên.</p>
    <InlineError message={submit.error} />
    {edit && <div className="mt-4 grid gap-3 border-t border-border-subtle pt-4 sm:grid-cols-2">
      <Field label="Tên giáo án"><input value={edit.name} maxLength={160} onChange={e => setEdit({ ...edit, name: e.target.value })} className={inputCls} /></Field>
      <Field label="Trọng tâm"><input value={edit.focus} maxLength={160} onChange={e => setEdit({ ...edit, focus: e.target.value })} className={inputCls} /></Field>
      <p className="text-xs text-text-muted sm:col-span-2">Lưu tạo phiên bản mới; buổi đã áp trước đó giữ nguyên.</p>
      <div className="flex justify-end gap-2 sm:col-span-2"><Btn onClick={() => setEdit(null)}>Hủy</Btn>
        <Btn variant="primary" busy={submit.busy} disabled={!edit.name.trim()} onClick={async () => { if (await submit.run(() => fixedPtApi.updateTemplate(t.id, { name: edit.name.trim(), focus: edit.focus.trim() || undefined }))) onDone('Đã lưu giáo án.') }}>Lưu</Btn></div>
    </div>}
    {t.coachId && !edit && <div className="mt-4 flex justify-end gap-2 border-t border-border-subtle pt-4">
      {!confirm && <Btn icon={<Pencil aria-hidden className="h-4 w-4" />} onClick={() => setEdit({ name: t.name, focus: t.focus ?? '' })}>Sửa tên</Btn>}
      {confirm ? <><span className="mr-auto self-center text-sm">Lưu trữ giáo án này? Buổi đã giao không bị ảnh hưởng.</span><Btn onClick={() => setConfirm(false)}>Không</Btn>
        <Btn variant="danger" busy={submit.busy} onClick={async () => { if (await submit.run(() => coachWs.archiveTemplate(t.id))) onDone('Đã lưu trữ giáo án.') }}>Lưu trữ</Btn></>
        : <Btn variant="danger" icon={<Archive aria-hidden className="h-4 w-4" />} onClick={() => setConfirm(true)}>Lưu trữ</Btn>}
    </div>}
  </Modal>
}

/**
 * Applies the template to every upcoming session of one package that has no assigned content yet
 * (the same per-session apply the session editor uses). Assigned or locked sessions are never touched.
 */
function ApplyModal({ t, onClose, onDone }: { t: LibraryTemplate; onClose: () => void; onDone: (m: string) => void }) {
  const packages = useLoad(async () => (await fixedPtApi.coachPackages()).filter(p => p.status === 'ACTIVE'), [])
  const [id, setId] = useState('')
  const sessions = useLoad(() => fixedPtApi.purchaseSessions(id), [id], !!id)
  const submit = useSubmit()
  const now = Date.now()
  const targets = (sessions.data ?? []).filter(s => ['CONFIRMED', 'ARRIVED'].includes(s.status) && new Date(s.startsAt).getTime() > now && s.content?.status !== 'ASSIGNED' && s.content?.status !== 'LOCKED')
  const assigned = (sessions.data ?? []).filter(s => ['CONFIRMED', 'ARRIVED'].includes(s.status) && new Date(s.startsAt).getTime() > now && s.content?.status === 'ASSIGNED').length
  const list = packages.data ?? []
  return <Modal isOpen onClose={onClose} title={`Áp “${t.name}” cho gói học viên`} description="Áp vào các buổi sắp tới chưa giao giáo án. Buổi đã giao giữ nguyên; sau đó mở từng buổi để nhập mức tạ rồi giao.">
    <form className="space-y-4" onSubmit={async e => {
      e.preventDefault()
      const ok = await submit.run(async () => { for (const s of targets) await fixedPtApi.applyTemplate(s.id, t.id); return true })
      if (ok) onDone(`Đã áp vào ${targets.length} buổi. Mở tab “Theo gói học viên” để xác nhận mức tạ và giao.`)
    }}>
      {packages.data && !list.length ? <EmptyBox title="Chưa có gói nào đang tập" hint="Khi học viên mua gói của bạn, các buổi sẽ hiện ở đây để áp giáo án." /> : <>
        <Field label="Gói của học viên" required error={packages.error}>
          <select required value={id} onChange={e => setId(e.target.value)} className={inputCls} disabled={!packages.data}>
            <option value="">{packages.data ? 'Chọn gói…' : 'Đang tải…'}</option>
            {list.map(p => <option key={p.id} value={p.id}>{p.memberName ?? 'Học viên'} · {p.packageNameSnapshot}</option>)}
          </select>
        </Field>
        {id && sessions.data && <p className="text-sm">{targets.length ? <>Sẽ áp vào <strong>{targets.length}</strong> buổi sắp tới.</> : 'Gói không còn buổi sắp tới nào chưa giao giáo án.'}{assigned ? ` ${assigned} buổi đã giao được giữ nguyên.` : ''}</p>}
      </>}
      <InlineError message={submit.error ?? sessions.error} />
      <div className="flex justify-end gap-2"><Btn onClick={onClose}>Hủy</Btn><Btn type="submit" variant="primary" busy={submit.busy} disabled={!targets.length}>Áp {targets.length ? `${targets.length} buổi` : ''}</Btn></div>
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
