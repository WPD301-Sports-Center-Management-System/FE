import { useState } from 'react'
import { Plus, KeyRound } from 'lucide-react'
import { db } from '@/mocks/mock-server'
import { DataTable, type Column } from '@/shared/components/ui/data-table'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { Input, Select } from '@/shared/components/ui/input'
import { formatDate } from '@/shared/utils/date'
import type { UserDetail, UserRole } from '@/shared/types/api'

export function UserManagementPage() {
  const [users, setUsers] = useState<UserDetail[]>([...db.users])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [resetUser, setResetUser] = useState<UserDetail | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'COACH' as UserRole,
  })

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault()
    const newUser: UserDetail = {
      id: 'usr-' + Date.now(),
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    }
    db.users.push(newUser)
    setUsers([...db.users])
    setIsCreateModalOpen(false)
    setFormData({ fullName: '', email: '', phone: '', role: 'COACH' })
  }

  const handleResetPassword = (user: UserDetail) => {
    const generated = 'GymPass@' + Math.floor(Math.random() * 9000 + 1000)
    setTempPassword(generated)
    setResetUser(user)
  }

  const columns: Column<UserDetail>[] = [
    {
      header: 'Họ và tên / Email',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
            alt={row.fullName}
            className="h-8 w-8 rounded-full object-cover"
          />
          <div>
            <p className="font-semibold text-slate-100">{row.fullName}</p>
            <p className="text-[11px] text-slate-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Số điện thoại',
      accessor: 'phone',
    },
    {
      header: 'Vai trò',
      accessor: (row) => (
        <span className="rounded-lg bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-200">
          {row.role}
        </span>
      ),
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Quản lý Tài Khoản & Nhân Sự (WEB-MAN-02)</h1>
          <p className="text-xs text-slate-400 mt-1">Danh sách Manager, Receptionist, Coach và Member trong hệ thống</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Thêm nhân viên mới</span>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={users}
        searchKey="fullName"
        searchPlaceholder="Tìm kiếm theo tên..."
        actions={(row) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => handleResetPassword(row)}
            >
              <KeyRound className="h-3.5 w-3.5 mr-1" />
              Đặt lại MK
            </Button>
          </div>
        )}
      />

      {/* Modal Create User */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Tạo tài khoản nhân viên"
        description="Thêm tài khoản mới cho Huấn luyện viên hoặc Lễ tân"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Họ và tên"
            required
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder="Nguyễn Văn A"
          />
          <Input
            label="Email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="a.nguyen@sports.local"
          />
          <Input
            label="Số điện thoại"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="0912345678"
          />
          <Select
            label="Vai trò"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
            options={[
              { value: 'COACH', label: 'Huấn Luyện Viên (COACH)' },
              { value: 'RECEPTIONIST', label: 'Nhân Viên Lễ Tân (RECEPTIONIST)' },
              { value: 'MANAGER', label: 'Quản Lý Trung Tâm (MANAGER)' },
            ]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary">
              Lưu tài khoản
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Reset Password */}
      <Modal
        isOpen={!!resetUser}
        onClose={() => {
          setResetUser(null)
          setTempPassword(null)
        }}
        title="Mật khẩu tạm thời đã tạo"
        description={`Mật khẩu mới cho nhân sự: ${resetUser?.fullName}`}
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-4 text-center">
            <p className="text-xs text-slate-400">Mật khẩu tạm:</p>
            <p className="text-lg font-mono font-bold text-emerald-400 mt-1">{tempPassword}</p>
          </div>
          <p className="text-xs text-slate-400">
            Vui lòng gửi mật khẩu này cho nhân sự để đăng nhập lần đầu và yêu cầu đổi mật khẩu ngay sau đó.
          </p>
          <div className="flex justify-end">
            <Button onClick={() => setResetUser(null)}>Đã sao chép</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
