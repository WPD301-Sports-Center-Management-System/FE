import { useState } from 'react'
import { fixedPtApi } from '../api'
import { useLoad, useSubmit } from '../hooks'
import { Async, Btn, InlineError } from '@/features/workspace/ui'
import { formatDateTime } from '@/shared/utils/date'

export function MemberProposals({ purchaseId, available, onChanged }: { purchaseId: string; available: number; onChanged: () => void }) {
  const state = useLoad(() => fixedPtApi.scheduleChanges({ purchaseId }), [purchaseId])
  const act = useSubmit()
  const [confirm, setConfirm] = useState<string | null>(null)
  return <Async state={state} rows={1}>{rows => {
    const proposals = rows.filter(r => r.purchaseId === purchaseId && r.status === 'PROPOSED')
    const waiting = new Set(proposals.flatMap(r => r.items.filter(i => !i.sourceBookingId).map(i => i.creditId))).size
    const coachWaiting = Math.max(0, available - waiting)
    return <div className="space-y-3">{coachWaiting > 0 && <p>{coachWaiting} buổi chưa có lịch. Đang chờ Coach sắp xếp.</p>}{proposals.map(r => <section key={r.id} className="rounded-lg bg-bg-surface-muted p-3 text-sm"><h3 className="font-semibold">Lịch tập đang chờ bạn xác nhận</h3><ul className="my-2 space-y-1">{r.items.map(i => <li key={i.id}>{i.startsAt ? formatDateTime(i.startsAt) : 'Chưa có giờ đề xuất'}{i.endsAt ? ' – ' + formatDateTime(i.endsAt) : ''}</li>)}</ul>{r.note && <p>{r.note}</p>}{confirm === r.id ? <div className="space-y-2"><p>Đồng ý sẽ chốt giờ mới theo đề xuất. Hệ thống kiểm tra lại lịch khi xác nhận.</p><Btn busy={act.busy} onClick={() => void act.run(async () => { await fixedPtApi.scheduleChangeAction(r.id, 'accept'); setConfirm(null); await state.reload(); onChanged() })}>Xác nhận đồng ý</Btn><Btn disabled={act.busy} onClick={() => setConfirm(null)}>Quay lại</Btn></div> : <div className="flex flex-wrap gap-2"><Btn disabled={act.busy} onClick={() => setConfirm(r.id)}>Xem và đồng ý lịch</Btn><Btn busy={act.busy} onClick={() => void act.run(async () => { await fixedPtApi.scheduleChangeAction(r.id, 'decline'); await state.reload(); onChanged() })}>Từ chối đề xuất</Btn></div>}</section>)}<InlineError message={act.error} /></div>
  }}</Async>
}
