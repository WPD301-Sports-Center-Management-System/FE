import { useState } from 'react'
import { Plus } from 'lucide-react'
import { db } from '@/mocks/mock-server'
import { formatVND } from '@/shared/utils/currency'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { Input, Select } from '@/shared/components/ui/input'
import type { PackageOption } from '@/shared/types/api'

export function CoachMyPackagesPage() {
  const coach = db.coaches[0]
  const [packages, setPackages] = useState<PackageOption[]>(
    db.packageOptions.filter((p) => !p.coachId || p.coachId === coach.id)
  )
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Form State
  const [form, setForm] = useState({
    name: '',
    courseId: db.courses[0].id,
    sessionCount: 12,
    validityDays: 60,
    price: '5400000',
  })

  const handleProposePackage = (e: React.FormEvent) => {
    e.preventDefault()
    const selectedCourse = db.courses.find((c) => c.id === form.courseId)
    const newPkg: PackageOption = {
      id: 'pkg-opt-' + Date.now(),
      courseId: form.courseId,
      coachId: coach.id,
      name: form.name,
      sessionCount: Number(form.sessionCount),
      validityDays: Number(form.validityDays),
      price: Number(form.price).toFixed(2),
      approvalStatus: 'PENDING',
      isActive: true,
      courseName: selectedCourse?.name,
      coachName: coach.fullName,
    }

    db.packageOptions.unshift(newPkg)
    setPackages(db.packageOptions.filter((p) => !p.coachId || p.coachId === coach.id))
    setIsModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Khóa Giảng Dạy & Gói Của Tôi (WEB-COA-02)</h1>
          <p className="text-xs text-slate-400 mt-1">
            Đề xuất gói huấn luyện cá nhân và quản lý các khóa đào tạo đã được duyệt
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Đề xuất gói PT mới</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4 relative overflow-hidden"
          >
            <div className="flex justify-between items-start">
              <span className="rounded-full bg-orange-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-orange-400">
                {pkg.sessionCount} Buổi Tập
              </span>
              <StatusBadge status={pkg.approvalStatus} />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">{pkg.name}</h3>
              <p className="text-xs text-slate-400 mt-1">{pkg.courseName}</p>
            </div>

            <div className="rounded-xl bg-slate-800/40 p-3 text-xs text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Thời hạn:</span>
                <span className="font-semibold text-white">{pkg.validityDays} Ngày</span>
              </div>
              <div className="flex justify-between border-t border-slate-700/50 pt-1">
                <span className="text-slate-400">Học phí:</span>
                <span className="font-bold text-emerald-400">{formatVND(pkg.price)}</span>
              </div>
            </div>

            {pkg.rejectionReason && (
              <p className="text-[11px] text-red-400 italic">Lý do từ chối: {pkg.rejectionReason}</p>
            )}
          </div>
        ))}
      </div>

      {/* Propose Package Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Đề Xuất Gói Tập PT Mới"
        description="Gói đề xuất sẽ gửi lên Quản lý (Manager) để phê duyệt trước khi mở bán"
      >
        <form onSubmit={handleProposePackage} className="space-y-4">
          <Input
            label="Tên gói tập"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ví dụ: Gói 12 Buổi Siết Cơ Bụng"
          />
          <Select
            label="Khóa học áp dụng"
            value={form.courseId}
            onChange={(e) => setForm({ ...form, courseId: e.target.value })}
            options={db.courses.map((c) => ({ value: c.id, label: c.name }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Số buổi tập"
              type="number"
              required
              value={form.sessionCount}
              onChange={(e) => setForm({ ...form, sessionCount: Number(e.target.value) })}
            />
            <Input
              label="Hạn sử dụng (Ngày)"
              type="number"
              required
              value={form.validityDays}
              onChange={(e) => setForm({ ...form, validityDays: Number(e.target.value) })}
            />
          </div>
          <Input
            label="Học phí đề xuất (VND)"
            type="number"
            required
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary">
              Gửi Quản lý duyệt
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
