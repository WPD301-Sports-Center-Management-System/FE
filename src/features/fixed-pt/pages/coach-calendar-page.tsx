import { WeeklySchedulePicker } from '@/features/workspace/weekly-schedule-picker'
import { ContentEditor } from './coach-program-page'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog'
import { useAuth } from '@/features/auth/context/auth-context'
import { centerDate, centerInstant, formatDateTime, formatTime } from '@/shared/utils/date'
import { hybridApi, hybridGet, type CoachCalendar } from '../hybrid-api'
import type { WorkingInterval } from '../hybrid-api'
import { fixedPtApi } from '../api'
import { useLoad, useSubmit } from '../hooks'
import {
  Empty,
  ErrorBanner,
  Field,
  inputCls,
  label,
  Loadable,
  Notice,
  Page,
  Panel,
  Status,
} from '../components/ui'
import {
  addDays,
  DEFAULT_LEGEND,
  FilterBar,
  FilterSelect,
  mondayOf,
  optionsOf,
  STATUS_OPTIONS,
  toneOf,
  ViewToggle,
  WeekBoard,
  WeekToolbar,
  type DayNote,
  type WeekEvent,
} from '../components/week-schedule'
import { SessionTable } from './coach-sessions-page'
import type { ContentItem, Session, SessionWithContent } from '../types'

const dayOf = (iso: string) => centerDate(iso)
type Filterable = { memberName?: string; courseName?: string; status: string; isMakeup: boolean }

