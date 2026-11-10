import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { coachWs } from '../api'
import { journeyApi } from '@/features/goal-lab/journey-api'
import { journeyMetrics, metricLabels } from '@/features/goal-lab/journey-types'
import { useLoad, useSubmit } from '@/features/fixed-pt/hooks'
import { Btn, Field, InlineError, inputCls, textareaCls } from '@/features/workspace/ui'

export function FinishSession({ bookingId, early, onDone }: { bookingId: string; early: boolean; onDone: (message: string) => void }) {
  const journey = useLoad(() => journeyApi.session(bookingId), [bookingId])
  const act = useSubmit()
  const completed = useRef(false)
  const [ended, setEnded] = useState(false)
  const [reason, setReason] = useState('')
  const [comment, setComment] = useState('')
  const [values, setValues] = useState<Record<string, string>>({})
  const complete = async () => {
    if (!completed.current) {
      await coachWs.complete(bookingId, { earlyEndReason: early ? reason.trim() : undefined })
      completed.current = true
      setEnded(true)
    }
  }
  return <div className="space-y-4">
    {ended && <p role="status" className="font-semibold">Buổi đã kết thúc. Phiếu chưa lưu; thử lại chỉ lưu phiếu.</p>}
    {!ended && early && <Field label="Lý do kết thúc sớm" required><textarea className={textareaCls} value={reason} onChange={e => setReason(e.target.value)} /></Field>}
    {journey.data?.journey.initial ? <><Field label="Nhận xét sau buổi (học viên xem được)"><textarea className={textareaCls} value={comment} onChange={e => setComment(e.target.value)} /></Field><details><summary className="cursor-pointer text-sm">Số đo thực sự đo hôm nay</summary><p className="my-2 text-sm text-text-muted">Không đo thì để trống. Không sao chép số đo cũ.</p><div className="grid gap-3 sm:grid-cols-2">{journeyMetrics.map(k => <Field key={k} label={metricLabels[k]}><input type="number" step="any" className={inputCls} value={values[k] ?? ''} onChange={e => setValues(v => ({ ...v, [k]: e.target.value }))} /></Field>)}</div></details></> : <p className="text-sm text-text-muted">{journey.error ? 'Chưa tải được điều kiện ghi phiếu. Có thể kết thúc trước và ghi phiếu sau.' : journey.loading ? 'Đang kiểm tra lộ trình…' : 'Gói chưa có mốc đầu. Kết thúc buổi trước và kiểm tra lộ trình sau.'}</p>}
    {journey.error && <p role="alert" className="text-sm text-danger">Không tải được phiếu sau buổi: {journey.error} <button type="button" className="underline" onClick={() => void journey.reload()}>Thử lại</button></p>}
    <InlineError message={act.error} />
    <div className="flex flex-wrap justify-end gap-2"><Btn busy={act.busy} disabled={!ended && early && !reason.trim()} onClick={() => void act.run(async () => { await complete(); onDone('Buổi đã kết thúc. Hoàn thiện phiếu sau trong hồ sơ buổi tập.') })}>{ended ? 'Hoàn thiện phiếu sau' : 'Kết thúc trước, ghi phiếu sau'}</Btn>
      {journey.data?.journey.initial && <Btn variant="primary" busy={act.busy} disabled={!comment.trim() || !ended && early && !reason.trim()} onClick={() => void act.run(async () => { await journeyApi.finish(bookingId, { comment: comment.trim(), values: Object.fromEntries(Object.entries(values).filter(([,v]) => v.trim()).map(([k,v]) => [k, Number(v.replace(',', '.'))])), earlyEndReason: !ended && early ? reason.trim() : undefined }); completed.current = true; onDone('Đã kết thúc buổi và lưu phiếu sau buổi.') })}>{ended ? 'Thử lưu phiếu lại' : 'Kết thúc & ghi phiếu'}</Btn>}
    </div>{ended && <Link className="text-sm underline" to={'/coach/goals/sheet/' + bookingId}>Mở trang phiếu sau buổi</Link>}
  </div>
}
