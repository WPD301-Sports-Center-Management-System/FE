import { useEffect, useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { formatDate, formatDateTime } from '@/shared/utils/date'
import { fixedPtApi } from '../api'
import { useLoad, useSubmit } from '../hooks'
import type { Enrollment } from '../types'
import { ErrorBanner, Field, inputCls, label, Loadable, money, Notice, Page, Panel, Status } from '../components/ui'
import { ScheduleList } from '../components/widgets'

function useCountdown(until?: string | null) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { if (!until) return; const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [until])
  if (!until) return null
  const ms = new Date(until).getTime() - now
  return ms <= 0 ? 'đã hết' : `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`
}

// Receptionist: register a Member to a Coach's fixed schedule on their behalf (with recorded consent),
// confirm the proposal the Member agreed to and take the payment of exactly that held schedule.
export function ReceptionEnrollmentPage() {
  const [status, setStatus] = useState('')
  const list = useLoad(() => fixedPtApi.enrollments({ status: status || undefined, limit: 50 }), [status])
  const [open, setOpen] = useState<Enrollment | null>(null)
  return (
    <Page title="Đăng ký lịch cố định cũ" subtitle="Theo dõi và xử lý các đơn legacy. Mua gói/đặt lịch mới dùng màn Mua gói & đặt lịch PT." actions={<Button disabled title="Dùng màn Mua gói & đặt lịch PT để tạo đơn mới">Đã dừng tạo đăng ký legacy</Button>}>
      <Panel title="Đăng ký" actions={<select aria-label="Lọc trạng thái" className={inputCls} value={status} onChange={e => setStatus(e.target.value)}><option value="">Tất cả</option>{['REQUESTED', 'PROPOSED', 'AWAITING_PAYMENT', 'PAID_NEEDS_SCHEDULE', 'CONFIRMED', 'WITHDRAWN', 'REJECTED', 'EXPIRED'].map(v => <option key={v} value={v}>{label(v)}</option>)}</select>}>
        <Loadable state={list} empty="Chưa có đăng ký.">{items => (
          <ul className="space-y-2">{items.map(e => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-subtle p-3 text-sm">
              <span><strong>{e.member.user.fullName}</strong> · Coach {e.coach.user.fullName} · {e.packageOption.name}<span className="block text-xs text-text-muted">{e.code} · gửi {formatDateTime(e.createdAt)}</span></span>
              <span className="flex items-center gap-2"><Status value={e.status} /><Button size="sm" variant="secondary" onClick={() => setOpen(e)}>Chi tiết</Button></span>
            </li>))}</ul>
        )}</Loadable>
      </Panel>
      {open && <EnrollmentModal id={open.id} onClose={() => { setOpen(null); void list.reload() }} />}
    </Page>
  )
}

