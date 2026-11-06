import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog'
import { formatWeekdayDateTime } from '@/shared/utils/date'
import { fixedPtApi } from '../api'
import { useLoad, type useSubmit } from '../hooks'
import type { SessionWithContent } from '../types'
import { previewProgram } from '../program-preview'
import { ErrorBanner, Field, inputCls, Loadable, Panel } from './ui'

type Props = {
  purchaseId: string
  sessions: { data: SessionWithContent[] | null; loading: boolean; error: string | null; reload: () => Promise<void> }
  submit: ReturnType<typeof useSubmit>
  onApplied: (message: string) => void
}

export function ProgramFillPanel({ purchaseId, sessions, submit, onApplied }: Props) {
  const programs = useLoad(() => fixedPtApi.programTemplates(), [])
  const [programId, setProgramId] = useState('')
  const [level, setLevel] = useState('')
  const [overwrite, setOverwrite] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const program = programs.data?.find(p => p.id === programId)
  const preview = program ? previewProgram(sessions.data ?? [], program, overwrite) : []
  const changed = preview.filter(p => !p.skip)
  const assigned = preview.filter(p => p.session.content?.status === 'ASSIGNED').length
  const drafts = changed.filter(p => p.session.content?.status === 'DRAFT').length
  const ready = !!program && changed.length > 0 && !sessions.loading && !sessions.error && !programs.loading && !programs.error
  const apply = async () => {
    if (!ready || submit.busy) return
    await submit.run(async () => {
      const result = await fixedPtApi.applyProgram(purchaseId, { programTemplateId: programId, overwrite, level: level || undefined })
      onApplied(`Đã điền giáo án nháp cho ${result.applied.length} buổi; giữ nguyên ${result.skipped.length} buổi đã giao. Kiểm tra từng buổi rồi giao cho học viên.`)
      setConfirm(false)
      await sessions.reload()
    })
  }

  return <Panel title="Điền giáo án cho nhiều buổi" actions={<Button isLoading={submit.busy} disabled={!ready} onClick={() => overwrite && assigned > 0 ? setConfirm(true) : void apply()}>{program ? `Điền nháp cho ${changed.length} buổi` : 'Điền giáo án nháp'}</Button>}>
    <p className="text-sm text-text-muted">Chọn một chu kỳ để tự điền giáo án lần lượt vào lịch tập của gói, thay vì soạn từng buổi. Bạn kiểm tra và giao cho học viên sau.</p>
    {/* One frame: 360px controls + 24px gutter + remaining width for the actual session preview. */}
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(260px,360px)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-4">
        <Loadable state={programs} empty="Chưa có chu kỳ giáo án để chọn.">{items => <fieldset disabled={submit.busy} className="space-y-4">
          <Field label="Chọn chu kỳ giáo án"><select className={inputCls} value={programId} onChange={e => { setProgramId(e.target.value); setShowAll(false) }}>
            <option value="">Chọn chu kỳ có sẵn…</option>{items.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select></Field>
          {program && <div className="rounded-lg bg-bg-surface-muted p-3">
            <p className="mb-2 text-sm font-medium">Thứ tự lặp lại</p>
            <ol className="space-y-2">{program.slots.map((slot, i) => <li key={`${slot.sessionTemplateId}-${i}`} className="flex items-start gap-2 text-sm">
              <span className="min-w-7 rounded bg-bg-surface px-1.5 py-0.5 text-center font-semibold">{slot.label}</span><span>{slot.sessionTemplate.name}</span>
            </li>)}</ol>
            <p className="mt-2 text-xs text-text-muted">Hết chu kỳ sẽ quay lại giáo án đầu tiên.</p>
          </div>}
          <details className="rounded-lg border border-border-subtle p-3">
            <summary className="cursor-pointer text-sm font-medium">Thông số & buổi đã giao{overwrite ? ' · Có thay giáo án' : ''}</summary>
            <div className="mt-3"><Field label="Trình độ để điền thông số" hint="Dùng gợi ý hiệp, lần, thời lượng và nghỉ của mẫu. Coach chọn mức tạ khi kiểm tra buổi.">
              <select value={level} onChange={e => setLevel(e.target.value)} className={inputCls}>
                <option value="">Coach tự điền thông số</option><option value="BEGINNER">Người mới</option><option value="INTERMEDIATE">Trung cấp</option><option value="ADVANCED">Nâng cao</option>
              </select>
            </Field></div>
            <label className="mt-3 flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={overwrite} onChange={e => setOverwrite(e.target.checked)} /><span>Thay cả giáo án của các buổi đã giao cho học viên</span></label>
          </details>
        </fieldset>}</Loadable>
        <Link to="/coach/library?tab=templates" className="inline-block text-sm font-medium text-primary underline underline-offset-4">Tạo hoặc sửa chu kỳ trong thư viện</Link>
      </div>

      <section className="min-w-0 space-y-3" aria-label="Xem trước giáo án sẽ điền">
        <h3 className="text-sm font-semibold">Xem trước các buổi sẽ được điền</h3>
        {sessions.error ? <ErrorBanner message={sessions.error} onRetry={() => void sessions.reload()} /> : sessions.loading ? <p role="status" className="text-sm text-text-muted">Đang tải lịch tập…</p> : !program ? <div className="rounded-lg bg-bg-surface-muted p-4 text-sm">
          <p className="font-medium">Một chu kỳ, dùng cho nhiều buổi tập</p>
          <p className="mt-2 text-text-muted">Ví dụ: A là thân trên, B là thân dưới. Các buổi được điền theo thứ tự A → B → A → B…</p>
          <p className="mt-3 text-text-muted">Chọn chu kỳ bên cạnh để xem giáo án cụ thể của từng buổi trong gói này.</p>
        </div> : !preview.length ? <p className="rounded-lg bg-bg-surface-muted p-4 text-sm text-text-muted">Gói chưa có buổi sắp tới đủ điều kiện. Cần có lịch đã chốt hoặc buổi học viên đã đến.</p> : <>
          <p className="text-sm"><strong>{changed.length} buổi sẽ được điền nháp</strong>{assigned > 0 && <span className="text-text-muted"> · {overwrite ? `${assigned} buổi đã giao sẽ bị thay` : `${assigned} buổi đã giao được giữ nguyên`}</span>}</p>
          <ol className="divide-y divide-border-subtle rounded-lg border border-border-subtle">
            {(showAll ? preview : preview.slice(0, 3)).map(({ session, slot, skip }) => <li key={session.id} className="flex flex-wrap items-start justify-between gap-2 px-3 py-3 text-sm">
              <div className="min-w-0"><p className="font-medium">Buổi {session.credit?.creditIndex ?? '—'} · {skip ? session.content?.title || 'Giáo án đã giao' : `${slot.label} · ${slot.sessionTemplate.name}`}</p><p className="mt-0.5 text-xs text-text-muted">{formatWeekdayDateTime(session.startsAt)}</p></div>
              <span className={`text-xs ${skip ? 'text-text-muted' : session.content?.status === 'ASSIGNED' ? 'text-amber-700 dark:text-amber-300' : 'text-text-primary'}`}>{skip ? 'Giữ nguyên' : session.content?.status === 'ASSIGNED' ? 'Thay giáo án đã giao' : session.content?.status === 'DRAFT' ? 'Thay bản nháp hiện tại' : 'Tạo bản nháp'}</span>
            </li>)}
          </ol>
          {preview.length > 3 && <Button size="sm" variant="ghost" onClick={() => setShowAll(!showAll)}>{showAll ? 'Thu gọn' : `Xem đủ ${preview.length} buổi`}</Button>}
          {drafts > 0 && <p className="text-sm text-amber-700 dark:text-amber-300">{drafts} bản nháp đang có sẽ được thay bằng giáo án trong chu kỳ.</p>}
          <p className="text-xs text-text-muted">Các buổi đã bắt đầu, kết thúc hoặc hủy không nằm trong danh sách điền.</p>
        </>}
        <div className="border-t border-border-subtle pt-3">
          <span className="text-sm text-text-muted">Lưu thành nháp · Chưa giao cho học viên</span>
        </div>
      </section>
    </div>
    <ConfirmDialog isOpen={confirm} title={`Thay giáo án của ${assigned} buổi đã giao?`} message={`Giáo án hiện tại của ${assigned} buổi sẽ được thay bằng bản nháp theo chu kỳ “${program?.name}”. Bạn cần kiểm tra và giao lại cho học viên.`} confirmLabel="Thay và lưu bản nháp" isLoading={submit.busy} onCancel={() => { if (!submit.busy) setConfirm(false) }} onConfirm={() => void apply()} />
  </Panel>
}
