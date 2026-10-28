import type { UserRole } from '@/shared/types/api'

export const ROLE_LABELS: Record<UserRole, string> = {
  MANAGER: 'Quản lý',
  RECEPTIONIST: 'Lễ tân',
  COACH: 'Huấn luyện viên',
  MEMBER: 'Hội viên',
}

export const roleLabel = (role?: string | null) => (role && ROLE_LABELS[role as UserRole]) || role || '—'
