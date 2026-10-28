import { useState, type ReactNode } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { centerDate, centerInstant, formatTime, formatWeekdayDateTime } from '@/shared/utils/date'
import { fixedPtApi } from '../api'
import { useLoad } from '../hooks'
import type { Session } from '../types'
import { Empty, Loadable, Notice, Panel, Status, Table, td } from '../components/ui'
import { addDays, FilterBar, FilterSelect, mondayOf, optionsOf, STATUS_OPTIONS, toneOf, WeekBoard, WeekToolbar } from '../components/week-schedule'

// Week view of every PT session in the center for Receptionist and Manager. `actions` renders the
// role's buttons for one session (table row and detail dialog); `reload` refreshes the week.
export function StaffWeekCalendar({ view, actions, reloadKey = 0 }: { view: 'week' | 'table'; actions?: (s: Session, reload: () => void) => ReactNode; reloadKey?: number }) {
  const [first, setFirst] = useState(() => mondayOf(centerDate()))
  const [filter, setFilter] = useState({ member: '', coach: '', course: '', tone: '' })
  const [open, setOpen] = useState<Session | null>(null)
  const from = centerInstant(first).toISOString()
  const to = new Date(centerInstant(addDays(first, 7)).getTime() - 1).toISOString()
  const state = useLoad(() => fixedPtApi.sessions({ from, to, limit: 100 }), [first, reloadKey])
  const all = state.data ?? []
  const rows = all.filter(s => (!filter.member || s.memberName === filter.member) && (!filter.coach || s.coachName === filter.coach)
    && (!filter.course || s.courseName === filter.course) && (!filter.tone || toneOf(s.status, s.isMakeup) === filter.tone))
  const reload = () => { setOpen(null); void state.reload() }
  const set = (key: keyof typeof filter) => (value: string) => setFilter({ ...filter, [key]: value })
  return (
    <Panel>
      <div className="space-y-5">
        <FilterBar>
          <FilterSelect label="Học viên" value={filter.member} onChange={set('member')} options={optionsOf(all, s => s.memberName)} />
          <FilterSelect label="Huấn luyện viên" value={filter.coach} onChange={set('coach')} options={optionsOf(all, s => s.coachName)} />
          <FilterSelect label="Khóa học" value={filter.course} onChange={set('course')} options={optionsOf(all, s => s.courseName)} />
          <FilterSelect label="Trạng thái" value={filter.tone} onChange={set('tone')} options={STATUS_OPTIONS} />
        </FilterBar>
        <WeekToolbar first={first} onChange={setFirst} />
        <Loadable state={{ ...state, data: state.data ? { items: rows } : null }}>
          {({ items }) => view === 'week'
            ? <WeekBoard first={first} events={items.map(s => ({
                id: s.id, start: s.startsAt, end: s.endsAt, tone: toneOf(s.status, s.isMakeup), statusText: label(s),
                title: `${s.memberName ?? 'Member'}${s.courseName ? ` · ${s.courseName}` : ''}`,
                subtitle: [s.coachName, s.purchase?.packageNameSnapshot].filter(Boolean).join(' · '),
                onOpen: () => setOpen(s),
              }))} />
            : !items.length ? <Empty>Không có buổi phù hợp trong tuần.</Empty> : <Table head={['Thời gian', 'Học viên', 'Huấn luyện viên', 'Khóa học / Gói', 'Trạng thái', 'Thao tác']}>
                {items.map(s => <tr key={s.id}>
                  <td className={td}>{formatWeekdayDateTime(s.startsAt)}–{formatTime(s.endsAt)}</td>
                  <td className={td}>{s.memberName}</td>
                  <td className={td}>{s.coachName}</td>
                  <td className={td}>{s.courseName}<div className="text-xs text-text-muted">{s.purchase?.packageNameSnapshot}</div></td>
                  <td className={td}><Status value={s.status} />{s.isMakeup && <div className="text-xs text-amber-700 dark:text-amber-300">Buổi dạy bù</div>}</td>
                  <td className={td}><div className="flex flex-wrap gap-1.5">{actions?.(s, reload)}</div></td>
                </tr>)}
              </Table>}
        </Loadable>
        {state.data && <p className="text-sm text-text-muted">{rows.length} buổi trong tuần{rows.length !== all.length ? ` (lọc từ ${all.length})` : ''}.</p>}
        {all.length >= 100 && <Notice tone="warning">Tuần này có từ 100 buổi trở lên; chỉ hiển thị 100 buổi đầu. Dùng bộ lọc hoặc chế độ Bảng theo từng ngày.</Notice>}
      </div>
      {open && <SessionDialog session={open} onClose={() => setOpen(null)}>{actions?.(open, reload)}</SessionDialog>}
    </Panel>
  )
}

const label = (s: Session) => (s.isMakeup && toneOf(s.status) === 'scheduled' ? 'Buổi dạy bù' : undefined)

function SessionDialog({ session: s, onClose, children }: { session: Session; onClose: () => void; children?: ReactNode }) {
  const rows: [string, ReactNode][] = [
    ['Thời gian', `${formatWeekdayDateTime(s.startsAt)}–${formatTime(s.endsAt)}`],
    ['Học viên', s.memberName ?? '—'],
    ['Huấn luyện viên', s.coachName ?? '—'],
    ['Khóa học', s.courseName ?? '—'],
    ['Gói PT', s.purchase ? `${s.purchase.packageNameSnapshot} · ${s.purchase.purchaseCode}` : '—'],
    ['Buổi', s.credit ? `${s.credit.creditIndex}/${s.purchase?.totalCredits ?? '?'}${s.isMakeup ? ' · Buổi dạy bù' : ''}` : s.isMakeup ? 'Buổi dạy bù' : '—'],
    ['Trạng thái', <Status value={s.status} />],
    ['Mã buổi', s.bookingCode],
  ]
  return (
    <Modal isOpen title="Chi tiết buổi PT" maxWidth="lg" onClose={onClose}>
      <div className="space-y-4">
        <dl className="grid grid-cols-[8rem_1fr] gap-x-3 gap-y-2 text-sm">
          {rows.map(([k, v]) => <div key={k} className="contents"><dt className="text-text-muted">{k}</dt><dd className="text-text-primary">{v}</dd></div>)}
        </dl>
        {s.needsReview && <Notice tone="warning">Buổi đang cần xử lý{s.reviewReason ? `: ${s.reviewReason}` : ''}.</Notice>}
        <div className="flex flex-wrap justify-end gap-2">{children}<Button variant="secondary" onClick={onClose}>Đóng</Button></div>
      </div>
    </Modal>
  )
}
