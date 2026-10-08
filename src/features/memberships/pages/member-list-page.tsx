import { useState } from 'react'
import { Eye, Plus, CreditCard, Dumbbell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { db } from '@/mocks/mock-server'
import { DataTable, type Column } from '@/shared/components/ui/data-table'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { Input, Select } from '@/shared/components/ui/input'
import { formatDate } from '@/shared/utils/date'
import type { MemberDetail } from '@/shared/types/api'

export function MemberListPage() {
  const [members, setMembers] = useState<MemberDetail[]>([...db.members])
  const [selectedMember, setSelectedMember] = useState<MemberDetail | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Form State
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    gender: 'Nam',
    dateOfBirth: '1995-01-01',
    address: '',
  })

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault()
    const newMem: MemberDetail = {
      id: 'mem-' + Date.now(),
      userId: 'usr-' + Date.now(),
      memberCode: 'MEM-' + Math.floor(Math.random() * 90000 + 10000),
      fullName: form.fullName,
      phone: form.phone,
      email: form.email,
      gender: form.gender,
      dateOfBirth: form.dateOfBirth,
      address: form.address,
      membershipStatus: 'PENDING',
      activePackageCount: 0,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    }
    db.members.unshift(newMem)
    setMembers([...db.members])
    setIsCreateModalOpen(false)
  }

  const columns: Column<MemberDetail>[] = [
    {
      header: 'Mã & Họ Tên Hội Viên',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.avatarUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80'}
            alt={row.fullName}
            className="h-8 w-8 rounded-full object-cover"
          />
          <div>
            <p className="font-bold text-white">{row.fullName}</p>
            <p className="text-[10px] font-mono text-orange-400">{row.memberCode}</p>
          </div>
        </div>
      ),
    },
    { header: 'Số điện thoại', accessor: 'phone' },
    {
      header: 'Trạng thái Thẻ Gym',
      accessor: (row) => <StatusBadge status={row.membershipStatus} />,
    },
    {
      header: 'Gói PT 1:1 Đang Có',
      accessor: (row) => (
        <span className="font-semibold text-slate-200">
          {row.activePackageCount || 0} Gói
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Danh Sách Hội Viên (WEB-REC-02, 03)</h1>
          <p className="text-xs text-slate-400 mt-1">Quản lý hồ sơ hội viên phòng Gym và các gói tập thể hình cá nhân</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Đăng ký hội viên mới</span>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={members}
        searchKey="fullName"
        searchPlaceholder="Tìm theo tên hoặc số điện thoại..."
        actions={(row) => (
          <div className="flex items-center justify-end gap-2">
            <Button size="sm" variant="outline" className="text-xs" onClick={() => setSelectedMember(row)}>
              <Eye className="h-3.5 w-3.5 mr-1" />
              Chi tiết
            </Button>
          </div>
        )}
      />

      {/* Member Detail Modal */}
      <Modal
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        title="Hồ Sơ Hội Viên Chi Tiết"
        maxWidth="lg"
      >
        {selectedMember && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 rounded-xl bg-slate-800/50 p-4">
              <img
                src={selectedMember.avatarUrl}
                alt={selectedMember.fullName}
                className="h-16 w-16 rounded-2xl object-cover border border-orange-500/30"
              />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">{selectedMember.fullName}</h3>
                <p className="text-xs font-mono text-orange-400">Mã: {selectedMember.memberCode}</p>
                <div className="flex gap-2">
                  <StatusBadge status={selectedMember.membershipStatus} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-slate-300">
              <div>
                <span className="text-slate-500">Số điện thoại:</span>
                <p className="font-semibold text-slate-200">{selectedMember.phone || '—'}</p>
              </div>
              <div>
                <span className="text-slate-500">Email:</span>
                <p className="font-semibold text-slate-200">{selectedMember.email || '—'}</p>
              </div>
              <div>
                <span className="text-slate-500">Ngày sinh:</span>
                <p className="font-semibold text-slate-200">{formatDate(selectedMember.dateOfBirth)}</p>
              </div>
              <div>
                <span className="text-slate-500">Địa chỉ:</span>
                <p className="font-semibold text-slate-200">{selectedMember.address || '—'}</p>
              </div>
            </div>

            {selectedMember.medicalNotes && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-3 text-xs text-amber-300">
                <span className="font-bold">Lưu ý sức khỏe / chấn thương:</span> {selectedMember.medicalNotes}
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
              <Link to="/receptionist/membership-sale">
                <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                  <CreditCard className="h-3.5 w-3.5" />
                  Gia hạn vé Gym
                </Button>
              </Link>
              <Link to="/receptionist/pt-sale">
                <Button size="sm" variant="primary" className="gap-1.5 text-xs">
                  <Dumbbell className="h-3.5 w-3.5" />
                  Mua gói PT 1:1
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Member Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Đăng Ký Hội Viên Mới"
        description="Nhập thông tin cơ bản để tạo mã thẻ hội viên tại quầy"
      >
        <form onSubmit={handleCreateMember} className="space-y-4">
          <Input
            label="Họ và tên"
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            placeholder="Ví dụ: Nguyễn Văn An"
          />
          <Input
            label="Số điện thoại"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="0987654321"
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="an.nguyen@gmail.com"
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Giới tính"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              options={[
                { value: 'Nam', label: 'Nam' },
                { value: 'Nữ', label: 'Nữ' },
                { value: 'Khác', label: 'Khác' },
              ]}
            />
            <Input
              label="Ngày sinh"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary">
              Tạo hồ sơ
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
