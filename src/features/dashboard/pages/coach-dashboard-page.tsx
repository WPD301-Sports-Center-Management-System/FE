import { Calendar, ClipboardList, DollarSign, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/auth-context'
import { fixedPtApi } from '@/features/fixed-pt/api'
import { useLoad } from '@/features/fixed-pt/hooks'
import { Loadable, money, Notice, Page, Panel, Status } from '@/features/fixed-pt/components/ui'
import { StatCard } from '@/shared/components/ui/stat-card'
import { Button } from '@/shared/components/ui/button'
import { centerDate, formatTime } from '@/shared/utils/date'

export function CoachDashboardPage() {
  const { user } = useAuth()
  const today = centerDate()
  const sessions = useLoad(() => fixedPtApi.coachSessions({ from: `${today}T00:00:00+07:00`, to: `${today}T23:59:59.999+07:00`, limit: 100 }), [today])
  const requests = useLoad(() => fixedPtApi.coachEnrollments({ status: 'REQUESTED', limit: 100 }), [])
  const changes = useLoad(() => fixedPtApi.scheduleChanges({ status: 'REQUESTED', limit: 100 }), [])
  const earnings = useLoad(() => fixedPtApi.myEarningSummary(), [])
  const refresh = () => { void sessions.reload(); void requests.reload(); void changes.reload(); void earnings.reload() }
  const s = earnings.data
  const payable = s ? (s.byStatus.ELIGIBLE?.amount ?? 0) + (s.byStatus.INCLUDED?.amount ?? 0) : null
  return <Page title={`Hôm nay của ${user?.fullName ?? 'Coach'}`} subtitle="Buổi tập hôm nay, yêu cầu đổi/bù và chương trình cá nhân." actions={<Button variant="secondary" onClick={refresh}><RefreshCw className="h-4 w-4" aria-hidden />Làm mới</Button>}>
    <Notice>Coach mới: <Link className="font-semibold underline" to="/coach/packages">đăng ký quyền dạy và chọn/đề xuất gói PT</Link> → <Link className="font-semibold underline" to="/coach/slots">thiết lập lịch làm việc</Link> → học viên mua và đặt buổi. Booking hợp lệ tự xác nhận, Coach không cần duyệt từng buổi.</Notice>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Buổi trong ngày" value={sessions.data?.length ?? '—'} icon={<Calendar aria-hidden className="h-5 w-5" />} />
      <StatCard title="Đăng ký lịch cũ chờ xử lý" value={requests.data?.length ?? '—'} icon={<ClipboardList aria-hidden className="h-5 w-5" />} />
      <StatCard title="Yêu cầu đổi / xếp bù" value={changes.data?.length ?? '—'} icon={<Calendar aria-hidden className="h-5 w-5" />} />
      <StatCard title="Đủ điều kiện, chưa chi" value={payable === null ? '—' : money(payable)} icon={<DollarSign aria-hidden className="h-5 w-5" />} description="Theo buổi; không phải toàn bộ 60% gói" />
    </div>
    <div className="flex flex-wrap gap-3 text-sm font-semibold text-primary">
      <Link to="/coach/packages">Quyền dạy & Gói PT</Link><Link to="/coach/slots">Lịch làm việc</Link><Link to="/coach/bookings">Điều hành lịch PT</Link><Link to="/coach/training-plans">Soạn chương trình</Link><Link to="/coach/earnings">Thu nhập và đối soát</Link>
    </div>
    <Panel title="Lịch hôm nay">
      <Loadable state={sessions} empty="Hôm nay chưa có buổi PT.">{items => <ul className="divide-y divide-border-subtle">{items.map(b => <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-semibold text-text-primary">{b.memberName}</p><p className="text-sm text-text-muted">{b.courseName} · {formatTime(b.startsAt)}–{formatTime(b.endsAt)}</p></div><Status value={b.status} /><Link to="/coach/bookings" className="text-sm font-semibold text-primary">Mở lịch PT</Link></li>)}</ul>}</Loadable>
    </Panel>
    <Panel title="Đăng ký lịch cũ cần phản hồi"><Loadable state={requests} empty="Không có đăng ký lịch cũ cần phản hồi.">{items => <ul className="space-y-3">{items.map(e => <li key={e.id} className="flex flex-wrap justify-between gap-2 text-sm"><span>{e.member.user.fullName} · {e.packageOption.name}</span><Link to="/coach/legacy-intake" className="font-semibold text-primary">Xem đăng ký cũ</Link></li>)}</ul>}</Loadable></Panel>
    <Panel title="Đổi giờ và học bù"><Loadable state={changes} empty="Không có yêu cầu đổi hoặc xếp lịch đang chờ.">{items => <ul className="space-y-3">{items.map(c => <li key={c.id} className="flex flex-wrap justify-between gap-2 text-sm"><span>{c.purchase.packageNameSnapshot} · {c.code}</span><Link to="/coach/bookings" className="font-semibold text-primary">Đề xuất giờ</Link></li>)}</ul>}</Loadable></Panel>
    <Panel title="Thu nhập"><Loadable state={earnings}>{() => <p className="text-sm text-text-muted">Xem từng buổi, khoản tạm giữ và kỳ đã chi tại <Link to="/coach/earnings" className="font-semibold text-primary">Thu nhập và đối soát</Link>.</p>}</Loadable></Panel>
  </Page>
}
