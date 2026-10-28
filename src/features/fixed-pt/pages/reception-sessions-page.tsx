import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { formatDateTime, formatWeekdayDateTime } from '@/shared/utils/date'
import { fixedPtApi } from '../api'
import { useSubmit } from '../hooks'
import type { CancellationPreview, Session } from '../types'
import { ErrorBanner, Field, inputCls, Notice, Page } from '../components/ui'
import { ReasonDialog } from '../components/widgets'
import { ViewToggle } from '../components/week-schedule'
import { StaffWeekCalendar } from './staff-calendar'

// Receptionist: the center's PT sessions by week — mark the Member arrived, report absence on their behalf.
export function ReceptionSessionsPage() {
  const [view, setView] = useState<'week' | 'table'>('week')
  const [reloadKey, setReloadKey] = useState(0)
  const act = useSubmit()
  const [cancelling, setCancelling] = useState<Session | null>(null)
  const [preview, setPreview] = useState<CancellationPreview | null>(null)
  const openCancel = async (s: Session) => { const fresh = await fixedPtApi.session(s.id); setPreview(fresh.cancellationPolicy); setCancelling(fresh) }
  return (
    <Page title="Lịch buổi PT" subtitle="Ghi nhận Member đến buổi PT tách riêng với vào/ra gym. Giờ hiển thị theo giờ Việt Nam." actions={<ViewToggle value={view} onChange={setView} />}>
      <ErrorBanner message={act.error} />
      <StaffWeekCalendar view={view} reloadKey={reloadKey} actions={(s, reload) => <>
        {s.allowedActions.arrive && <Button size="sm" variant="secondary" disabled={act.busy} onClick={() => void act.run(async () => { await fixedPtApi.arrive(s.id); reload() })}>Đã đến</Button>}
        {s.allowedActions.cancel && <Button size="sm" variant="ghost" disabled={act.busy} onClick={() => void act.run(() => openCancel(s))}>Báo nghỉ thay</Button>}
      </>} />
      <CancelDialog session={cancelling} preview={preview} onClose={() => { setCancelling(null); setPreview(null) }} onDone={() => { setCancelling(null); setPreview(null); setReloadKey(k => k + 1) }} />
    </Page>
  )
}

// Shows the effect computed by the server now; if the 4-hour cutoff passes meanwhile the server answers
// POLICY_CHANGED with the new effect and the user must confirm again.
export function CancelDialog({ session, preview, onClose, onDone }: { session: Session | null; preview: CancellationPreview | null; onClose: () => void; onDone: () => void }) {
  const act = useSubmit()
  const [effect, setEffect] = useState<CancellationPreview | null>(null)
  const current = effect ?? preview
  if (!session || !current) return null
  const description = current.creditEffect === 'RETURN'
    ? <>Báo nghỉ trước mốc {formatDateTime(current.cutoffAt)} (4 giờ, tính cả đúng mốc): <strong>không tính buổi</strong>, Member có quyền học bù với cùng Coach.</>
    : <>Đã qua mốc {formatDateTime(current.cutoffAt)}: báo nghỉ bây giờ <strong>tính buổi</strong> và không có học bù.</>
  return (
    <ReasonDialog open title={`Báo nghỉ buổi ${formatWeekdayDateTime(session.startsAt)}`} requireReason={false} danger={current.creditEffect === 'CONSUME'} confirmLabel={current.creditEffect === 'RETURN' ? 'Báo nghỉ (được bù)' : 'Báo nghỉ (tính buổi)'}
      busy={act.busy} error={act.code === 'POLICY_CHANGED' ? 'Tác động đã thay đổi vì vừa qua mốc 4 giờ. Kiểm tra lại và xác nhận.' : act.error}
      description={<>{description}{act.code === 'POLICY_CHANGED' && <div className="mt-2"><Notice tone="warning">Đã cập nhật tác động mới.</Notice></div>}</>}
      onClose={() => { setEffect(null); act.clear(); onClose() }}
      onConfirm={reason => void act.run(async () => {
        try { await fixedPtApi.cancel(session.id, { reason: reason || undefined, expectedEffect: current.creditEffect }); setEffect(null); onDone() }
        catch (e) { const details = (e as { details?: CancellationPreview }).details; if (details?.creditEffect) setEffect(details); throw e }
      })} extra={<Field label="Buổi"><input className={inputCls} disabled value={`${session.memberName ?? ''} · ${session.coachName ?? ''}`} /></Field>} />
  )
}
