import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { hybridSend } from '@/features/fixed-pt/hybrid-api'
import { Play, Square, UserX } from 'lucide-react'
import { Modal } from '@/shared/components/ui/modal'
import { useSubmit } from '@/features/fixed-pt/hooks'
import type { Session } from '@/features/fixed-pt/types'
import { coachWs } from '../api'
import { Btn, Field, InlineError, textareaCls, LinkBtn } from '@/features/workspace/ui'

type Dialog = null | 'noShow' | 'interrupt'

/**
 * The actions the server allows on a session right now (Session.allowedActions), with the
 * confirmations the BE rules need: a no-show is blocked while the
 * member is checked in, and service interruptions retain the session credit.
 */
export function SessionActions({ session, onDone, size = 'sm', compact }: { session: Session; onDone: (message: string) => void; size?: 'sm' | 'md'; compact?: boolean }) {
  const a = session.allowedActions
  const navigate = useNavigate()

  const [dialog, setDialog] = useState<Dialog>(null)

  const [reason, setReason] = useState('')
  const submit = useSubmit()
  const close = () => { setDialog(null); setReason(''); submit.clear() }
  const run = async (work: () => Promise<unknown>, message: string, after?: () => void) => { const ok = await submit.run(async () => { await work(); return true }); if (ok) { close(); onDone(message); after?.() } }

  return <>
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {a.start && <Btn size={size} variant="soft" busy={submit.busy && !dialog} icon={<Play aria-hidden className="h-4 w-4" />} onClick={() => void run(() => coachWs.start(session.id), 'Đã bắt đầu buổi tập.')}>Bắt đầu buổi tập</Btn>}
      {a.end && <Btn size={size} variant="primary" busy={submit.busy && !dialog} icon={<Square aria-hidden className="h-3.5 w-3.5" />} onClick={() => void run(() => coachWs.complete(session.id, {}), 'Đã kết thúc buổi tập.', () => navigate(`/coach/goals/sheet/${session.id}`))}>Kết thúc buổi</Btn>}
      {a.interrupt && !compact && <Btn size={size} variant="danger" onClick={() => setDialog('interrupt')}>Dừng do sự cố, hoàn buổi</Btn>}
      {a.noShow && !compact && <Btn size={size} variant="outline" icon={<UserX aria-hidden className="h-4 w-4" />} onClick={() => setDialog('noShow')}>Học viên vắng</Btn>}
      {session.status === 'COMPLETED' && !session.outcomeReversedAt && compact && <LinkBtn size={size} to={`/coach/goals/sheet/${session.id}`}>Đánh giá cuối buổi</LinkBtn>}
    </div>
    {!compact && session.actionReasons?.start && <p className="mt-2 text-sm text-text-muted">{session.actionReasons.start}</p>}
    {submit.error && !dialog && <p role="alert" className="mt-1 text-right text-xs text-red-600">{submit.error}</p>}

    <Modal isOpen={dialog === 'interrupt'} onClose={close} title="Dừng buổi do sự cố" description="Giữ lại buổi tập để Coach xếp buổi bù; buổi này không phát sinh thu nhập. Lịch sử phần đã tập vẫn được giữ.">
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); void run(() => hybridSend('post', `/pt-bookings/${session.id}/interrupt`, { reason: reason.trim() }), 'Đã dừng buổi và giữ lại buổi tập.') }}>
        <Field label="Sự cố và cách xử lý" required><textarea required className={textareaCls} rows={3} value={reason} onChange={e => setReason(e.target.value)} /></Field>
        <InlineError message={submit.error} />
        <div className="flex justify-end gap-2"><Btn onClick={close}>Quay lại</Btn><Btn type="submit" variant="danger" busy={submit.busy} disabled={!reason.trim()}>Dừng và hoàn buổi</Btn></div>
      </form>
    </Modal>

    <Modal isOpen={dialog === 'noShow'} onClose={close} title="Ghi học viên vắng" description="Buổi vắng vẫn được tính vào gói theo chính sách trung tâm.">
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); void run(() => coachWs.noShow(session.id, { reason: reason.trim() || undefined }), 'Đã ghi học viên vắng.') }}>
        <Field label="Ghi chú (không bắt buộc)"><textarea rows={2} value={reason} onChange={e => setReason(e.target.value)} className={textareaCls} placeholder="Đã gọi nhưng không liên lạc được…" /></Field>
        <InlineError message={submit.code === 'MEMBER_PRESENT' ? 'Học viên đang có lượt check-in tại gym trong khung giờ này. Hãy ghi "Đã đến" hoặc nhờ Manager xác nhận.' : submit.error} />
        <div className="flex justify-end gap-2"><Btn onClick={close}>Quay lại</Btn><Btn type="submit" variant="primary" busy={submit.busy}>Xác nhận vắng</Btn></div>
      </form>
    </Modal>


  </>
}
