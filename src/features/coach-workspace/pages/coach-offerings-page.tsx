import { useState } from 'react'
import { BookOpen, CalendarRange, Clock3, Plus, Settings2, Users } from 'lucide-react'
import { Modal } from '@/shared/components/ui/modal'
import { useLoad, useSubmit } from '@/features/fixed-pt/hooks'
import { coachWs, type Offering } from '../api'
import { Badge, Btn, Card, Dot, EmptyBox, ErrorBox, Field, InlineError, LinkBtn, PageHeader, Skeleton, StatTile, Table, inputCls, td, textareaCls, useFlash } from '@/features/workspace/ui'
import { fmtMoney, type Tone } from '@/features/workspace/utils'

const DAY = ['', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const OFFERING: Record<Offering['status'], { label: string; tone: Tone }> = { APPROVED: { label: 'Đã duyệt', tone: 'success' }, PENDING: { label: 'Chờ Manager duyệt', tone: 'warning' }, REJECTED: { label: 'Bị từ chối', tone: 'danger' } }

export function CoachOfferingsPage() {
  const { flash, node } = useFlash()
  const offerings = useLoad(() => coachWs.offerings(), [])
  const options = useLoad(() => coachWs.packageOptions(), [])
  const rules = useLoad(() => coachWs.intakeRules(), [])
  const purchases = useLoad(() => coachWs.purchases(), [])
  const [open, setOpen] = useState(false)
  const list = offerings.data ?? []
  const teaching = list.filter(o => o.status === 'APPROVED' && o.isActive)
  const active = (purchases.data ?? []).filter(p => p.status === 'ACTIVE')
  const approvedOptions = (options.data ?? []).filter(o => o.approvalStatus === 'APPROVED')
  const pending = list.filter(o => o.status === 'PENDING').length + (options.data ?? []).filter(o => o.approvalStatus === 'PENDING').length

  return <div>
    {node}
    <PageHeader title="Khóa đăng ký dạy" subtitle={<><span>Khóa tập bạn được duyệt dạy, khung nhận học viên và gói PT</span><Dot /><span>Manager duyệt khóa và gói trước khi mở bán</span></>}
      actions={<Btn variant="primary" icon={<Plus aria-hidden className="h-4 w-4" />} onClick={() => setOpen(true)}>Đăng ký khóa mới</Btn>} />
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile label="Khóa đang dạy" icon={<BookOpen className="h-[18px] w-[18px]" />} iconTone="info" value={offerings.data ? teaching.length : '—'} hint={offerings.data ? `${list.length} khóa đã đăng ký` : undefined} />
      <StatTile label="Học viên đang học" icon={<Users className="h-[18px] w-[18px]" />} iconTone="violet" value={purchases.data ? new Set(active.map(p => p.memberId)).size : '—'} hint={purchases.data ? `${active.length} gói đang hoạt động` : undefined} />
      <StatTile label="Gói PT đang bán" icon={<CalendarRange className="h-[18px] w-[18px]" />} iconTone="success" value={options.data ? approvedOptions.filter(o => o.isActive).length : '—'} hint={options.data ? `${approvedOptions.length} gói đã duyệt` : undefined} />
      <StatTile label="Chờ duyệt" icon={<Clock3 className="h-[18px] w-[18px]" />} iconTone="warning" tone={pending ? 'warning' : 'neutral'} value={offerings.data && options.data ? pending : '—'} hint="Khóa và gói PT gửi Manager" />
    </div>
    <Card flush>
      {offerings.error ? <ErrorBox message={offerings.error} onRetry={() => void offerings.reload()} /> : !offerings.data ? <Skeleton rows={4} /> : !list.length
        ? <EmptyBox icon={<BookOpen className="h-5 w-5" />} title="Bạn chưa đăng ký dạy khóa nào" hint="Đăng ký khóa → Manager duyệt → tạo gói PT và khung nhận học viên." action={<Btn variant="primary" onClick={() => setOpen(true)}>Đăng ký khóa mới</Btn>} />
        : <Table head={['Khóa tập', 'Khung nhận học viên', 'Gói PT', 'Học viên', 'Trạng thái', 'Thao tác']} minWidth={1000}>
          {list.map(o => {
            const courseOptions = (options.data ?? []).filter(x => x.courseId === o.courseId)
            const courseRules = (rules.data ?? []).filter(r => r.offeringId === o.id && r.status === 'PUBLISHED')
            const students = active.filter(p => p.courseId === o.courseId)
            const st = OFFERING[o.status]
            return <tr key={o.id} className="align-top hover:bg-bg-surface-muted/40">
              <td className={td}><p className="font-semibold">{o.course.name}</p><p className="text-xs text-text-muted">{o.course.difficultyLevel ?? 'Mọi trình độ'}</p></td>
              <td className={td}>{courseRules.length ? <ul className="space-y-1">{courseRules.map(r => <li key={r.id}><span className="font-medium">{[...new Set(r.slots.map(s => DAY[s.weekday]))].join(' · ')}</span>
                <span className="text-text-muted"> — {[...new Set(r.slots.map(s => s.startTime.slice(0, 5)))].join(', ')}</span></li>)}</ul>
                : <span className="text-text-muted">{rules.data ? 'Chưa công bố khung' : '…'}</span>}</td>
              <td className={td}>{courseOptions.length ? <ul className="space-y-1">{courseOptions.slice(0, 3).map(x => <li key={x.id} className="flex flex-wrap items-center gap-1.5"><span>{x.name}</span><span className="text-xs text-text-muted">{x.sessionCount} buổi · {fmtMoney(x.price)}</span>
                {x.approvalStatus !== 'APPROVED' && <Badge tone={x.approvalStatus === 'PENDING' ? 'warning' : 'danger'}>{x.approvalStatus === 'PENDING' ? 'chờ duyệt' : 'bị từ chối'}</Badge>}</li>)}
                {courseOptions.length > 3 && <li className="text-xs text-text-muted">+{courseOptions.length - 3} gói khác</li>}</ul> : <span className="text-text-muted">Chưa có gói</span>}</td>
              <td className={`${td} tabular-nums`}>{students.length ? `${new Set(students.map(s => s.memberId)).size} HV · ${students.length} gói` : <span className="text-text-muted">—</span>}</td>
              <td className={td}><Badge tone={o.isActive ? st.tone : 'neutral'}>{o.isActive ? st.label : 'Tạm dừng'}</Badge>{o.rejectionReason && o.status === 'REJECTED' && <p className="mt-1 max-w-56 text-xs text-red-600">Lý do: {o.rejectionReason}</p>}</td>
              <td className={`${td} text-right`}><div className="flex justify-end gap-1.5">
                {o.status === 'APPROVED' && <LinkBtn size="sm" variant="soft" to="/coach/slots">Khung giờ</LinkBtn>}
                <LinkBtn size="sm" to="/coach/teaching-rights" icon={<Settings2 aria-hidden className="h-3.5 w-3.5" />}>{o.status === 'REJECTED' ? 'Sửa & gửi lại' : 'Gói PT'}</LinkBtn>
              </div></td>
            </tr>
          })}
        </Table>}
    </Card>
    <RegisterModal open={open} taken={new Set(list.map(o => o.courseId))} onClose={() => setOpen(false)} onDone={() => { setOpen(false); flash('Đã gửi đăng ký dạy khóa — chờ Manager duyệt.'); void offerings.reload() }} />
  </div>
}

function RegisterModal({ open, taken, onClose, onDone }: { open: boolean; taken: Set<string>; onClose: () => void; onDone: () => void }) {
  const courses = useLoad(() => coachWs.courses(), [], open)
  const submit = useSubmit()
  const [courseId, setCourseId] = useState('')
  const [note, setNote] = useState('')
  const available = (courses.data ?? []).filter(c => !taken.has(c.id))
  return <Modal isOpen={open} onClose={onClose} title="Đăng ký dạy khóa mới" description="Manager xem kinh nghiệm của bạn rồi duyệt. Sau khi duyệt, bạn tạo gói PT và khung nhận học viên cho khóa.">
    <form className="space-y-4" onSubmit={async e => { e.preventDefault(); if (await submit.run(() => coachWs.registerOffering({ courseId, experienceNote: note.trim() || undefined }))) { setCourseId(''); setNote(''); onDone() } }}>
      <Field label="Khóa tập" required error={courses.error}>
        <select required value={courseId} onChange={e => setCourseId(e.target.value)} className={inputCls} disabled={!courses.data}>
          <option value="">{courses.data ? (available.length ? 'Chọn khóa…' : 'Bạn đã đăng ký tất cả khóa đang mở') : 'Đang tải…'}</option>
          {available.map(c => <option key={c.id} value={c.id}>{c.name}{c.difficultyLevel ? ` · ${c.difficultyLevel}` : ''}</option>)}
        </select>
      </Field>
      <Field label="Kinh nghiệm / chứng chỉ liên quan"><textarea rows={3} value={note} onChange={e => setNote(e.target.value)} className={textareaCls} placeholder="VD: 3 năm dạy Kickboxing, chứng chỉ …" /></Field>
      <InlineError message={submit.error} />
      <div className="flex justify-end gap-2"><Btn onClick={onClose}>Hủy</Btn><Btn type="submit" variant="primary" busy={submit.busy} disabled={!courseId}>Gửi đăng ký</Btn></div>
    </form>
  </Modal>
}
