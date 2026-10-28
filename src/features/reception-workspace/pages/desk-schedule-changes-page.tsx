import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, Check, CheckCircle2, Hourglass, Send, Undo2, X } from 'lucide-react'
import { Modal } from '@/shared/components/ui/modal'
import { useLoad, useSubmit } from '@/features/fixed-pt/hooks'
import { fixedPtApi } from '@/features/fixed-pt/api'
import type { ScheduleChange } from '@/features/fixed-pt/types'
import { centerDate, centerInstant } from '@/shared/utils/date'
import { PersonSearch, type PersonHit } from '@/features/workspace/person-search'
import { Async, Badge, Btn, Card, Dot, EmptyBox, Field, InlineError, PageHeader, Person, Segmented, StatTile, Table, inputCls, td, textareaCls, useFlash } from '@/features/workspace/ui'
import { CHANGE_LABEL, CHANGE_TONE, CHANGE_TYPE, hhmm, isUpcoming, mondayOf, relativeAgo, relativeSlot, shortDate, WEEKDAY_SHORT, weekdayOf } from '@/features/workspace/utils'
import { deskApi, type MemberProfile } from '../api'
import { useDeskShell } from '../shell'

type Change = Omit<ScheduleChange, 'items'> & { decidedAt?: string | null; items: (ScheduleChange['items'][number] & { credit?: { creditIndex: number } | null })[] }
type Tab = 'all' | 'REQUESTED' | 'PROPOSED' | 'ACCEPTED' | 'closed'
const slot = (iso?: string | null) => iso ? `${WEEKDAY_SHORT[weekdayOf(centerDate(iso))]} ${shortDate(centerDate(iso))} ${hhmm(iso)}` : 'chưa chọn giờ'

