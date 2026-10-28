import { useState } from 'react'
import { Check, Play, Square, UserX, XCircle } from 'lucide-react'
import { Modal } from '@/shared/components/ui/modal'
import { useSubmit } from '@/features/fixed-pt/hooks'
import type { Session } from '@/features/fixed-pt/types'
import { coachWs } from '../api'
import { Btn, Field, InlineError, textareaCls } from '@/features/workspace/ui'

type Dialog = null | 'end' | 'noShow' | 'cancel'

/**
 * The actions the server allows on a session right now (Session.allowedActions), with the
 * confirmations the BE rules need: an early end needs a reason, a no-show is blocked while the
 * member is checked in, and a Coach cancel always returns the credit.
 */
export function SessionActions({ session, onDone, size = 'sm', compact }: { session: Session; onDone: (message: string) => void; size?: 'sm' | 'md'; compact?: boolean }) {
  const a = session.allowedActions
  const [dialog, setDialog] = useState<Dialog>(null)
  const [note, setNote] = useState('')
  const [reason, setReason] = useState('')
  const submit = useSubmit()
  const early = Date.now() < new Date(session.endsAt).getTime()
  const close = () => { setDialog(null); setNote(''); setReason(''); submit.clear() }
  const run = async (work: () => Promise<unknown>, message: string) => { const ok = await submit.run(async () => { await work(); return true }); if (ok) { close(); onDone(message) } }

  return <>
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {a.arrive && <Btn size={size} variant="outline" busy={submit.busy && !dialog} icon={<Check aria-hidden className="h-4 w-4" />} onClick={() => void run(() => coachWs.arrive(session.id), 'Đã ghi học viên có mặt.')}>Đã đến</Btn>}
      {a.start && <Btn size={size} variant="soft" busy={submit.busy && !dialog} icon={<Play aria-hidden className="h-4 w-4" />} onClick={() => void run(() => coachWs.start(session.id), 'Đã bắt đầu buổi tập.')}>Bắt đầu ca</Btn>}
      {a.end && <Btn size={size} variant="primary" icon={<Square aria-hidden className="h-3.5 w-3.5" />} onClick={() => setDialog('end')}>Kết thúc ca</Btn>}
      {a.noShow && !compact && <Btn size={size} variant="outline" icon={<UserX aria-hidden className="h-4 w-4" />} onClick={() => setDialog('noShow')}>Học viên vắng</Btn>}
      {a.coachCancel && !compact && <Btn size={size} variant="danger" icon={<XCircle aria-hidden className="h-4 w-4" />} onClick={() => setDialog('cancel')}>Hủy buổi</Btn>}
      {session.status === 'COMPLETED' && compact && <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-300"><Check aria-hidden className="h-3.5 w-3.5" />Hoàn thành</span>}
    </div>
    {submit.error && !dialog && <p role="alert" className="mt-1 text-right text-xs text-red-600">{submit.error}</p>}

    <Modal isOpen={dialog === 'end'} onClose={close} title="Kết thúc buổi tập" description={`${session.memberName ?? ''} · buổi được tính và ghi thu nhập theo kết quả.`}>
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); void run(() => coachWs.complete(session.id, { note: note.trim() || undefined, earlyEndReason: early ? reason.trim() : undefined }), 'Đã kết thúc buổi tập.') }}>
        {early && <Field label="Lý do kết thúc sớm" required hint="Buổi chưa tới giờ kết thúc dự kiến nên cần ghi lý do."><textarea required rows={2} value={reason} onChange={e => setReason(e.target.value)} className={textareaCls} /></Field>}
        <Field label="Ghi chú buổi tập" hint="Học viên và lễ tân xem được ghi chú này."><textarea rows={3} value={note} onChange={e => setNote(e.target.value)} className={textareaCls} placeholder="Mức tạ, cảm nhận, điều cần lưu ý cho buổi sau…" /></Field>
        <InlineError message={submit.error} />
        <div className="flex justify-end gap-2"><Btn onClick={close}>Hủy</Btn><Btn type="submit" variant="primary" busy={submit.busy} disabled={early && !reason.trim()}>Kết thúc buổi</Btn></div>
      </form>
    </Modal>

    <Modal isOpen={dialog === 'noShow'} onClose={close} title="Ghi học viên vắng" description="Buổi vắng vẫn được tính vào gói theo chính sách trung tâm.">
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); void run(() => coachWs.noShow(session.id, { reason: reason.trim() || undefined }), 'Đã ghi học viên vắng.') }}>
        <Field label="Ghi chú (không bắt buộc)"><textarea rows={2} value={reason} onChange={e => setReason(e.target.value)} className={textareaCls} placeholder="Đã gọi nhưng không liên lạc được…" /></Field>
        <InlineError message={submit.code === 'MEMBER_PRESENT' ? 'Học viên đang có lượt check-in tại gym trong khung giờ này. Hãy ghi "Đã đến" hoặc nhờ Manager xác nhận.' : submit.error} />
        <div className="flex justify-end gap-2"><Btn onClick={close}>Quay lại</Btn><Btn type="submit" variant="primary" busy={submit.busy}>Xác nhận vắng</Btn></div>
      </form>
    </Modal>

    <Modal isOpen={dialog === 'cancel'} onClose={close} title="Coach hủy buổi" description="Buổi được hoàn lại cho học viên; bạn sẽ đề xuất giờ học bù sau.">
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); void run(() => coachWs.coachCancel(session.id, reason.trim()), 'Đã hủy buổi và hoàn buổi cho học viên.') }}>
        <Field label="Lý do hủy" required><textarea required rows={3} value={reason} onChange={e => setReason(e.target.value)} className={textareaCls} /></Field>
        <InlineError message={submit.error} />
        <div className="flex justify-end gap-2"><Btn onClick={close}>Quay lại</Btn><Btn type="submit" variant="danger" busy={submit.busy} disabled={!reason.trim()}>Hủy buổi</Btn></div>
      </form>
    </Modal>
  </>
}
