import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Download, Eye, Undo2, UserRoundCheck, Wrench, XCircle } from 'lucide-react'
import { Modal } from '@/shared/components/ui/modal'
import { useLoad, useSubmit } from '@/features/fixed-pt/hooks'
import type { Session } from '@/features/fixed-pt/types'
import { centerDate } from '@/shared/utils/date'
import { Async, Badge, Btn, Card, Dot, EmptyBox, Field, InlineError, LinkBtn, PageHeader, Pagination, Person, Segmented, StatTile, Table, btnCls, inputCls, td, textareaCls, useFlash } from '@/features/workspace/ui'
import { addDays, dayEnd, dayStart, downloadCsv, hhmm, isScheduled, longDate, minutesBetween, relativeSlot, SESSION_LABEL, SESSION_TONE } from '@/features/workspace/utils'
import { mgrApi } from '../api'
import { useMgrShell } from '../shell'

const PAGE = 12
const REVIEW: Record<string, string> = { NO_OUTCOME_AFTER_END: 'Qua giờ, chưa có kết quả', IN_PROGRESS_NOT_ENDED: 'Đang dạy nhưng quá giờ kết thúc', LEGACY_OVERLAP: 'Lịch cũ trùng giờ' }
type Dialog = { kind: 'resolve' | 'complete' | 'reverse' | 'cancel'; s: Session }