export function DeskScheduleChangesPage() {
  const { refresh } = useDeskShell()
  const { flash, node } = useFlash()
  const changes = useLoad(() => deskApi.scheduleChanges() as Promise<Change[]>, [])
  const memberIds = [...new Set((changes.data ?? []).map(c => c.purchase.memberId))].join(',')
  const people = useLoad(async () => new Map((await Promise.all(memberIds.split(',').filter(Boolean).map(id => deskApi.member(id).catch(() => null)))).filter((m): m is MemberProfile => !!m).map(m => [m.id, m])), [memberIds], !!changes.data)
  const [tab, setTab] = useState<Tab>('all')
  const [accept, setAccept] = useState<Change | null>(null)
  const [decline, setDecline] = useState<Change | null>(null)
  const list = changes.data ?? []
  const week = mondayOf(centerDate())
  const tabs: { key: Tab; label: string; test: (c: Change) => boolean }[] = [
    { key: 'all', label: 'Tất cả', test: () => true }, { key: 'REQUESTED', label: 'Chờ Coach', test: c => c.status === 'REQUESTED' },
    { key: 'PROPOSED', label: 'Chờ HV đồng ý', test: c => c.status === 'PROPOSED' }, { key: 'ACCEPTED', label: 'Đã chốt', test: c => c.status === 'ACCEPTED' },
    { key: 'closed', label: 'Đã đóng', test: c => ['DECLINED', 'WITHDRAWN', 'EXPIRED'].includes(c.status) },
  ]
  const rows = list.filter(tabs.find(t => t.key === tab)!.test)
  const done = (m: string) => { flash(m); setAccept(null); setDecline(null); void changes.reload(); refresh() }

  return <div>
    {node}
    <PageHeader title="Đổi lịch & học bù" subtitle={<><span>Lễ tân gửi yêu cầu thay hội viên, Coach đề xuất giờ, hội viên đồng ý thì lịch mới được chốt</span><Dot /><span>Đổi giờ phải trước buổi gốc 4 giờ</span></>} />
    <div className="mb-6 grid gap-4 md:grid-cols-3">
      <StatTile label="Chờ Coach đề xuất giờ" icon={<Hourglass className="h-[18px] w-[18px]" />} iconTone="info" value={changes.data ? list.filter(c => c.status === 'REQUESTED').length : '—'} />
      <StatTile label="Chờ hội viên đồng ý" icon={<CalendarClock className="h-[18px] w-[18px]" />} iconTone="warning" tone="warning" value={changes.data ? list.filter(c => c.status === 'PROPOSED').length : '—'} hint="Gọi xác nhận rồi ghi nhận tại đây" />
      <StatTile label="Đã chốt tuần này" icon={<CheckCircle2 className="h-[18px] w-[18px]" />} iconTone="success" tone="success" value={changes.data ? list.filter(c => c.status === 'ACCEPTED' && c.decidedAt && centerDate(c.decidedAt) >= week).length : '—'} />
    </div>
    <div className="grid gap-6 2xl:grid-cols-[400px_minmax(0,1fr)]">
      <RequestForm onDone={done} />
      <Card flush title="Yêu cầu đổi lịch" actions={<Segmented label="Lọc yêu cầu" value={tab} onChange={setTab} items={tabs.map(t => ({ key: t.key, label: t.label, count: list.filter(t.test).length }))} />}>
        <Async state={changes} rows={5} empty={() => !rows.length && <EmptyBox icon={<CalendarClock className="h-5 w-5" />} title="Không có yêu cầu nào" />}>
          {() => <Table head={['Hội viên', 'Yêu cầu', 'Ghi chú', 'Gửi lúc', 'Trạng thái', 'Thao tác']} minWidth={980}>
            {rows.map(c => { const m = people.data?.get(c.purchase.memberId); return <tr key={c.id} className="align-top">
              <td className={td}><Link to={`/receptionist/members/${c.purchase.memberId}`} className="flex items-center gap-3 hover:text-primary"><Person name={m?.user.fullName} size={32} /><span><span className="block font-semibold">{m?.user.fullName ?? '…'}</span><span className="text-xs text-text-muted">{m?.user.phone ?? m?.memberCode}</span></span></Link></td>
              <td className={td}><p className="font-medium">{CHANGE_TYPE[c.type]} · {c.purchase.packageNameSnapshot}</p>
                <ul className="mt-0.5 space-y-0.5 text-xs text-text-muted">{c.items.map(i => <li key={i.id}>{i.credit ? `Buổi ${i.credit.creditIndex}: ` : ''}{i.sourceBooking ? <>{slot(i.sourceBooking.plannedStartsAt)} → </> : null}<span className="font-semibold text-text-primary">{slot(i.startsAt)}</span></li>)}</ul></td>
              <td className={`${td} max-w-60`}><p className="line-clamp-3">{c.note || <span className="text-text-muted">—</span>}</p>{c.responseNote && <p className="mt-1 text-xs text-text-muted">Phản hồi: {c.responseNote}</p>}</td>
              <td className={td}><p className="font-semibold tabular-nums">{hhmm(c.createdAt)}</p><p className="text-xs text-text-muted">{relativeAgo(c.createdAt)}</p></td>
              <td className={td}><Badge tone={CHANGE_TONE[c.status]}>{c.status === 'REQUESTED' ? 'Chờ Coach' : CHANGE_LABEL[c.status]}</Badge></td>
              <td className={`${td} text-right`}>
                {c.status === 'PROPOSED' && <div className="flex justify-end gap-1.5"><Btn size="sm" variant="soft" icon={<Check aria-hidden className="h-4 w-4" />} onClick={() => setAccept(c)}>HV đồng ý</Btn><Btn size="sm" icon={<X aria-hidden className="h-4 w-4" />} onClick={() => setDecline(c)}>Từ chối</Btn></div>}
                {c.status === 'REQUESTED' && <WithdrawButton id={c.id} onDone={done} />}
              </td>
            </tr> })}
          </Table>}
        </Async>
      </Card>
    </div>
    {accept && <AcceptModal change={accept} name={people.data?.get(accept.purchase.memberId)?.user.fullName} onClose={() => setAccept(null)} onDone={done} />}
    {decline && <DeclineModal change={decline} onClose={() => setDecline(null)} onDone={done} />}
  </div>
}

function WithdrawButton({ id, onDone }: { id: string; onDone: (m: string) => void }) {
  const submit = useSubmit()
  return <div className="text-right"><Btn size="sm" icon={<Undo2 aria-hidden className="h-4 w-4" />} busy={submit.busy} onClick={async () => { if (await submit.run(() => deskApi.withdrawChange(id))) onDone('Đã rút yêu cầu.') }}>Rút yêu cầu</Btn>
    {submit.error && <p role="alert" className="mt-1 text-xs text-red-600">{submit.error}</p>}</div>
}

