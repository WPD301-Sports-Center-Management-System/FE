import { useMemo, useState } from 'react'
import { CalendarClock, Inbox, Send } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { useAuth } from '@/features/auth/context/auth-context'
import { coachesService } from '@/features/coaches/services/coaches.service'
import { centerDate, formatDate, formatDateTime } from '@/shared/utils/date'
import { fixedPtApi } from '../api'
import { useLoad, useSubmit } from '../hooks'
import type { Enrollment, IntakeRule, PreviewItem, WeeklySlot } from '../types'
import { Empty, ErrorBanner, Field, inputCls, Loadable, money, Notice, Page, Panel, Status } from '../components/ui'
import { ReasonDialog, ScheduleList, SlotsEditor, slotText } from '../components/widgets'

type Tab = 'requests' | 'rules' | 'timeoff'

// Coach: publish weekly intake rules, answer requests by confirming N concrete sessions, manage time off.
export function CoachIntakePage() {
  const [tab, setTab] = useState<Tab>('requests')
  const tabs: [Tab, string][] = [['requests', 'Yêu cầu đăng ký'], ['rules', 'Khung nhận Member'], ['timeoff', 'Ngày nghỉ']]
  return (
    <Page title="Khung nhận & yêu cầu PT" subtitle="Công bố khung giờ cố định theo tuần; Member gửi nhu cầu và bạn chốt đủ số buổi trước khi Member thanh toán.">
      <div role="tablist" className="flex gap-2">
        {tabs.map(([key, text]) => <Button key={key} role="tab" aria-selected={tab === key} variant={tab === key ? 'primary' : 'secondary'} size="sm" onClick={() => setTab(key)}>{text}</Button>)}
      </div>
      {tab === 'requests' && <RequestsTab />}
      {tab === 'rules' && <RulesTab />}
      {tab === 'timeoff' && <TimeOffTab />}
    </Page>
  )
}

