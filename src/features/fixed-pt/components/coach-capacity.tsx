import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { hybridGet, hybridApi } from '../hybrid-api'
import { useLoad, useSubmit } from '../hooks'
import { ErrorBanner, Field, inputCls, Loadable, Notice, Panel } from './ui'

interface Capacity {
  activePurchases: number
  pendingPurchases: number
  unservedCredits: number
  settings: {
    acceptingNewMembers: boolean
    maxActivePurchases: number | null
    bufferMinutes: number | null
  } | null
  rules: unknown[]
}
export function CoachCapacity() {
  const coaches = useLoad(() =>
    hybridGet<{ id: string; fullName: string }[]>('/coaches', { limit: 100 }),
  )
  const [coachId, setCoachId] = useState('')
  const [limit, setLimit] = useState<string | null>(null)
  const [accept, setAccept] = useState<boolean | null>(null)
  const [buffer, setBuffer] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const save = useSubmit()
  const state = useLoad(
    () => hybridGet<Capacity>(`/coaches/${coachId}/capacity`),
    [coachId],
    !!coachId,
  )
  return (
    <Panel title="Capacity theo Coach">
      <Loadable state={coaches}>
        {(rows) => (
          <Field label="Coach">
            <select
              className={inputCls}
              value={coachId}
              disabled={save.busy}
              onChange={(e) => {
                setCoachId(e.target.value)
                setLimit(null)
                setBuffer(null)
                setAccept(null)
                setNotice('')
                save.clear()
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
        <Loadable state={state}>
          {(c) => (
            <div className="mt-3 space-y-3">
              <p>
                {c.activePurchases} gói ACTIVE · {c.pendingPurchases} đơn chờ
                thanh toán · {c.unservedCredits} credit chưa phục vụ ·{' '}
                {c.rules.length} khoảng giờ đã cấu hình.
              </p>
              <Notice>
                Capacity là chỉ báo. Hệ thống vẫn kiểm tra giờ khả dụng thực tế
                trước khi bán. Để trống giới hạn nghĩa là không đặt trần số gói
                cho Coach này.
              </Notice>
              <p className="text-sm">
                Giới hạn hiện tại:{' '}
                {c.settings?.maxActivePurchases ?? 'Chưa đặt trần'} ·{' '}
                  {(c.settings?.acceptingNewMembers ?? false)
                  ? 'Đang nhận mới'
                  : 'Tạm ngừng nhận mới'}{' '}
                · buffer riêng{' '}
                {c.settings?.bufferMinutes ?? 'theo cấu hình trung tâm'}.
              </p>
              <Field label="Giới hạn gói đang hoạt động/chờ thanh toán mới">
                <input
                  type="number"
                  min={1}
                  className={inputCls}
                  value={limit ?? c.settings?.maxActivePurchases ?? ''}
                  disabled={save.busy}
                  onChange={(e) => setLimit(e.target.value)}
                />
              </Field>
              <Field label="Buffer riêng (phút; để trống giữ giá trị hiện tại)">
                <input
                  type="number"
                  min={0}
                  max={240}
                  className={inputCls}
                  value={buffer ?? c.settings?.bufferMinutes ?? ''}
                  disabled={save.busy}
                  onChange={(e) => setBuffer(e.target.value)}
                />
              </Field>
              <label className="flex min-h-11 items-center gap-2">
                <input
                  type="checkbox"
                  checked={accept ?? c.settings?.acceptingNewMembers ?? false}
                  disabled={save.busy}
                  onChange={(e) => setAccept(e.target.checked)}
                />
                Cho nhận học viên mới sau lần lưu này
              </label>
              <Button
                isLoading={save.busy}
                disabled={
                  (limit !== null &&
                    limit !== '' &&
                    (!Number.isInteger(Number(limit)) || Number(limit) < 1)) ||
                  (buffer !== null &&
                    buffer !== '' &&
                    (!Number.isInteger(Number(buffer)) ||
                      Number(buffer) < 0 ||
                      Number(buffer) > 240))
                }
                onClick={() =>
                  void save.run(async () => {
                    await hybridApi.setSettings(coachId, {
                      maxActivePurchases:
                        limit === null
                          ? (c.settings?.maxActivePurchases ?? null)
                          : limit === ''
                            ? null
                            : Number(limit),
                      acceptingNewMembers:
                        accept ?? c.settings?.acceptingNewMembers ?? false,
                      ...(buffer !== null && buffer !== ''
                        ? { bufferMinutes: Number(buffer) }
                        : {}),
                    })
                    setNotice('Đã lưu cấu hình Coach.')
                    setLimit(null)
                    setBuffer(null)
                    setAccept(null)
                    await state.reload()
                  })
                }
              >
                Lưu cấu hình Coach
              </Button>
            </div>
          )}
        </Loadable>
      )}
      <ErrorBanner message={save.error} />
      {notice && <Notice tone="success">{notice}</Notice>}
    </Panel>
  )
}
