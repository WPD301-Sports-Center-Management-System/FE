import type { PtDraft } from '@/shared/utils/pt-continuation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { PersonSearch } from '@/features/workspace/person-search'
import { deskApi } from '@/features/reception-workspace/api'
import { useSearchParams } from 'react-router-dom'
import { useLoad, useSubmit } from '../hooks'
import { hybridGet } from '../hybrid-api'
import { seriesApi, type PatternSlot, type SeriesPreview, type SeriesOrder, type SeriesPreviewBody } from '../series-api'
import { PatternPicker, SeriesPreviewList } from '../components/pattern-picker'
import { Page, Panel, Field, inputCls, Loadable, ErrorBanner, Notice, money } from '../components/ui'
import { Btn } from '@/features/workspace/ui'
import { counterPayment } from '@/features/workspace/counter-payment'
import { centerDate } from '@/shared/utils/date'
import { useAuth } from '@/features/auth/context/auth-context'
import { AppApiError } from '@/shared/api/api-error'
import { tierLabel, type CoachTier } from '@/shared/utils/coach-tier'
export function HybridSalePage() {
  const [params] = useSearchParams()
  const location = useLocation()
  type Draft = PtDraft
  const restored = (location.state as { ptDraft?: Draft } | null)?.ptDraft
  const [acceptPolicy, setAcceptPolicy] = useState(false)
  const [consentSource, setConsentSource] = useState('')
  const [consentNote, setConsentNote] = useState('')
  const consent = consentSource === 'OTHER' ? consentNote.trim() : consentSource ? consentSource + (consentNote.trim() ? ': ' + consentNote.trim() : '') : ''
  // Counter cash is Receptionist-only on the BE (POST /payments/counter).
  const { role, user } = useAuth()
  const self = role === 'MEMBER'
  const desk = role === 'RECEPTIONIST'
  const [memberId, setMember] = useState(self ? user?.memberProfilesUserId?.id ?? '' : restored?.memberId ?? params.get('memberId') ?? '')
  const [coachId, setCoach] = useState(restored?.coachId ?? '')
  const [optionId, setOption] = useState(restored?.optionId ?? '')
  const [startDate, setDate] = useState(restored?.startDate ?? centerDate(new Date(Date.now() + 86400000).toISOString()))
  const [pattern, setPattern] = useState<PatternSlot[]>(restored?.pattern ?? [])
  const [preview, setPreview] = useState<SeriesPreview | null>(null)
  const [order, setOrder] = useState<SeriesOrder | null>(restored?.purchaseId ? { purchaseId: restored.purchaseId, hold: { expiresAt: new Date(0).toISOString() }, expectedCompletionAt: '' } : null)
  const [paid, setPaid] = useState(false)
  const [receivedPayment, setReceivedPayment] = useState<string | null>(null)
  const [cash, setCash] = useState('')
  const [now, setNow] = useState(Date.now())
  const key = useRef({ body: '', key: crypto.randomUUID() })
  const act = useSubmit()
  const member = useLoad(() => deskApi.member(memberId), [memberId], !!memberId && !self)
  const findMember = useCallback(async (term: string) => (await deskApi.members({ search: term, limit: 8 })).items.map(m => ({ id: m.id, name: m.user.fullName, sub: m.memberCode })), [])
  const coaches = useLoad(() => hybridGet<{ id: string; fullName: string; tier?: CoachTier }[]>('/coaches', { limit: 100 }))
  const options = useLoad(() => hybridGet<{ id: string; name: string; price: string; sessionCount: number; durationMinutes?: number }[]>('/pt-package-options', { coachId, limit: 100 }), [coachId], !!coachId)
  const [tierNotice, setTierNotice] = useState('')
  async function checkTier<T>(work: () => Promise<T>): Promise<T> {
    try { return await work() } catch (error) {
      if (error instanceof AppApiError && error.code === 'COACH_TIER_TOO_LOW') {
        setTierNotice('Coach này chưa bán gói này. Vui lòng chọn lại gói của Coach.'); setOption(''); setPattern([]); setPreview(null); setAcceptPolicy(false); setConsentSource(''); void options.reload()
      }
      throw error
    }
  }
  const pending = useLoad(() => hybridGet<{ id: string; purchaseCode: string; memberId: string; coachId: string; packageOptionId: string; status: string }[]>(self ? '/me/pt-packages' : '/pt-package-purchases', { memberId, status: 'PENDING_PAYMENT', limit: 100 }), [memberId], !!memberId)
  const slots = useLoad(() => checkTier(() => seriesApi.patterns(coachId, optionId, startDate, memberId, order?.purchaseId)), [coachId, optionId, startDate, memberId, order?.purchaseId], !!coachId && !!optionId && !!memberId && !!startDate)
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id) }, [])
  useEffect(() => { setPreview(null); setAcceptPolicy(false); setConsentSource('') }, [coachId, optionId, startDate, memberId])
  const renewal = useLoad(() => seriesApi.renewal(params.get('renewFrom')!), [params.get('renewFrom')], !!params.get('renewFrom'))
  const appliedRenewal = useRef('')
  useEffect(() => {
    if (renewal.data && appliedRenewal.current !== params.get('renewFrom')) {
      const d = renewal.data; setMember(d.memberId); setCoach(d.coachId); setOption(d.suggestedPackageOptionId ?? ''); setDate(d.suggestedStartDate); setPattern(d.pattern); appliedRenewal.current = params.get('renewFrom')!
    }
  }, [renewal.data])
  const body: SeriesPreviewBody = { coachId, packageOptionId: optionId, memberId, startDate, pattern, consentEvidence: self || !consent ? undefined : consent, acceptPolicy: self && acceptPolicy ? true : undefined, purchaseId: order?.purchaseId }
  const changePattern = (p: PatternSlot[]) => { setPattern(p); setPreview(null); setAcceptPolicy(false); setConsentSource('') }
  const remaining = order ? Math.max(0, Math.ceil((Date.parse(order.hold.expiresAt) - now) / 1000)) : null
  useEffect(() => { if (order && remaining === 0) void slots.reload() }, [order?.purchaseId, remaining === 0])
  const previewBlocker = !pattern.length ? 'Chưa thể xem trước: hãy chọn ít nhất 1 ngày tập trong tuần.'
    : pattern.some(p => !p.startTime) ? 'Chưa thể xem trước: hãy chọn giờ cho tất cả các ngày đã chọn.'
    : slots.data && pattern.some(p => !slots.data!.slots.some(s => s.available && s.weekday === p.weekday && s.startTime === p.startTime)) ? 'Chưa thể xem trước: có ngày/giờ không còn trống, hãy chọn lại giờ khác.'
    : order && remaining !== 0 ? 'Giữ chỗ đang chạy, chưa thể đổi lịch.' : null
  return <Page title={self ? "Chọn gói PT và lịch tập" : "Bán gói PT có lịch"} subtitle="Chọn lịch tập cho cả gói, sau đó xem trước từng buổi trước khi thu tiền.">
    <div className="rounded-xl bg-text-primary px-5 py-4 text-bg-surface"><p className="font-semibold">Xếp lịch cho toàn bộ gói</p><p className="mt-1 text-sm opacity-70">Một lịch tập rõ ràng, kiểm tra đủ các buổi trước khi tạo đơn.</p></div>
    {tierNotice && <Notice>{tierNotice}</Notice>}
    <ErrorBanner message={act.error ?? renewal.error} />{params.get('renewFrom') && <Notice>Mua gói mới với Coach hiện tại. Kiểm tra lại gói, lịch, giá và đồng ý trước khi tạo đơn. Khung giờ gợi ý chưa được giữ.</Notice>}
    {receivedPayment && !paid && <Notice>Đã nhận tiền. Đơn đang chờ áp dụng hoặc đối soát, vui lòng không thu thêm. <Link className="font-semibold underline" to="/receptionist/payments">Mở thanh toán để theo dõi</Link></Notice>}
    {paid ? <Panel title="Đã hoàn tất bán gói"><Notice tone="success">Đã nhận tiền và tạo toàn bộ buổi tập. Hóa đơn đã mở.</Notice><div className="mt-4 flex flex-wrap gap-3"><Link className="font-semibold text-primary underline" to={`/receptionist/members/${memberId}`}>Xem gói và lịch của hội viên</Link><Link className="font-semibold text-primary underline" to="/receptionist/calendar">Mở lịch PT</Link></div></Panel> : <>
    <Panel title="Thông tin gói tập"><fieldset disabled={act.busy || !!order && remaining !== 0} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2"><p className="text-sm font-medium">Hội viên mua gói</p>{self ? <p className="font-semibold">{user?.fullName}</p> : <><PersonSearch label="Tìm hội viên mua PT" placeholder="Nhập tên, số điện thoại hoặc email…" find={findMember} onPick={m => setMember(m.id)} />{memberId && <Loadable state={member}>{m => <p className="rounded-lg bg-bg-surface-muted p-3 text-sm font-semibold">Đã chọn: {m.user.fullName} · {m.memberCode}</p>}</Loadable>}</>}</div>
      <Field label="Huấn luyện viên"><Loadable state={coaches}>{rows => <select aria-label="Huấn luyện viên" className={inputCls} value={coachId} onChange={e => { setCoach(e.target.value); setOption('') }}><option value="">Chọn huấn luyện viên</option>{rows.map(c => <option key={c.id} value={c.id}>{c.fullName}{!self && c.tier ? " · " + tierLabel(c.tier) : ""}</option>)}</select>}</Loadable></Field>
      <Field label="Gói PT">{coachId ? <Loadable state={options}>{() => <select aria-label="Gói PT" className={inputCls} value={optionId} onChange={e => { setOption(e.target.value); setTierNotice(''); setAcceptPolicy(false); setConsentSource('') }}><option value="">{(options.data ?? []).length ? 'Chọn gói PT' : 'Coach chưa có gói mở bán'}</option>{(options.data ?? []).map(o => <option key={o.id} value={o.id}>{o.name} · {o.sessionCount} buổi · {o.durationMinutes ?? '—'} phút/buổi · {money(o.price)}</option>)}</select>}</Loadable> : <p className="text-sm text-text-muted">Chọn HLV trước để xem gói PT.</p>}</Field>
      <Field label="Ngày bắt đầu"><input className={inputCls} type="date" min={centerDate()} value={startDate} onChange={e => setDate(e.target.value)} /></Field>

    </fieldset></Panel>
    {!order && pending.data?.some(p => p.status === 'PENDING_PAYMENT') && <Panel title="Tiếp tục đơn chưa thanh toán">{pending.data.filter(p => p.status === 'PENDING_PAYMENT').map(p => <Btn key={p.id} onClick={() => { setCoach(p.coachId); setOption(p.packageOptionId); setOrder({ purchaseId: p.id, hold: { expiresAt: new Date(0).toISOString() }, expectedCompletionAt: '' }); setPreview(null) }}>Chọn lại lịch cho {p.purchaseCode}</Btn>)}</Panel>}
    {optionId && <Panel title="Lịch tập hằng tuần"><fieldset disabled={act.busy || !!order && remaining !== 0} className="min-w-0 space-y-3">{memberId ? <Loadable state={slots}>{data => <PatternPicker data={data} summary={[{label:'Coach',value:coaches.data?.find(c=>c.id===coachId)?.fullName??'—'},{label:'Gói PT',value:options.data?.find(o=>o.id===optionId)?.name??'—'},{label:'Bắt đầu từ',value:startDate.split('-').reverse().join('/')},{label:'Tổng gói',value:`${options.data?.find(o=>o.id===optionId)?.sessionCount??'—'} buổi`}]} value={pattern} onChange={changePattern} />}</Loadable> : <p className="text-sm text-text-muted">Chọn hội viên ở bước 1 để kiểm tra giờ trống phù hợp.</p>}
      <Btn variant="primary" className="w-full" busy={act.busy} disabled={pattern.length < 1 || pattern.length > 6 || new Set(pattern.map(p => p.weekday)).size !== pattern.length || pattern.some(p => !p.startTime || !slots.data?.slots.some(s => s.available && s.weekday === p.weekday && s.startTime === p.startTime)) || !!order && remaining !== 0} onClick={() => void act.run(async () => { setAcceptPolicy(false); setConsentSource(''); setPreview(await checkTier(() => seriesApi.preview(body))) })}>Xem trước toàn bộ lịch</Btn>
<p className="text-sm text-text-muted">{previewBlocker ?? 'Xem trước chưa giữ lịch và chưa tạo đơn.'}</p>
    </fieldset></Panel>}
    {preview && <Panel title="Xem phương án và xác nhận"><SeriesPreviewList data={preview} /><p className="my-3 font-semibold">Giá gói: {money(preview.price)}</p><p className="text-sm">Báo nghỉ trước 4 giờ để được giữ lại buổi tập theo chính sách; các thay đổi lịch cần bên còn lại xác nhận. Vé gym là quyền lợi riêng.</p>
      {preview.gymCoverage && <Notice>{preview.gymCoverage.uncoveredSessions ? <>{preview.gymCoverage.uncoveredSessions} buổi PT chưa có vé gym từ {preview.gymCoverage.firstUncoveredDate} đến {preview.gymCoverage.lastUncoveredDate}. <Link className="font-semibold underline" state={{ ptDraft: { memberId, coachId, optionId, startDate, pattern, ...(order ? { purchaseId: order.purchaseId } : {}) } }} to={self ? '/member/membership-sale' + (preview.gymCoverage?.renewableSubscriptionId ? '?renewSubscriptionId=' + preview.gymCoverage.renewableSubscriptionId : '') : '/receptionist/membership-sale?memberId=' + memberId + '&returnToPt=1' + (preview.gymCoverage?.renewableSubscriptionId ? '&renewSubscriptionId=' + preview.gymCoverage.renewableSubscriptionId : '')}>Mua hoặc gia hạn vé gym rồi quay lại</Link></> : 'Vé gym hiện có phủ các ngày tập trong phương án này.'} Đơn gym và PT độc lập; lịch PT được kiểm tra lại khi tạo đơn.</Notice>}
      {self ? <label className="my-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={acceptPolicy} onChange={e => setAcceptPolicy(e.target.checked)} />Tôi đã xem toàn bộ lịch và đồng ý chính sách gói tập đã hiển thị.</label> : <>      <Field label="Căn cứ Member đồng ý"><select aria-label="Căn cứ Member đồng ý" className={inputCls} value={consentSource} onChange={e => setConsentSource(e.target.value)}><option value="">Chọn căn cứ sau khi Member xem phương án</option><option>Member xác nhận trực tiếp tại quầy</option><option>Member xác nhận qua tin nhắn</option><option value="OTHER">Căn cứ khác (cần ghi rõ)</option></select></Field>
      {consentSource && <Field label="Ghi chú xác nhận"><textarea className={inputCls} value={consentNote} onChange={e => setConsentNote(e.target.value)} /></Field>}
</>}
      <Btn busy={act.busy} disabled={(self ? !acceptPolicy : !consent.trim()) || !preview.canConfirmAll || !!order && remaining !== 0} onClick={() => void act.run(async () => {
        const serialized = JSON.stringify({ ...body, expectedPrice: preview.price }); if (serialized !== key.current.body) key.current = { body: serialized, key: crypto.randomUUID() }
        try {
          const next = order ? await seriesApi.rehold(order.purchaseId, { pattern, startDate, idempotencyKey: key.current.key, consentEvidence: self ? undefined : consent }) : await checkTier(() => seriesApi.checkout({ coachId, packageOptionId: optionId, memberId, startDate, pattern, expectedPrice: Number(preview.price), consentEvidence: self ? undefined : consent, acceptPolicy: self && acceptPolicy ? true : undefined, idempotencyKey: key.current.key }))
          setOrder(next); setCash(String(next.price ?? preview.price))
        } catch (error) {
          if (error instanceof AppApiError && error.code === 'PRICE_CHANGED') {
            const details = error.details as { price?: string; coachTier?: CoachTier } | undefined
            setAcceptPolicy(false); setConsentSource(''); setPreview(null)
            key.current = { body: '', key: crypto.randomUUID() }
            await options.reload()
            try { setPreview(await checkTier(() => seriesApi.preview(body))) } catch { /* The preview button remains available for retry. */ }
            throw new Error(`Giá gói vừa thay đổi${details?.price ? ': ' + money(details.price) : ''}. Vui lòng xem lại giá và xác nhận lại trước khi giữ lịch.`)
          }
          throw error
        }
      })}>{order ? 'Chọn lại lịch trên đơn này' : 'Giữ chuỗi và tạo đơn'}</Btn>
    </Panel>}
    {order && <Panel title="Thanh toán đơn PT"><p>Giữ chỗ còn {remaining} giây.</p>{self ? <Btn busy={act.busy} disabled={remaining === 0 || !!receivedPayment} onClick={() => void act.run(async () => { const result = await deskApi.payVnpay({ ptPurchaseId: order.purchaseId }); window.location.assign(result.paymentUrl) })}>Thanh toán qua VNPay</Btn> : !desk ? <Notice>Chỉ tài khoản Lễ tân được thu tiền tại quầy. Manager xem được quầy nhưng không thu tiền; hãy đăng nhập bằng tài khoản Lễ tân.</Notice> : remaining === 0 ? <Notice>Giữ chỗ đã hết. Chọn lại khung tuần, xem trước và giữ lịch lại trước khi thu tiền.</Notice> : <><Field label="Tiền nhận"><input className={inputCls} type="number" inputMode="numeric" min={0} step={1000} value={cash} onChange={e => setCash(e.target.value.replace(/[^0-9]/g, ''))} /></Field><Btn busy={act.busy} disabled={!!receivedPayment || !preview || Number(cash) < Number(preview.price)} onClick={() => void act.run(async () => {
      if (receivedPayment) return
      const collect = (overrideReason?: string) => counterPayment<{ id: string; application: string }>({ ptPurchaseId: order.purchaseId, method: 'CASH', receivedAmount: Number(cash), ...(overrideReason ? { overrideReason } : {}) })
      // Checkout always opens a VNPay placeholder attempt; the BE refuses cash over it without a reason.
      const payment = await collect('Lễ tân thu tiền mặt tại quầy')
      setReceivedPayment(payment.id); if (payment.application !== 'APPLIED') throw new Error('Đã nhận tiền, đơn đang chờ áp dụng/đối soát. Không thu lần nữa.'); setPaid(true)
    })}>Xác nhận đã thu tiền mặt</Btn></>}</Panel>}
    </>}
  </Page>
}
