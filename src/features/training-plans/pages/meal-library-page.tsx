import { useMemo, useState } from 'react'
import { Apple, BookCopy, Copy, Pencil, Plus, Search, Trash2, Utensils } from 'lucide-react'
import { Modal } from '@/shared/components/ui/modal'
import { DeleteDialog } from '@/shared/components/ui/delete-dialog'
import { useLoad, useSubmit } from '@/features/fixed-pt/hooks'
import { Async, Badge, Btn, Card, Dot, EmptyBox, Field, InlineError, PageHeader, Segmented, Table, inputCls, td, textareaCls, useFlash } from '@/features/workspace/ui'
import { foodLine, GOAL_TAG_LABEL, mealPlansService, type FoodItem, type MealTemplate, type TemplatePayload } from '../services/meal-plans.service'
import { MEAL_TYPES } from './coach-meal-plan-page'
import { Link, useSearchParams } from 'react-router-dom'

// Manager: center templates + food library. Coach: center templates (read-only) + own templates.
type Tab = 'templates' | 'foods'
export function MealLibraryPage({ manager = false, embedded = false }: { manager?: boolean; embedded?: boolean }) {
  const [params] = useSearchParams()
  const { flash, node } = useFlash()
  const [tab, setTab] = useState<Tab>('templates')
  const templates = useLoad(() => mealPlansService.getTemplates({ includeInactive: manager }), [manager])
  const foods = useLoad(() => mealPlansService.getFoodItems({ includeInactive: manager }), [manager])
  const [editing, setEditing] = useState<MealTemplate | 'new' | null>(null)
  const [deletingTemplate, setDeletingTemplate] = useState<MealTemplate | null>(null)
  const canEdit = (t: MealTemplate) => manager ? t.scope === 'CENTER' : t.scope === 'COACH' && !!t.mine

  return <div>
    {node}
    {embedded ? tab === 'templates' && <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-text-muted">Chọn “Dùng mẫu” để tạo thực đơn cho học viên. Khẩu phần được điều chỉnh theo năng lượng mục tiêu.</p>
      <Btn variant="primary" icon={<Plus aria-hidden className="h-4 w-4" />} onClick={() => setEditing('new')}>Tạo mẫu của tôi</Btn>
    </div> : <PageHeader title={manager ? 'Thư viện dinh dưỡng' : 'Mẫu thực đơn'}
      subtitle={manager ? undefined : <><span>Mẫu trung tâm và mẫu riêng của bạn</span><Dot /><span>Kcal mẫu = tổng các món; khi áp dụng, khẩu phần co giãn theo kcal của học viên</span></>}
      actions={tab === 'templates' && <Btn variant="primary" icon={<Plus aria-hidden className="h-4 w-4" />} onClick={() => setEditing('new')}>{manager ? 'Tạo mẫu trung tâm' : 'Tạo mẫu của tôi'}</Btn>} />}
    {manager && <div className="mb-4"><Segmented label="Mục" value={tab} onChange={setTab} items={[{ key: 'templates' as Tab, label: 'Mẫu thực đơn', count: templates.data?.length }, { key: 'foods' as Tab, label: 'Thư viện món', count: foods.data?.length }]} /></div>}
    {tab === 'templates' ? <Card flush>
      <Async state={templates} rows={5} empty={t => !t.length && <EmptyBox icon={<BookCopy className="h-5 w-5" />} title="Chưa có mẫu thực đơn" hint={manager ? undefined : 'Mở một thực đơn rồi bấm “Lưu thành mẫu”, hoặc tạo mẫu mới.'} />}>
        {list => <Table head={['Mẫu', 'Mục tiêu', 'Kcal / ngày', 'Số ngày', 'Trạng thái', 'Thao tác']} minWidth={860}>
          {list.map(t => <tr key={t.id} className="hover:bg-bg-surface-muted/40">
            <td className={td}><p className="font-semibold">{t.title}</p>{!manager && <p className="max-w-md text-xs text-text-muted">{t.scope === 'CENTER' ? 'Mẫu trung tâm' : 'Mẫu của tôi'}{t.description ? ` · ${t.description}` : ''}</p>}</td>
            <td className={td}>{t.goalTag ? <Badge tone="info">{GOAL_TAG_LABEL[t.goalTag] ?? t.goalTag}</Badge> : <span className="text-text-muted">—</span>}</td>
            <td className={`${td} tabular-nums`}>{t.dailyCalorieTarget.toLocaleString('vi-VN')}</td>
            <td className={`${td} tabular-nums`}>{t.dayCount}</td>
            <td className={td}><Badge tone={t.isActive ? 'success' : 'neutral'}>{t.isActive ? 'Đang sử dụng' : 'Đã ẩn'}</Badge></td>
            <td className={`${td} whitespace-nowrap text-right`}>
              {!manager && t.isActive && <Link className="mr-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline" to={`/coach/meal-plans?tab=plans&templateId=${t.id}${params.get('memberId') ? `&memberId=${encodeURIComponent(params.get('memberId')!)}` : ''}`}>Dùng mẫu</Link>}
              {canEdit(t) ? <span className="inline-flex gap-1.5">
                <Btn size="sm" icon={<Pencil aria-hidden className="h-3.5 w-3.5" />} onClick={() => setEditing(t)}>Sửa</Btn>
                <ToggleTemplate t={t} onDone={m => { flash(m); void templates.reload() }} />
                {manager && <Btn size="sm" variant="danger" icon={<Trash2 aria-hidden className="h-3.5 w-3.5" />} aria-label={`Xóa mẫu ${t.title}`} onClick={() => setDeletingTemplate(t)}>Xóa</Btn>}
              </span> : <Btn size="sm" icon={<Copy aria-hidden className="h-3.5 w-3.5" />} onClick={async () => setEditing({ ...(await mealPlansService.getTemplate(t.id)), id: '', scope: 'COACH', title: `${t.title} (bản của tôi)` })}>Tạo bản sao</Btn>}
            </td>
          </tr>)}
        </Table>}
      </Async>
    </Card> : <FoodLibrary foods={foods} flash={flash} />}
    <DeleteDialog name={deletingTemplate?.title ?? null} noun="mẫu thực đơn" onClose={() => setDeletingTemplate(null)}
      impact="Mẫu sẽ biến mất khỏi danh sách và không còn để Coach chọn. Thực đơn đã tạo từ mẫu này cho học viên là bản sao độc lập nên không đổi. Nếu chỉ muốn tạm ngưng dùng, hãy chọn Tắt."
      onConfirm={async () => { if (!deletingTemplate) return; await mealPlansService.deleteTemplate(deletingTemplate.id); flash(`Đã xóa mẫu “${deletingTemplate.title}”.`); await templates.reload() }} />
    {editing && <TemplateEditor manager={manager} initial={editing === 'new' ? null : editing} foods={(foods.data ?? []).filter(f => f.isActive)} onClose={() => setEditing(null)}
      onDone={m => { setEditing(null); flash(m); void templates.reload() }} />}
  </div>
}

