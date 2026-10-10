import { useState, useEffect, useCallback } from 'react'
import { Plus, RefreshCw, AlertCircle, Check, Package } from 'lucide-react'
import { coachesService } from '@/features/coaches/services/coaches.service'
import { coachApprovalService } from '@/features/coach-approval/services/coach-approval.service'
import { coursesExercisesService } from '@/features/courses-exercises/services/courses-exercises.service'
import { formatVND } from '@/shared/utils/currency'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { Input, Select, Textarea } from '@/shared/components/ui/input'
import { isAppApiError } from '@/shared/api/api-error'
import type { PackageOption, TrainingCourse } from '@/shared/types/api'

export function CoachMyPackagesPage() {
  const [packages, setPackages] = useState<PackageOption[]>([])
  const [courses, setCourses] = useState<TrainingCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [form, setForm] = useState({
    name: '',
    courseId: '',
    sessionCount: 12,
    validityDays: 60,
    price: '3600000',
    description: '',
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    setErrorMessage(null)
    try {
      const [pkgRes, courseRes, offeringRes] = await Promise.all([
        coachesService.getMyPackageOptions({ limit: 100 }),
        coursesExercisesService.getTrainingCourses({ limit: 100 }),
        coachApprovalService.getMyOfferings({ limit: 100 }),
      ])

      const myPackages = pkgRes.data || []
      const allCourses = courseRes.data || []
      const myOfferings = offeringRes.data || []

      // Filter courses where coach has approved offerings or active courses
      const approvedCourseIds = myOfferings
        .filter((o) => o.status === 'APPROVED' && o.isActive)
        .map((o) => o.courseId)

      const availableCourses = allCourses.filter(
        (c) => approvedCourseIds.length === 0 || approvedCourseIds.includes(c.id)
      )

      setPackages(myPackages)
      setCourses(availableCourses.length > 0 ? availableCourses : allCourses)

      if (availableCourses.length > 0 && !form.courseId) {
        setForm((prev) => ({ ...prev, courseId: availableCourses[0].id }))
      }
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không thể tải danh sách gói tập của bạn.')
      } else {
        setErrorMessage('Lỗi kết nối máy chủ.')
      }
    } finally {
      setLoading(false)
    }
  }, [form.courseId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(null), 4000)
  }

  const handleProposePackage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setErrorMessage('Vui lòng nhập tên gói tập.')
      return
    }
    if (!form.courseId) {
      setErrorMessage('Vui lòng chọn khóa học áp dụng.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      const created = await coachApprovalService.createPtPackageOption({
        courseId: form.courseId,
        name: form.name.trim(),
        sessionCount: Number(form.sessionCount),
        validityDays: Number(form.validityDays),
        price: String(form.price),
        description: form.description.trim() || undefined,
      })

      showSuccess(`Đã gửi đề xuất gói "${created.name}" lên Quản lý xét duyệt!`)
      setIsModalOpen(false)
      setForm({
        name: '',
        courseId: courses[0]?.id || '',
        sessionCount: 12,
        validityDays: 60,
        price: '3600000',
        description: '',
      })

      // Refresh list from API
      const updatedPkgs = await coachesService.getMyPackageOptions({ limit: 100 })
      setPackages(updatedPkgs.data || [created, ...packages])
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Gửi đề xuất gói tập thất bại.')
      } else {
        setErrorMessage('Lỗi hệ thống khi gửi đề xuất gói tập.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Toggle Active/Inactive Status (PATCH /pt-package-options/:id/status)
  const handleToggleStatus = async (pkg: PackageOption) => {
    const nextStatus = !pkg.isActive
    setErrorMessage(null)
    try {
      const updated = await coachApprovalService.updatePtPackageOptionStatus(pkg.id, {
        isActive: nextStatus,
      })
      setPackages((prev) =>
        prev.map((item) => (item.id === pkg.id ? { ...item, isActive: updated.isActive } : item))
      )
      showSuccess(`Đã ${nextStatus ? 'mở bán' : 'tạm dừng'} gói tập "${pkg.name}" thành công!`)
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không thể đổi trạng thái gói tập.')
      } else {
        setErrorMessage('Lỗi kết nối khi cập nhật trạng thái.')
      }
    }
  }

  // Edit / Resubmit State
  const [editingPkg, setEditingPkg] = useState<PackageOption | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    sessionCount: 12,
    validityDays: 60,
    price: '3600000',
    description: '',
  })
  const [isEditing, setIsEditing] = useState(false)

  const handleOpenEdit = (pkg: PackageOption) => {
    setEditingPkg(pkg)
    setEditForm({
      name: pkg.name,
      sessionCount: pkg.sessionCount,
      validityDays: pkg.validityDays,
      price: String(pkg.price),
      description: pkg.description || '',
    })
  }

  const handleUpdatePackage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPkg) return
    setIsEditing(true)
    setErrorMessage(null)
    try {
      const updated = await coachApprovalService.updatePtPackageOption(editingPkg.id, {
        name: editForm.name.trim(),
        sessionCount: Number(editForm.sessionCount),
        validityDays: Number(editForm.validityDays),
        price: Number(editForm.price),
        description: editForm.description.trim() || undefined,
      })
      setPackages((prev) =>
        prev.map((item) =>
          item.id === editingPkg.id
            ? { ...item, ...updated, approvalStatus: 'PENDING', rejectionReason: undefined }
            : item
        )
      )
      showSuccess(`Đã cập nhật và gửi duyệt lại gói "${updated.name}"!`)
      setEditingPkg(null)
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Cập nhật gói tập thất bại.')
      } else {
        setErrorMessage('Lỗi kết nối khi cập nhật gói tập.')
      }
    } finally {
      setIsEditing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Khóa Giảng Dạy & Gói Của Tôi (WEB-COA-02)</h1>
          <p className="text-xs text-text-muted mt-1">
            Đề xuất gói huấn luyện cá nhân và quản lý các khóa đào tạo đã được duyệt
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="gap-2 text-xs">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 text-xs">
            <Plus className="h-4 w-4" />
            <span>Đề xuất gói PT mới</span>
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 gap-2">
          <RefreshCw className="h-8 w-8 text-orange-500 animate-spin" />
          <p className="text-xs text-text-muted">Đang tải danh sách gói tập...</p>
        </div>
      ) : packages.length === 0 ? (
        <div className="rounded-2xl border border-border-subtle bg-bg-surface p-12 text-center">
          <Package className="h-12 w-12 text-text-muted mx-auto mb-3" />
          <h3 className="text-base font-semibold text-text-primary">Chưa có gói tập nào</h3>
          <p className="text-xs text-text-muted mt-1">Bấm nút "Đề xuất gói PT mới" để bắt đầu gửi yêu cầu phê duyệt.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 relative overflow-hidden flex flex-col justify-between shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="rounded-full bg-orange-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-orange-500">
                    {pkg.sessionCount} Buổi Tập
                  </span>
                  <StatusBadge status={pkg.approvalStatus} />
                </div>

                <div>
                  <h3 className="text-base font-bold text-text-primary">{pkg.name}</h3>
                  <p className="text-xs text-text-muted mt-1">{pkg.courseName || 'Khóa đào tạo PT'}</p>
                </div>

                <div className="rounded-xl bg-bg-surface-muted p-3 text-xs text-text-primary space-y-1 border border-border-subtle">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Thời hạn:</span>
                    <span className="font-semibold text-text-primary">{pkg.validityDays} Ngày</span>
                  </div>
                  <div className="flex justify-between border-t border-border-subtle pt-1">
                    <span className="text-text-muted">Học phí:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatVND(pkg.price)}</span>
                  </div>
                </div>

                {pkg.rejectionReason && (
                  <p className="text-[11px] text-danger italic bg-danger/10 rounded p-2 border border-danger/20">
                    Lý do từ chối: {pkg.rejectionReason}
                  </p>
                )}

                {pkg.approvalStatus === 'APPROVED' && (
                  <div className="pt-2 border-t border-border-subtle flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleStatus(pkg)}
                      className={`text-xs gap-1.5 ${
                        pkg.isActive
                          ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border-rose-500/20'
                          : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/20'
                      }`}
                    >
                      <span>{pkg.isActive ? 'Tạm dừng bán' : 'Kích hoạt mở bán'}</span>
                    </Button>
                  </div>
                )}

                {pkg.approvalStatus === 'REJECTED' && (
                  <div className="pt-2 border-t border-border-subtle flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenEdit(pkg)}
                      className="text-xs text-orange-500 border-orange-500/30 hover:bg-orange-500/10"
                    >
                      Sửa & gửi duyệt lại
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Rejected Package Modal */}
      <Modal
        isOpen={!!editingPkg}
        onClose={() => !isEditing && setEditingPkg(null)}
        title="Chỉnh sửa & Gửi duyệt lại gói tập"
        description="Cập nhật lại thông tin gói tập theo yêu cầu của Quản lý để gửi xét duyệt lại"
      >
        <form onSubmit={handleUpdatePackage} className="space-y-4">
          <Input
            label="Tên gói tập"
            required
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            disabled={isEditing}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Số buổi tập"
              type="number"
              required
              value={editForm.sessionCount}
              onChange={(e) => setEditForm({ ...editForm, sessionCount: Number(e.target.value) })}
              disabled={isEditing}
            />
            <Input
              label="Hạn sử dụng (Ngày)"
              type="number"
              required
              value={editForm.validityDays}
              onChange={(e) => setEditForm({ ...editForm, validityDays: Number(e.target.value) })}
              disabled={isEditing}
            />
          </div>
          <Input
            label="Học phí đề xuất (VND)"
            type="number"
            required
            value={editForm.price}
            onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
            disabled={isEditing}
          />
          <Textarea
            label="Ghi chú mô tả"
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            disabled={isEditing}
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
            <Button type="button" variant="ghost" onClick={() => setEditingPkg(null)} disabled={isEditing}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isEditing} disabled={isEditing}>
              Cập nhật & Gửi duyệt lại
            </Button>
          </div>
        </form>
      </Modal>

      {/* Propose Package Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
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
            disabled={isSubmitting}
          />
          <Select
            label="Khóa học áp dụng"
            value={form.courseId}
            onChange={(e) => setForm({ ...form, courseId: e.target.value })}
            options={courses.map((c) => ({ value: c.id, label: c.name }))}
            disabled={isSubmitting}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Số buổi tập"
              type="number"
              required
              value={form.sessionCount}
              onChange={(e) => setForm({ ...form, sessionCount: Number(e.target.value) })}
              disabled={isSubmitting}
            />
            <Input
              label="Hạn sử dụng (Ngày)"
              type="number"
              required
              value={form.validityDays}
              onChange={(e) => setForm({ ...form, validityDays: Number(e.target.value) })}
              disabled={isSubmitting}
            />
          </div>
          <Input
            label="Học phí đề xuất (VND)"
            type="number"
            required
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            disabled={isSubmitting}
          />
          <Textarea
            label="Ghi chú mô tả (tùy chọn)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Mô tả quyền lợi học viên, cam kết hiệu quả..."
            disabled={isSubmitting}
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
              Gửi Quản lý duyệt
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
