import { useState, type ReactNode } from 'react'
import { coachTiers, tierLabels, type CoachTier } from '@/shared/utils/coach-tier'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { CheckCircle2, FileText, Send } from 'lucide-react'
import { Modal } from '@/shared/components/ui/modal'
import { hybridGet, hybridSend } from '../hybrid-api'
import { useLoad, useSubmit } from '../hooks'
import { Async, Badge, Btn, Card, EmptyBox, ErrorBox, Field, InlineError, PageHeader, Person, Skeleton, Table, inputCls, td, textareaCls, useFlash } from '@/features/workspace/ui'

type ApplicationStatus = 'DRAFT' | 'PENDING_REVIEW' | 'NEEDS_INFO' | 'APPROVED' | 'REJECTED'
type Application = { completedSessions?: number; averageRating?: string | number | null; reviewCount?: number; id: string; bio: string | null; specialization: string | null; yearsOfExperience: number | null; applicationStatus: ApplicationStatus; applicationSubmittedAt?: string | null; cvUrl: string | null; certificateUrls: string[] | null; applicationReviewNote: string | null; user?: { fullName: string; email?: string; avatarUrl?: string | null } }
const STATUS: Record<ApplicationStatus, { label: string; tone: 'neutral' | 'warning' | 'success' | 'danger' | 'info'; hint: string }> = {
  DRAFT: { label: 'Chưa nộp', tone: 'neutral', hint: 'Điền hồ sơ và tải CV PDF để gửi Manager duyệt.' },
  PENDING_REVIEW: { label: 'Đang chờ duyệt', tone: 'info', hint: 'Manager đang xem hồ sơ. Bạn sẽ nhận thông báo khi có kết quả.' },
  NEEDS_INFO: { label: 'Cần bổ sung', tone: 'warning', hint: 'Bổ sung theo nhận xét của Manager rồi nộp lại.' },
  APPROVED: { label: 'Đã duyệt', tone: 'success', hint: 'Hồ sơ đã được duyệt một lần. Bạn có thể bán gói theo bậc và nhận học viên.' },
  REJECTED: { label: 'Bị từ chối', tone: 'danger', hint: 'Bạn có thể chỉnh hồ sơ theo lý do và nộp lại.' },
}
// A Coach is never left on an empty status: an untouched profile reads as "not submitted".
const statusOf = (p: Application): ApplicationStatus => p.applicationStatus === 'PENDING_REVIEW' && !p.applicationSubmittedAt && !p.cvUrl ? 'DRAFT' : p.applicationStatus

export function CoachApplicationGate({ children }: { children: ReactNode }) {
  const state = useLoad(() => hybridGet<Application>('/coaches/me/application'))
  const location = useLocation()
  if (location.pathname === '/coach/application') return <>{children}</>
  if (state.error) return <ErrorBox message={state.error} onRetry={() => void state.reload()} />
  if (!state.data) return <Skeleton rows={3} />
  return state.data.applicationStatus === 'APPROVED' ? <>{children}</> : <Navigate to="/coach/application" replace />
}

async function upload(file: File, pdf: boolean) {
  const data = await new Promise<string>((resolve, reject) => { const r = new FileReader(); r.onerror = reject; r.onload = () => resolve(String(r.result).split(',')[1]); r.readAsDataURL(file) })
  return (await hybridSend<{ url: string }>('post', pdf ? '/uploads/documents' : '/uploads/images', { contentType: file.type, data })).url
}
const fileCls = 'block w-full text-sm text-text-muted file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-bg-surface-muted file:px-3 file:py-2 file:text-sm file:font-medium file:text-text-primary hover:file:bg-border-subtle'

export function CoachApplicationPage() {
  const state = useLoad(() => hybridGet<Application>('/coaches/me/application'))
  return <div>
    <PageHeader title="Hồ sơ huấn luyện viên" />
    {state.error ? <ErrorBox message={state.error} onRetry={() => void state.reload()} /> : !state.data ? <Skeleton rows={5} /> : <ApplicationForm p={state.data} reload={() => void state.reload()} />}
  </div>
}

