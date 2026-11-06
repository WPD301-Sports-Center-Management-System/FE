import { useState } from 'react'
import { useLoad } from '@/features/fixed-pt/hooks'
import { Async, Btn, EmptyBox, Field, inputCls, textareaCls } from '@/features/workspace/ui'
import { centerDateTimeToIso } from '@/shared/utils/date'
import { deskApi, type TrialSession } from '../api'
import { CoachPicker } from './trial-registration-form'

export function TrialPTArrangement({ session: s, busy, onSave }: { session: TrialSession; busy: boolean; onSave: (body: Parameters<typeof deskApi.updateTrialSession>[1]) => Promise<void> }) {
  const [reselect, setReselect] = useState(s.coachDecision === 'DECLINED')
  const coaches = useLoad(() => deskApi.coaches(), [], reselect)
  const [coachId, setCoachId] = useState('')
  const [decision, setDecision] = useState<'ACCEPTED' | 'DECLINED'>('ACCEPTED')
  const [note, setNote] = useState('')
  const [time, setTime] = useState('')
  const selected = reselect ? coaches.data?.find(c => c.id === coachId) : null
  const phone = reselect ? selected?.user.phone : s.coachPhone
  return <form className="space-y-4" onSubmit={e => {
    e.preventDefault()
    if (reselect && !coachId || decision === 'DECLINED' && !note.trim()) return
    void onSave({ coachId: reselect ? coachId : undefined, coachDecision: decision, coachResponse: note.trim() || undefined, scheduledAt: decision === 'ACCEPTED' && time ? centerDateTimeToIso(time) : undefined })
  }}>
    <p className="text-sm text-text-muted">Lễ tân trao đổi với PT và khách tại quầy hoặc qua điện thoại. Có giờ thống nhất thì lưu xác nhận và lịch hẹn cùng lúc.</p>
    {reselect ? <section className="space-y-2"><h4 className="font-semibold">PT khách chọn lại</h4><Async state={coaches} rows={2} empty={data => !data.some(c => c.id !== s.coachId) && <EmptyBox title="Chưa có PT khác để chọn" />}>{data => <CoachPicker coaches={data.filter(c => c.id !== s.coachId)} value={coachId} onChange={setCoachId} />}</Async></section> : <div className="flex items-center justify-between gap-2 text-sm"><span>PT: <strong>{s.coachName}</strong></span><Btn size="sm" variant="ghost" onClick={() => setReselect(true)}>Chọn PT khác</Btn></div>}
    {phone && <a href={`tel:${phone}`} className="inline-block text-sm text-primary underline">Gọi PT: {phone}</a>}
    <Field label="Kết quả trao đổi"><select value={decision} onChange={e => setDecision(e.target.value as 'ACCEPTED' | 'DECLINED')} className={inputCls}><option value="ACCEPTED">PT đồng ý nhận khách</option><option value="DECLINED">PT chưa nhận được khách</option></select></Field>
    {decision === 'ACCEPTED' && <Field label="Giờ đã thống nhất với khách" hint="Chưa chốt được giờ thì để trống; đăng ký sẽ chờ xếp lịch."><input type="datetime-local" value={time} onChange={e => setTime(e.target.value)} className={inputCls} /></Field>}
    <Field label={decision === 'DECLINED' ? 'Lý do chưa nhận khách' : 'Ghi chú trao đổi'} required={decision === 'DECLINED'}><textarea required={decision === 'DECLINED'} rows={2} maxLength={180} value={note} onChange={e => setNote(e.target.value)} className={textareaCls} /></Field>
    <Btn type="submit" variant="primary" busy={busy} disabled={reselect && !coachId || decision === 'DECLINED' && !note.trim()}>{decision === 'DECLINED' ? 'Lưu để khách chọn PT khác' : time ? 'Xác nhận PT và lịch hẹn' : 'Lưu PT nhận khách'}</Btn>
  </form>
}