/** Desk files a change for a member: move a scheduled session, or schedule an unused / makeup session. */
function RequestForm({ onDone }: { onDone: (m: string) => void }) {
  const [member, setMember] = useState<PersonHit | null>(null)
  const [purchaseId, setPurchaseId] = useState('')
  const [mode, setMode] = useState<'move' | 'credit'>('move')
  const [target, setTarget] = useState('')
  const [day, setDay] = useState('')
  const [time, setTime] = useState('')
  const [note, setNote] = useState('')
  const submit = useSubmit()
  const find = useCallback(async (term: string) => (await deskApi.members({ search: term, limit: 8 })).items.map(m => ({ id: m.id, name: m.user.fullName, sub: `${m.memberCode}${m.user.phone ? ` · ${m.user.phone}` : ''}`, avatarUrl: m.user.avatarUrl })), [])
  const purchases = useLoad(() => deskApi.purchases({ memberId: member!.id, status: 'ACTIVE' }), [member?.id], !!member)
  const sessions = useLoad(() => deskApi.sessions({ purchaseId, from: new Date().toISOString() }, 1), [purchaseId], !!purchaseId)
  const credits = useLoad(() => fixedPtApi.credits(purchaseId), [purchaseId], !!purchaseId)
  const bookable = (sessions.data ?? []).filter(s => s.status === 'CONFIRMED' && isUpcoming(s))
  const free = (credits.data ?? []).filter(c => c.status === 'AVAILABLE')
  const source = bookable.find(s => s.id === target)
  const minutes = source ? (new Date(source.endsAt).getTime() - new Date(source.startsAt).getTime()) / 60_000 : 60
  const reset = () => { setMember(null); setPurchaseId(''); setTarget(''); setDay(''); setTime(''); setNote('') }
  const valid = useMemo(() => !!purchaseId && !!target && (!day === !time), [purchaseId, target, day, time])
  return <Card title="Tạo yêu cầu thay hội viên" subtitle="Coach sẽ nhận yêu cầu và đề xuất giờ cụ thể">
    <form className="space-y-4" onSubmit={async e => {
      e.preventDefault()
      const start = day && time ? centerInstant(day, time) : null
      const times = start ? { startsAt: start.toISOString(), endsAt: new Date(start.getTime() + minutes * 60_000).toISOString() } : {}
      const item = mode === 'move' ? { bookingId: target, ...times } : { creditId: target, ...times }
      if (await submit.run(() => deskApi.requestChange({ purchaseId, items: [item], note: note.trim() || undefined }))) { reset(); onDone('Đã gửi yêu cầu cho Coach.') }
    }}>
      {member ? <div className="flex items-center gap-3 rounded-lg border border-border-subtle p-3"><Person name={member.name} src={member.avatarUrl} size={32} /><div className="min-w-0 flex-1"><p className="font-semibold">{member.name}</p><p className="text-xs text-text-muted">{member.sub}</p></div>
        <button type="button" aria-label="Đổi hội viên" onClick={reset} className="rounded-lg p-1.5 text-text-muted hover:bg-bg-surface-muted"><X className="h-4 w-4" /></button></div>
        : <Field label="Hội viên" required><PersonSearch className="" label="Tìm hội viên" placeholder="Tên / SĐT hội viên…" find={find} onPick={setMember} /></Field>}
      {member && <Field label="Gói PT" required error={purchases.error}><select required value={purchaseId} onChange={e => { setPurchaseId(e.target.value); setTarget('') }} className={inputCls}>
        <option value="">{purchases.data ? (purchases.data.length ? 'Chọn gói…' : 'Hội viên không có gói PT đang hoạt động') : 'Đang tải…'}</option>
        {(purchases.data ?? []).map(p => <option key={p.id} value={p.id}>{p.packageNameSnapshot} · HLV {p.coachNameSnapshot ?? ''} · {p.consumedCredits}/{p.totalCredits}</option>)}</select></Field>}
      {purchaseId && <>
        <Segmented label="Loại yêu cầu" value={mode} onChange={m => { setMode(m); setTarget('') }} items={[{ key: 'move', label: 'Đổi giờ buổi đã có' }, { key: 'credit', label: 'Xếp buổi trống / học bù' }]} />
        {mode === 'move'
          ? <Field label="Buổi cần đổi" required><select required value={target} onChange={e => setTarget(e.target.value)} className={inputCls}><option value="">{sessions.data ? (bookable.length ? 'Chọn buổi…' : 'Không có buổi sắp tới') : 'Đang tải…'}</option>{bookable.map(s => <option key={s.id} value={s.id}>{relativeSlot(s.startsAt)} · buổi {s.credit?.creditIndex ?? ''}</option>)}</select></Field>
          : <Field label="Buổi chưa xếp lịch" required error={credits.error}><select required value={target} onChange={e => setTarget(e.target.value)} className={inputCls}><option value="">{credits.data ? (free.length ? 'Chọn buổi…' : 'Không còn buổi trống') : 'Đang tải…'}</option>{free.map(c => <option key={c.id} value={c.id}>Buổi {c.creditIndex}{c.openMakeup ? ' · học bù' : ''}</option>)}</select></Field>}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ngày mong muốn"><input type="date" min={centerDate()} value={day} onChange={e => setDay(e.target.value)} className={inputCls} /></Field>
          <Field label="Giờ mong muốn"><input type="time" value={time} onChange={e => setTime(e.target.value)} className={inputCls} /></Field>
        </div>
        <p className="-mt-2 text-xs text-text-muted">Không bắt buộc. Coach sẽ dựa vào đây để chọn giờ trống.</p>
        <Field label="Lý do / ghi chú"><textarea rows={2} value={note} onChange={e => setNote(e.target.value)} className={textareaCls} placeholder="Khách bận công tác, muốn tập tối…" /></Field>
      </>}
      <InlineError message={submit.error} />
      <Btn type="submit" variant="primary" className="w-full" icon={<Send aria-hidden className="h-4 w-4" />} busy={submit.busy} disabled={!valid}>Gửi yêu cầu cho Coach</Btn>
    </form>
  </Card>
}

