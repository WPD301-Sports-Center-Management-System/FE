import { useState, useEffect, useCallback } from 'react'
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
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Tạo tài khoản thất bại.')
      } else {
        setErrorMessage('Lỗi hệ thống khi tạo tài khoản.')
      }
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
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Cập nhật tài khoản thất bại.')
      } else {
        setErrorMessage('Lỗi hệ thống khi cập nhật.')
      }
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
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Cập nhật trạng thái thất bại.')
      } else {
        setErrorMessage('Lỗi khi đổi trạng thái.')
      }
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
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Đặt lại mật khẩu thất bại.')
      } else {
        setErrorMessage('Lỗi khi đặt lại mật khẩu.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyPassword = async () => {
    if (tempPassword) {
      await navigator.clipboard.writeText(tempPassword)
      setIsCopied(true)
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
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không thể xuất dữ liệu.')
      } else {
        setErrorMessage('Lỗi khi xuất file CSV.')
      }
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
              className="h-9 w-9 rounded-full object-cover border border-slate-700 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-slate-100 text-sm">{row.fullName}</p>
                {memberCode && (
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-400 border border-orange-500/30 tracking-tight">
                    {memberCode}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{row.email}</p>
            </div>
          </div>
        )
      },
    },
    {
      header: 'Số điện thoại',
      accessor: (row) => <span className="font-mono text-xs text-slate-300">{row.phone || '—'}</span>,
    },
    {
      header: 'Vai trò',
      accessor: (row) => {
        const badgeColors: Record<UserRole, string> = {
          MANAGER: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
          RECEPTIONIST: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
          COACH: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
          MEMBER: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
        }
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold ${
              badgeColors[row.role] || 'bg-slate-800 text-slate-200'
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
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Quản lý Tài Khoản & Nhân Sự (WEB-MAN-02)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
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
        <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-950/40 p-3.5 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3.5 text-xs text-emerald-300">
          <Check className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="h-3.5 w-3.5 text-orange-400" />
            <span>Lọc:</span>
          </div>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as UserRole | '')}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-orange-500 focus:outline-none"
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
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-orange-500 focus:outline-none"
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
              className="text-xs text-orange-400 hover:text-orange-300 underline transition-colors"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>

        <div className="text-xs text-slate-400">
          Tổng số: <strong className="text-slate-200">{users.length}</strong> tài khoản
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
                className="h-8 px-2 text-xs text-amber-400 hover:text-amber-300 hover:border-amber-500/40"
                onClick={() => setStatusChangeUser({ user: row, targetStatus: 'INACTIVE' })}
                title="Tạm khóa tài khoản"
              >
                <Ban className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 text-xs text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/40"
                onClick={() => setStatusChangeUser({ user: row, targetStatus: 'ACTIVE' })}
                title="Kích hoạt tài khoản"
              >
                <UserCheck className="h-3.5 w-3.5" />
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2.5 text-xs text-orange-400 hover:text-orange-300 hover:border-orange-500/40"
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

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
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
            <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-3 flex items-center justify-between">
              <span className="text-xs text-orange-300 font-medium">Mã hội viên chính thức:</span>
              <span className="font-mono text-xs font-bold text-orange-400 bg-slate-900/80 px-2 py-0.5 rounded border border-orange-500/30">
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

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
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
          <p className="text-xs text-slate-300 leading-relaxed">
            Bạn có chắc chắn muốn đổi trạng thái của tài khoản{' '}
            <strong className="text-white">{statusChangeUser?.user.email}</strong> sang{' '}
            <span className="font-semibold text-orange-400">
              {statusChangeUser?.targetStatus}
            </span>
            ?
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
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
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-4 text-center">
            <p className="text-xs text-slate-400">Mật khẩu tạm thời mới:</p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="font-mono text-base font-bold text-emerald-400 select-all tracking-wider bg-slate-900/80 px-3 py-1.5 rounded-lg border border-emerald-500/30">
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
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
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
          <p className="text-xs text-slate-400 leading-relaxed">
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
