import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  KeyRound,
  Download,
  Edit2,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  Filter,
  UserCheck,
  Ban,
  Shield,
} from 'lucide-react'
import { DataTable, type Column } from '@/shared/components/ui/data-table'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { Input, Select } from '@/shared/components/ui/input'
import { formatDate } from '@/shared/utils/date'
import { usersService } from '@/features/users-accounts/services/users.service'
import { isAppApiError } from '@/shared/api/api-error'
import type { UserDetail, UserRole, UserStatus } from '@/shared/types/api'

export function UserManagementPage() {
  const [users, setUsers] = useState<UserDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('')
  const [selectedStatus, setSelectedStatus] = useState<UserStatus | ''>('')

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserDetail | null>(null)
  const [statusChangeUser, setStatusChangeUser] = useState<{ user: UserDetail; targetStatus: UserStatus } | null>(null)
  const [resetUser, setResetUser] = useState<UserDetail | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Create Form State
  const [createFormData, setCreateFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'COACH' as UserRole,
    password: '',
  })

  // Edit Form State
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    phone: '',
    role: 'COACH' as UserRole,
  })

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const res = await usersService.getUsers({
        search: searchTerm.trim() || undefined,
        role: selectedRole || undefined,
        status: selectedStatus || undefined,
      })
      setUsers(res.data || [])
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không thể tải danh sách tài khoản.')
      } else {
        setErrorMessage('Không thể kết nối đến máy chủ.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [searchTerm, selectedRole, selectedStatus])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers()
    }, 200)
    return () => clearTimeout(timer)
  }, [fetchUsers])

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg)
    toast.success(msg)
    setTimeout(() => setSuccessMessage(null), 4000)
  }

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      const created = await usersService.createUser({
        fullName: createFormData.fullName.trim(),
        email: createFormData.email.trim(),
        phone: createFormData.phone.trim(),
        role: createFormData.role,
        password: createFormData.password || undefined,
      })
      setUsers((prev) => [created, ...prev])
      setIsCreateModalOpen(false)
      setCreateFormData({ fullName: '', email: '', phone: '', role: 'COACH', password: '' })
      showSuccess(`Đã tạo thành công tài khoản cho ${created.fullName}`)
    } catch (err) {
      const msg = isAppApiError(err) ? (err.message || 'Tạo tài khoản thất bại.') : 'Lỗi hệ thống khi tạo tài khoản.'
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Edit User
  const handleOpenEdit = (user: UserDetail) => {
    setEditingUser(user)
    setEditFormData({
      fullName: user.fullName,
      phone: user.phone || '',
      role: user.role,
    })
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      const updated = await usersService.updateUser(editingUser.id, {
        fullName: editFormData.fullName.trim(),
        phone: editFormData.phone.trim(),
        role: editFormData.role,
      })
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      setEditingUser(null)
      showSuccess(`Đã cập nhật thông tin cho ${updated.fullName}`)
    } catch (err) {
      const msg = isAppApiError(err) ? (err.message || 'Cập nhật tài khoản thất bại.') : 'Lỗi hệ thống khi cập nhật.'
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Status Change
  const handleConfirmStatusChange = async () => {
    if (!statusChangeUser) return
    setIsSubmitting(true)
    try {
      const updated = await usersService.updateUserStatus(
        statusChangeUser.user.id,
        statusChangeUser.targetStatus
      )
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      setStatusChangeUser(null)
      showSuccess(`Đã cập nhật trạng thái tài khoản sang ${statusChangeUser.targetStatus}`)
    } catch (err) {
      const msg = isAppApiError(err) ? (err.message || 'Cập nhật trạng thái thất bại.') : 'Lỗi khi đổi trạng thái.'
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Reset Password
  const handleResetPassword = async (user: UserDetail) => {
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      const res = await usersService.resetUserPassword(user.id)
      setTempPassword(res.temporaryPassword)
      setResetUser(user)
      setIsCopied(false)
      toast.success(`Đã tạo mật khẩu tạm thời mới cho ${user.fullName}`)
    } catch (err) {
      const msg = isAppApiError(err) ? (err.message || 'Đặt lại mật khẩu thất bại.') : 'Lỗi khi đặt lại mật khẩu.'
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyPassword = async () => {
    if (tempPassword) {
      await navigator.clipboard.writeText(tempPassword)
      setIsCopied(true)
      toast.success('Đã sao chép mật khẩu tạm thời!')
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  // Handle Export CSV
  const handleExportCsv = async () => {
    setIsExporting(true)
    setErrorMessage(null)
    try {
      const blob = await usersService.exportUsers({
        search: searchTerm.trim() || undefined,
        role: selectedRole || undefined,
        status: selectedStatus || undefined,
      })
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `users-export-${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      showSuccess('Đã xuất danh sách tài khoản ra file CSV thành công.')
    } catch (err) {
      const msg = isAppApiError(err) ? (err.message || 'Không thể xuất dữ liệu.') : 'Lỗi khi xuất file CSV.'
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setIsExporting(false)
    }
  }

  const columns: Column<UserDetail>[] = [
    {
      header: 'Họ và tên / Email',
      accessor: (row) => {
        const memberCode = row.memberCode || row.memberProfile?.memberCode
        return (
          <div className="flex items-center gap-3">
            <img
              src={
                row.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'
              }
              alt={row.fullName}
              className="h-9 w-9 rounded-full object-cover border border-border-subtle shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-text-primary text-sm">{row.fullName}</p>
                {memberCode && (
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/25 tracking-tight">
                    {memberCode}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-text-muted mt-0.5">{row.email}</p>
            </div>
          </div>
        )
      },
    },
    {
      header: 'Số điện thoại',
      accessor: (row) => <span className="font-mono text-xs text-text-primary">{row.phone || '—'}</span>,
    },
    {
      header: 'Vai trò',
      accessor: (row) => {
        const badgeColors: Record<UserRole, string> = {
          MANAGER: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30',
          RECEPTIONIST: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30',
          COACH: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30',
          MEMBER: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30',
        }
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold ${
              badgeColors[row.role] || 'bg-bg-surface-muted text-text-primary border border-border-subtle'
            }`}
          >
            <Shield className="h-3 w-3 shrink-0" />
            {row.role}
          </span>
        )
      },
    },
    {
      header: 'Trạng thái',
      accessor: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Ngày tạo',
      accessor: (row) => formatDate(row.createdAt),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Quản lý Tài Khoản & Nhân Sự (WEB-MAN-02)
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Quản lý phân quyền Manager, Lễ tân, Huấn luyện viên và Hội viên qua API
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchUsers}
            disabled={isLoading}
            className="gap-1.5 text-xs"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>

          <Button
            variant="outline"
            onClick={handleExportCsv}
            disabled={isExporting}
            isLoading={isExporting}
            className="gap-1.5 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Xuất CSV</span>
          </Button>

          <Button onClick={() => setIsCreateModalOpen(true)} className="gap-1.5 text-xs">
            <Plus className="h-4 w-4" />
            <span>Thêm tài khoản</span>
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/10 p-3.5 text-xs text-danger">
          <AlertCircle className="h-4 w-4 shrink-0 text-danger mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-2.5 rounded-xl border border-success/30 bg-success/10 p-3.5 text-xs text-success">
          <Check className="h-4 w-4 shrink-0 text-success mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-2xl border border-border-subtle bg-bg-surface p-4 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Filter className="h-3.5 w-3.5 text-primary" />
            <span>Lọc:</span>
          </div>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as UserRole | '')}
            className="rounded-xl border border-border-subtle bg-bg-input px-3 py-1.5 text-xs text-text-primary focus:border-primary focus:outline-none"
          >
            <option value="">Tất cả vai trò</option>
            <option value="MANAGER">Quản lý (MANAGER)</option>
            <option value="RECEPTIONIST">Lễ tân (RECEPTIONIST)</option>
            <option value="COACH">Huấn luyện viên (COACH)</option>
            <option value="MEMBER">Hội viên (MEMBER)</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as UserStatus | '')}
            className="rounded-xl border border-border-subtle bg-bg-input px-3 py-1.5 text-xs text-text-primary focus:border-primary focus:outline-none"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động (ACTIVE)</option>
            <option value="INACTIVE">Không hoạt động (INACTIVE)</option>
            <option value="SUSPENDED">Bị đình chỉ (SUSPENDED)</option>
          </select>

          {(selectedRole || selectedStatus || searchTerm) && (
            <button
              onClick={() => {
                setSelectedRole('')
                setSelectedStatus('')
                setSearchTerm('')
              }}
              className="text-xs text-primary hover:text-primary-hover underline transition-colors"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>

        <div className="text-xs text-text-muted">
          Tổng số: <strong className="text-text-primary">{users.length}</strong> tài khoản
        </div>
      </div>

      {/* Main Data Table */}
      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        searchFn={(item, term) => {
          const t = term.toLowerCase()
          const memberCode = (item.memberCode || item.memberProfile?.memberCode || '').toLowerCase()
          return (
            item.fullName.toLowerCase().includes(t) ||
            item.email.toLowerCase().includes(t) ||
            (item.phone && item.phone.toLowerCase().includes(t)) ||
            memberCode.includes(t)
          )
        }}
        searchPlaceholder="Tìm kiếm theo họ tên, mã hội viên, email, SĐT..."
        actions={(row) => (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2 text-xs"
              onClick={() => handleOpenEdit(row)}
              title="Chỉnh sửa thông tin"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>

            {row.status === 'ACTIVE' ? (
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:border-amber-500/40"
                onClick={() => setStatusChangeUser({ user: row, targetStatus: 'INACTIVE' })}
                title="Tạm khóa tài khoản"
              >
                <Ban className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:border-emerald-500/40"
                onClick={() => setStatusChangeUser({ user: row, targetStatus: 'ACTIVE' })}
                title="Kích hoạt tài khoản"
              >
                <UserCheck className="h-3.5 w-3.5" />
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2.5 text-xs text-primary hover:text-primary-hover hover:border-primary/40"
              onClick={() => handleResetPassword(row)}
              title="Tạo mật khẩu tạm thời mới"
            >
              <KeyRound className="h-3.5 w-3.5 mr-1" />
              <span>Reset MK</span>
            </Button>
          </div>
        )}
      />

      {/* Modal Create User */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => !isSubmitting && setIsCreateModalOpen(false)}
        title="Tạo tài khoản người dùng"
        description="Thêm tài khoản mới cho Quản lý, Lễ tân, HLV hoặc Hội viên"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Họ và tên"
            required
            value={createFormData.fullName}
            onChange={(e) => setCreateFormData({ ...createFormData, fullName: e.target.value })}
            placeholder="Nguyễn Văn A"
            disabled={isSubmitting}
          />
          <Input
            label="Email"
            type="email"
            required
            value={createFormData.email}
            onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
            placeholder="a.nguyen@sports.local"
            disabled={isSubmitting}
          />
          <Input
            label="Số điện thoại"
            required
            value={createFormData.phone}
            onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
            placeholder="0912345678"
            disabled={isSubmitting}
          />
          <Select
            label="Vai trò (Role)"
            value={createFormData.role}
            onChange={(e) =>
              setCreateFormData({ ...createFormData, role: e.target.value as UserRole })
            }
            options={[
              { value: 'COACH', label: 'Huấn Luyện Viên (COACH)' },
              { value: 'RECEPTIONIST', label: 'Nhân Viên Lễ Tân (RECEPTIONIST)' },
              { value: 'MANAGER', label: 'Quản Lý Trung Tâm (MANAGER)' },
              { value: 'MEMBER', label: 'Hội Viên (MEMBER)' },
            ]}
            disabled={isSubmitting}
          />
          <Input
            label="Mật khẩu khởi tạo (Để trống để tạo tự động)"
            type="password"
            value={createFormData.password}
            onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
            placeholder="Tối thiểu 8 ký tự..."
            disabled={isSubmitting}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
              Tạo tài khoản
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Edit User */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => !isSubmitting && setEditingUser(null)}
        title="Chỉnh sửa tài khoản"
        description={`Cập nhật thông tin cho: ${editingUser?.fullName}`}
      >
        <form onSubmit={handleUpdateUser} className="space-y-4">
          {(editingUser?.memberCode || editingUser?.memberProfile?.memberCode) && (
            <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 flex items-center justify-between">
              <span className="text-xs text-primary font-medium">Mã hội viên chính thức:</span>
              <span className="font-mono text-xs font-bold text-primary bg-bg-surface-muted px-2 py-0.5 rounded border border-primary/30">
                {editingUser.memberCode || editingUser.memberProfile?.memberCode}
              </span>
            </div>
          )}
          <Input
            label="Họ và tên"
            required
            value={editFormData.fullName}
            onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
            placeholder="Nguyễn Văn A"
            disabled={isSubmitting}
          />
          <Input
            label="Số điện thoại"
            value={editFormData.phone}
            onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
            placeholder="0912345678"
            disabled={isSubmitting}
          />
          <Select
            label="Vai trò"
            value={editFormData.role}
            onChange={(e) =>
              setEditFormData({ ...editFormData, role: e.target.value as UserRole })
            }
            options={[
              { value: 'COACH', label: 'Huấn Luyện Viên (COACH)' },
              { value: 'RECEPTIONIST', label: 'Nhân Viên Lễ Tân (RECEPTIONIST)' },
              { value: 'MANAGER', label: 'Quản Lý Trung Tâm (MANAGER)' },
              { value: 'MEMBER', label: 'Hội Viên (MEMBER)' },
            ]}
            disabled={isSubmitting}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditingUser(null)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirm Status Change */}
      <Modal
        isOpen={!!statusChangeUser}
        onClose={() => !isSubmitting && setStatusChangeUser(null)}
        title="Xác nhận thay đổi trạng thái"
        description={`Thay đổi trạng thái tài khoản cho: ${statusChangeUser?.user.fullName}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-text-muted leading-relaxed">
            Bạn có chắc chắn muốn đổi trạng thái của tài khoản{' '}
            <strong className="text-text-primary">{statusChangeUser?.user.email}</strong> sang{' '}
            <span className="font-semibold text-primary">
              {statusChangeUser?.targetStatus}
            </span>
            ?
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStatusChangeUser(null)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleConfirmStatusChange}
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Xác nhận đổi
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Reset Password Result */}
      <Modal
        isOpen={!!resetUser}
        onClose={() => {
          setResetUser(null)
          setTempPassword(null)
          setIsCopied(false)
        }}
        title="Mật khẩu tạm thời đã tạo từ máy chủ"
        description={`Mật khẩu mới cho tài khoản: ${resetUser?.fullName} (${resetUser?.email})`}
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-center">
            <p className="text-xs text-text-muted">Mật khẩu tạm thời mới:</p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="font-mono text-base font-bold text-success select-all tracking-wider bg-bg-surface px-3 py-1.5 rounded-lg border border-success/30">
                {tempPassword}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyPassword}
                className="h-8 gap-1 text-xs"
              >
                {isCopied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-success" />
                    <span>Đã sao chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Sao chép</span>
                  </>
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            Vui lòng gửi mật khẩu tạm này cho nhân sự hoặc hội viên để họ đăng nhập và thực hiện đổi mật khẩu ngay sau đó.
          </p>
          <div className="flex justify-end pt-2">
            <Button
              onClick={() => {
                setResetUser(null)
                setTempPassword(null)
              }}
            >
              Hoàn tất
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
