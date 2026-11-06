import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarCheck, CreditCard, Dumbbell, LayoutGrid, LifeBuoy, ReceiptText, ScanLine, Shield, Ticket, UserPlus, Users,
} from 'lucide-react'
import { useAuth } from '@/features/auth/context/auth-context'
import { WorkspaceLayout, type WorkspaceNavSection } from '@/features/workspace/layout'
import { PersonSearch } from '@/features/workspace/person-search'
import { LinkBtn } from '@/features/workspace/ui'
import { deskApi, type DeskDashboard } from './api'

// Front-desk state shared by pages: dashboard counters (sidebar badges) and a refresh hook.
interface DeskShellState { counts: DeskDashboard | null; newTrials: number | null; proposedChanges: number | null; refresh: () => void }
const ShellContext = createContext<DeskShellState>({ counts: null, newTrials: null, proposedChanges: null, refresh: () => {} })
export const useDeskShell = () => useContext(ShellContext)

export function ReceptionShell() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [counts, setCounts] = useState<DeskDashboard | null>(null)
  const [newTrials, setNewTrials] = useState<number | null>(null)
  const [proposedChanges, setProposed] = useState<number | null>(null)
  const refresh = useCallback(() => {
    deskApi.dashboard().then(setCounts).catch(() => setCounts(null))
    deskApi.trials({ status: 'NEW' }).then(t => setNewTrials(t.length)).catch(() => setNewTrials(null))
    deskApi.scheduleChanges().then(c => setProposed(c.filter(x => x.status === 'PROPOSED').length)).catch(() => setProposed(null))
  }, [])
  useEffect(() => { refresh(); const t = setInterval(refresh, 60_000); return () => clearInterval(t) }, [refresh])
  const find = useCallback(async (term: string) => (await deskApi.members({ search: term, limit: 8 })).items
    .map(m => ({ id: m.id, name: m.user.fullName, sub: `${m.memberCode}${m.user.phone ? ` · ${m.user.phone}` : ''}`, avatarUrl: m.user.avatarUrl })), [])

  const nav: WorkspaceNavSection[] = [
    { title: 'Tổng quan', items: [
      ...(user?.role === 'MANAGER' ? [{ to: '/manager', label: 'Về trang Manager', icon: Shield, end: true }] : []),
      { to: '/receptionist', label: 'Hôm nay tại quầy', icon: LayoutGrid, end: true },
    ] },
    { title: 'Quản lý hội viên', items: [
      { to: '/receptionist/trial-requests', label: 'Đăng ký tập thử', icon: UserPlus, badge: { count: newTrials, tone: 'warning', label: n => `${n} khách mới chưa gọi` } },
      { to: '/receptionist/members', label: 'Danh sách hội viên', icon: Users },
      { to: '/receptionist/check-in', label: 'Vào / ra phòng tập', icon: ScanLine, badge: { count: counts?.insideGym ?? null, label: n => `${n} người đang trong phòng` } },
    ] },
    { title: 'Giao dịch & lịch hẹn', items: [
      { to: '/receptionist/membership-sale', label: 'Bán vé gym', icon: Ticket },
      { to: '/receptionist/pt-sale', label: 'Bán gói PT có lịch', icon: Dumbbell },
      { to: '/receptionist/calendar', label: 'Lịch PT & đổi lịch', icon: CalendarCheck, badge: { count: proposedChanges, tone: 'warning', label: n => `${n} đề xuất chờ hội viên đồng ý` } },
    ] },
    { title: 'Thanh toán', items: [
      { to: '/receptionist/payments', label: 'Thanh toán', icon: ReceiptText, badge: { count: counts?.pendingPayments ?? null, tone: 'warning', label: n => `${n} giao dịch chờ` } },
    ] },
    { title: 'Hỗ trợ', items: [
      { to: '/receptionist/support', label: 'Hỗ trợ hội viên', icon: LifeBuoy, badge: { count: counts?.openSupportRequests ?? null, tone: 'warning', label: n => `${n} yêu cầu đang mở` } },
    ] },
  ]

  return <ShellContext.Provider value={{ counts, newTrials, proposedChanges, refresh }}>
    <WorkspaceLayout nav={nav} panel="Quầy lễ tân" roleLabel={user?.role === 'MANAGER' ? 'Quản lý' : 'Lễ tân'}
      search={<PersonSearch label="Tìm hội viên" placeholder="Tìm hội viên theo tên / SĐT / email…" find={find} onPick={h => navigate(`/receptionist/members/${h.id}`)} />}
      actions={<>
        <span className="hidden sm:contents"><LinkBtn to="/receptionist/check-in" variant="soft" icon={<ScanLine aria-hidden className="h-4 w-4" />}>Ghi nhận vào tập</LinkBtn></span>
        <span className="hidden xl:contents"><LinkBtn to="/receptionist/membership-sale" variant="primary" icon={<CreditCard aria-hidden className="h-4 w-4" />}>Bán vé</LinkBtn></span>
      </>} />
  </ShellContext.Provider>
}
