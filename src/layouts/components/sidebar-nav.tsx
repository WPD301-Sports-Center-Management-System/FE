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
  interface NavItem {
    to: string
    label: string
    icon: React.ComponentType<{ className?: string }>
  }

  interface NavSection {
    title?: string
    items: NavItem[]
  }

  const getNavSections = (): NavSection[] => {
    switch (role) {
      case 'MANAGER':
        return [
          {
            title: 'TỔNG QUAN',
            items: [
              { to: '/manager', label: 'Dashboard', icon: LayoutDashboard },
            ],
          },
          {
            title: 'QUẢN LÝ DỊCH VỤ',
            items: [
              { to: '/manager/users', label: 'Tài khoản & User', icon: Users },
              { to: '/manager/membership-plans', label: 'Gói Vé Gym', icon: CreditCard },
              { to: '/manager/categories', label: 'Bài tập & Khóa học', icon: Dumbbell },
              { to: '/manager/approvals', label: 'Duyệt HLV & Gói PT', icon: CheckCircle2 },
            ],
          },
          {
            title: 'VẬN HÀNH & BÁO CÁO',
            items: [
              { to: '/manager/equipment', label: 'Thiết bị & Bảo trì', icon: Wrench },
              { to: '/manager/reports', label: 'Báo cáo & Quyết toán', icon: BarChart3 },
              { to: '/manager/reviews-audit', label: 'Kiểm duyệt & Audit', icon: ShieldAlert },
            ],
          },
        ]
      case 'RECEPTIONIST':
        return [
          {
            title: 'TỔNG QUAN',
            items: [
              { to: '/receptionist', label: 'Dashboard Lễ tân', icon: LayoutDashboard },
            ],
          },
          {
            title: 'QUẦY LỄ TÂN & HỘI VIÊN',
            items: [
              { to: '/receptionist/check-in', label: 'Quầy Check-in', icon: CheckCircle2 },
              { to: '/receptionist/members', label: 'Hồ sơ Hội viên', icon: Users },
              { to: '/receptionist/calendar', label: 'Lịch Đặt Chỗ', icon: Calendar },
            ],
          },
          {
            title: 'KINH DOANH & HỖ TRỢ',
            items: [
              { to: '/receptionist/membership-sale', label: 'Bán Vé Gym', icon: CreditCard },
              { to: '/receptionist/pt-sale', label: 'Bán Gói PT 1:1', icon: Dumbbell },
              { to: '/receptionist/payments', label: 'Thu ngân & Hóa đơn', icon: DollarSign },
              { to: '/receptionist/support', label: 'Hỗ trợ Hội viên', icon: HelpCircle },
            ],
          },
        ]
      case 'COACH':
        return [
          {
            title: 'TỔNG QUAN',
            items: [
              { to: '/coach', label: 'Dashboard HLV', icon: LayoutDashboard },
            ],
          },
          {
            title: 'LỊCH TRÌNH & HỌC VIÊN',
            items: [
              { to: '/coach/slots', label: 'Thời khóa biểu', icon: Calendar },
              { to: '/coach/bookings', label: 'Lịch hẹn PT 1:1', icon: CheckCircle2 },
              { to: '/coach/students', label: 'Học viên', icon: Users },
            ],
          },
          {
            title: 'CHUYÊN MÔN & GIÁO ÁN',
            items: [
              { to: '/coach/packages', label: 'Gói dạy của tôi', icon: Dumbbell },
              { to: '/coach/training-plans', label: 'Soạn Giáo án', icon: FileText },
              { to: '/coach/training-results', label: 'Ghi Kết quả tập', icon: Activity },
              { to: '/coach/assessments', label: 'InBody & Thể trạng', icon: BarChart3 },
              { to: '/coach/ai-recommendation', label: 'Gợi ý từ AI', icon: Sparkles },
            ],
          },
        ]
      case 'MEMBER':
        return [
          {
            title: 'TỔNG QUAN',
            items: [
              { to: '/member', label: 'Hồ Sơ Hội Viên', icon: LayoutDashboard },
            ],
          },
        ]
      default:
        return []
    }
  }

  const sections = getNavSections()

  return (
    <nav className="flex-1 space-y-4 px-3 py-3">
      {sections.map((section, idx) => (
        <div key={section.title || idx} className="space-y-1">
          {section.title && (
            <div className="flex items-center gap-2 px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
              <span>{section.title}</span>
              <div className="h-px flex-1 bg-border-subtle" />
            </div>
          )}
          <div className="space-y-1">
            {section.items.map((link) => {
              const Icon = link.icon
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/manager' || link.to === '/receptionist' || link.to === '/coach'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                        : 'text-text-muted hover:bg-bg-surface-muted hover:text-text-primary'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{link.label}</span>
                </NavLink>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