function ApplicationForm({ p, reload }: { p: Application; reload: () => void }) {
  const [form, setForm] = useState({ bio: p.bio ?? '', specialization: p.specialization ?? '', years: String(p.yearsOfExperience ?? 0) })
  const [avatar, setAvatar] = useState<File | null>(null)
  const [cv, setCv] = useState<File | null>(null)
  const [certificates, setCertificates] = useState<File[]>([])
  const act = useSubmit()
  const status = statusOf(p)
  const editable = status !== 'APPROVED' && status !== 'PENDING_REVIEW'
  const submit = () => void act.run(async () => {
    if (!cv && !p.cvUrl) throw new Error('Cần tải CV dạng PDF.')
    const cvUrl = cv ? await upload(cv, true) : p.cvUrl
    const certificateUrls = certificates.length ? await Promise.all(certificates.map(f => upload(f, false))) : p.certificateUrls ?? []
    await hybridSend('put', '/coaches/me/application', { bio: form.bio, specialization: form.specialization, yearsOfExperience: Number(form.years), avatarUrl: avatar ? await upload(avatar, false) : undefined, cvUrl, certificateUrls })
    reload()
  })
  return <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
    <Card title="Trạng thái">
      <div className="space-y-3">
        <Badge tone={STATUS[status].tone}>{STATUS[status].label}</Badge>
        <p className="text-sm text-text-muted">{STATUS[status].hint}</p>
        {p.applicationReviewNote && <p className="rounded-lg bg-bg-surface-muted px-3 py-2 text-sm"><span className="font-medium">Nhận xét của Manager:</span> {p.applicationReviewNote}</p>}
        {p.cvUrl && <a className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline" href={p.cvUrl} target="_blank" rel="noreferrer"><FileText aria-hidden className="h-4 w-4" />Xem CV đã nộp</a>}
        {status === 'APPROVED' && <Link to="/coach" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"><CheckCircle2 aria-hidden className="h-4 w-4" />Vào khu vực huấn luyện viên</Link>}
      </div>
    </Card>
    <Card title="Thông tin hồ sơ" subtitle={editable ? 'Các mục có dấu * là bắt buộc.' : 'Hồ sơ đang khóa trong lúc chờ duyệt hoặc đã được duyệt.'}>
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); submit() }}>
        <fieldset disabled={!editable || act.busy} className="space-y-4">
          <Field label="Giới thiệu bản thân" required><textarea required rows={4} className={textareaCls} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px]">
            <Field label="Chuyên môn" required><input required className={inputCls} value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} placeholder="VD: Giảm mỡ, phục hồi chấn thương" /></Field>
            <Field label="Số năm kinh nghiệm" required><input required type="number" min={0} max={80} className={inputCls} value={form.years} onChange={e => setForm({ ...form, years: e.target.value })} /></Field>
          </div>
          <Field label="CV (PDF, tối đa 5 MB)" required={!p.cvUrl} hint={p.cvUrl ? 'Đã có CV; chọn tệp mới nếu muốn thay.' : undefined}><input type="file" accept="application/pdf" className={fileCls} onChange={e => setCv(e.target.files?.[0] ?? null)} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ảnh chứng chỉ" hint={p.certificateUrls?.length ? `Đã có ${p.certificateUrls.length} ảnh.` : undefined}><input multiple type="file" accept="image/png,image/jpeg,image/webp" className={fileCls} onChange={e => setCertificates(Array.from(e.target.files ?? []))} /></Field>
            <Field label="Ảnh đại diện"><input type="file" accept="image/png,image/jpeg,image/webp" className={fileCls} onChange={e => setAvatar(e.target.files?.[0] ?? null)} /></Field>
          </div>
        </fieldset>
        <InlineError message={act.error} />
        {editable && <Btn type="submit" variant="primary" busy={act.busy} icon={<Send aria-hidden className="h-4 w-4" />}>{status === 'DRAFT' ? 'Nộp hồ sơ' : 'Nộp lại hồ sơ'}</Btn>}
      </form>
    </Card>
  </div>
}