export function MgrPtBoardPage() {
  const { counts, refresh } = useMgrShell()
  const { flash, node } = useFlash()
  const [params, setParams] = useSearchParams()
  const today = centerDate()
  const day = /^\d{4}-\d{2}-\d{2}$/.test(params.get('day') ?? '') ? params.get('day')! : today
  const tab = params.get('tab') === 'review' ? 'review' : 'day'
  const set = (k: string, v: string) => { const p = new URLSearchParams(params); p.set(k, v); setParams(p, { replace: true }) }
  const sessions = useLoad(() => mgrApi.sessions({ from: dayStart(day), to: dayEnd(day) }, 5), [day])
  const review = useLoad(() => mgrApi.sessions({ needsReview: 'true' }, 3), [])
  const [coach, setCoach] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const list = sessions.data ?? []
  const coaches = useMemo(() => [...new Map((sessions.data ?? []).map(s => [s.coachId, s.coachName ?? '—'])).entries()].sort((a, b) => a[1].localeCompare(b[1], 'vi')), [sessions.data])
  const scheduled = list.filter(isScheduled)
  const live = list.filter(s => s.status === 'IN_PROGRESS')
  const source = tab === 'review' ? review.data ?? [] : list
  const rows = source.filter(s => (!coach || s.coachId === coach) && (!status || (status === 'review' ? s.needsReview : s.status === status)))
  const done = (m: string) => { flash(m); setDialog(null); void sessions.reload(); void review.reload(); refresh() }

  return <div>
    {node}
    <PageHeader title="Lịch PT toàn trung tâm" subtitle={<><span>{longDate(day)}</span><Dot /><span>{sessions.data ? `${scheduled.length} buổi · ${coaches.length} HLV có lịch` : 'Đang tải…'}</span></>}
      actions={<>
        <Btn icon={<AlertTriangle aria-hidden className="h-4 w-4 text-red-600" />} onClick={() => set('tab', 'review')}>Buổi cần kiểm tra <Badge tone="danger">{counts?.sessionsNeedingReview ?? '—'}</Badge></Btn>
        <Btn variant="primary" icon={<Download aria-hidden className="h-4 w-4" />} disabled={!list.length} onClick={() => downloadCsv(`lich-pt-${day}.csv`, ['Bắt đầu', 'Kết thúc', 'HLV', 'Học viên', 'Gói', 'Buổi', 'Trạng thái'],
          list.map(s => [hhmm(s.startsAt), hhmm(s.endsAt), s.coachName ?? '', s.memberName ?? '', s.purchase?.packageNameSnapshot ?? '', s.credit ? `${s.credit.creditIndex}/${s.purchase?.totalCredits ?? ''}` : '', SESSION_LABEL[s.status] ?? s.status]))}>Xuất lịch ngày</Btn>
      </>} />
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile label="Buổi PT trong ngày" icon={<CalendarDays className="h-[18px] w-[18px]" />} iconTone="info" value={sessions.data ? scheduled.length : '—'} />
      <StatTile label="Đã hoàn thành" icon={<CheckCircle2 className="h-[18px] w-[18px]" />} iconTone="success" tone="success" value={sessions.data ? list.filter(s => s.status === 'COMPLETED').length : '—'} />
      <StatTile label="HLV đang dạy" icon={<UserRoundCheck className="h-[18px] w-[18px]" />} iconTone="violet" value={sessions.data && day === today ? <>{new Set(live.map(s => s.coachId)).size}<span className="text-lg font-medium text-text-muted">/{coaches.length}</span></> : '—'} />
      <StatTile label="Cần kiểm tra" icon={<AlertTriangle className="h-[18px] w-[18px]" />} iconTone="danger" tone="danger" value={counts?.sessionsNeedingReview ?? '—'} />
    </div>
    <Card flush>
      <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle p-4">
        <Segmented label="Chế độ" value={tab} onChange={v => { set('tab', v); setPage(1) }} items={[{ key: 'day', label: 'Theo ngày', count: list.length }, { key: 'review', label: 'Cần kiểm tra', count: review.data?.length }]} />
        {tab === 'day' && <div className="flex items-center gap-1">
          <button type="button" aria-label="Ngày trước" onClick={() => set('day', addDays(day, -1))} className={btnCls('ghost')}><ChevronLeft aria-hidden className="h-4 w-4" /></button>
          <input type="date" aria-label="Chọn ngày" value={day} onChange={e => e.target.value && set('day', e.target.value)} className={`${inputCls} w-40`} />
          <button type="button" aria-label="Ngày sau" onClick={() => set('day', addDays(day, 1))} className={btnCls('ghost')}><ChevronRight aria-hidden className="h-4 w-4" /></button>
          {day !== today && <Btn size="sm" onClick={() => set('day', today)}>Hôm nay</Btn>}
        </div>}
        <label className="ml-auto"><span className="sr-only">Lọc HLV</span><select value={coach} onChange={e => { setCoach(e.target.value); setPage(1) }} className={`${inputCls} w-52`}><option value="">Tất cả HLV ({coaches.length})</option>{coaches.map(([id, n]) => <option key={id} value={id}>{n} ({list.filter(s => s.coachId === id).length} buổi)</option>)}</select></label>
        <label><span className="sr-only">Lọc trạng thái</span><select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} className={`${inputCls} w-48`}><option value="">Tất cả trạng thái</option><option value="review">Cần kiểm tra</option>{Object.entries(SESSION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
      </div>
      <Async state={tab === 'review' ? review : sessions} rows={8} empty={() => !rows.length && <EmptyBox icon={tab === 'review' ? <CheckCircle2 className="h-5 w-5" /> : <CalendarDays className="h-5 w-5" />} title={tab === 'review' ? 'Không có buổi nào cần kiểm tra' : 'Không có buổi PT phù hợp'} />}>
        {() => <><Table head={['Khung giờ', 'HLV', 'Học viên', 'Gói', 'Trạng thái', 'Hành động']} minWidth={1040}>
          {rows.slice((page - 1) * PAGE, page * PAGE).map(s => <tr key={s.id} className={`hover:bg-bg-surface-muted/40 ${s.needsReview ? 'bg-red-50/40 dark:bg-red-500/5' : ''}`}>
            <td className={td}><p className="whitespace-nowrap font-semibold tabular-nums">{tab === 'review' ? relativeSlot(s.startsAt) : `${hhmm(s.startsAt)} – ${hhmm(s.endsAt)}`}</p><p className="text-xs text-text-muted">{minutesBetween(s.startsAt, s.endsAt)} phút</p></td>
            <td className={td}><span className="flex items-center gap-2"><Person name={s.coachName} size={28} /><span className="whitespace-nowrap font-semibold">{s.coachName}</span></span></td>
            <td className={td}><Link to={`/manager/members/${s.memberId}`} className="hover:text-primary">{s.memberName}</Link></td>
            <td className={td}><Badge tone="violet">{s.purchase?.packageNameSnapshot ?? s.courseName}</Badge><p className="mt-0.5 text-xs text-text-muted">{s.credit ? `buổi ${s.credit.creditIndex}/${s.purchase?.totalCredits ?? '?'}` : ''}{s.isMakeup ? ' · học bù' : ''}</p></td>
            <td className={td}>{s.needsReview ? <Badge tone="danger">{REVIEW[s.reviewReason ?? ''] ?? 'Cần kiểm tra'}</Badge> : <Badge tone={SESSION_TONE[s.status]} dot={s.status === 'IN_PROGRESS'}>{SESSION_LABEL[s.status]}</Badge>}
              {s.outcomeReversedAt && <p className="mt-1 text-xs text-text-muted">đã đảo kết quả</p>}</td>
            <td className={`${td} text-right`}><div className="flex justify-end gap-1.5">
              {s.needsReview && s.status === 'IN_PROGRESS' && s.allowedActions.end && <Btn size="sm" variant="soft" icon={<CheckCircle2 aria-hidden className="h-3.5 w-3.5" />} onClick={() => setDialog({ kind: 'complete', s })}>Kết thúc hộ</Btn>}
              {s.needsReview && <Btn size="sm" variant={s.status === 'IN_PROGRESS' ? 'outline' : 'soft'} icon={<Wrench aria-hidden className="h-3.5 w-3.5" />} onClick={() => setDialog({ kind: 'resolve', s })}>Đóng cờ</Btn>}
              {s.allowedActions.reverse && <Btn size="sm" icon={<Undo2 aria-hidden className="h-3.5 w-3.5" />} onClick={() => setDialog({ kind: 'reverse', s })}>Đảo kết quả</Btn>}
              {!s.needsReview && s.allowedActions.coachCancel && <Btn size="sm" variant="ghost" icon={<XCircle aria-hidden className="h-3.5 w-3.5" />} onClick={() => setDialog({ kind: 'cancel', s })}>Gym hủy</Btn>}
              <LinkBtn size="sm" variant="ghost" to={`/manager/sessions/${s.id}`} icon={<Eye aria-hidden className="h-4 w-4" />}><span className="sr-only">Chi tiết {s.bookingCode}</span></LinkBtn>
            </div></td>
          </tr>)}
        </Table><Pagination page={page} pageSize={PAGE} total={rows.length} onChange={setPage} noun="buổi" /></>}
      </Async>
    </Card>
    {dialog && <ActionModal d={dialog} onClose={() => setDialog(null)} onDone={done} />}
  </div>
}

const COPY: Record<Dialog['kind'], { title: string; help: string; field: string; button: string; ok: string; danger?: boolean }> = {
  complete: { title: 'Kết thúc buổi hộ Coach', help: 'Buổi đã quá giờ kết thúc. Buổi được tính và ghi thu nhập cho Coach như bình thường.', field: 'Ghi chú (bắt buộc)', button: 'Kết thúc buổi', ok: 'Đã kết thúc buổi.' },
  resolve: { title: 'Đóng cờ cần kiểm tra', help: 'Ghi lại đã xác minh gì với Coach / lễ tân. Kết quả buổi không thay đổi.', field: 'Kết luận', button: 'Đóng cờ', ok: 'Đã đóng cờ kiểm tra.' },
  reverse: { title: 'Đảo kết quả tính buổi', help: 'Hoàn buổi cho học viên, mở quyền học bù và đảo dòng thu nhập của Coach. Chỉ dùng khi buổi bị tính sai.', field: 'Lý do đảo', button: 'Đảo kết quả', ok: 'Đã đảo kết quả buổi.', danger: true },
  cancel: { title: 'Trung tâm hủy buổi', help: 'Buổi luôn được hoàn cho học viên; Coach sẽ đề xuất giờ học bù.', field: 'Lý do hủy', button: 'Hủy buổi', ok: 'Đã hủy buổi và hoàn buổi cho học viên.', danger: true },
}

function ActionModal({ d, onClose, onDone }: { d: Dialog; onClose: () => void; onDone: (m: string) => void }) {
  const submit = useSubmit()
  const [text, setText] = useState('')
  const c = COPY[d.kind]
  const run = () => d.kind === 'complete' ? mgrApi.completeSession(d.s.id, text.trim()) : d.kind === 'resolve' ? mgrApi.resolveReview(d.s.id, text.trim()) : d.kind === 'reverse' ? mgrApi.reverseOutcome(d.s.id, text.trim()) : mgrApi.gymCancel(d.s.id, text.trim())
  return <Modal isOpen onClose={onClose} title={c.title} description={`${d.s.memberName} · ${d.s.coachName} · ${relativeSlot(d.s.startsAt)} (${SESSION_LABEL[d.s.status]})`}>
    <form className="space-y-4" onSubmit={async e => { e.preventDefault(); if (await submit.run(run)) onDone(c.ok) }}>
      <p className={`rounded-lg px-3 py-2 text-sm ${c.danger ? 'bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200' : 'bg-bg-surface-muted'}`}>{c.help}</p>
      <Field label={c.field} required><textarea required rows={3} value={text} onChange={e => setText(e.target.value)} className={textareaCls} /></Field>
      <InlineError message={submit.error} />
      <div className="flex justify-end gap-2"><Btn onClick={onClose}>Quay lại</Btn><Btn type="submit" variant={c.danger ? 'danger' : 'primary'} busy={submit.busy} disabled={!text.trim()}>{c.button}</Btn></div>
    </form>
  </Modal>
}
