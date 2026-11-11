import { useEffect, useState } from 'react'
import { useLoad } from '@/features/fixed-pt/hooks'
import { Async, Btn, EmptyBox, Field, inputCls, textareaCls } from '@/features/workspace/ui'
import { centerDateTimeToIso } from '@/shared/utils/date'
import { deskApi, type TrialSession } from '../api'
import { CoachPicker } from './trial-registration-form'
export function TrialPTArrangement({ session: s, busy, onSave }: { session: TrialSession; busy: boolean; onSave: (body: Parameters<typeof deskApi.updateTrialSession>[1]) => Promise<void> }) {
  const [reselect, setReselect] = useState(s.coachDecision === 'DECLINED')
  useEffect(() => { setReselect(s.coachDecision === 'DECLINED') }, [s.coachId, s.coachDecision])
  const coaches = useLoad(() => deskApi.coaches(), [], reselect)
  const [coachId, setCoach] = useState(''), [note, setNote] = useState(''), [time, setTime] = useState('')
  return <div className="space-y-4">
    {!reselect && <div className="flex flex-wrap justify-between gap-2"><p className="text-sm">PT: <strong>{s.coachName ?? 'Đang chờ phản hồi'}</strong></p><Btn size="sm" onClick={() => setReselect(true)}>Chọn PT khác</Btn></div>}
    {reselect ? <form className="space-y-3" onSubmit={e => { e.preventDefault(); if (coachId) void onSave({ coachId }) }}><Async state={coaches} rows={2} empty={data => !data.some(c => c.id !== s.coachId) && <EmptyBox title="Chưa có PT khác để chọn" />}>{data => <CoachPicker coaches={data.filter(c => c.id !== s.coachId)} value={coachId} onChange={setCoach} />}</Async><p className="text-sm text-text-muted">PT mới sẽ tự nhận khách trước khi lễ tân chốt giờ.</p><Btn type="submit" busy={busy} disabled={!coachId}>Gửi yêu cầu cho PT mới</Btn><Btn onClick={() => setReselect(false)}>Quay lại</Btn></form>
    : s.coachDecision !== 'ACCEPTED' ? <p role="status" className="text-sm text-text-muted">Đang chờ PT trả lời trên ứng dụng. Khi PT nhận khách, bạn có thể chốt giờ hẹn tại đây.</p>
    : <form className="space-y-3" onSubmit={e => { e.preventDefault(); if (time) void onSave({ scheduledAt: centerDateTimeToIso(time), ...(note.trim() ? { note: note.trim() } : {}) }) }}><p className="text-sm">PT đã đồng ý nhận khách. Chốt giờ phù hợp với khách để giữ lịch.</p><Field label="Giờ đã thống nhất với khách"><input required type="datetime-local" value={time} onChange={e => setTime(e.target.value)} className={inputCls} /></Field><Field label="Ghi chú lịch hẹn (không bắt buộc)"><textarea rows={2} maxLength={1000} value={note} onChange={e => setNote(e.target.value)} className={textareaCls} /></Field><Btn type="submit" variant="primary" busy={busy} disabled={!time}>Chốt lịch tập thử</Btn></form>}
  </div>
}
