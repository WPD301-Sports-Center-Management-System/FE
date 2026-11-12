import { useState } from 'react'
import { Modal } from '@/shared/components/ui/modal'
import { DeleteDialog } from '@/shared/components/ui/delete-dialog'
import { useLoad, useSubmit } from '@/features/fixed-pt/hooks'
import { Async, Badge, Btn, Card, EmptyBox, Field, InlineError, PageHeader, inputCls, useFlash } from '@/features/workspace/ui'
import { fmtMoney } from '@/features/workspace/utils'
import { coachTiers, tierLabels, type CoachTier } from '@/shared/utils/coach-tier'
import { mgrApi, type PackageInput, type PackageOption } from '../api'

export function MgrPtPackagesPage() {
  const options = useLoad(() => mgrApi.options())
  const [editing, setEditing] = useState<PackageOption | 'new' | null>(null)
  const [q, setQ] = useState('')
  const [deleting, setDeleting] = useState<PackageOption | null>(null)
  const { flash, node } = useFlash()
  return <div className="space-y-5">
    <PageHeader title="Gói PT trung tâm" actions={<Btn variant="primary" onClick={() => setEditing('new')}>Tạo gói PT</Btn>} />{node}
    <Card title="Bảng giá gói PT" actions={<label><span className="sr-only">Tìm gói</span><input type="search" className={inputCls} placeholder="Tìm tên gói…" value={q} onChange={e => setQ(e.target.value)} /></label>}>
      <Async state={options} rows={4}>{all => {
        const rows = all.filter(p => p.name.toLocaleLowerCase('vi').includes(q.toLocaleLowerCase('vi')))
        return !rows.length ? <EmptyBox title="Chưa có gói phù hợp" /> : <><div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-left text-sm"><thead className="border-b border-border-subtle text-text-muted"><tr><th className="px-3 py-3 font-medium">Gói PT</th><th className="px-3 py-3 font-medium">Số buổi</th><th className="px-3 py-3 font-medium">Phút / buổi</th><th className="px-3 py-3 font-medium">Bậc tối thiểu</th>{coachTiers.map(t => <th key={t} className="px-3 py-3 text-right font-medium">{tierLabels[t]}</th>)}<th className="px-3 py-3 font-medium">Trạng thái</th><th className="px-3 py-3 text-right font-medium">Thao tác</th></tr></thead><tbody className="divide-y divide-border-subtle">{rows.map(p => <tr key={p.id}><th scope="row" className="px-3 py-4 font-semibold">{p.name}</th><td className="px-3 py-4 tabular-nums">{p.sessionCount}</td><td className="px-3 py-4 tabular-nums">{p.durationMinutes}</td><td className="px-3 py-4">{tierLabels[p.minCoachTier ?? 'STANDARD']}</td>{coachTiers.map(t => <td key={t} className="whitespace-nowrap px-3 py-4 text-right tabular-nums">{coachTiers.indexOf(t) < coachTiers.indexOf(p.minCoachTier ?? 'STANDARD') ? '—' : p.prices?.[t] != null ? fmtMoney(p.prices[t]) : 'Chưa đặt giá'}</td>)}<td className="px-3 py-4"><Badge tone={p.isActive ? 'success' : 'neutral'}>{p.isActive ? 'Đang mở bán' : 'Ngừng bán'}</Badge></td><td className="px-3 py-4"><div className="flex justify-end gap-2"><Btn size="sm" onClick={() => setEditing(p)}>Sửa gói và giá</Btn><ToggleSale o={p} onDone={m => { flash(m); void options.reload() }} /><Btn size="sm" variant="danger" aria-label={`Xóa gói ${p.name}`} onClick={() => setDeleting(p)}>Xóa</Btn></div></td></tr>)}</tbody></table></div></>
      }}</Async>
    </Card>
    <DeleteDialog name={deleting?.name ?? null} noun="gói PT" onClose={() => setDeleting(null)}
      impact="Gói sẽ biến mất khỏi bảng giá và danh sách bán của mọi Coach. Đơn đã mua giữ nguyên giá, bậc Coach và lịch sử. Gói còn đơn chờ thanh toán, đang tập hoặc tạm dừng không xóa được; khi đó hãy chọn Ngừng bán."
      onConfirm={async () => { if (!deleting) return; await mgrApi.deleteOption(deleting.id); flash(`Đã xóa gói “${deleting.name}”.`); await options.reload() }} />
    {editing && <OptionModal option={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} onDone={m => { setEditing(null); flash(m); void options.reload() }} />}
  </div>
}

