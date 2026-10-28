import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/features/auth/context/auth-context'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import {
  availabilityReason,
  hybridGet,
  hybridSend,
  type SlotPreview,
} from '../hybrid-api'
import { fixedPtApi } from '../api'
import { useLoad, useSubmit } from '../hooks'
import {
  ErrorBanner,
  Field,
  inputCls,
  Loadable,
  money,
  Notice,
  Page,
  Panel,
  Status,
} from '../components/ui'
import { centerDate, formatDateTime, formatTime } from '@/shared/utils/date'
import type { TimeItem } from '../types'
import type { WeeklySlot } from '../types'
import { SlotsEditor } from '../components/widgets'

interface Purchase {
  id: string
  purchaseCode: string
  memberId: string
  coachId: string
  packageOptionId: string
  packageNameSnapshot: string
  priceSnapshot: string
  status: string
}
export function HybridSalePage() {
  const { role } = useAuth()
  const members = useLoad(() =>
    hybridGet<
      { id: string; memberCode: string; user?: { fullName: string } }[]
    >('/members', {
      limit: 100,
    }),
  )
  const coaches = useLoad(() =>
    hybridGet<{ id: string; fullName: string }[]>('/coaches', { limit: 100 }),
  )
  const [searchParams] = useSearchParams()
  const [memberId, setMember] = useState(() => searchParams.get('memberId') ?? '')
  const [coachId, setCoach] = useState('')
  const [optionId, setOption] = useState('')
  const [purchaseId, setPurchase] = useState('')
  const [mode, setMode] = useState<'later' | 'now' | 'existing'>('later')
  const [consent, setConsent] = useState('')
  const [day, setDay] = useState(centerDate())
  const [items, setItems] = useState<TimeItem[]>([])
  const [preview, setPreview] = useState<
    (SlotPreview & { canConfirmAll: boolean }) | null
  >(null)
  const [created, setCreated] = useState<{
    purchaseId: string
    hold?: { expiresAt: string }
    policy?: { holdMinutes: number }
  } | null>(null)
  const [method, setMethod] = useState<'CASH' | 'BANK_TRANSFER'>('CASH')
  const [received, setReceived] = useState('')
  const [reference, setReference] = useState('')
  const [notice, setNotice] = useState('')
  const [selectionMode, setSelectionMode] = useState<'day' | 'week'>('day')
  const [weekly, setWeekly] = useState<WeeklySlot[]>([
    { weekday: 1, startTime: '18:00', durationMinutes: 60 },
  ])
  const [count, setCount] = useState(1)
  const [clock, setClock] = useState(Date.now())
  useEffect(() => {
    if (!created?.hold) return
    const timer = window.setInterval(() => setClock(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [created])
  const act = useSubmit()
  const key = useRef({ body: '', key: crypto.randomUUID() })
  const options = useLoad(
    () =>
      hybridGet<{
        availablePackageOptions: {
          id: string
          name: string
          price: string
          sessionCount: number
        }[]
      }>(`/coaches/${coachId}`).then(
        (profile) => profile.availablePackageOptions,
      ),
    [coachId],
    !!coachId,
  )
  const purchases = useLoad(
    () =>
      hybridGet<Purchase[]>('/pt-package-purchases', { memberId, limit: 100 }),
    [memberId],
    !!memberId,
  )
  const selectedPurchase = purchases.data?.find((p) => p.id === purchaseId)
  const effectiveCoach =
    mode === 'existing' ? selectedPurchase?.coachId : coachId
  const effectiveOption =
    mode === 'existing' ? selectedPurchase?.packageOptionId : optionId
  const slots = useLoad(
    () =>
      hybridGet<SlotPreview>(
        mode === 'existing'
          ? `/pt-package-purchases/${purchaseId}/availability`
          : `/coaches/${effectiveCoach}/availability`,
        {
          from: day,
          to: day,
          packageOptionId: mode === 'existing' ? undefined : effectiveOption,
        },
      ),
    [effectiveCoach, effectiveOption, day, purchaseId, mode],
    !!effectiveCoach && !!effectiveOption && !!day,
  )
  const reset = () => {
    setItems([])
    setPreview(null)
    setCreated(null)
    setNotice('')
    setReceived('')
    setReference('')
    setMethod('CASH')
    act.clear()
    key.current = { body: '', key: crypto.randomUUID() }
  }
  const check = () =>
    void act.run(async () => {
      const times =
        selectionMode === 'week'
          ? {
              generate: {
                startDate: day,
                count,
                slots: weekly.map((s) => ({
                  ...s,
                  durationMinutes:
                    slots.data?.durationMinutes ?? s.durationMinutes,
                })),
              },
            }
          : { items }
      const selection =
        mode === 'existing'
          ? { purchaseId, ...times, consentEvidence: consent }
          : {
              coachId,
              packageOptionId: optionId,
              ...times,
              memberId,
              consentEvidence: consent,
            }
      setPreview(
        await hybridSend(
          'post',
          mode === 'existing' ? '/pt-bookings/preview' : '/pt-checkout/preview',
          selection,
        ),
      )
    })
  const confirm = () =>
    void act.run(async () => {
      const payload =
        mode === 'existing'
          ? {
              purchaseId,
              items: preview?.items.map(({ startsAt, endsAt }) => ({
                startsAt,
                endsAt,
              })),
              consentEvidence: consent,
            }
          : {
              coachId,
              packageOptionId: optionId,
              memberId,
              items:
                mode === 'now'
                  ? preview?.items.map(({ startsAt, endsAt }) => ({
                      startsAt,
                      endsAt,
                    }))
                  : undefined,
              consentEvidence: consent,
            }
      const body = JSON.stringify(payload)
      if (key.current.body !== body)
        key.current = { body, key: crypto.randomUUID() }
      if (mode === 'existing') {
        await hybridSend('post', '/pt-bookings/confirm', {
          ...payload,
          idempotencyKey: key.current.key,
        })
        setNotice('Đã xác nhận toàn bộ các buổi.')
        setPreview(null)
        setItems([])
        await purchases.reload()
      } else {
        const result = await hybridSend<NonNullable<typeof created>>(
          'post',
          '/pt-purchases',
          {
            ...payload,
            idempotencyKey: key.current.key,
          },
        )
        setCreated(result)
        setClock(Date.now())
        await purchases.reload()
      }
    })
  return (
    <Page
      title="Mua gói & đặt lịch PT"
      subtitle="Chọn học viên → chọn Coach và gói → ghi nhận đồng ý → mua hoặc đặt lịch → thanh toán tại quầy."
    >
      <Link
        className="text-sm text-primary underline"
        to="/receptionist/legacy-enrollments"
      >
        Theo dõi các đăng ký lịch cũ
      </Link>
      <fieldset disabled={act.busy || !!created} className="min-w-0 space-y-5">
        <Panel title="1. Học viên và gói PT">
          <Loadable state={members}>
            {(rows) => (
              <Field label="Member">
                <select
                  className={inputCls}
                  value={memberId}
                  onChange={(e) => {
                    setMember(e.target.value)
                    setPurchase('')
                    setConsent('')
                    reset()
                  }}
                >
                  <option value="">Chọn Member</option>
                  {rows.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.memberCode} · {m.user?.fullName}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </Loadable>
          <div className="my-3 flex flex-wrap gap-2">
            {(
              [
                ['later', 'Mua gói mới'],
                ['existing', 'Đặt lịch gói đã mua'],
              ] as const
            ).map(([v, t]) => (
              <Button
                key={v}
                aria-pressed={v === 'existing' ? mode === 'existing' : mode !== 'existing'}
                variant={(v === 'existing' ? mode === 'existing' : mode !== 'existing') ? 'primary' : 'secondary'}
                onClick={() => {
                  setMode(v)
                  reset()
                }}
              >
                {t}
              </Button>
            ))}
          </div>
          {mode === 'existing' ? (
            <Loadable state={purchases}>
              {(rows) => (
                <Field label="Gói ACTIVE">
                  <select
                    className={inputCls}
                    value={purchaseId}
                    onChange={(e) => {
                      setPurchase(e.target.value)
                      reset()
                    }}
                  >
                    <option value="">Chọn gói</option>
                    {rows
                      .filter((p) => p.status === 'ACTIVE')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.purchaseCode} · {p.packageNameSnapshot}
                        </option>
                      ))}
                  </select>
                </Field>
              )}
            </Loadable>
          ) : (
            <>
              <Loadable state={coaches}>
                {(rows) => (
                  <Field label="Coach">
                    <select
                      className={inputCls}
                      value={coachId}
                      onChange={(e) => {
                        setCoach(e.target.value)
                        setOption('')
                        reset()
                      }}
                    >
                      <option value="">Chọn Coach</option>
                      {rows.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.fullName}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
              </Loadable>
              {coachId && (
                <Loadable
                  state={options}
                  empty="Coach chưa có gói phù hợp đang mở bán. Kiểm tra quyền dạy và gói đã duyệt ở phía Coach/Manager."
                >
                  {(rows) => (
                    <Field label="Gói đã duyệt">
                      <select
                        className={inputCls}
                        value={optionId}
                        onChange={(e) => {
                          setOption(e.target.value)
                          reset()
                        }}
                      >
                        <option value="">Chọn gói</option>
                        {rows.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name} · {o.sessionCount} buổi · {money(o.price)}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}
                </Loadable>
              )}
            </>
          )}
          <Field label="Căn cứ Member đồng ý (bắt buộc)">
            <textarea
              className={inputCls}
              value={consent}
              maxLength={5000}
              placeholder="Ví dụ: Học viên xác nhận trực tiếp tại quầy về gói, Coach và lịch được chọn."
              onChange={(e) => {
                setConsent(e.target.value)
                setPreview(null)
              }}
            />
          </Field>
        </Panel>
        <Panel title={mode === 'existing' ? '2. Chọn lịch và xác nhận' : '2. Lịch tập (không bắt buộc)'}>
          {mode === 'later' && (
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <p className="flex-1 text-sm text-text-muted">
                Bỏ qua để tạo đơn mua trước; Member chọn lịch sau khi thanh toán. Hoặc xếp lịch ngay để giữ chỗ trong lúc thanh toán.
              </p>
              <Button variant="secondary" onClick={() => setMode('now')}>
                Xếp lịch ngay
              </Button>
            </div>
          )}
          {mode === 'now' && (
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <p className="flex-1 text-sm text-text-muted">
                Chọn vài buổi hoặc đủ gói; buổi còn lại đặt sau. Lịch được giữ trong thời gian thanh toán.
              </p>
              <Button
                variant="ghost"
                onClick={() => {
                  setMode('later')
                  setItems([])
                  setPreview(null)
                }}
              >
                Để sau, mua trước
              </Button>
            </div>
          )}
          {mode !== 'later' && (
            <div className="mb-3 flex flex-wrap gap-2">
              {(['day', 'week'] as const).map((v) => (
                <Button
                  key={v}
                  aria-pressed={selectionMode === v}
                  variant={selectionMode === v ? 'primary' : 'secondary'}
                  onClick={() => {
                    setSelectionMode(v)
                    setPreview(null)
                    setItems([])
                  }}
                >
                  {v === 'day' ? 'Chọn ngày cụ thể' : 'Xếp theo tuần'}
                </Button>
              ))}
            </div>
          )}
          {mode !== 'later' && (
          <Field label={selectionMode === 'week' && mode !== 'existing' ? 'Bắt đầu từ ngày' : 'Ngày xem lịch'}>
            <input
              type="date"
              min={centerDate()}
              className={inputCls}
              value={day}
              onChange={(e) => {
                setDay(e.target.value)
                setPreview(null)
              }}
            />
          </Field>
          )}
          {mode !== 'later' && selectionMode === 'week' && (
            <div className="my-3 space-y-3">
              <Notice>
                Lịch tuần được kiểm tra thành các ngày cụ thể. Chỉ xác nhận khi
                toàn bộ buổi đều khả dụng; không tự đặt thêm các tuần sau.
              </Notice>
              <SlotsEditor
                value={weekly}
                durationMinutes={slots.data?.durationMinutes}
                onChange={(value) => {
                  setWeekly(value)
                  setPreview(null)
                }}
              />
              <Field label="Số buổi muốn xếp">
                <input
                  className={inputCls}
                  type="number"
                  min={1}
                  max={100}
                  step={1}
                  value={count}
                  onChange={(e) => {
                    setCount(Number(e.target.value))
                    setPreview(null)
                  }}
                />
              </Field>
              <p className="text-sm text-text-muted">
                Thời lượng được lấy từ gói: {slots.data?.durationMinutes ?? '—'}{' '}
                phút/buổi.
              </p>
            </div>
          )}
          {effectiveCoach && effectiveOption && (
            <Loadable state={slots}>
              {(data) => (
                <>
                  <Notice>
                    {data.durationMinutes} phút/buổi · buffer{' '}
                    {data.bufferMinutes} phút · cửa sổ{' '}
                    {data.policy.bookingWindowDays} ngày · hạn đặt buổi đầu{' '}
                    {data.policy.activationDeadlineDays} ngày · hold{' '}
                    {data.policy.holdMinutes} phút. Đổi/hủy từ{' '}
                    {data.policy.cancelCutoffHours} giờ trả quyền, dưới cutoff
                    tính buổi. Hoàn tiền theo điều khoản gói cần Manager phê
                    duyệt.
                  </Notice>
                  {mode !== 'later' && selectionMode === 'day' && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {!data.items.length && (
                        <Notice tone="warning">
                          Không có giờ trống trong ngày. Chọn ngày khác hoặc
                          kiểm tra lịch làm việc, ngày nghỉ và trạng thái nhận
                          học viên của Coach.
                        </Notice>
                      )}
                      {data.items.map((s) => (
                        <Button
                          key={s.startsAt}
                          variant={
                            items.some((i) => i.startsAt === s.startsAt)
                              ? 'primary'
                              : 'secondary'
                          }
                          disabled={!s.available || !!created}
                          onClick={() => {
                            setItems(
                              items.some((i) => i.startsAt === s.startsAt)
                                ? items.filter((i) => i.startsAt !== s.startsAt)
                                : [
                                    ...items,
                                    { startsAt: s.startsAt, endsAt: s.endsAt },
                                  ],
                            )
                            setPreview(null)
                          }}
                        >
                          {formatTime(s.startsAt)}{' '}
                          {s.available ? '' : '· Không khả dụng'}
                          {!s.available && s.reason && (
                            <span className="text-xs">
                              {availabilityReason(s.reason)}
                            </span>
                          )}
                        </Button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </Loadable>
          )}
          {items.map((i) => (
            <div key={i.startsAt} className="flex items-center gap-3 py-2">
              <span>{formatDateTime(i.startsAt)}</span>
              <Button
                variant="ghost"
                disabled={!!created}
                onClick={() => {
                  setItems(items.filter((x) => x.startsAt !== i.startsAt))
                  setPreview(null)
                }}
              >
                Bỏ buổi
              </Button>
            </div>
          ))}
          {mode !== 'later' && (
            <Button
              variant="secondary"
              disabled={
                !memberId ||
                !effectiveCoach ||
                !effectiveOption ||
                !consent.trim() ||
                !!created ||
                (selectionMode === 'day'
                  ? !items.length
                  : !Number.isInteger(count) ||
                    count < 1 ||
                    count > 100 ||
                    !weekly.length)
              }
              isLoading={act.busy}
              onClick={check}
            >
              Xem trước đợt đặt
            </Button>
          )}
          {preview && (
            <div className="my-3 space-y-2">
              <Notice tone={preview.canConfirmAll ? 'success' : 'warning'}>
                {preview.canConfirmAll
                  ? `Đã kiểm tra ${preview.items.length} buổi. Xác nhận bên dưới để hoàn tất; xem trước chưa giữ chỗ.`
                  : 'Chưa thể xác nhận toàn bộ. Kiểm tra số buổi còn lại, sửa giờ hoặc bỏ buổi xung đột rồi xem trước lại.'}
              </Notice>
              <ul className="space-y-2 text-sm">
                {preview.items.map((i) => (
                  <li key={i.startsAt}>
                    {formatDateTime(i.startsAt)} ·{' '}
                    {i.available ? 'Khả dụng' : availabilityReason(i.reason)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!created && (
            <Button
              disabled={
                !memberId ||
                !consent.trim() ||
                !effectiveOption ||
                (mode !== 'later' && !preview?.canConfirmAll)
              }
              isLoading={act.busy}
              onClick={confirm}
            >
              {mode === 'existing'
                ? 'Xác nhận các buổi'
                : mode === 'now'
                  ? 'Giữ lịch và tạo đơn'
                  : 'Tạo đơn mua gói'}
            </Button>
          )}
        </Panel>
      </fieldset>
      {created && (
        <Notice>
          Đơn đã được tạo. Hoàn tất thanh toán bên dưới hoặc theo dõi đơn trong
          danh sách; các lựa chọn đang được khóa để giữ đúng thông tin đơn.
        </Notice>
      )}
      {created && role !== 'RECEPTIONIST' && (
        <Notice>
          Đã tạo đơn {created.purchaseId}. Lễ tân có quyền ghi nhận khoản thu
          tại quầy; Member có thể thanh toán qua Mobile.
        </Notice>
      )}
      {created && role === 'RECEPTIONIST' && (
        <Panel title="Thu tiền tại quầy">
          <fieldset disabled={act.busy} className="space-y-3">
            <Notice>
              Đơn {created.purchaseId}.{' '}
              {created.hold
                ? `Giữ chỗ đến ${formatDateTime(created.hold.expiresAt)}.`
                : 'Kiểm tra chi tiết đơn và lịch trước khi ghi nhận khoản thu.'}{' '}
              Xác minh khoản tiền thực nhận trước khi ghi nhận.
            </Notice>
            <p className="font-semibold">
              Giá gói:{' '}
              {money(
                purchases.data?.find((p) => p.id === created.purchaseId)
                  ?.priceSnapshot ??
                  options.data?.find((o) => o.id === optionId)?.price,
              )}
              .
            </p>
            {created.hold && (
              <Notice
                tone={
                  new Date(created.hold.expiresAt).getTime() <= clock
                    ? 'warning'
                    : 'info'
                }
              >
                {new Date(created.hold.expiresAt).getTime() <= clock
                  ? 'Giữ chỗ đã hết hạn. Thanh toán sau hạn có thể cấp gói nhưng cần đặt lại lịch; không đảm bảo các giờ cũ.'
                  : `Còn ${Math.ceil((new Date(created.hold.expiresAt).getTime() - clock) / 1000)} giây giữ lịch.`}
              </Notice>
            )}
            <Field label="Phương thức">
              <select
                className={inputCls}
                value={method}
                onChange={(e) => setMethod(e.target.value as typeof method)}
              >
                <option value="CASH">Tiền mặt</option>
                <option value="BANK_TRANSFER">Chuyển khoản</option>
              </select>
            </Field>
            <Field label="Số tiền đã nhận">
              <input
                type="number"
                min={1}
                value={received}
                className={inputCls}
                onChange={(e) => setReceived(e.target.value)}
              />
            </Field>
            <Field label="Mã tham chiếu">
              <input
                value={reference}
                className={inputCls}
                onChange={(e) => setReference(e.target.value)}
              />
            </Field>
            <Button
              isLoading={act.busy}
              disabled={
                !Number.isInteger(Number(received)) ||
                Number(received) <= 0 ||
                (method === 'BANK_TRANSFER' && !reference.trim())
              }
              onClick={() =>
                void act.run(async () => {
                  const p = await fixedPtApi.payCounter({
                    ptPurchaseId: created.purchaseId,
                    method,
                    receivedAmount: Number(received),
                    externalRef: reference || undefined,
                  })
                  const paidPurchaseId = created.purchaseId
                  reset()
                  setPurchase(paidPurchaseId)
                  setMode('existing')
                  setNotice(
                    p.application === 'APPLIED'
                      ? `Thanh toán được áp dụng. Tiền thối ${money(p.changeAmount)}. Chọn gói bên trên để đặt thêm các buổi chưa xếp.`
                      : 'Tiền đã ghi nhận, đang đối soát. Không thu lại; theo dõi tại Đối soát tiền nhận.',
                  )
                  await purchases.reload()
                })
              }
            >
              Ghi nhận thanh toán
            </Button>
          </fieldset>
        </Panel>
      )}
      {notice && <Notice>{notice}</Notice>}
      <ErrorBanner message={act.error} />
      {purchases.data && (
        <Panel title="Các gói của Member">
          {purchases.data.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center gap-3 border-b border-border-subtle py-3"
            >
              {p.purchaseCode} · {p.packageNameSnapshot}{' '}
              <Status value={p.status} />
              <Link
                className="text-primary underline"
                to={`/pt-purchases/${p.id}`}
              >
                Chi tiết gói
              </Link>
              {p.status === 'ACTIVE' && (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={act.busy || !!created}
                  onClick={() => {
                    reset()
                    setPurchase(p.id)
                    setMode('existing')
                  }}
                >
                  Đặt thêm buổi
                </Button>
              )}
              {p.status === 'PENDING_PAYMENT' && role === 'RECEPTIONIST' && (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={act.busy || !!created}
                  onClick={() => {
                    reset()
                    setCreated({ purchaseId: p.id })
                    setClock(Date.now())
                  }}
                >
                  Thu tiền đơn này
                </Button>
              )}
            </div>
          ))}
        </Panel>
      )}
    </Page>
  )
}