function AcceptModal({ change, name, onClose, onDone }: { change: Change; name?: string; onClose: () => void; onDone: (m: string) => void }) {
  const submit = useSubmit()
  const [evidence, setEvidence] = useState('')
  return <Modal isOpen onClose={onClose} title="Ghi nhận hội viên đồng ý lịch mới" description="Lịch cũ được thay thế ngay khi xác nhận. Nếu giờ mới vừa bị trùng, lịch cũ được giữ nguyên.">
    <form className="space-y-4" onSubmit={async e => { e.preventDefault(); if (await submit.run(() => deskApi.acceptChange(change.id, evidence.trim()))) onDone('Đã chốt lịch mới.') }}>
      <ul className="space-y-1 rounded-lg bg-bg-surface-muted px-3 py-2 text-sm">{change.items.map(i => <li key={i.id}>{i.sourceBooking ? `${slot(i.sourceBooking.plannedStartsAt)} → ` : ''}<span className="font-semibold">{slot(i.startsAt)}</span></li>)}</ul>
      <Field label="Cách hội viên xác nhận" required hint="Lưu làm bằng chứng đồng ý, ví dụ: gọi điện lúc 10:20, khách đồng ý."><textarea required rows={2} value={evidence} onChange={e => setEvidence(e.target.value)} className={textareaCls} placeholder={`${name ?? 'Hội viên'} xác nhận qua điện thoại lúc ${hhmm(new Date().toISOString())}`} /></Field>
      <InlineError message={submit.code === 'SLOT_CONFLICT' ? 'Giờ mới không còn trống. Lịch cũ được giữ nguyên — hãy nhờ Coach đề xuất giờ khác.' : submit.error} />
      <div className="flex justify-end gap-2"><Btn onClick={onClose}>Hủy</Btn><Btn type="submit" variant="primary" busy={submit.busy} disabled={!evidence.trim()}>Xác nhận đồng ý</Btn></div>
    </form>
  </Modal>
}

function DeclineModal({ change, onClose, onDone }: { change: Change; onClose: () => void; onDone: (m: string) => void }) {
  const submit = useSubmit()
  const [reason, setReason] = useState('')
  return <Modal isOpen onClose={onClose} title="Hội viên từ chối giờ đề xuất" description="Lịch hiện tại được giữ nguyên.">
    <form className="space-y-4" onSubmit={async e => { e.preventDefault(); if (await submit.run(() => deskApi.declineChange(change.id, reason.trim() || undefined))) onDone('Đã ghi nhận từ chối.') }}>
      <Field label="Lý do"><textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} className={textareaCls} /></Field>
      <InlineError message={submit.error} />
      <div className="flex justify-end gap-2"><Btn onClick={onClose}>Quay lại</Btn><Btn type="submit" variant="danger" busy={submit.busy}>Từ chối</Btn></div>
    </form>
  </Modal>
}
