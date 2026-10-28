import { useState } from 'react'
import { CheckCircle2, Download, Inbox, Pencil, Percent, Phone, PhoneCall, Search, UserPlus } from 'lucide-react'
import { Modal } from '@/shared/components/ui/modal'
import { useLoad, useSubmit } from '@/features/fixed-pt/hooks'
import { centerDate } from '@/shared/utils/date'
import { Async, Badge, Btn, Card, Dot, EmptyBox, Field, InlineError, PageHeader, Pagination, Person, Segmented, StatTile, Table, inputCls, td, textareaCls, useFlash } from '@/features/workspace/ui'
import { downloadCsv, hhmm, relativeAgo } from '@/features/workspace/utils'
import { deskApi, type TrialRequest, type TrialStatus } from '../api'
import { useDeskShell } from '../shell'
import { dmy, TRIAL_LABEL } from '../labels'
import { CreateMemberModal } from './desk-members-page'

const PAGE = 10
const SLOTS = ['Sáng 06:00 – 09:00', 'Trưa 11:00 – 13:00', 'Chiều 14:00 – 17:00', 'Tối 17:00 – 20:00', 'Tối muộn 20:00 – 22:00']

export function DeskTrialsPage() {
  const { refresh } = useDeskShell()
  const { flash, node } = useFlash()
  const trials = useLoad(() => deskApi.trials(), [])
  const [tab, setTab] = useState<'all' | TrialStatus>('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [edit, setEdit] = useState<TrialRequest | null>(null)
  const [convert, setConvert] = useState<TrialRequest | null>(null)
  const list = trials.data ?? []
  const today = centerDate()
  const month = today.slice(0, 7)
  const thisMonth = list.filter(t => centerDate(t.createdAt).startsWith(month))
  const term = q.trim().toLowerCase()
  const rows = list.filter(t => (tab === 'all' || t.status === tab) && (!term || [t.fullName, t.phone].some(v => v.toLowerCase().includes(term))))
  const fresh = list.filter(t => t.status === 'NEW').sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const done = (m: string) => { flash(m); setEdit(null); void trials.reload(); refresh() }

  return <div>
    {node}
    <PageHeader title="Đăng ký tập thử" subtitle={<><span>Khách đăng ký từ website và khách đến trực tiếp</span><Dot /><span>Gọi lại khách mới càng sớm càng tốt</span></>}
      actions={<Btn icon={<Download aria-hidden className="h-4 w-4" />} disabled={!rows.length} onClick={() => downloadCsv('dang-ky-tap-thu.csv', ['Ngày', 'Họ tên', 'SĐT', 'Quan tâm', 'Mục tiêu', 'Khung giờ', 'Coach', 'Trạng thái', 'Ghi chú lễ tân'],
        rows.map(t => [dmy(t.createdAt), t.fullName, t.phone, t.interest ?? '', t.goal ?? '', t.preferredTime ?? '', t.coachName ?? '', TRIAL_LABEL[t.status].label, t.staffNote ?? '']))}>Xuất CSV</Btn>} />
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile label="Hồ sơ mới hôm nay" icon={<UserPlus className="h-[18px] w-[18px]" />} iconTone="info" value={trials.data ? list.filter(t => centerDate(t.createdAt) === today).length : '—'} />
      <StatTile label="Chờ gọi" icon={<PhoneCall className="h-[18px] w-[18px]" />} iconTone="warning" tone="warning" value={trials.data ? fresh.length : '—'} hint={fresh[0] ? `Cũ nhất: ${relativeAgo(fresh[0].createdAt)} ${hhmm(fresh[0].createdAt)}` : 'Đã gọi hết'} />
      <StatTile label="Đã liên hệ" icon={<CheckCircle2 className="h-[18px] w-[18px]" />} iconTone="success" value={trials.data ? list.filter(t => t.status === 'CONTACTED').length : '—'} hint="Đang chờ khách đến tập" />
      <StatTile label={`Chuyển đổi tháng ${month.slice(5)}`} icon={<Percent className="h-[18px] w-[18px]" />} iconTone="violet" value={trials.data && thisMonth.length ? Math.round((thisMonth.filter(t => t.status === 'CONVERTED').length / thisMonth.length) * 100) : '—'} unit={thisMonth.length ? '%' : undefined}
        hint={trials.data ? `${thisMonth.filter(t => t.status === 'CONVERTED').length}/${thisMonth.length} hồ sơ thành hội viên` : undefined} />
    </div>

    <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <NewTrialForm onDone={m => { flash(m); void trials.reload(); refresh() }} />
      <Card flush title="Chờ gọi lại" badge={<Badge tone="warning">{fresh.length} hồ sơ</Badge>} subtitle="Xếp theo thời gian đăng ký, cũ nhất trước">
        <Async state={trials} rows={4} empty={() => !fresh.length && <EmptyBox icon={<CheckCircle2 className="h-5 w-5" />} title="Không còn khách chờ gọi" />}>
          {() => <ul className="divide-y divide-border-subtle">{fresh.slice(0, 6).map(t => <li key={t.id} className="flex items-center gap-3 px-5 py-3">
            <Person name={t.fullName} />
            <div className="min-w-0 flex-1"><p className="font-semibold">{t.fullName}</p><p className="truncate text-xs text-text-muted">{[t.interest, t.preferredTime, t.phone].filter(Boolean).join(' · ')}</p></div>
            <span className="text-xs text-text-muted">{relativeAgo(t.createdAt)} {hhmm(t.createdAt)}</span>
            <a href={`tel:${t.phone}`} className="inline-flex h-8 items-center gap-1 rounded-lg border border-border-subtle px-2.5 text-xs font-semibold hover:bg-bg-surface-muted"><Phone aria-hidden className="h-3.5 w-3.5" />Gọi</a>
            <Btn size="sm" variant="soft" onClick={() => setEdit(t)}>Cập nhật</Btn>
          </li>)}</ul>}
        </Async>
      </Card>
    </div>

    <Card flush title="Danh sách hồ sơ tập thử" actions={<Segmented label="Lọc trạng thái" value={tab} onChange={t => { setTab(t); setPage(1) }}
      items={[{ key: 'all' as const, label: 'Tất cả', count: list.length }, ...(Object.keys(TRIAL_LABEL) as TrialStatus[]).map(k => ({ key: k, label: TRIAL_LABEL[k].label, count: list.filter(t => t.status === k).length }))]} />}>
      <div className="border-b border-border-subtle p-4"><label className="relative block max-w-md"><span className="sr-only">Tìm hồ sơ</span><Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input type="search" value={q} onChange={e => { setQ(e.target.value); setPage(1) }} placeholder="Tìm theo tên hoặc số điện thoại…" className={`${inputCls} pl-9`} /></label></div>
      <Async state={trials} rows={6} empty={() => !rows.length && <EmptyBox icon={<Inbox className="h-5 w-5" />} title="Không có hồ sơ phù hợp" />}>
        {() => <><Table head={['Khách hàng', 'Quan tâm', 'Khung giờ mong muốn', 'Coach chọn', 'Đăng ký lúc', 'Trạng thái', 'Thao tác']} minWidth={1060}>
          {rows.slice((page - 1) * PAGE, page * PAGE).map(t => <tr key={t.id} className="align-top hover:bg-bg-surface-muted/40">
            <td className={td}><div className="flex items-center gap-3"><Person name={t.fullName} /><div><p className="font-semibold">{t.fullName}</p><a href={`tel:${t.phone}`} className="text-xs text-primary hover:underline">{t.phone}</a></div></div></td>
            <td className={td}>{t.interest ?? '—'}{t.goal && <p className="text-xs text-text-muted">Mục tiêu: {t.goal}</p>}{t.note && <p className="mt-1 max-w-56 text-xs text-text-muted">“{t.note}”</p>}</td>
            <td className={td}>{t.preferredTime ?? '—'}</td>
            <td className={td}>{t.coachName ?? <span className="text-text-muted">—</span>}</td>
            <td className={`${td} tabular-nums`}>{dmy(t.createdAt)}<p className="text-xs text-text-muted">{hhmm(t.createdAt)}</p></td>
            <td className={td}><Badge tone={TRIAL_LABEL[t.status].tone}>{TRIAL_LABEL[t.status].label}</Badge>{t.staffNote && <p className="mt-1 max-w-48 text-xs text-text-muted">{t.staffNote}</p>}</td>
            <td className={`${td} text-right`}><div className="flex justify-end gap-1.5">
              <Btn size="sm" icon={<Pencil aria-hidden className="h-3.5 w-3.5" />} onClick={() => setEdit(t)}>Cập nhật</Btn>
              {t.status !== 'CONVERTED' && t.status !== 'CLOSED' && <Btn size="sm" variant="soft" icon={<UserPlus aria-hidden className="h-3.5 w-3.5" />} onClick={() => setConvert(t)}>Tạo hội viên</Btn>}
            </div></td>
          </tr>)}
        </Table><Pagination page={page} pageSize={PAGE} total={rows.length} onChange={setPage} noun="hồ sơ" /></>}
      </Async>
    </Card>
    {edit && <StatusModal t={edit} onClose={() => setEdit(null)} onDone={done} />}
    <CreateMemberModal open={!!convert} initial={convert ? { fullName: convert.fullName, phone: convert.phone } : undefined} onClose={() => setConvert(null)}
      onDone={async m => { if (convert) await deskApi.updateTrial(convert.id, { status: 'CONVERTED', staffNote: convert.staffNote ?? 'Đã tạo tài khoản hội viên tại quầy.' }).catch(() => undefined); flash(m); void trials.reload(); refresh() }} />
  </div>
}

function NewTrialForm({ onDone }: { onDone: (m: string) => void }) {
  const coaches = useLoad(() => deskApi.coaches(), [])
  const courses = useLoad(() => deskApi.coursesForTrial(), [])
  const submit = useSubmit()
  const [v, setV] = useState<Record<string, string>>({})
  const set = (k: string) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value })
  return <Card title="Ghi nhận khách tập thử" subtitle="Dùng cho khách đến quầy hoặc gọi điện">
    <form className="space-y-3" onSubmit={async e => {
      e.preventDefault()
      const body = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, x.trim()]).filter(([, x]) => x)) as { fullName: string; phone: string }
      if (await submit.run(() => deskApi.createTrial(body))) { setV({}); onDone(`Đã ghi nhận ${body.fullName}.`) }
    }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Họ và tên" required><input required maxLength={180} value={v.fullName ?? ''} onChange={set('fullName')} className={inputCls} /></Field>
        <Field label="Số điện thoại" required><input required type="tel" value={v.phone ?? ''} onChange={set('phone')} className={inputCls} /></Field>
        <Field label="Quan tâm"><select value={v.interest ?? ''} onChange={set('interest')} className={inputCls}><option value="">—</option><option>Tập gym tự do</option>{(courses.data ?? []).map(c => <option key={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Mục tiêu"><input maxLength={120} value={v.goal ?? ''} onChange={set('goal')} className={inputCls} placeholder="Giảm mỡ, tăng cơ…" /></Field>
        <Field label="Khung giờ mong muốn"><select value={v.preferredTime ?? ''} onChange={set('preferredTime')} className={inputCls}><option value="">—</option>{SLOTS.map(s => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Coach (nếu khách chọn)"><select value={v.coachId ?? ''} onChange={set('coachId')} className={inputCls}><option value="">Chưa chọn</option>{(coaches.data ?? []).map(c => <option key={c.id} value={c.id}>{c.user.fullName}</option>)}</select></Field>
      </div>
      <Field label="Ghi chú"><textarea rows={2} maxLength={1000} value={v.note ?? ''} onChange={set('note')} className={textareaCls} /></Field>
      <InlineError message={submit.code === 'TOO_MANY_REQUESTS' ? 'Máy chủ giới hạn 5 hồ sơ/giờ cho mỗi địa chỉ mạng. Thử lại sau ít phút.' : submit.error} />
      <div className="flex justify-end gap-2"><Btn onClick={() => setV({})}>Xóa form</Btn><Btn type="submit" variant="primary" busy={submit.busy} disabled={!v.fullName?.trim() || !v.phone?.trim()}>Lưu hồ sơ</Btn></div>
    </form>
  </Card>
}

function StatusModal({ t, onClose, onDone }: { t: TrialRequest; onClose: () => void; onDone: (m: string) => void }) {
  const submit = useSubmit()
  const [status, setStatus] = useState<TrialStatus>(t.status === 'NEW' ? 'CONTACTED' : t.status)
  const [note, setNote] = useState(t.staffNote ?? '')
  return <Modal isOpen onClose={onClose} title={`Cập nhật · ${t.fullName}`} description={`${t.phone}${t.interest ? ` · ${t.interest}` : ''}`}>
    <form className="space-y-4" onSubmit={async e => { e.preventDefault(); if (await submit.run(() => deskApi.updateTrial(t.id, { status, staffNote: note.trim() || undefined }))) onDone('Đã cập nhật hồ sơ.') }}>
      <fieldset><legend className="mb-1.5 text-sm font-medium">Trạng thái</legend>
        <div className="grid grid-cols-2 gap-2">{(Object.keys(TRIAL_LABEL) as TrialStatus[]).map(k => <label key={k} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${status === k ? 'border-primary bg-primary/5 font-semibold' : 'border-border-subtle'}`}>
          <input type="radio" name="trial-status" checked={status === k} onChange={() => setStatus(k)} className="accent-[var(--primary)]" />{TRIAL_LABEL[k].label}</label>)}</div>
      </fieldset>
      <Field label="Ghi chú lễ tân" hint="VD: hẹn 18:00 thứ 5, đã gửi bảng giá."><textarea rows={3} value={note} onChange={e => setNote(e.target.value)} className={textareaCls} /></Field>
      <InlineError message={submit.error} />
      <div className="flex justify-end gap-2"><Btn onClick={onClose}>Hủy</Btn><Btn type="submit" variant="primary" busy={submit.busy}>Lưu</Btn></div>
    </form>
  </Modal>
}
