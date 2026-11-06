import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { PersonSearch } from '@/features/workspace/person-search'
import { deskApi } from '@/features/reception-workspace/api'
import { useSearchParams } from 'react-router-dom'
import { useLoad, useSubmit } from '../hooks'
import { hybridGet } from '../hybrid-api'
import { seriesApi, type PatternSlot, type SeriesPreview, type SeriesOrder } from '../series-api'
import { PatternPicker, SeriesPreviewList } from '../components/pattern-picker'
import { Page, Panel, Field, inputCls, Loadable, ErrorBanner, Notice, money } from '../components/ui'
import { Btn } from '@/features/workspace/ui'
import { counterPayment } from '@/features/workspace/counter-payment'
import { centerDate } from '@/shared/utils/date'
import { useAuth } from '@/features/auth/context/auth-context'
export function HybridSalePage() {
  const [params] = useSearchParams()
  // Counter cash is Receptionist-only on the BE (POST /payments/counter).
  const desk = useAuth().role !== 'MANAGER'
  const [memberId, setMember] = useState(params.get('memberId') ?? '')
  const [coachId, setCoach] = useState('')
  const [optionId, setOption] = useState('')
  const [startDate, setDate] = useState(centerDate(new Date(Date.now() + 86400000).toISOString()))
  const [pattern, setPattern] = useState<PatternSlot[]>([])
  const [consent, setConsent] = useState('')
  const [preview, setPreview] = useState<SeriesPreview | null>(null)
  const [order, setOrder] = useState<SeriesOrder | null>(null)
  const [paid, setPaid] = useState(false)
  const [receivedPayment, setReceivedPayment] = useState<string | null>(null)
  const [cash, setCash] = useState('')
  const [now, setNow] = useState(Date.now())
  const key = useRef({ body: '', key: crypto.randomUUID() })
  const act = useSubmit()
  const member = useLoad(() => deskApi.member(memberId), [memberId], !!memberId)
  const findMember = useCallback(async (term: string) => (await deskApi.members({ search: term, limit: 8 })).items.map(m => ({ id: m.id, name: m.user.fullName, sub: m.memberCode })), [])
  const coaches = useLoad(() => hybridGet<{ id: string; fullName: string }[]>('/coaches', { limit: 100 }))
  const options = useLoad(() => hybridGet<{ id: string; name: string; price: string; sessionsPerWeek?: number | null; sessionCount: number }[]>('/pt-package-options', { coachId, limit: 100 }), [coachId], !!coachId)
  const [cadence, setCadence] = useState('')
  const cadenceOf = (o: { sessionsPerWeek?: number | null; sessionCount: number }) => o.sessionsPerWeek ?? Math.min(3, o.sessionCount)
  const matchingOptions = (options.data ?? []).filter(o => !cadence || cadenceOf(o) === Number(cadence))
  const pending = useLoad(() => hybridGet<{ id: string; purchaseCode: string; memberId: string; coachId: string; packageOptionId: string; status: string }[]>('/pt-package-purchases', { memberId, status: 'PENDING_PAYMENT', limit: 100 }), [memberId], !!memberId)
  const slots = useLoad(() => seriesApi.patterns(coachId, optionId, startDate, memberId, order?.purchaseId), [coachId, optionId, startDate, memberId, order?.purchaseId], !!coachId && !!optionId && !!memberId && !!startDate)
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id) }, [])
  useEffect(() => { setPreview(null); setPattern([]) }, [coachId, optionId, startDate, memberId])
  const body = { coachId, packageOptionId: optionId, memberId, startDate, pattern, consentEvidence: consent, purchaseId: order?.purchaseId }
  const changePattern = (p: PatternSlot[]) => { setPattern(p); setPreview(null) }
  const remaining = order ? Math.max(0, Math.ceil((Date.parse(order.hold.expiresAt) - now) / 1000)) : null
  useEffect(() => { if (order && remaining === 0) void slots.reload() }, [order?.purchaseId, remaining === 0])
  return <Page title="Bán gói PT có lịch" subtitle="Chọn lịch tập cho cả gói, sau đó xem trước từng buổi trước khi thu tiền.">
    <div className="rounded-xl bg-text-primary px-5 py-4 text-bg-surface"><p className="font-semibold">Xếp lịch cho toàn bộ gói</p><p className="mt-1 text-sm opacity-70">Một lịch tập rõ ràng, kiểm tra đủ các buổi trước khi tạo đơn.</p></div>
    <ErrorBanner message={act.error} />
    {receivedPayment && !paid && <Notice>Đã nhận tiền. Đơn đang chờ áp dụng hoặc đối soát, vui lòng không thu thêm. <Link className="font-semibold underline" to="/receptionist/payments">Mở thanh toán để theo dõi</Link></Notice>}
    {paid ? <Panel title="Đã hoàn tất bán gói"><Notice tone="success">Đã nhận tiền và tạo toàn bộ buổi tập. Hóa đơn đã mở.</Notice><div className="mt-4 flex flex-wrap gap-3"><Link className="font-semibold text-primary underline" to={`/receptionist/members/${memberId}`}>Xem gói và lịch của hội viên</Link><Link className="font-semibold text-primary underline" to="/receptionist/calendar">Mở lịch PT</Link></div></Panel> : <>
    <Panel title="Thông tin gói tập"><fieldset disabled={!!order && remaining !== 0} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2"><p className="text-sm font-medium">Hội viên mua gói</p><PersonSearch label="Tìm hội viên mua PT" placeholder="Nhập tên, số điện thoại hoặc email…" find={findMember} onPick={m => setMember(m.id)} />{memberId && <Loadable state={member}>{m => <p className="rounded-lg bg-bg-surface-muted p-3 text-sm font-semibold">Đã chọn: {m.user.fullName} · {m.memberCode}</p>}</Loadable>}</div>
      <Field label="Huấn luyện viên"><Loadable state={coaches}>{rows => <select aria-label="Huấn luyện viên" className={inputCls} value={coachId} onChange={e => { setCoach(e.target.value); setOption(''); setCadence('') }}><option value="">Chọn huấn luyện viên</option>{rows.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}</select>}</Loadable></Field>
      <Field label="Số buổi mỗi tuần"><select aria-label="Số buổi mỗi tuần" className={inputCls} disabled={!coachId || !options.data} value={cadence} onChange={e => { setCadence(e.target.value); setOption('') }}><option value="">Tất cả nhịp tập</option>{[...new Set((options.data ?? []).map(cadenceOf))].sort((a, b) => a - b).map(n => <option key={n} value={n}>{n} buổi / tuần</option>)}</select><p className="mt-1 text-xs text-text-muted">Theo các gói HLV đang mở bán. Bạn tự chọn ngày và giờ ở bước tiếp theo.</p></Field>
      <Field label="Gói PT">{coachId ? <Loadable state={options}>{() => <select aria-label="Gói PT" className={inputCls} value={optionId} onChange={e => setOption(e.target.value)}><option value="">{matchingOptions.length ? 'Chọn gói PT' : 'Chưa có gói phù hợp nhịp tập này'}</option>{matchingOptions.map(o => <option key={o.id} value={o.id}>{o.name} · {cadenceOf(o)} buổi/tuần · {money(o.price)}</option>)}</select>}</Loadable> : <p className="text-sm text-text-muted">Chọn HLV trước để xem gói PT.</p>}</Field>
      <Field label="Ngày bắt đầu"><input className={inputCls} type="date" min={centerDate()} value={startDate} onChange={e => setDate(e.target.value)} /></Field>
      <Field label="Căn cứ Member đồng ý"><input className={inputCls} value={consent} onChange={e => setConsent(e.target.value)} placeholder="Member xác nhận trực tiếp tại quầy…" /></Field>
    </fieldset></Panel>
    {!order && pending.data?.some(p => p.status === 'PENDING_PAYMENT') && <Panel title="Tiếp tục đơn chưa thanh toán">{pending.data.filter(p => p.status === 'PENDING_PAYMENT').map(p => <Btn key={p.id} onClick={() => { setCoach(p.coachId); setOption(p.packageOptionId); setOrder({ purchaseId: p.id, hold: { expiresAt: new Date(0).toISOString() }, expectedCompletionAt: '' }); setPreview(null) }}>Chọn lại lịch cho {p.purchaseCode}</Btn>)}</Panel>}
    {optionId && <Panel title="Lịch tập hằng tuần"><fieldset disabled={!!order && remaining !== 0} className="min-w-0 space-y-3">{memberId ? <Loadable state={slots}>{data => <PatternPicker data={data} summary={[{label:'Coach',value:coaches.data?.find(c=>c.id===coachId)?.fullName??'—'},{label:'Gói PT',value:options.data?.find(o=>o.id===optionId)?.name??'—'},{label:'Bắt đầu từ',value:startDate.split('-').reverse().join('/')},{label:'Tổng gói',value:`${options.data?.find(o=>o.id===optionId)?.sessionCount??'—'} buổi`}]} value={pattern} onChange={changePattern} />}</Loadable> : <p className="text-sm text-text-muted">Chọn hội viên ở bước 1 để kiểm tra giờ trống phù hợp.</p>}
      <Btn variant="primary" className="w-full" busy={act.busy} disabled={!consent.trim() || pattern.length !== slots.data?.sessionsPerWeek || pattern.some(p => !p.startTime || !slots.data?.slots.some(s => s.available && s.weekday === p.weekday && s.startTime === p.startTime)) || !!order && remaining !== 0} onClick={() => void act.run(async () => setPreview(await seriesApi.preview(body)))}>Xem trước toàn bộ lịch</Btn>
      {!consent.trim()&&<p className="text-sm text-text-muted">Ghi nhận sự đồng ý của hội viên ở bước 1 trước khi xem lịch.</p>}
    </fieldset></Panel>}
    {preview && <Panel title="3. Xem trước toàn bộ lịch"><SeriesPreviewList data={preview} /><p className="my-3 font-semibold">Giá gói: {money(preview.price)}</p>
      <Btn busy={act.busy} disabled={!preview.canConfirmAll || !!order && remaining !== 0} onClick={() => void act.run(async () => {
        const serialized = JSON.stringify(body); if (serialized !== key.current.body) key.current = { body: serialized, key: crypto.randomUUID() }
        const next = order ? await seriesApi.rehold(order.purchaseId, { pattern, startDate, idempotencyKey: crypto.randomUUID(), consentEvidence: consent }) : await seriesApi.checkout({ ...body, idempotencyKey: key.current.key })
        setOrder(next); setCash(String(preview.price))
      })}>{order ? 'Chọn lại lịch trên đơn này' : 'Giữ chuỗi và tạo đơn'}</Btn>
    </Panel>}
    {order && <Panel title="4. Thu tiền mặt"><p>Giữ chỗ còn {remaining} giây.</p>{!desk ? <Notice>Chỉ tài khoản Lễ tân được thu tiền tại quầy. Manager xem được quầy nhưng không thu tiền; hãy đăng nhập bằng tài khoản Lễ tân.</Notice> : remaining === 0 ? <Notice>Giữ chỗ đã hết. Chọn lại khung tuần, xem trước và giữ lịch lại trước khi thu tiền.</Notice> : <><Field label="Tiền nhận"><input className={inputCls} type="number" value={cash} onChange={e => setCash(e.target.value)} /></Field><Btn busy={act.busy} disabled={!!receivedPayment || !preview || Number(cash) < Number(preview.price)} onClick={() => void act.run(async () => {
      if (receivedPayment) return
      const payment = await counterPayment<{ id: string; application: string }>({ ptPurchaseId: order.purchaseId, method: 'CASH', receivedAmount: Number(cash) }); setReceivedPayment(payment.id); if (payment.application !== 'APPLIED') throw new Error('Đã nhận tiền, đơn đang chờ áp dụng/đối soát. Không thu lần nữa.'); setPaid(true)
    })}>Xác nhận đã thu tiền mặt</Btn></>}</Panel>}
    </>}
  </Page>
}