export function CoachCalendarPage({ settingsOnly = false }: { settingsOnly?: boolean } = {}) {
  const [params] = useSearchParams()
  const [first, setFirst] = useState(() => mondayOf(centerDate()))
  const [view, setView] = useState<'week' | 'table'>('week')
  const [filter, setFilter] = useState({ member: '', course: '', tone: '' })
  const [editing, setEditing] = useState(false)
  const [exception, setException] = useState(false)
  const [session, setSession] = useState<string | null>(() => params.get('sessionId'))
  const [notice, setNotice] = useState('')
  const [removing, setRemoving] = useState<{ id: string; kind: 'exception' | 'timeOff'; text: string } | null>(null)
  const last = addDays(first, 6)
  const state = useLoad(() => hybridApi.calendar(first, last), [first, last])
  // Richer rows (package, course, makeup flag, allowed actions) for cards, filters and the table view.
  const rich = useLoad(
    () =>
      fixedPtApi.coachSessions({
        from: centerInstant(first).toISOString(),
        to: new Date(centerInstant(addDays(first, 7)).getTime() - 1).toISOString(),
        limit: 100,
      }),
    [first],
  )
  const { user } = useAuth()
  const coachId = user?.coachProfilesUserId?.id ?? ''
  const settings = useLoad(() => hybridApi.settings(coachId), [coachId], !!coachId)
  const reloadSettings = settings.reload
  useEffect(() => {
    const refresh = () => { if (coachId) void reloadSettings() }
    window.addEventListener('coach-readiness-changed', refresh)
    return () => window.removeEventListener('coach-readiness-changed', refresh)
  }, [coachId, reloadSettings])
  const act = useSubmit()
  const reload = () => {
    void state.reload()
    window.dispatchEvent(new Event('coach-readiness-changed'))
    void rich.reload()
  }
  const byId = new Map((rich.data ?? []).map((s) => [s.id, s]))
  const matches = (s: Filterable) =>
    (!filter.member || s.memberName === filter.member) &&
    (!filter.course || s.courseName === filter.course) &&
    (!filter.tone || toneOf(s.status, s.isMakeup) === filter.tone)
  const set = (key: keyof typeof filter) => (value: string) => setFilter({ ...filter, [key]: value })
  const filtered = !!(filter.member || filter.course || filter.tone)
  return (
    <Page
      title={settingsOnly ? 'Thiết lập giờ làm việc' : 'Lịch làm việc'}
      subtitle="Mọi giờ hiển thị theo giờ Việt Nam. Booking hợp lệ được tự xác nhận."
      actions={
        <>
          <Button variant="secondary" onClick={() => setException(true)}>
            Thêm ngoại lệ
          </Button>
          {!settingsOnly && <Button onClick={() => setEditing(true)}>Thiết lập / sửa giờ</Button>}
          {!settingsOnly && <ViewToggle value={view} onChange={setView} />}
        </>
      }
    >
      <p className="text-sm text-text-muted">Lịch làm việc xác định giờ trống. Để nhận học viên, cần <Link className="text-primary underline" to="/coach/packages">quyền dạy và gói đang mở bán</Link>. Sau khi học viên mua và đặt, buổi xuất hiện tại đây.</p>
      {notice && <Notice>{notice}</Notice>}
      <ErrorBanner message={act.error} />
      {settings.data && !settings.data.acceptingNewMembers && <Panel title="Chưa mở nhận học viên mới">
        <Notice tone="warning">Lưu lịch làm việc chỉ khai báo ngày/giờ rảnh. Hiện Member chưa thể mua gói hoặc giữ lịch vì bạn chưa bật nhận học viên mới.</Notice>
        <div className="mt-3"><Button isLoading={act.busy} onClick={() => void act.run(async () => {
          await hybridApi.setSettings(coachId, { acceptingNewMembers: true })
          await settings.reload()
          window.dispatchEvent(new Event('coach-readiness-changed'))
          setNotice('Đã bật nhận học viên mới. Member cập nhật màn mua gói để tiếp tục.')
        })}>Bật nhận học viên mới</Button></div>
      </Panel>}
      {settings.data && (
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={settings.data.acceptingNewMembers}
            disabled={act.busy}
            onChange={(e) =>
              void act.run(async () => {
                await hybridApi.setSettings(coachId, { acceptingNewMembers: e.target.checked })
                await settings.reload()
                window.dispatchEvent(new Event('coach-readiness-changed'))
              })
            }
          />
          Đang nhận học viên mới{' '}
          <span className="text-text-muted">Tắt nhận mới vẫn phục vụ gói đã mua.</span>
        </label>
      )}
      <ErrorBanner message={settings.error} onRetry={settings.reload} />
      {!coachId && <Notice tone="warning">Chưa tải được hồ sơ Coach. Tải lại trang hoặc đăng nhập lại để quản lý trạng thái nhận học viên.</Notice>}
      {settingsOnly && <HoursDialog inline onClose={()=>{}} onSaved={count=>{setNotice(`${count} buổi cần rà soát. Giờ làm việc đã được lưu; các lịch đã xác nhận được giữ nguyên.`);reload()}}/>}
      <Panel>
        <div className="space-y-5">
          {!settingsOnly && <><FilterBar>
            <FilterSelect label="Học viên" value={filter.member} onChange={set('member')} options={optionsOf(state.data?.sessions ?? [], (s) => s.member.user.fullName)} />
            <FilterSelect label="Khóa học" value={filter.course} onChange={set('course')} options={optionsOf(rich.data ?? [], (s) => s.courseName)} />
            <FilterSelect label="Trạng thái" value={filter.tone} onChange={set('tone')} options={STATUS_OPTIONS} />
          </FilterBar>
          <WeekToolbar first={first} onChange={setFirst} legend={[...DEFAULT_LEGEND, 'hold']} />
          {view === 'week' ? (
            <Loadable state={{ ...state, data: state.data ? { data: state.data } : null }}>
              {({ data }) => {
                const events = weekEvents(data, byId, filtered, matches, setSession)
                return (
                  <>
                    {!data.rules.length && (
                      <Empty>
                        Chưa thiết lập lịch làm việc. Chọn “Thiết lập / sửa giờ” để công bố giờ trống cho
                        Member.
                      </Empty>
                    )}
                    <WeekBoard first={first} events={events} notes={dayNotes(data, first)} />
                    <p className="text-sm text-text-muted">
                      {events.filter((e) => e.tone !== 'hold').length} buổi trong tuần. Dòng xám là giờ làm việc; đỏ là nghỉ/đóng giờ; xanh là giờ mở thêm.
                    </p>
                  </>
                )
              }}
            </Loadable>
          ) : (
            <Loadable state={rich} empty="Không có buổi trong tuần này.">
              {(rows) =>
                rows.filter(matches).length ? (
                  <SessionTable sessions={rows.filter(matches)} onChanged={reload} />
                ) : (
                  <Empty>Không có buổi phù hợp bộ lọc.</Empty>
                )
              }
            </Loadable>
          )}
          </>}
          {settingsOnly && <>
            <h3 className="font-semibold">Ngoại lệ và ngày nghỉ theo tuần</h3>
            <WeekToolbar first={first} onChange={setFirst} legend={[]} />
            <p className="text-sm text-text-muted">Giờ mở thêm là ngoại lệ. Đóng giờ không được ảnh hưởng buổi đã bán; cần đổi giờ trong ngày hoặc nhờ Manager xử lý trước. Xem từng buổi tại tab Lịch dạy.</p>
          </>}
          {state.data && (state.data.exceptions.length > 0 || state.data.timeOffs.length > 0) && (
            <section className="space-y-2" aria-label="Ngoại lệ và ngày nghỉ">
              <h3 className="text-sm font-semibold text-text-primary">Ngoại lệ & ngày nghỉ trong tuần</h3>
              <ul className="divide-y divide-border-subtle rounded-xl border border-border-subtle">
                {[
                  ...state.data.exceptions.map((e) => ({ ...e, kind: 'exception' as const, text: e.type === 'OPEN' ? 'Mở thêm giờ' : `Nghỉ${e.reason ? `: ${e.reason}` : ''}` })),
                  ...state.data.timeOffs.map((t) => ({ ...t, kind: 'timeOff' as const, text: `Nghỉ phép${t.reason ? `: ${t.reason}` : ''}` })),
                ].map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
                    <span>
                      <span className="font-medium text-text-primary">{item.text}</span>
                      <span className="text-text-muted"> · {formatDateTime(item.startsAt)} – {formatDateTime(item.endsAt)}</span>
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setRemoving({ id: item.id, kind: item.kind, text: item.text })}>
                      Xóa
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </Panel>
      {editing && (
        <HoursDialog
          onClose={() => setEditing(false)}
          onSaved={(count) => {
            setEditing(false)
            setNotice(
              `${count} buổi sắp tới cần rà soát sau thay đổi. Các lịch đã xác nhận được giữ nguyên; đổi giờ trong ngày hoặc nhờ Manager xử lý.`,
            )
            void state.reload()
          }}
        />
      )}
      <ConfirmDialog
        isOpen={!!removing}
        title="Xóa ngoại lệ?"
        message={<>Xóa “{removing?.text}”. Giờ làm việc thường lệ sẽ áp dụng lại cho khoảng thời gian này.</>}
        confirmLabel="Xóa"
        tone="danger"
        isLoading={act.busy}
        onCancel={() => setRemoving(null)}
        onConfirm={() =>
          removing &&
          void act.run(async () => {
            if (removing.kind === 'exception') await hybridApi.deleteException(removing.id)
            else await fixedPtApi.deleteTimeOff(removing.id)
            setRemoving(null)
            setNotice('Đã xóa ngoại lệ.')
            void state.reload()
          })
        }
      />
      {exception && (
        <ExceptionDialog
          onClose={() => setException(false)}
          onSaved={(count) => {
            setException(false)
            setNotice(
              `${count} buổi giao khoảng ngoại lệ. Lịch được giữ nguyên; cần đổi giờ trong ngày hoặc nhờ Manager xử lý.`,
            )
            void state.reload()
          }}
        />
      )}
      {session && (
        <SessionDrawer
          id={session}
          onClose={() => setSession(null)}
          onChanged={reload}
        />
      )}
    </Page>
  )
}

// Sessions (enriched when the booking list has the row) plus live holds; holds are hidden while filtering.
function weekEvents(
  data: CoachCalendar,
  byId: Map<string, Session>,
  filtered: boolean,
  matches: (s: Filterable) => boolean,
  open: (id: string) => void,
): WeekEvent[] {
  const sessions = data.sessions
    .map((s) => {
      const r = byId.get(s.id)
      return { id: s.id, start: s.plannedStartsAt, end: s.plannedEndsAt, status: s.status, memberName: s.member.user.fullName, courseName: r?.courseName, isMakeup: r?.isMakeup ?? false, packageName: r?.purchase?.packageNameSnapshot, credit: r?.credit && r.purchase ? `Buổi ${r.credit.creditIndex}/${r.purchase.totalCredits}` : undefined }
    })
    .filter(matches)
    .map((s): WeekEvent => ({
      id: s.id,
      start: s.start,
      end: s.end,
      tone: toneOf(s.status, s.isMakeup),
      statusText: s.isMakeup && toneOf(s.status) === 'scheduled' ? 'Buổi dạy bù' : label(s.status),
      title: `${s.memberName}${s.courseName ? ` · ${s.courseName}` : ''}`,
      subtitle: [s.packageName, s.credit].filter(Boolean).join(' · ') || label(s.status),
      onOpen: () => open(s.id),
    }))
  if (filtered) return sessions
  return [
    ...sessions,
    ...data.holds.map((h): WeekEvent => ({ id: h.id, start: h.startsAt, end: h.endsAt, tone: 'hold', title: 'Đang giữ chỗ', subtitle: `Chờ thanh toán đến ${formatTime(h.hold.expiresAt)}` })),
  ]
}

// Working hours, extra hours and closures shown as small lines at the top of each day.
function dayNotes(data: CoachCalendar, first: string): DayNote[] {
  const notes: DayNote[] = []
  for (let i = 0; i < 7; i++) {
    const day = addDays(first, i)
    const weekday = i + 1
    data.rules
      .filter((r) => r.weekday === weekday && r.effectiveFrom.slice(0, 10) <= day && (!r.effectiveTo || r.effectiveTo.slice(0, 10) >= day))
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .forEach((r) => notes.push({ id: `${r.id}-${day}`, day, kind: 'hours', text: `Giờ làm ${r.startTime}–${r.endTime}` }))
    ;[...data.exceptions, ...data.timeOffs.map((t) => ({ ...t, type: 'CLOSED' as const }))]
      .filter((e) => dayOf(e.startsAt) <= day && dayOf(e.endsAt) >= day)
      .forEach((e) => {
        const start = dayOf(e.startsAt) < day ? '00:00' : formatTime(e.startsAt)
        const end = dayOf(e.endsAt) > day ? '24:00' : formatTime(e.endsAt)
        notes.push({ id: `${e.id}-${day}`, day, kind: e.type === 'OPEN' ? 'open' : 'closed', text: e.type === 'OPEN' ? `Mở thêm ${start}–${end}` : `Nghỉ ${start}–${end}${e.reason ? `: ${e.reason}` : ''}` })
      })
  }
  return notes
}


function HoursDialog({
  inline = false,
  onClose,
  onSaved,
}: {
  inline?: boolean
  onClose: () => void
  onSaved: (count: number) => void
}) {
  const rules = useLoad(hybridApi.rules)
  const [intervals, setIntervals] = useState<WorkingInterval[] | null>(null)
  const [impact, setImpact] = useState<{ signature: string; count: number } | null>(null)
  const [initialDate] = useState(() => centerDate())
  const [effective, setEffective] = useState(initialDate)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const save = useSubmit()
  const rows =
    intervals ??
    rules.data?.rules
      .filter((r) => !r.effectiveTo)
      .map(({ weekday, startTime, endTime }) => ({ weekday, startTime, endTime })) ??
    []
  const invalid = rows.some(
    (r, i) =>
      r.startTime >= r.endTime ||
      rows.some(
        (other, j) =>
          i !== j &&
          other.weekday === r.weekday &&
          r.startTime < other.endTime &&
          other.startTime < r.endTime,
      ),
  )
  const close = () => {
    if (intervals === null && effective === initialDate) onClose()
    else setConfirmDiscard(true)
  }
  return (
    <>
    <ConfirmDialog
      isOpen={confirmDiscard}
      title="Bỏ thay đổi?"
      message="Giờ làm việc bạn vừa chỉnh chưa được lưu. Đóng lúc này sẽ mất các thay đổi đó."
      confirmLabel="Bỏ thay đổi"
      cancelLabel="Tiếp tục chỉnh"
      tone="danger"
      onConfirm={onClose}
      onCancel={() => setConfirmDiscard(false)}
    />
    <HoursContainer inline={inline} isOpen={!confirmDiscard} onClose={close}>
      <div className={inline ? 'space-y-4' : 'max-h-[75vh] space-y-4 overflow-y-auto'}>
        <ErrorBanner message={rules.error} onRetry={rules.reload} />
        <div className="rounded-xl bg-text-primary p-4 text-bg-surface"><strong>Giờ bạn nhận tập</strong><p className="mt-1 text-sm opacity-70">Đặt khoảng giờ mở định kỳ. Các buổi đã xác nhận luôn được giữ lại.</p></div>
        <Panel title="Ngày bắt đầu áp dụng"><Field label="Áp dụng từ ngày">
          <input
            className={inputCls}
            type="date"
            value={effective}
            min={centerDate()}
            onChange={(e) => setEffective(e.target.value)}
          />
        </Field>
        </Panel>
        <WeeklySchedulePicker mode="hours" value={rows} onChange={setIntervals} />
        {invalid && (
          <ErrorBanner message="Có khoảng giờ sai hoặc trùng nhau trong cùng thứ. Sửa trước khi lưu." />
        )}
        <Notice>
          Xem trước: {rows.length} khoảng giờ mỗi tuần, áp dụng từ {effective}. Session đã xác nhận
          giữ nguyên; hệ thống báo các buổi cần rà soát sau khi lưu.
        </Notice>
        <Button
          variant="secondary"
          disabled={invalid || rules.loading}
          onClick={() =>
            void save.run(async () =>
              setImpact({
                signature: JSON.stringify({ effective, rows }),
                count: (await hybridApi.previewRules(effective, rows)).affectedCount,
              }),
            )
          }
        >
          Xem trước số buổi bị ảnh hưởng
        </Button>
        {impact?.signature === JSON.stringify({ effective, rows }) && (
          <Notice>
            {impact.count} buổi nằm ngoài giờ làm việc mới; giữ nguyên các buổi này và xử lý qua
            đổi giờ hoặc ngoại lệ Manager có audit.
          </Notice>
        )}
        <ErrorBanner message={save.error} />
        <div className="flex justify-end gap-2">
          {!inline && <Button variant="secondary" onClick={close}>Hủy</Button>}
          <Button
            disabled={
              invalid ||
              rules.loading ||
              !!rules.error ||
              !effective ||
              impact?.signature !== JSON.stringify({ effective, rows })
            }
            isLoading={save.busy}
            onClick={() =>
              void save.run(async () =>
                { const result = await hybridApi.saveRules(effective, rows); setImpact(null); setIntervals(null); void rules.reload(); onSaved(result.affectedCount) },
              )
            }
          >
            Lưu giờ làm việc
          </Button>
        </div>
      </div>
    </HoursContainer>
    </>
  )
}

function HoursContainer({inline,isOpen,onClose,children}:{inline:boolean;isOpen:boolean;onClose:()=>void;children:ReactNode}) {
  if(inline) return <section aria-label="Thiết lập giờ làm việc">{children}</section>
  return <Modal isOpen={isOpen} title="Thiết lập giờ làm việc" maxWidth="2xl" onClose={onClose}>{children}</Modal>
}
function ExceptionDialog({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved: (n: number) => void
}) {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [reason, setReason] = useState('')
  const [kind, setKind] = useState<'OPEN' | 'CLOSED'>('CLOSED')
  const act = useSubmit()
  return (
    <Modal isOpen title="Ngoại lệ giờ làm việc" onClose={() => !act.busy && onClose()}>
      <div className="space-y-3">
        <Notice>Đóng giờ chặn đặt mới trong khoảng này. Các buổi đã xác nhận vẫn giữ nguyên; nếu bị ảnh hưởng, Coach cần đổi giờ trong ngày hoặc nhờ Manager xử lý.</Notice>
        <Field label="Loại">
          <select
            className={inputCls}
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
          >
            <option value="CLOSED">Nghỉ / đóng giờ</option>
            <option value="OPEN">Mở thêm giờ</option>
          </select>
        </Field>
        <Field label="Bắt đầu">
          <input
            type="datetime-local"
            className={inputCls}
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </Field>
        <Field label="Kết thúc">
          <input
            type="datetime-local"
            className={inputCls}
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </Field>
        <Field label="Lý do">
          <textarea
            className={inputCls}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
        <ErrorBanner message={act.error} />
        <Button
          disabled={!start || end <= start || !reason.trim()}
          isLoading={act.busy}
          onClick={() =>
            void act.run(async () =>
              onSaved(
                (
                  await hybridApi.exception({
                    startsAt: new Date(`${start}:00+07:00`).toISOString(),
                    endsAt: new Date(`${end}:00+07:00`).toISOString(),
                    type: kind,
                    reason,
                  })
                ).affectedCount,
              ),
            )
          }
        >
          Lưu ngoại lệ
        </Button>
      </div>
    </Modal>
  )
}

function DrawerTemplate({ id, onChanged }: { id: string; onChanged: () => void }) {
  const templates = useLoad(() => fixedPtApi.sessionTemplates())
  const [selected, setSelected] = useState('')
  const act = useSubmit()
  return (
    <div className="space-y-2">
      <Loadable state={templates}>
        {(rows) => (
          <Field label="Chọn mẫu buổi">
            <select
              value={selected}
              className={inputCls}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">Chọn mẫu</option>
              {rows.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>
        )}
      </Loadable>
      <Button
        variant="secondary"
        disabled={!selected}
        isLoading={act.busy}
        onClick={() =>
          void act.run(async () => {
            await fixedPtApi.applyTemplate(id, selected)
            onChanged()
          })
        }
      >
        Áp dụng mẫu vào bản nháp
      </Button>
      <ErrorBanner message={act.error} />
    </div>
  )
}

function SessionDrawer({
  id,
  onClose,
  onChanged,
}: {
  id: string
  onClose: () => void
  onChanged: () => void
}) {
  const [editing, setEditing] = useState(false)
  const history = useLoad(
    () =>
      hybridGet<{
        events: {
          id: string
          action: string
          createdAt: string
          actor: { fullName: string } | null
        }[]
        versions: { id: string; version: number; kind: string; createdAt: string }[]
        changes: { id: string; code: string; status: string; createdAt: string }[]
      }>(`/pt-bookings/${id}/history`),
    [id],
  )
  const state = useLoad(() => fixedPtApi.session(id), [id])
  const content = useLoad(
    () =>
      hybridGet<{ content: SessionWithContent['content']; items: ContentItem[] }>(
        `/pt-bookings/${id}/content`,
      ),
    [id],
  )
  const [tab, setTab] = useState('overview')
  const act = useSubmit()
  if (editing && state.data && content.data)
    return (
      <ContentEditor
        session={{ ...state.data, content: { ...content.data.content, items: content.data.items } }}
        onClose={() => setEditing(false)}
        onSaved={() => {
          setEditing(false)
          void content.reload()
        }}
      />
    )
  return (
    <Modal isOpen placement="right" title="Chi tiết buổi PT" maxWidth="2xl" onClose={onClose}>
      <div className="max-h-[75vh] space-y-4 overflow-y-auto">
        <div className="flex flex-wrap gap-2">
          {[
            ['overview', 'Tổng quan'],
            ['plan', 'Giáo án'],
            ['history', 'Lịch sử'],
          ].map(([v, t]) => (
            <Button key={v} variant={tab === v ? 'primary' : 'secondary'} onClick={() => setTab(v)}>
              {t}
            </Button>
          ))}
        </div>
        <Loadable state={state}>
          {(s) => (
            <>
              {tab === 'overview' && (
                <SessionTable
                  sessions={[s]}
                  onChanged={() => {
                    void state.reload()
                    onChanged()
                  }}
                />
              )}
              {tab === 'plan' && (
                <>
                  <Loadable state={content}>
                    {(c) => (
                      <>
                        <p>{c.content?.title ?? 'Chưa có giáo án'}</p>
                        <Status value={c.content?.status ?? 'DRAFT'} />
                        <ul>
                          {c.items.map((x, i) => (
                            <li key={i} className="py-2">
                              {x.name} · {x.sets ?? '—'} hiệp × {x.reps ?? '—'} lần
                            </li>
                          ))}
                        </ul>
                        {c.content?.status === 'DRAFT' && (
                          <Button
                            isLoading={act.busy}
                            onClick={() =>
                              void act.run(async () => {
                                await fixedPtApi.assignContent(id)
                                await content.reload()
                              })
                            }
                          >
                            Giao cho Member
                          </Button>
                        )}
                      </>
                    )}
                  </Loadable>
                  <Button variant="secondary" onClick={() => setEditing(true)}>
                    Tạo / sửa giáo án buổi này
                  </Button>
                  <DrawerTemplate id={id} onChanged={() => void content.reload()} />
                  <Link
                    className="inline-block p-2 text-primary underline"
                    to={`/coach/library?tab=packages&purchaseId=${s.purchaseId}`}
                  >
                    Soạn / sửa giáo án và chọn mẫu A/B/C
                  </Link>
                </>
              )}
              {tab === 'overview' && s.status === 'COMPLETED' && (
                <Link className="inline-block text-primary underline" to={`/coach/goals/sheet/${id}`}>
                  Đánh giá cuối buổi
                </Link>
              )}
              {tab === 'history' && (
                <>
                  <Loadable state={history}>
                    {(h) => (
                      <ul>
                        {h.events.map((e) => (
                          <li key={e.id}>
                            {formatDateTime(e.createdAt)} · {e.action} ·{' '}
                            {e.actor?.fullName ?? 'Hệ thống'}
                          </li>
                        ))}
                        {h.versions.map((v) => (
                          <li key={v.id}>
                            {formatDateTime(v.createdAt)} · Giáo án v{v.version} · {v.kind}
                          </li>
                        ))}
                        {h.changes.map((c) => (
                          <li key={c.id}>
                            {formatDateTime(c.createdAt)} · {c.code} · {c.status}
                          </li>
                        ))}
                      </ul>
                    )}
                  </Loadable>
                  <p>Tạo: {s.bookedAt ? formatDateTime(s.bookedAt) : 'Chưa có dữ liệu'}</p>
                  {s.actualStartedAt && <p>Bắt đầu thực tế: {formatDateTime(s.actualStartedAt)}</p>}
                  {s.actualEndedAt && <p>Kết thúc thực tế: {formatDateTime(s.actualEndedAt)}</p>}
                  <Status value={s.status} />
                </>
              )}
            </>
          )}
        </Loadable>
        <ErrorBanner message={act.error} />
      </div>
    </Modal>
  )
}
