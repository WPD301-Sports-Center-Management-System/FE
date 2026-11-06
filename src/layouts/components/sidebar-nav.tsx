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
  Utensils,
  PhoneCall,
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
              { to: '/manager', label: 'Tổng quan', icon: LayoutDashboard },
            ],
          },
          {
            title: 'QUẢN LÝ DỊCH VỤ',
            items: [
              { to: '/manager/users', label: 'Tài khoản người dùng', icon: Users },
              { to: '/manager/membership-plans', label: 'Gói vé gym', icon: CreditCard },
              { to: '/manager/categories', label: 'Bài tập & Khóa học', icon: Dumbbell },
              { to: '/manager/approvals', label: 'Duyệt HLV & Gói PT', icon: CheckCircle2 },
              { to: '/manager/policies', label: 'Chính sách vận hành PT', icon: ShieldAlert },
            ],
          },
          {
            title: 'VẬN HÀNH & BÁO CÁO',
            items: [
              { to: '/manager/equipment', label: 'Thiết bị & Bảo trì', icon: Wrench },
              { to: '/manager/reports', label: 'Báo cáo', icon: BarChart3 },
              { to: '/manager/coach-ledger', label: 'Đối soát Coach theo kỳ', icon: DollarSign },
              { to: '/manager/pt-board', label: 'Lịch PT toàn trung tâm', icon: Calendar },
              { to: '/manager/sessions', label: 'Buổi cần xử lý & gián đoạn', icon: Activity },
              { to: '/receptionist/reconciliation', label: 'Đối soát tiền nhận', icon: CreditCard },
              { to: '/receptionist/invoices', label: 'Hóa đơn', icon: FileText },
              { to: '/manager/reviews-audit', label: 'Đánh giá & nhật ký thao tác', icon: ShieldAlert },
            ],
          },
        ]
      case 'RECEPTIONIST':
        return [
          {
            title: 'TỔNG QUAN',
            items: [
              { to: '/receptionist', label: 'Tổng quan', icon: LayoutDashboard },
            ],
          },
          {
            title: 'QUẦY LỄ TÂN & HỘI VIÊN',
            items: [
              { to: '/receptionist/check-in', label: 'Quầy check-in', icon: CheckCircle2 },
              { to: '/receptionist/members', label: 'Hồ sơ hội viên', icon: Users },
              { to: '/receptionist/calendar', label: 'Lịch buổi PT', icon: Calendar },
            ],
          },
          {
            title: 'KINH DOANH & HỖ TRỢ',
            items: [
              { to: '/receptionist/membership-sale', label: 'Bán vé gym', icon: CreditCard },
              { to: '/receptionist/pt-sale', label: 'Mua gói & đặt lịch PT', icon: Dumbbell },
              { to: '/receptionist/payments', label: 'Thu ngân', icon: DollarSign },
              { to: '/receptionist/invoices', label: 'Hóa đơn', icon: FileText },
              { to: '/receptionist/reconciliation', label: 'Đối soát tiền nhận', icon: CreditCard },
              { to: '/receptionist/support', label: 'Hỗ trợ hội viên', icon: HelpCircle },
              { to: '/receptionist/trial-requests', label: 'Đăng ký tập thử', icon: PhoneCall },
            ],
          },
        ]
      case 'COACH':
        return [
          {
            title: 'TỔNG QUAN',
            items: [
              { to: '/coach', label: 'Tổng quan', icon: LayoutDashboard },
            ],
          },
          {
            title: 'LỊCH TRÌNH & HỌC VIÊN',
            items: [
              { to: '/coach/slots', label: 'Lịch làm việc', icon: Calendar },
              { to: '/coach/schedule', label: 'Lịch PT 1:1', icon: CheckCircle2 },
              { to: '/coach/students', label: 'Học viên', icon: Users },
            ],
          },
          {
            title: 'GIÁO ÁN & THEO DÕI',
            items: [
              { to: '/coach/training-plans', label: 'Chương trình theo buổi', icon: FileText },
              { to: '/coach/training-results', label: 'Đánh giá cuối buổi', icon: Activity },
              { to: '/coach/assessments', label: 'InBody & thể trạng', icon: BarChart3 },
              { to: '/coach/meal-plans', label: 'Thực đơn dinh dưỡng', icon: Utensils },
              { to: '/coach/ai-recommendation', label: 'Gợi ý từ AI', icon: Sparkles },
            ],
          },
          {
            title: 'GÓI PT & THU NHẬP',
            items: [
              { to: '/coach/packages', label: 'Quyền dạy & gói PT', icon: Dumbbell },
              { to: '/coach/earnings', label: 'Thu nhập & đối soát', icon: DollarSign },
            ],
          },
        ]
      case 'MEMBER':
        return [
          {
            title: 'TỔNG QUAN',
            items: [
              { to: '/member', label: 'Hồ sơ hội viên', icon: LayoutDashboard },
              { to: '/member/goals', label: 'Mục tiêu và phiếu sau buổi', icon: Activity },
              { to: '/member/support', label: 'Yêu cầu hỗ trợ', icon: HelpCircle },
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
            <div className="flex items-center gap-2 px-3 pb-1 text-xs font-bold uppercase tracking-wider text-text-muted">
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
                  end={link.to === '/manager' || link.to === '/receptionist' || link.to === '/coach' || link.to === '/member'}
                  className={({ isActive }) =>
                    `flex min-h-11 items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-text-primary'
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
