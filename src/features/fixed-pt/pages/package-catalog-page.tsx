import { CoachReadiness } from '@/features/coach-workspace/components/session-work-queue'
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { hybridGet, hybridSend } from '../hybrid-api'
import { useLoad, useSubmit } from '../hooks'
import { money } from '../components/ui'
import { Async, Badge, Btn, Card, EmptyBox, Field, InlineError, Table, inputCls, td, useFlash } from '@/features/workspace/ui'

type Option = { id: string; name: string; price: string; sessionCount: number; sessionsPerWeek: number | null; durationMinutes: number; approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED'; isActive: boolean; adopted?: boolean; rejectionReason?: string | null; course?: { name: string } }
const EMPTY = { courseId: '', name: '', sessionCount: '12', sessionsPerWeek: '3', durationMinutes: '60', price: '' }
export function PackageCatalogPage() { return <Navigate to="/coach/packages?view=catalog" replace /> }

export function CoachCatalog() {
  const center = useLoad(() => hybridGet<Option[]>('/coaches/me/center-packages'))
  const courses = useLoad(() => hybridGet<{ id: string; name: string }[]>('/training-courses', { limit: 100 }))
  const packages = useLoad(() => hybridGet<Option[]>('/coaches/me/pt-package-options', { limit: 100 }))
  const [custom, setCustom] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const act = useSubmit()
  const { flash, node } = useFlash()
  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value })
  const adopt = (p: Option) => void act.run(async () => {
    await hybridSend('post', `/pt-package-options/${p.id}/adopt`, { isActive: !p.adopted })
    flash(p.adopted ? 'Đã ngừng nhận học viên mới. Các gói đã bán vẫn được phục vụ.' : 'Đã nhận dạy theo giá trung tâm. Kiểm tra giờ làm và trạng thái nhận học viên bên dưới.')
    await center.reload()
  })
  return <div className="space-y-6">
    {node}
    <CoachReadiness key={(center.data ?? []).filter(p => p.adopted).length} />
    <Card flush title="Gói trung tâm — chọn để nhận dạy" subtitle="Khóa tập, số buổi, nhịp tuần và giá đã được Manager chốt. Nhận dạy để học viên có thể mua với bạn.">
      <InlineError message={act.error} />
      <Async state={center} rows={3} empty={rows => !rows.length && <EmptyBox title="Trung tâm chưa có gói mở bán" hint="Manager cần tạo gói hoàn chỉnh trước." />}>
        {rows => <><div className="divide-y divide-border-subtle xl:hidden">{rows.map(p => <div key={p.id} className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="break-words font-semibold">{p.name}</p><p className="text-xs text-text-muted">{p.course?.name}</p></div><p className="shrink-0 font-semibold tabular-nums">{money(p.price)}</p></div>
          <p className="text-sm text-text-muted">{p.sessionCount} buổi · {p.sessionsPerWeek ?? 3}/tuần · {p.durationMinutes} phút/buổi</p>
          <Btn className="w-full" variant={p.adopted ? 'outline' : 'primary'} busy={act.busy} onClick={() => adopt(p)}>{p.adopted ? 'Ngừng nhận dạy' : 'Nhận dạy gói'}</Btn>
        </div>)}</div><div className="hidden xl:block"><Table head={['Gói / Khóa tập', 'Lịch tập', 'Giá bán', '']} minWidth={650}>
          {rows.map(p => <tr key={p.id}>
            <td className={td}><p className="font-semibold">{p.name}</p><p className="text-xs text-text-muted">{p.course?.name}</p></td>
            <td className={td}>{p.sessionCount} buổi · {p.sessionsPerWeek ?? 3}/tuần · {p.durationMinutes} phút/buổi</td>
            <td className={`${td} tabular-nums font-semibold`}>{money(p.price)}</td>
            <td className={`${td} text-right`}><Btn variant={p.adopted ? 'outline' : 'primary'} busy={act.busy} onClick={() => adopt(p)}>{p.adopted ? 'Ngừng nhận dạy' : 'Nhận dạy gói'}</Btn></td>
          </tr>)}
        </Table></div></>}
      </Async>
    </Card>
    <Card title="Gói riêng của bạn" subtitle="Chỉ đề xuất khi cần số buổi, nhịp tập hoặc giá khác gói trung tâm. Manager duyệt trước khi mở bán." actions={<Btn onClick={() => setCustom(!custom)}>{custom ? 'Đóng đề xuất' : 'Đề xuất gói riêng'}</Btn>}>
      {custom && <form className="mb-6 space-y-4 border-b border-border-subtle pb-6" onSubmit={e => { e.preventDefault(); void act.run(async () => {
        await hybridSend('post', '/pt-package-options', { ...form, sessionCount: Number(form.sessionCount), sessionsPerWeek: Number(form.sessionsPerWeek), durationMinutes: Number(form.durationMinutes), price: Number(form.price), validityDays: 3650 })
        flash('Đã gửi gói riêng cho Manager duyệt. Gói chưa mở bán.'); setForm(EMPTY); setCustom(false); await packages.reload()
      }) }}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Khóa tập" required><select required className={inputCls} value={form.courseId} onChange={set('courseId')}><option value="">Chọn khóa tập</option>{courses.data?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><InlineError message={courses.error} /></Field>
          <Field label="Tên gói riêng" required><input required maxLength={120} className={inputCls} value={form.name} onChange={set('name')} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Số buổi" required><input required type="number" min={1} max={1000} className={inputCls} value={form.sessionCount} onChange={set('sessionCount')} /></Field>
          <Field label="Buổi/tuần" required><input required type="number" min={1} max={6} className={inputCls} value={form.sessionsPerWeek} onChange={set('sessionsPerWeek')} /></Field>
          <Field label="Phút/buổi"><select className={inputCls} value={form.durationMinutes} onChange={set('durationMinutes')}>{[60, 90, 120].map(m => <option key={m} value={m}>{m}</option>)}</select></Field>
          <Field label="Giá đề xuất (đ)" required><input required type="number" min={1} step={1} className={inputCls} value={form.price} onChange={set('price')} /></Field>
        </div>
        <Btn type="submit" variant="primary" busy={act.busy}>Gửi Manager duyệt</Btn>
      </form>}
      <Async state={packages} rows={3} empty={rows => !rows.length && <EmptyBox title="Chưa đề xuất gói riêng" hint="Bạn có thể nhận dạy các gói trung tâm ở trên." />}>
        {rows => <><div className="divide-y divide-border-subtle xl:hidden">{rows.map(p => <div key={p.id} className="space-y-2 py-4">
          <div className="flex items-start justify-between gap-3"><p className="break-words font-semibold">{p.name}</p><p className="shrink-0 tabular-nums">{money(p.price)}</p></div>
          <p className="text-sm text-text-muted">{p.course?.name} · {p.sessionCount} buổi · {p.sessionsPerWeek ?? 3}/tuần · {p.durationMinutes} phút</p>
          <p className="text-sm">{p.approvalStatus === 'PENDING' ? 'Chờ Manager duyệt' : p.approvalStatus === 'REJECTED' ? `Bị từ chối: ${p.rejectionReason ?? ''}` : p.isActive ? 'Đang mở bán' : 'Ngừng bán'}</p>
          {p.approvalStatus === 'APPROVED' && <Btn size="sm" busy={act.busy} onClick={() => void act.run(async () => { await hybridSend('patch', `/pt-package-options/${p.id}/status`, { isActive: !p.isActive }); await packages.reload() })}>{p.isActive ? 'Ngừng bán' : 'Mở bán'}</Btn>}
        </div>)}</div><div className="hidden xl:block"><Table head={['Gói / Khóa tập', 'Lịch tập', 'Giá', 'Trạng thái']} minWidth={650} alignLast={false}>
          {rows.map(p => <tr key={p.id}>
            <td className={td}><p className="font-semibold">{p.name}</p><p className="text-xs text-text-muted">{p.course?.name}</p></td>
            <td className={td}>{p.sessionCount} buổi · {p.sessionsPerWeek ?? 3}/tuần · {p.durationMinutes} phút</td>
            <td className={`${td} tabular-nums`}>{money(p.price)}</td>
            <td className={td}><Badge tone={p.approvalStatus === 'APPROVED' && p.isActive ? 'success' : p.approvalStatus === 'REJECTED' ? 'danger' : 'warning'}>{p.approvalStatus === 'APPROVED' ? p.isActive ? 'Đang mở bán' : 'Ngừng bán' : p.approvalStatus === 'PENDING' ? 'Chờ Manager duyệt' : 'Bị từ chối'}</Badge>{p.rejectionReason && <p className="mt-1 text-xs text-red-600">{p.rejectionReason}</p>}{p.approvalStatus === 'APPROVED' && <div className="mt-2"><Btn size="sm" busy={act.busy} onClick={() => void act.run(async () => { await hybridSend('patch', `/pt-package-options/${p.id}/status`, { isActive: !p.isActive }); await packages.reload() })}>{p.isActive ? 'Ngừng bán' : 'Mở bán'}</Btn></div>}</td>
          </tr>)}
        </Table></div></>}
      </Async>
    </Card>
    <p className="text-sm text-text-muted">Giáo án được Coach chọn và điều chỉnh trong thư viện mẫu buổi sau khi có học viên. Nhận dạy gói không yêu cầu chọn lại bài tập.</p>
  </div>
}
