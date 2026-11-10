import { hybridGet } from '@/features/fixed-pt/hybrid-api'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Apple, BarChart3, BookOpen, CalendarDays, ClipboardCheck, ConciergeBell, LayoutGrid, Package, ReceiptText, ShieldCheck, SlidersHorizontal, Users, Wallet,
} from 'lucide-react'
import { WorkspaceLayout, type WorkspaceNavSection } from '@/features/workspace/layout'
import { PersonSearch } from '@/features/workspace/person-search'
import { deskApi } from '@/features/reception-workspace/api'
import { mgrApi, type ManagerDashboard } from './api'
import { demoVisible } from '@/features/demo/demo-page'

interface MgrShellState { counts: ManagerDashboard | null; pendingApprovals: number | null; refresh: () => void }
const ShellContext = createContext<MgrShellState>({ counts: null, pendingApprovals: null, refresh: () => {} })
export const useMgrShell = () => useContext(ShellContext)

export function ManagerShell() {
  const navigate = useNavigate()
  const [counts, setCounts] = useState<ManagerDashboard | null>(null)
  const [pendingApprovals, setPending] = useState<number | null>(null)
  const refresh = useCallback(() => {
    mgrApi.dashboard().then(setCounts).catch(() => setCounts(null))
    hybridGet<{ cvUrl: string | null }[]>('/coach-applications', { status: 'PENDING_REVIEW' }).then(a => setPending(a.filter(x => x.cvUrl).length)).catch(() => setPending(null))
  }, [])
  useEffect(() => { refresh(); const t = setInterval(refresh, 120_000); return () => clearInterval(t) }, [refresh])
  const find = useCallback(async (term: string) => (await deskApi.members({ search: term, limit: 8 })).items
    .map(m => ({ id: m.id, name: m.user.fullName, sub: `${m.memberCode}${m.user.phone ? ` · ${m.user.phone}` : ''}`, avatarUrl: m.user.avatarUrl })), [])

  const nav: WorkspaceNavSection[] = [
    ...(demoVisible ? [{ title: 'Trình diễn', items: [{ to: '/manager/demo', label: 'Hướng dẫn demo', icon: ClipboardCheck }] }] : []),
    { title: 'Tổng quan', items: [{ to: '/manager', label: 'Hôm nay', icon: LayoutGrid, end: true }] },
    { title: 'Vận hành', items: [
      { to: '/manager/members', label: 'Hội viên & vé', icon: Users },
      { to: '/manager/pt-board', label: 'Lịch PT trung tâm', icon: CalendarDays, badge: { count: counts?.sessionsNeedingReview ?? null, tone: 'warning', label: n => `${n} buổi cần kiểm tra` } },
      { to: '/manager/categories', label: 'Chương trình đào tạo', icon: BookOpen },
      { to: '/manager/pt-packages', label: 'Gói PT', icon: Package },
      { to: '/manager/meal-library', label: 'Thư viện dinh dưỡng', icon: Apple },
      { to: '/manager/approvals', label: 'Duyệt huấn luyện viên', icon: ClipboardCheck, badge: { count: pendingApprovals, label: n => `${n} mục chờ duyệt` } },
    ] },
    { title: 'Tài chính', items: [
      { to: '/manager/coach-income', label: 'Chi trả Coach', icon: Wallet },
      { to: '/manager/payments', label: 'Thanh toán', icon: ReceiptText, badge: { count: counts?.openReconciliation ?? null, tone: 'warning', label: n => `${n} hồ sơ đối soát mở` } },
      { to: '/manager/reports', label: 'Báo cáo', icon: BarChart3 },
    ] },
    { title: 'Trung tâm', items: [
      { to: '/receptionist', label: 'Mở quầy lễ tân', icon: ConciergeBell },
    ] },
    { title: 'Hệ thống', items: [
      { to: '/manager/users', label: 'Tài khoản & phân quyền', icon: ShieldCheck },
      { to: '/manager/ops', label: 'Vận hành & Kiểm duyệt', icon: SlidersHorizontal },
    ] },
  ]

  return <ShellContext.Provider value={{ counts, pendingApprovals, refresh }}>
    <WorkspaceLayout nav={nav} panel="Quản lý trung tâm" roleLabel="Quản lý trung tâm"
      search={<PersonSearch label="Tìm hội viên" placeholder="Tìm hội viên theo tên / SĐT / email…" find={find} onPick={h => navigate(`/manager/members/${h.id}`)} />} />
  </ShellContext.Provider>
}