function EnrollmentModal({ id, onClose }: { id: string; onClose: () => void }) {
  const state = useLoad(() => fixedPtApi.enrollment(id), [id])
  const e = state.data; const p = e?.currentProposal
  const [consent, setConsent] = useState(''); const [method, setMethod] = useState<'CASH' | 'BANK_TRANSFER'>('CASH')
  const [received, setReceived] = useState(''); const [ref, setRef] = useState(''); const [override, setOverride] = useState('')
  const [paid, setPaid] = useState<string | null>(null)
  const act = useSubmit()
  const countdown = useCountdown(e?.activeHold?.expiresAt)
  const price = Number(p?.priceSnapshot ?? e?.packageOption.price ?? 0)
  return (
    <Modal isOpen onClose={onClose} title={e ? `${e.code} · ${e.member.user.fullName}` : 'Đăng ký'} maxWidth="2xl">
      <Loadable state={state}>{() => e && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm"><Status value={e.status} /><span>Coach {e.coach.user.fullName} · {e.packageOption.name}</span></div>
          {p && <Panel title={`Lịch đề xuất v${p.version} · ${p.items.length} buổi · ${money(p.priceSnapshot)}`}>
            <p className="mb-2 text-xs text-text-muted">Bắt đầu {formatDate(p.startDate)} · hạn gói {p.validityDaysSnapshot} ngày kể từ buổi đầu · {String(p.policySnapshot.timelyCancel ?? '')} {String(p.policySnapshot.lateCancel ?? '')} {String(p.policySnapshot.noRefund ?? '')}</p>
            <ScheduleList items={p.items} />
          </Panel>}
          {e.status === 'PROPOSED' && p && <>
            <Field label="Căn cứ Member đồng ý lịch này (bắt buộc)"><textarea className={inputCls} rows={2} value={consent} onChange={ev => setConsent(ev.target.value)} /></Field>
            <div className="flex gap-2">
              <Button isLoading={act.busy} disabled={!consent.trim()} onClick={() => void act.run(async () => { await fixedPtApi.accept(e.id, p.id, consent); await state.reload() })}>Xác nhận Member đồng ý & giữ chỗ</Button>
              <Button variant="ghost" disabled={!consent.trim() || act.busy} onClick={() => void act.run(async () => { await fixedPtApi.requestChange(e.id, 'Member đề nghị chỉnh lịch tại quầy', consent); await state.reload() })}>Member đề nghị chỉnh</Button>
            </div>
          </>}
          {e.status === 'AWAITING_PAYMENT' && e.purchase && <Panel title={`Thanh toán tại quầy · giữ chỗ còn ${countdown ?? '-'}`}>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Phương thức"><select className={inputCls} value={method} onChange={ev => setMethod(ev.target.value as 'CASH' | 'BANK_TRANSFER')}><option value="CASH">Tiền mặt</option><option value="BANK_TRANSFER">Chuyển khoản</option></select></Field>
              <Field label={method === 'CASH' ? 'Tiền khách đưa' : 'Số tiền nhận (đúng giá)'} hint={`Giá đã chốt: ${money(price)}`}><input type="number" min={0} className={inputCls} value={received} onChange={ev => setReceived(ev.target.value)} /></Field>
              <Field label="Mã tham chiếu"><input className={inputCls} value={ref} onChange={ev => setRef(ev.target.value)} /></Field>
            </div>
            {act.code === 'GATEWAY_ATTEMPT_PENDING' && <Field label="Lý do vẫn thu tại quầy khi có giao dịch VNPay đang mở"><input className={inputCls} value={override} onChange={ev => setOverride(ev.target.value)} /></Field>}
            <div className="mt-2"><Button isLoading={act.busy} disabled={!received} onClick={() => void act.run(async () => { const r = await fixedPtApi.payCounter({ ptPurchaseId: e.purchase!.id, method, receivedAmount: Number(received), externalRef: ref || undefined, overrideReason: override || undefined }); setPaid(r.application === 'APPLIED' ? `Đã thu và áp dụng cho đơn. Tiền thối: ${money(r.changeAmount)}.` : 'Đã ghi nhận tiền nhưng chưa áp dụng – đã mở hồ sơ đối soát.'); await state.reload() })}>Thu tiền</Button></div>
          </Panel>}
          {e.status === 'PAID_NEEDS_SCHEDULE' && <Notice tone="warning">Đã nhận thanh toán nhưng giờ giữ chỗ không còn trống. Coach đang sắp lại lịch; Member không cần trả lại.</Notice>}
          {e.purchase?.paymentsPtPurchaseId?.length ? <div className="text-xs text-text-muted">Giao dịch: {e.purchase.paymentsPtPurchaseId.map(x => `${x.paymentCode} ${x.method} ${label(x.status)}${x.application ? ` (${label(x.application)})` : ''}`).join(' · ')}</div> : null}
          {paid && <Notice tone="success">{paid}</Notice>}
          <ErrorBanner message={act.code === 'GATEWAY_ATTEMPT_PENDING' ? `${act.error} Nhập lý do rồi bấm Thu tiền lần nữa.` : act.error} />
          {['REQUESTED', 'PROPOSED', 'AWAITING_PAYMENT'].includes(e.status) && <div className="flex justify-end"><Button variant="ghost" disabled={act.busy || !consent.trim()} onClick={() => void act.run(async () => { await fixedPtApi.withdraw(e.id, 'Member rút yêu cầu tại quầy', consent); await state.reload() })}>Member rút yêu cầu (cần căn cứ)</Button></div>}
        </div>
      )}</Loadable>
    </Modal>
  )
}