function RequestsTab() {
  const [status, setStatus] = useState('REQUESTED')
  const state = useLoad(() => fixedPtApi.coachEnrollments({ status: status || undefined, limit: 100 }), [status])
  const [proposing, setProposing] = useState<Enrollment | null>(null)
  const [declining, setDeclining] = useState<Enrollment | null>(null)
  const decline = useSubmit()
  return (
    <Panel title={<span className="inline-flex items-center gap-2"><Inbox className="h-4 w-4" aria-hidden />Yêu cầu</span>} actions={
      <select aria-label="Lọc trạng thái" className={inputCls} value={status} onChange={e => setStatus(e.target.value)}>
        <option value="REQUESTED">Chờ chốt lịch</option><option value="PROPOSED">Chờ Member đồng ý</option><option value="AWAITING_PAYMENT">Đang giữ chỗ</option><option value="PAID_NEEDS_SCHEDULE">Đã trả tiền – cần sắp lại</option><option value="CONFIRMED">Đã xác nhận</option><option value="">Tất cả</option>
      </select>}>
      <Loadable state={state} empty="Không có yêu cầu ở trạng thái này.">{items => (
        <ul className="space-y-3">
          {items.map(e => (
            <li key={e.id} className="rounded-xl border border-border-subtle p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-text-primary">{e.member.user.fullName} <span className="text-xs text-text-muted">({e.member.memberCode})</span></p>
                  <p className="text-sm text-text-muted">{e.packageOption.name} · {e.packageOption.sessionCount} buổi · {money(e.packageOption.price)} · bắt đầu mong muốn {formatDate(e.preferredStartDate)}</p>
                  {e.goal && <p className="mt-1 text-sm">Mục tiêu: {e.goal}</p>}
                  {e.note && <p className="text-sm text-text-muted">Ghi chú/đề nghị: {e.note}</p>}
                  {e.isConsultation && <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Yêu cầu tư vấn lịch khác khung công bố</p>}
                  {e.currentProposal && <p className="text-xs text-text-muted">Phiên bản lịch hiện tại: v{e.currentProposal.version} ({e.currentProposal.items.length} buổi)</p>}
                  {e.activeHold && <p className="text-xs text-text-muted">Giữ chỗ tới {formatDateTime(e.activeHold.expiresAt)}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Status value={e.status} />
                  {['REQUESTED', 'PROPOSED'].includes(e.status) && <div className="flex gap-2">
                    <Button size="sm" onClick={() => setProposing(e)}><Send className="h-3.5 w-3.5" aria-hidden />{e.status === 'PROPOSED' ? 'Gửi phiên bản mới' : 'Chốt lịch'}</Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeclining(e)}>Từ chối</Button>
                  </div>}
                  {e.status === 'PAID_NEEDS_SCHEDULE' && <Notice tone="warning">Xếp lại đủ buổi ở trang "Lịch PT" (xếp buổi còn trống).</Notice>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}</Loadable>
      {proposing && <ProposeModal enrollment={proposing} onClose={() => setProposing(null)} onDone={() => { setProposing(null); void state.reload() }} />}
      <ReasonDialog open={!!declining} title="Từ chối yêu cầu" danger confirmLabel="Từ chối" busy={decline.busy} error={decline.error} onClose={() => { setDeclining(null); decline.clear() }}
        onConfirm={reason => void decline.run(async () => { await fixedPtApi.decline(declining!.id, reason); setDeclining(null); await state.reload() })} />
    </Panel>
  )
}

function ProposeModal({ enrollment, onClose, onDone }: { enrollment: Enrollment; onClose: () => void; onDone: () => void }) {
  const { user } = useAuth()
  const coachId = user?.coachProfilesUserId?.id ?? enrollment.coachId
  const rules = useLoad(() => fixedPtApi.myIntakeRules(), [])
  const ruleSlots = rules.data?.find(r => r.status === 'PUBLISHED')?.slots
  const [slots, setSlots] = useState<WeeklySlot[]>([])
  const [startDate, setStartDate] = useState(enrollment.preferredStartDate.slice(0, 10))
  const [note, setNote] = useState('')
  const [preview, setPreview] = useState<PreviewItem[] | null>(null)
  const effectiveSlots = slots.length ? slots : (ruleSlots ?? [])
  const check = useSubmit(); const send = useSubmit()
  const count = enrollment.packageOption.sessionCount
  const blocked = preview?.some(p => !p.available) || (preview && preview.length < count)
  return (
    <Modal isOpen onClose={onClose} title={`Chốt lịch ${count} buổi cho ${enrollment.member.user.fullName}`} maxWidth="2xl">
      <div className="space-y-4">
        <Notice>Lịch chỉ giữ giờ sau khi Member đồng ý; bạn có thể gửi phiên bản mới cho tới lúc đó. Mỗi buổi đúng 1 Coach – 1 Member, kiểm tra trùng cả hai phía.</Notice>
        <Field label="Khung giờ trong tuần" hint={ruleSlots && !slots.length ? `Đang dùng khung công bố: ${ruleSlots.map(slotText).join(', ')}` : undefined}>
          <SlotsEditor value={effectiveSlots} onChange={s => { setSlots(s); setPreview(null) }} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Ngày bắt đầu"><input type="date" className={inputCls} min={centerDate()} value={startDate} onChange={e => { setStartDate(e.target.value); setPreview(null) }} /></Field>
          <Field label="Ghi chú cho Member"><input className={inputCls} value={note} onChange={e => setNote(e.target.value)} /></Field>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" isLoading={check.busy} disabled={!effectiveSlots.length} onClick={() => void check.run(async () => setPreview((await fixedPtApi.preview({ coachId, memberId: enrollment.memberId, slots: effectiveSlots, startDate, count })).items))}><CalendarClock className="h-4 w-4" aria-hidden />Xem trước {count} buổi</Button>
        </div>
        <ErrorBanner message={check.error} />
        {preview && <>
          {preview.length < count && <Notice tone="warning">Chỉ tạo được {preview.length}/{count} buổi trong 2 năm tới; thêm khung giờ.</Notice>}
          {preview.some(p => !p.available) && <Notice tone="warning">Có buổi bị trùng lịch Coach/Member hoặc ngày nghỉ. Đổi khung giờ hoặc ngày bắt đầu trước khi gửi.</Notice>}
          <ScheduleList items={preview} />
        </>}
        <ErrorBanner message={send.error} />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Đóng</Button>
          <Button isLoading={send.busy} disabled={!preview || !!blocked} onClick={() => void send.run(async () => { await fixedPtApi.propose(enrollment.id, { generate: { slots: effectiveSlots, startDate }, note: note || undefined }); onDone() })}>Gửi lịch cho Member</Button>
        </div>
      </div>
    </Modal>
  )
}

function RulesTab() {
  const rules = useLoad(() => fixedPtApi.myIntakeRules(), [])
  const offerings = useLoad(async () => (await coachesService.getMyOfferings({ limit: 100 })).data ?? [], [])
  const options = useLoad(async () => (await coachesService.getMyPackageOptions({ limit: 100 })).data ?? [], [])
  const [editing, setEditing] = useState<IntakeRule | 'new' | null>(null)
  const action = useSubmit()
  return (
    <Panel title="Khung nhận Member" actions={<Button size="sm" onClick={() => setEditing('new')}>Tạo khung</Button>}>
      <ErrorBanner message={action.error} />
      <Loadable state={rules} empty="Chưa có khung nhận Member.">{items => (
        <ul className="space-y-2">
          {items.map(rule => (
            <li key={rule.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-subtle p-3">
              <div>
                <p className="font-semibold">{rule.title} <span className="text-xs text-text-muted">v{rule.version} · {rule.offering?.course?.name}</span></p>
                <p className="text-sm text-text-muted">{rule.slots.map(slotText).join(' · ')}</p>
                <p className="text-xs text-text-muted">Hiệu lực từ {formatDate(rule.validFrom)}{rule.validTo ? ` đến ${formatDate(rule.validTo)}` : ''} · Gói: {rule.options.map(o => o.packageOption.name).join(', ')}</p>
              </div>
              <div className="flex items-center gap-2">
                <Status value={rule.status} />
                {rule.status !== 'PUBLISHED' && <Button size="sm" disabled={action.busy} onClick={() => void action.run(async () => { await fixedPtApi.intakeRuleAction(rule.id, 'publish'); await rules.reload() })}>Công bố</Button>}
                {rule.status === 'PUBLISHED' && <Button size="sm" variant="secondary" disabled={action.busy} onClick={() => void action.run(async () => { await fixedPtApi.intakeRuleAction(rule.id, 'pause'); await rules.reload() })}>Tạm ngưng</Button>}
                <Button size="sm" variant="ghost" onClick={() => setEditing(rule)}>Sửa</Button>
                <Button size="sm" variant="ghost" disabled={action.busy} onClick={() => void action.run(async () => { await fixedPtApi.intakeRuleAction(rule.id, 'archive'); await rules.reload() })}>Lưu trữ</Button>
              </div>
            </li>
          ))}
        </ul>
      )}</Loadable>
      {editing && <RuleModal rule={editing === 'new' ? null : editing} offerings={(offerings.data ?? []).filter(o => o.status === 'APPROVED')} options={(options.data ?? []).filter(o => o.approvalStatus === 'APPROVED')} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void rules.reload() }} />}
    </Panel>
  )
}

type OfferingLike = { id: string; courseId: string; status: string; course?: { name: string } }
type OptionLike = { id: string; courseId: string; name: string; sessionCount: number; approvalStatus?: string; isActive?: boolean }
function RuleModal({ rule, offerings, options, onClose, onSaved }: { rule: IntakeRule | null; offerings: OfferingLike[]; options: OptionLike[]; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(rule?.title ?? 'Khung tối 2-4-6')
  const [offeringId, setOfferingId] = useState(rule?.offeringId ?? offerings[0]?.id ?? '')
  const [validFrom, setValidFrom] = useState(rule?.validFrom.slice(0, 10) ?? centerDate())
  const [slots, setSlots] = useState<WeeklySlot[]>(rule?.slots.map(s => ({ weekday: s.weekday, startTime: s.startTime, durationMinutes: s.durationMinutes })) ?? [1, 3, 5].map(weekday => ({ weekday, startTime: '18:00', durationMinutes: 60 })))
  const [optionIds, setOptionIds] = useState<string[]>(rule?.options.map(o => o.packageOptionId) ?? [])
  const courseId = offerings.find(o => o.id === offeringId)?.courseId
  const courseOptions = useMemo(() => options.filter(o => o.courseId === courseId), [options, courseId])
  const save = useSubmit()
  return (
    <Modal isOpen onClose={onClose} title={rule ? 'Sửa khung nhận Member' : 'Tạo khung nhận Member'} maxWidth="2xl">
      <div className="space-y-3">
        {rule?.status === 'PUBLISHED' && <Notice tone="warning">Sửa khung đang công bố tạo phiên bản mới; yêu cầu và lịch đã gửi giữ nguyên.</Notice>}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Tên khung"><input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} /></Field>
          <Field label="Khóa tập (đã được duyệt)"><select className={inputCls} value={offeringId} onChange={e => { setOfferingId(e.target.value); setOptionIds([]) }}>{offerings.map(o => <option key={o.id} value={o.id}>{o.course?.name ?? o.courseId}</option>)}</select></Field>
          <Field label="Hiệu lực từ"><input type="date" className={inputCls} value={validFrom} onChange={e => setValidFrom(e.target.value)} /></Field>
        </div>
        <Field label="Khung giờ trong tuần"><SlotsEditor value={slots} onChange={setSlots} /></Field>
        <fieldset className="space-y-1">
          <legend className="text-xs font-semibold uppercase tracking-wider text-text-muted">Gói áp dụng</legend>
          {courseOptions.length === 0 && <Empty>Chưa có gói đã duyệt cho khóa này.</Empty>}
          {courseOptions.map(o => <label key={o.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={optionIds.includes(o.id)} onChange={e => setOptionIds(e.target.checked ? [...optionIds, o.id] : optionIds.filter(x => x !== o.id))} />{o.name} ({o.sessionCount} buổi)</label>)}
        </fieldset>
        <ErrorBanner message={save.error} />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Hủy</Button>
          <Button isLoading={save.busy} disabled={!title.trim() || !offeringId || !slots.length || !optionIds.length} onClick={() => void save.run(async () => {
            if (rule) await fixedPtApi.updateIntakeRule(rule.id, { title, validFrom, slots, packageOptionIds: optionIds })
            else await fixedPtApi.createIntakeRule({ offeringId, title, validFrom, slots, packageOptionIds: optionIds })
            onSaved()
          })}>Lưu</Button>
        </div>
      </div>
    </Modal>
  )
}

function TimeOffTab() {
  const offs = useLoad(() => fixedPtApi.myTimeOffs(), [])
  const [from, setFrom] = useState(''); const [to, setTo] = useState(''); const [reason, setReason] = useState('')
  const [affected, setAffected] = useState<number | null>(null)
  const save = useSubmit(); const remove = useSubmit()
  return (
    <Panel title="Ngày nghỉ của Coach">
      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <Field label="Từ"><input type="datetime-local" className={inputCls} value={from} onChange={e => setFrom(e.target.value)} /></Field>
        <Field label="Đến"><input type="datetime-local" className={inputCls} value={to} onChange={e => setTo(e.target.value)} /></Field>
        <Field label="Lý do"><input className={inputCls} value={reason} onChange={e => setReason(e.target.value)} /></Field>
        <div className="flex items-end"><Button isLoading={save.busy} disabled={!from || !to} onClick={() => void save.run(async () => {
          const res = await fixedPtApi.createTimeOff({ startsAt: new Date(`${from}:00+07:00`).toISOString(), endsAt: new Date(`${to}:00+07:00`).toISOString(), reason: reason || undefined })
          setAffected(res.affectedSessions.length); setFrom(''); setTo(''); setReason(''); await offs.reload()
        })}>Thêm ngày nghỉ</Button></div>
      </div>
      <ErrorBanner message={save.error ?? remove.error} />
      {affected !== null && affected > 0 && <Notice tone="warning">Có {affected} buổi đã lên lịch trong thời gian nghỉ. Hệ thống không tự hủy: vào "Lịch PT" để hủy (hoàn buổi + học bù) hoặc đề xuất đổi giờ.</Notice>}
      <Loadable state={offs} empty="Chưa khai báo ngày nghỉ.">{items => (
        <ul className="space-y-2">{items.map(o => <li key={o.id} className="flex items-center justify-between rounded-xl border border-border-subtle px-3 py-2 text-sm">
          <span>{formatDateTime(o.startsAt)} → {formatDateTime(o.endsAt)} {o.reason && <span className="text-text-muted">· {o.reason}</span>}</span>
          <Button size="sm" variant="ghost" disabled={remove.busy} onClick={() => void remove.run(async () => { await fixedPtApi.deleteTimeOff(o.id); await offs.reload() })}>Xóa</Button>
        </li>)}</ul>
      )}</Loadable>
    </Panel>
  )
}