function ToggleTemplate({ t, onDone }: { t: MealTemplate; onDone: (m: string) => void }) {
  const submit = useSubmit()
  return <><Btn size="sm" variant={t.isActive ? 'outline' : 'soft'} busy={submit.busy} onClick={async () => { if (await submit.run(() => mealPlansService.setTemplateActive(t.id, !t.isActive))) onDone(t.isActive ? `Đã ẩn mẫu “${t.title}”.` : `Đã hiển thị mẫu “${t.title}”.`) }}>{t.isActive ? 'Ẩn mẫu' : 'Hiện mẫu'}</Btn>
    {submit.error && <p role="alert" className="mt-1 text-xs text-red-600">{submit.error}</p>}</>
}

type Row = { key: number; dayNumber: number; mealType: string; foodItemId: string; servings: string }
let rowKey = 0
const toRows = (t: MealTemplate | null): Row[] => (t?.items ?? []).filter(i => i.foodItemId).map(i => ({ key: ++rowKey, dayNumber: i.dayNumber, mealType: i.mealType, foodItemId: i.foodItemId!, servings: String(Number(i.servings)) }))

/** Template content = library foods × servings per meal and day; kcal is computed, not typed. */
function TemplateEditor({ manager, initial, foods, onClose, onDone }: { manager: boolean; initial: MealTemplate | null; foods: FoodItem[]; onClose: () => void; onDone: (m: string) => void }) {
  const submit = useSubmit()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [goalTag, setGoalTag] = useState(initial?.goalTag ?? '')
  const [rows, setRows] = useState<Row[]>(() => toRows(initial))
  const [day, setDay] = useState(1)
  const byId = useMemo(() => new Map(foods.map(f => [f.id, f])), [foods])
  const loaded = useLoad(() => initial?.id ? mealPlansService.getTemplate(initial.id) : Promise.resolve(null), [initial?.id], !!initial?.id && !initial.items)
  const [hydrated, setHydrated] = useState(false)
  if (loaded.data && !hydrated) { setHydrated(true); setRows(toRows(loaded.data)) }
  const freeText = (initial?.items ?? loaded.data?.items ?? []).filter(i => !i.foodItemId).length
  const days = Math.max(1, day, ...rows.map(r => r.dayNumber))
  const kcalOf = (r: Row) => { const f = byId.get(r.foodItemId); return f ? foodLine(f, Number(r.servings) || 0).estimatedCalories : 0 }
  const dayKcal = (d: number) => rows.filter(r => r.dayNumber === d).reduce((n, r) => n + kcalOf(r), 0)
  const usedDays = [...new Set(rows.map(r => r.dayNumber))]
  const avg = usedDays.length ? Math.round(usedDays.reduce((n, d) => n + dayKcal(d), 0) / usedDays.length) : 0
  const update = (key: number, patch: Partial<Row>) => setRows(rs => rs.map(r => r.key === key ? { ...r, ...patch } : r))
  const valid = title.trim() && rows.length && rows.every(r => r.foodItemId && Number(r.servings) > 0)

  const save = async () => {
    const payload: TemplatePayload = { title: title.trim(), description: description.trim() || undefined, goalTag: goalTag || undefined,
      items: rows.sort((a, b) => a.dayNumber - b.dayNumber || MEAL_TYPES.indexOf(a.mealType) - MEAL_TYPES.indexOf(b.mealType)).map((r, i) => ({ dayNumber: r.dayNumber, mealType: r.mealType, foodItemId: r.foodItemId, servings: Number(r.servings), sortOrder: i })) }
    const saved = await submit.run(() => initial?.id ? mealPlansService.replaceTemplate(initial.id, payload) : mealPlansService.createTemplate(payload))
    if (saved) onDone(`Đã lưu mẫu “${saved.title}” · ~${saved.dailyCalorieTarget.toLocaleString('vi-VN')} kcal/ngày.`)
  }

  return <Modal isOpen onClose={onClose} maxWidth="xl" title={initial?.id ? 'Sửa mẫu thực đơn' : 'Tạo mẫu thực đơn'} description={manager ? undefined : 'Chọn món trong thư viện cho từng bữa. Thực đơn đã tạo từ mẫu trước đây không bị thay đổi.'}>
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2"><Field label="Tên mẫu" required><input value={title} onChange={e => setTitle(e.target.value)} maxLength={180} className={inputCls} placeholder="Giảm mỡ · dân văn phòng" /></Field></div>
        <Field label="Mục tiêu"><select value={goalTag} onChange={e => setGoalTag(e.target.value)} className={inputCls}><option value="">—</option>{Object.entries(GOAL_TAG_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
      </div>
      <Field label="Mô tả"><textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} className={textareaCls} placeholder="Đối tượng phù hợp, lưu ý chế biến…" /></Field>
      {freeText > 0 && <p className="text-xs text-amber-700 dark:text-amber-300">{freeText} món tự nhập (ngoài thư viện) của mẫu gốc không sửa được ở đây và sẽ bị bỏ khi lưu.</p>}
      <div className="flex flex-wrap items-center gap-2 border-t border-border-subtle pt-3">
        {Array.from({ length: days }, (_, i) => i + 1).map(d => <button key={d} type="button" onClick={() => setDay(d)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${day === d ? 'border-primary bg-primary text-primary-foreground' : 'border-border-subtle bg-bg-surface-muted text-text-muted'}`}>Ngày {d} · {dayKcal(d).toLocaleString('vi-VN')} kcal</button>)}
        {days < 14 && <Btn size="sm" onClick={() => setDay(days + 1)}>+ Ngày</Btn>}
        {rows.some(r => r.dayNumber === day) && days < 14 && <Btn size="sm" icon={<Copy aria-hidden className="h-3.5 w-3.5" />} onClick={() => { const next = days + 1; setRows(rs => [...rs, ...rs.filter(r => r.dayNumber === day).map(r => ({ ...r, key: ++rowKey, dayNumber: next }))]); setDay(next) }}>Nhân bản sang ngày {days + 1}</Btn>}
        <span className="ml-auto text-xs text-text-muted">Trung bình: <strong className="text-text-primary">{avg.toLocaleString('vi-VN')} kcal/ngày</strong></span>
      </div>
      <div className="max-h-[45vh] space-y-2 overflow-y-auto pr-1">
        {MEAL_TYPES.map(meal => { const list = rows.filter(r => r.dayNumber === day && r.mealType === meal); return <div key={meal} className="rounded-xl border border-border-subtle p-3">
          <div className="mb-2 flex items-center justify-between"><p className="text-xs font-bold">{meal}</p>
            <Btn size="sm" icon={<Plus aria-hidden className="h-3.5 w-3.5" />} disabled={!foods.length} onClick={() => setRows(rs => [...rs, { key: ++rowKey, dayNumber: day, mealType: meal, foodItemId: foods[0]!.id, servings: '1' }])}>Thêm món</Btn></div>
          {list.map(r => <div key={r.key} className="mb-1.5 grid grid-cols-[1fr_6rem_5rem_2rem] items-center gap-2">
            <select aria-label="Món" value={r.foodItemId} onChange={e => update(r.key, { foodItemId: e.target.value })} className={inputCls}>{foods.map(f => <option key={f.id} value={f.id}>{f.name} · {f.servingLabel}</option>)}</select>
            <input aria-label="Số khẩu phần" type="number" min={0.25} step={0.25} value={r.servings} onChange={e => update(r.key, { servings: e.target.value })} className={inputCls} />
            <span className="text-right text-xs tabular-nums text-text-muted">{kcalOf(r)} kcal</span>
            <button type="button" aria-label="Xóa món" onClick={() => setRows(rs => rs.filter(x => x.key !== r.key))} className="text-text-muted hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
          </div>)}
        </div> })}
      </div>
      <InlineError message={submit.error} />
      <div className="flex justify-end gap-2 border-t border-border-subtle pt-3"><Btn onClick={onClose}>Hủy</Btn><Btn variant="primary" busy={submit.busy} disabled={!valid} onClick={() => void save()}>Lưu mẫu</Btn></div>
    </div>
  </Modal>
}

function FoodLibrary({ foods, flash }: { foods: ReturnType<typeof useLoad<FoodItem[]>>; flash: (m: string) => void }) {
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<FoodItem | 'new' | null>(null)
  const [deleting, setDeleting] = useState<FoodItem | null>(null)
  const term = q.trim().toLowerCase()
  return <Card flush>
    <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle p-4">
      <label className="relative min-w-56 flex-1 sm:max-w-xs"><span className="sr-only">Tìm món</span><Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Tên món, nhóm…" className={`${inputCls} pl-9`} /></label>
      <p className="text-xs text-text-muted">Sửa số liệu chỉ ảnh hưởng lần chọn sau; thực đơn đã lưu giữ nguyên.</p>
      <Btn className="ml-auto" variant="primary" icon={<Plus aria-hidden className="h-4 w-4" />} onClick={() => setEditing('new')}>Thêm món</Btn>
    </div>
    <Async state={foods} rows={8} empty={f => !f.length && <EmptyBox icon={<Apple className="h-5 w-5" />} title="Thư viện món đang trống" />}>
      {list => <Table head={['Món', 'Nhóm', 'Khẩu phần', 'Kcal', 'Đạm', 'Tinh bột', 'Béo', 'Thao tác']} minWidth={900}>
        {list.filter(f => !term || `${f.name} ${f.category ?? ''}`.toLowerCase().includes(term)).map(f => <tr key={f.id} className={f.isActive ? '' : 'opacity-60'}>
          <td className={`${td} font-semibold`}>{f.name}{!f.isActive && <Badge className="ml-2">Đã ẩn</Badge>}</td>
          <td className={td}>{f.category ?? '—'}</td><td className={td}>{f.servingLabel}</td>
          <td className={`${td} tabular-nums`}>{f.calories}</td><td className={`${td} tabular-nums`}>{Number(f.proteinGrams)} g</td>
          <td className={`${td} tabular-nums`}>{Number(f.carbsGrams)} g</td><td className={`${td} tabular-nums`}>{Number(f.fatGrams)} g</td>
          <td className={`${td} whitespace-nowrap text-right`}><span className="inline-flex gap-1.5"><Btn size="sm" icon={<Pencil aria-hidden className="h-3.5 w-3.5" />} onClick={() => setEditing(f)}>Sửa</Btn>
            <Btn size="sm" variant="danger" icon={<Trash2 aria-hidden className="h-3.5 w-3.5" />} aria-label={`Xóa khỏi thư viện: ${f.name}`} onClick={() => setDeleting(f)}>Xóa</Btn></span></td>
        </tr>)}
      </Table>}
    </Async>
    <DeleteDialog name={deleting?.name ?? null} noun="món trong thư viện" onClose={() => setDeleting(null)}
      impact="Món sẽ biến mất khỏi thư viện và danh sách chọn món. Thực đơn đã giao cho học viên giữ nguyên tên và dinh dưỡng đã lưu. Món đang nằm trong mẫu đang bật hoặc thực đơn nháp sẽ không xóa được; khi đó hãy chọn “Ẩn khỏi thư viện”."
      onConfirm={async () => { if (!deleting) return; await mealPlansService.deleteFoodItem(deleting.id); flash(`Đã xóa món “${deleting.name}”.`); await foods.reload() }} />
    {editing && <FoodModal food={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onDone={m => { setEditing(null); flash(m); void foods.reload() }} />}
  </Card>
}

function FoodModal({ food, onClose, onDone }: { food: FoodItem | null; onClose: () => void; onDone: (m: string) => void }) {
  const submit = useSubmit()
  const [v, setV] = useState<Record<string, string>>(() => ({ name: food?.name ?? '', category: food?.category ?? '', servingLabel: food?.servingLabel ?? '', calories: String(food?.calories ?? ''), proteinGrams: String(food ? Number(food.proteinGrams) : ''), carbsGrams: String(food ? Number(food.carbsGrams) : ''), fatGrams: String(food ? Number(food.fatGrams) : '') }))
  const set = (k: string) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value })
  const num = (k: string) => Number(v[k])
  const valid = v.name?.trim() && v.servingLabel?.trim() && ['calories', 'proteinGrams', 'carbsGrams', 'fatGrams'].every(k => v[k] !== '' && num(k) >= 0)
  const body = { name: v.name!.trim(), category: v.category?.trim() || undefined, servingLabel: v.servingLabel!.trim(), calories: Math.round(num('calories')), proteinGrams: num('proteinGrams'), carbsGrams: num('carbsGrams'), fatGrams: num('fatGrams') }
  return <Modal isOpen onClose={onClose} maxWidth="lg" title={food ? `Sửa “${food.name}”` : 'Thêm món vào thư viện'} description="Dinh dưỡng cho một khẩu phần.">
    <form className="space-y-4" onSubmit={async e => { e.preventDefault(); const r = await submit.run(() => food ? mealPlansService.updateFoodItem(food.id, body) : mealPlansService.createFoodItem(body as Omit<FoodItem, 'id' | 'isActive'>)); if (r) onDone(`Đã lưu “${r.name}”.`) }}>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2"><Field label="Tên món" required><input required value={v.name} onChange={set('name')} className={inputCls} /></Field></div>
        <Field label="Nhóm"><input value={v.category} onChange={set('category')} className={inputCls} placeholder="Đạm, Tinh bột…" /></Field>
      </div>
      <Field label="Một khẩu phần" required hint="Ví dụ: 100 g · 1 chén (150 g) · 1 quả (120 g)"><input required value={v.servingLabel} onChange={set('servingLabel')} className={inputCls} /></Field>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Kcal" required><input type="number" min={0} required value={v.calories} onChange={set('calories')} className={inputCls} /></Field>
        <Field label="Đạm (g)" required><input type="number" min={0} step={0.1} required value={v.proteinGrams} onChange={set('proteinGrams')} className={inputCls} /></Field>
        <Field label="Tinh bột (g)" required><input type="number" min={0} step={0.1} required value={v.carbsGrams} onChange={set('carbsGrams')} className={inputCls} /></Field>
        <Field label="Béo (g)" required><input type="number" min={0} step={0.1} required value={v.fatGrams} onChange={set('fatGrams')} className={inputCls} /></Field>
      </div>
      <InlineError message={submit.error} />
      <div className="flex justify-between gap-2">
        {food ? <Btn variant="outline" busy={submit.busy} onClick={async () => { const r = await submit.run(() => mealPlansService.updateFoodItem(food.id, { isActive: !food.isActive })); if (r) onDone(food.isActive ? `Đã ẩn “${food.name}”.` : `Đã hiện lại “${food.name}”.`) }}>{food.isActive ? 'Ẩn khỏi thư viện' : 'Hiện lại'}</Btn> : <span />}
        <span className="flex gap-2"><Btn onClick={onClose}>Hủy</Btn><Btn type="submit" variant="primary" busy={submit.busy} disabled={!valid}><Utensils aria-hidden className="h-4 w-4" />Lưu</Btn></span>
      </div>
    </form>
  </Modal>
}
