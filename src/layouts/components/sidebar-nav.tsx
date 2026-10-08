import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Dumbbell,
  CheckCircle2,
  Wrench,
  BarChart3,
  ShieldAlert,
  Calendar,
  DollarSign,
  HelpCircle,
  FileText,
  Activity,
  Sparkles,
} from 'lucide-react'
import type { UserRole } from '@/shared/types/api'

export function SidebarNav({ role }: { role: UserRole | null }) {
  const getNavLinks = () => {
    switch (role) {
      case 'MANAGER':
        return [
          { to: '/manager', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/manager/users', label: 'Tài khoản & User', icon: Users },
          { to: '/manager/membership-plans', label: 'Gói Vé Gym', icon: CreditCard },
          { to: '/manager/categories', label: 'Bài tập & Khóa học', icon: Dumbbell },
          { to: '/manager/approvals', label: 'Duyệt HLV & Gói PT', icon: CheckCircle2 },
          { to: '/manager/equipment', label: 'Thiết bị & Bảo trì', icon: Wrench },
          { to: '/manager/reports', label: 'Báo cáo & Quyết toán', icon: BarChart3 },
          { to: '/manager/reviews-audit', label: 'Kiểm duyệt & Audit', icon: ShieldAlert },
        ]
      case 'RECEPTIONIST':
        return [
          { to: '/receptionist', label: 'Dashboard Lễ tân', icon: LayoutDashboard },
          { to: '/receptionist/check-in', label: 'Quầy Check-in', icon: CheckCircle2 },
          { to: '/receptionist/members', label: 'Hồ sơ Hội viên', icon: Users },
          { to: '/receptionist/membership-sale', label: 'Bán Vé Gym', icon: CreditCard },
          { to: '/receptionist/pt-sale', label: 'Bán Gói PT 1:1', icon: Dumbbell },
          { to: '/receptionist/calendar', label: 'Lịch Đặt Chỗ', icon: Calendar },
          { to: '/receptionist/payments', label: 'Thu ngân & Hóa đơn', icon: DollarSign },
          { to: '/receptionist/support', label: 'Hỗ trợ Hội viên', icon: HelpCircle },
        ]
      case 'COACH':
        return [
          { to: '/coach', label: 'Dashboard HLV', icon: LayoutDashboard },
          { to: '/coach/packages', label: 'Gói dạy của tôi', icon: Dumbbell },
          { to: '/coach/slots', label: 'Lịch Slot của tôi', icon: Calendar },
          { to: '/coach/bookings', label: 'Lịch hẹn PT 1:1', icon: CheckCircle2 },
          { to: '/coach/students', label: 'Học viên phụ trách', icon: Users },
          { to: '/coach/training-plans', label: 'Soạn Giáo án', icon: FileText },
          { to: '/coach/training-results', label: 'Ghi Kết quả tập', icon: Activity },
          { to: '/coach/assessments', label: 'InBody & Thể trạng', icon: BarChart3 },
          { to: '/coach/ai-recommendation', label: 'Gợi ý từ AI', icon: Sparkles },
        ]
      default:
        return []
    }
  }

  const links = getNavLinks()

  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {links.map((link) => {
        const Icon = link.icon
        return (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/manager' || link.to === '/receptionist' || link.to === '/coach'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{link.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