/** Manager queue of Coach applications (one-time review, PRD §5.10). */
export function ApplicationsPanel({ onChange }: { onChange?: () => void } = {}) {
  const state = useLoad(() => hybridGet<Application[]>('/coach-applications', { status: 'PENDING_REVIEW' }))
  const [open, setOpen] = useState<Application | null>(null)
  const { flash, node } = useFlash()
  const rows = (state.data ?? []).filter(p => p.cvUrl)
  return <Card flush title="Hồ sơ Coach chờ duyệt" badge={state.data ? <Badge tone="warning">{rows.length}</Badge> : null}>
    {node}
    <Async state={state} rows={3} empty={() => !rows.length && <EmptyBox icon={<CheckCircle2 className="h-5 w-5" />} title="Không có hồ sơ chờ duyệt" />}>
      {() => <Table head={['Coach', 'Chuyên môn', 'Hồ sơ', '']} minWidth={720}>
        {rows.map(p => <tr key={p.id} className="hover:bg-bg-surface-muted/40">
          <td className={td}><span className="flex items-center gap-3"><Person name={p.user?.fullName} src={p.user?.avatarUrl} /><span><span className="block font-semibold">{p.user?.fullName}</span><span className="text-xs text-text-muted">{p.user?.email}</span></span></span></td>
          <td className={td}><p>{p.specialization}</p><p className="text-xs text-text-muted">{p.yearsOfExperience ?? 0} năm kinh nghiệm</p></td>
          <td className={td}><div className="flex flex-wrap gap-3 text-sm">{p.cvUrl && <a href={p.cvUrl} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">CV PDF</a>}{p.certificateUrls?.map((url, i) => <a key={url} href={url} target="_blank" rel="noreferrer" className="text-primary hover:underline">Chứng chỉ {i + 1}</a>)}</div></td>
          <td className={`${td} text-right`}><Btn size="sm" variant="soft" onClick={() => setOpen(p)}>Xem & duyệt</Btn></td>
        </tr>)}
      </Table>}
    </Async>
    {open && <ReviewModal p={open} onClose={() => setOpen(null)} onDone={m => { flash(m); setOpen(null); void state.reload(); onChange?.() }} />}
  </Card>
}

function ReviewModal({ p, onClose, onDone }: { p: Application; onClose: () => void; onDone: (message: string) => void }) {
  const [note, setNote] = useState('')
  const act = useSubmit()
  const [tier, setTier] = useState<CoachTier>('STANDARD')
  const review = (status: 'APPROVED' | 'NEEDS_INFO' | 'REJECTED', message: string) => void act.run(async () => { await hybridSend('patch', `/coach-applications/${p.id}/review`, { status, note: note.trim(), ...(status === 'APPROVED' ? { tier } : {}) }); onDone(message) })
  return <Modal isOpen onClose={onClose} title={`Hồ sơ ${p.user?.fullName ?? ''}`} description={`${p.specialization ?? ''} · ${p.yearsOfExperience ?? 0} năm kinh nghiệm`}>
    <div className="space-y-4">
      {p.bio && <p className="whitespace-pre-line rounded-lg bg-bg-surface-muted px-3 py-2 text-sm">{p.bio}</p>}
      <p className="text-sm">{p.completedSessions ?? 0} buổi đã dạy xong · {p.averageRating ?? '—'}/5 · {p.reviewCount ?? 0} đánh giá</p>
      <Field label="Bậc khi duyệt" required><select aria-label="Bậc khi duyệt" className={inputCls} value={tier} disabled={act.busy} onChange={e => setTier(e.target.value as CoachTier)}>{coachTiers.map(t => <option key={t} value={t}>{tierLabels[t]}</option>)}</select><p className="mt-1 text-sm text-text-muted">Chỉ áp dụng khi duyệt hồ sơ. Bậc quyết định các gói Coach được bán và giá bán.</p></Field>
      <Field label="Nhận xét gửi Coach" required hint="Bắt buộc với mọi quyết định; Coach thấy nội dung này."><textarea rows={3} className={textareaCls} value={note} onChange={e => setNote(e.target.value)} /></Field>
      <InlineError message={act.error} />
      <div className="flex flex-wrap justify-end gap-2">
        <Btn variant="danger" busy={act.busy} disabled={!note.trim()} onClick={() => review('REJECTED', 'Đã từ chối hồ sơ.')}>Từ chối</Btn>
        <Btn busy={act.busy} disabled={!note.trim()} onClick={() => review('NEEDS_INFO', 'Đã yêu cầu Coach bổ sung.')}>Yêu cầu bổ sung</Btn>
        <Btn variant="primary" busy={act.busy} disabled={!note.trim()} onClick={() => review('APPROVED', 'Đã duyệt hồ sơ Coach.')}>Duyệt</Btn>
      </div>
    </div>
  </Modal>
}