function ToggleSale({ o, onDone }: { o: PackageOption; onDone: (m: string) => void }) {
  const submit = useSubmit()
  return <><Btn size="sm" busy={submit.busy} onClick={async () => { if (await submit.run(() => mgrApi.setOptionActive(o.id, !o.isActive))) onDone(o.isActive ? `Đã ngừng bán “${o.name}”.` : `Đã mở bán “${o.name}”.`) }}>{o.isActive ? 'Ngừng bán' : 'Mở bán'}</Btn><InlineError message={submit.error} /></>
}

function OptionModal({ option, onClose, onDone }: { option?: PackageOption; onClose: () => void; onDone: (m: string) => void }) {
  const submit = useSubmit()
  const [v, setV] = useState<Record<string, string>>({ name: option?.name ?? '', sessionCount: String(option?.sessionCount ?? ''), durationMinutes: String(option?.durationMinutes ?? 60), description: option?.description ?? '', ...Object.fromEntries(coachTiers.map(t => [t, option?.prices?.[t] ?? ''])) })
  const [minCoachTier, setMinCoachTier] = useState<CoachTier>(option?.minCoachTier ?? 'STANDARD')
  const sellingTiers = coachTiers.filter(t => coachTiers.indexOf(t) >= coachTiers.indexOf(minCoachTier))
  const set = (k: string) => (e: { target: { value: string } }) => setV(prev => ({ ...prev, [k]: e.target.value }))
  const integer = (n: string, max: number) => Number.isInteger(Number(n)) && Number(n) >= 1 && Number(n) <= max
  const valid = v.name.trim() && integer(v.sessionCount, 200) && sellingTiers.every(t => integer(v[t], 999999999999))
  return <Modal isOpen onClose={onClose} maxWidth="lg" title={option ? 'Sửa gói PT' : 'Tạo gói PT'} description="Giá tính bằng đồng cho toàn bộ gói, áp dụng từ bậc Coach tối thiểu trở lên.">
    <form className="space-y-4" onSubmit={async e => {
      e.preventDefault(); if (!valid) return
      const body: PackageInput = { name: v.name.trim(), sessionCount: Number(v.sessionCount), durationMinutes: Number(v.durationMinutes) as 60 | 90 | 120, ...(v.description.trim() ? { description: v.description.trim() } : {}), minCoachTier, prices: Object.fromEntries(sellingTiers.map(t => [t, Number(v[t])])) }
      const result = await submit.run(() => option ? mgrApi.updateOption(option.id, body) : mgrApi.createOption(body))
      if (result) onDone(`Đã ${option ? 'cập nhật' : 'tạo'} gói “${result.name}”.`)
    }}>
      <Field label="Tên gói" required><input required maxLength={120} value={v.name} onChange={set('name')} className={inputCls} placeholder="PT Starter" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Số buổi" required><input type="number" min={1} max={200} step={1} required value={v.sessionCount} onChange={set('sessionCount')} className={inputCls} /></Field>
        <Field label="Phút / buổi"><select value={v.durationMinutes} onChange={set('durationMinutes')} className={inputCls}><option>60</option><option>90</option><option>120</option></select></Field>
      </div>
      <Field label="Bậc Coach tối thiểu" required><select aria-label="Bậc Coach tối thiểu" className={inputCls} value={minCoachTier} onChange={e => setMinCoachTier(e.target.value as CoachTier)}>{coachTiers.map(t => <option key={t} value={t}>{tierLabels[t]}</option>)}</select><p className="mt-1 text-sm text-text-muted">Coach từ bậc {tierLabels[minCoachTier]} được bán gói này. Đơn đã mua giữ nguyên giá và bậc.</p></Field>
      <fieldset className="space-y-3 rounded-lg bg-bg-surface-muted p-4"><legend className="px-1 text-sm font-semibold">Giá theo bậc Coach (₫)</legend><div className={`grid gap-3 ${sellingTiers.length === 3 ? 'sm:grid-cols-3' : sellingTiers.length === 2 ? 'sm:grid-cols-2' : ''}`}>{sellingTiers.map(t => <Field key={t} label={tierLabels[t]} required><input aria-label={`Giá ${tierLabels[t]}`} type="number" min={1} max={999999999999} step={1} required value={v[t]} onChange={set(t)} className={inputCls} />{Number(v[t]) > 0 && Number(v.sessionCount) > 0 && <p className="mt-1 text-xs text-text-muted">{fmtMoney(Number(v[t]) / Number(v.sessionCount))}/buổi</p>}</Field>)}</div></fieldset>
      <Field label="Mô tả (không bắt buộc)"><textarea maxLength={5000} rows={2} value={v.description} onChange={set('description')} className={inputCls + ' h-auto py-2'} /></Field>
      <InlineError message={submit.error} /><div className="flex justify-end gap-2"><Btn onClick={onClose}>Hủy</Btn><Btn type="submit" variant="primary" busy={submit.busy} disabled={!valid}>Lưu gói PT</Btn></div>
    </form>
  </Modal>
}
