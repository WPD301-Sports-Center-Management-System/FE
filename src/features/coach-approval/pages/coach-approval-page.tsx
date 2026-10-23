import { useState, useEffect, useCallback, useMemo } from 'react'
import { Check, X, RefreshCw, AlertCircle, Award, Search, Power } from 'lucide-react'
import { toast } from 'sonner'
import { formatVND } from '@/shared/utils/currency'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { Textarea } from '@/shared/components/ui/input'
import { coachApprovalService } from '@/features/coach-approval/services/coach-approval.service'
import { isAppApiError } from '@/shared/api/api-error'
import type { OfferingDetail, PackageOption } from '@/features/coach-approval/types/coach-approval.types'

export function CoachApprovalPage() {
  const [activeTab, setActiveTab] = useState<'offering' | 'package'>('offering')
  const [offerings, setOfferings] = useState<OfferingDetail[]>([])
  const [packageOptions, setPackageOptions] = useState<PackageOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Filter States
  const [offeringSearch, setOfferingSearch] = useState('')
  const [offeringStatusFilter, setOfferingStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL')

  const [packageSearch, setPackageSearch] = useState('')
  const [packageStatusFilter, setPackageStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL')

  // Action states
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Reject Modal State
  const [rejectItem, setRejectItem] = useState<{ id: string; type: 'package' | 'offering' } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [isSubmittingReject, setIsSubmittingReject] = useState(false)

  const loadApprovals = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const [offRes, pkgRes] = await Promise.all([
        coachApprovalService.getCoachCourseOfferings(),
        coachApprovalService.getPtPackageOptions({ limit: 100 }),
      ])
      setOfferings(offRes.data || [])
      setPackageOptions(pkgRes.data || [])
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không thể tải danh sách phê duyệt HLV & Gói PT.')
      } else {
        setErrorMessage('Lỗi kết nối máy chủ.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadApprovals()
  }, [loadApprovals])

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg)
    toast.success(msg)
    setTimeout(() => setSuccessMessage(null), 4000)
  }

  // Handle Approve Offering (PATCH /coach-course-offerings/:id/approve)
  const handleApproveOffering = async (off: OfferingDetail) => {
    setProcessingId(off.id)
    setErrorMessage(null)
    try {
      const updated = await coachApprovalService.approveCoachCourseOffering(off.id)
      setOfferings((prev) =>
        prev.map((item) =>
          item.id === off.id
            ? { ...item, status: 'APPROVED', isActive: updated.isActive !== undefined ? updated.isActive : true }
            : item
        )
      )
      showSuccess(`Đã phê duyệt năng lực giảng dạy cho HLV ${off.coach?.user?.fullName || off.coachName || ''}!`)
    } catch (err) {
      const msg = isAppApiError(err) ? (err.message || 'Phê duyệt HLV thất bại.') : 'Lỗi hệ thống khi phê duyệt HLV.'
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setProcessingId(null)
    }
  }

  // Handle Toggle Offering Active Status (PATCH /coach-course-offerings/:id/status)
  const handleToggleOfferingStatus = async (off: OfferingDetail) => {
    const nextStatus = !off.isActive
    setProcessingId(off.id)
    setErrorMessage(null)
    try {
      const updated = await coachApprovalService.updateOfferingStatus(off.id, {
        isActive: nextStatus,
      })
      setOfferings((prev) =>
        prev.map((item) =>
          item.id === off.id ? { ...item, isActive: updated.isActive } : item
        )
      )
      showSuccess(`Đã ${nextStatus ? 'kích hoạt' : 'tạm dừng'} giảng dạy khóa học thành công!`)
    } catch (err) {
      const msg = isAppApiError(err) ? (err.message || 'Không thể đổi trạng thái giảng dạy.') : 'Lỗi kết nối khi cập nhật trạng thái.'
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setProcessingId(null)
    }
  }

  // Handle Toggle Package Active Status (PATCH /pt-package-options/:id/status)
  const handleTogglePackageStatus = async (pkg: PackageOption) => {
    const nextStatus = !pkg.isActive
    setProcessingId(pkg.id)
    setErrorMessage(null)
    try {
      const updated = await coachApprovalService.updatePtPackageOptionStatus(pkg.id, {
        isActive: nextStatus,
      })
      setPackageOptions((prev) =>
        prev.map((item) =>
          item.id === pkg.id ? { ...item, isActive: updated.isActive } : item
        )
      )
      showSuccess(`Đã ${nextStatus ? 'kích hoạt' : 'tạm dừng'} mở bán gói tập thành công!`)
    } catch (err) {
      const msg = isAppApiError(err) ? (err.message || 'Không thể đổi trạng thái gói tập.') : 'Lỗi kết nối khi cập nhật trạng thái.'
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setProcessingId(null)
    }
  }

  // Handle Approve Package Option (PATCH /pt-package-options/:id/approve)
  const handleApprovePackage = async (id: string) => {
    setProcessingId(id)
    setErrorMessage(null)
    try {
      const updated = await coachApprovalService.approvePtPackageOption(id)
      setPackageOptions((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updated, approvalStatus: 'APPROVED', isActive: true } : p))
      )
      showSuccess('Đã phê duyệt gói tập PT thành công!')
    } catch (err) {
      const msg = isAppApiError(err) ? (err.message || 'Phê duyệt gói tập thất bại.') : 'Lỗi hệ thống khi phê duyệt gói tập.'
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setProcessingId(null)
    }
  }

  // Handle Reject Submission (PATCH /coach-course-offerings/:id/reject or /pt-package-options/:id/reject)
  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectItem || !rejectReason.trim()) return

    setIsSubmittingReject(true)
    setErrorMessage(null)
    try {
      if (rejectItem.type === 'package') {
        const updated = await coachApprovalService.rejectPtPackageOption(rejectItem.id, {
          rejectionReason: rejectReason.trim(),
        })
        setPackageOptions((prev) =>
          prev.map((p) =>
            p.id === rejectItem.id
              ? { ...p, approvalStatus: 'REJECTED', isActive: false, rejectionReason: updated.rejectionReason || rejectReason.trim() }
              : p
          )
        )
        showSuccess('Đã từ chối phê duyệt gói tập PT.')
      } else {
        const updated = await coachApprovalService.rejectCoachCourseOffering(rejectItem.id, {
          rejectionReason: rejectReason.trim(),
        })
        setOfferings((prev) =>
          prev.map((o) =>
            o.id === rejectItem.id
              ? {
                  ...o,
                  status: 'REJECTED',
                  isActive: false,
                  rejectionReason: updated.rejectionReason || rejectReason.trim(),
                }
              : o
          )
        )
        showSuccess('Đã ghi nhận lý do và từ chối phê duyệt HLV.')
      }
      setRejectItem(null)
      setRejectReason('')
    } catch (err) {
      const msg = isAppApiError(err) ? (err.message || 'Từ chối phê duyệt thất bại.') : 'Lỗi hệ thống khi từ chối phê duyệt.'
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setIsSubmittingReject(false)
    }
  }

  // Filtered Offerings
  const filteredOfferings = useMemo(() => {
    return offerings.filter((off) => {
      const s = offeringSearch.toLowerCase()
      const coachName = off.coach?.user?.fullName || off.coachName || ''
      const courseName = off.course?.name || off.courseName || ''
      const note = off.experienceNote || ''

      const matchesSearch =
        coachName.toLowerCase().includes(s) ||
        courseName.toLowerCase().includes(s) ||
        note.toLowerCase().includes(s)

      const matchesStatus =
        offeringStatusFilter === 'ALL' || off.status === offeringStatusFilter

      return matchesSearch && matchesStatus
    })
  }, [offerings, offeringSearch, offeringStatusFilter])

  // Filtered Packages
  const filteredPackages = useMemo(() => {
    return packageOptions.filter((pkg) => {
      const s = packageSearch.toLowerCase()
      const pkgName = pkg.name.toLowerCase()
      const coachName = ((pkg as any).coach?.user?.fullName || pkg.coachName || '').toLowerCase()
      const courseName = ((pkg as any).course?.name || pkg.courseName || '').toLowerCase()

      const matchesSearch =
        pkgName.includes(s) || coachName.includes(s) || courseName.includes(s)

      const matchesStatus =
        packageStatusFilter === 'ALL' || pkg.approvalStatus === packageStatusFilter

      return matchesSearch && matchesStatus
    })
  }, [packageOptions, packageSearch, packageStatusFilter])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
            <Award className="h-6 w-6 text-orange-500" />
            <span>Phê Duyệt HLV & Gói Tập (WEB-MAN-07)</span>
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Xét duyệt năng lực dạy khóa học và các gói huấn luyện PT 1:1 do Huấn luyện viên đề xuất
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={loadApprovals}
          disabled={isLoading}
          className="gap-1.5 text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </Button>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-xs text-danger">
          <AlertCircle className="h-4 w-4 shrink-0 text-danger mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-success/30 bg-success/10 p-4 text-xs text-success">
          <Check className="h-4 w-4 shrink-0 text-success mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border-subtle">
        <button
          onClick={() => setActiveTab('offering')}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'offering'
              ? 'border-orange-500 text-orange-500'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Khóa đăng ký giảng dạy ({offerings.length})
        </button>
        <button
          onClick={() => setActiveTab('package')}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'package'
              ? 'border-orange-500 text-orange-500'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Gói PT HLV đề xuất ({packageOptions.length})
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-xs text-text-muted">Đang tải danh sách phê duyệt HLV & Gói PT...</p>
        </div>
      ) : activeTab === 'offering' ? (
        <div className="space-y-4">
          {/* Search & Filter Bar for Offerings */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-bg-surface p-3.5 rounded-2xl border border-border-subtle shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                value={offeringSearch}
                onChange={(e) => setOfferingSearch(e.target.value)}
                placeholder="Tìm HLV, khóa đào tạo hoặc ghi chú..."
                className="w-full pl-9 pr-3.5 py-2 bg-bg-input border border-border-subtle rounded-xl text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs text-text-muted">Trạng thái:</span>
              <select
                value={offeringStatusFilter}
                onChange={(e) => setOfferingStatusFilter(e.target.value as any)}
                className="bg-bg-input border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary"
              >
                <option value="ALL">Tất cả ({offerings.length})</option>
                <option value="PENDING">Chờ duyệt ({offerings.filter((o) => o.status === 'PENDING').length})</option>
                <option value="APPROVED">Đã duyệt ({offerings.filter((o) => o.status === 'APPROVED').length})</option>
                <option value="REJECTED">Từ chối ({offerings.filter((o) => o.status === 'REJECTED').length})</option>
              </select>
            </div>
          </div>

          {filteredOfferings.length === 0 ? (
            <div className="text-center py-12 text-text-muted text-xs rounded-2xl border border-border-subtle bg-bg-surface">
              {offeringSearch || offeringStatusFilter !== 'ALL'
                ? 'Không tìm thấy hồ sơ đăng ký dạy phù hợp bộ lọc.'
                : 'Chưa có đề xuất đăng ký dạy khóa học nào.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredOfferings.map((off) => {
                const coachName = off.coach?.user?.fullName || off.coachName || 'Huấn luyện viên'
                const courseTitle = off.course?.name || off.courseName || 'Khóa tập PT 1:1'
                const isApproved = off.status === 'APPROVED'

                return (
                  <div
                    key={off.id}
                    className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-3 hover:border-border-strong shadow-sm transition-colors flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-base font-bold text-text-primary">{courseTitle}</h3>
                          <p className="text-xs text-orange-500 font-semibold mt-0.5">HLV: {coachName}</p>
                          {off.course?.difficultyLevel && (
                            <span className="inline-block mt-1 text-[10px] rounded bg-bg-surface-muted px-2 py-0.5 text-text-muted">
                              Độ khó: {off.course.difficultyLevel}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <StatusBadge status={off.status} />
                          {isApproved && (
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                off.isActive
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {off.isActive ? 'Đang mở nhận lớp' : 'Tạm dừng nhận lớp'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl bg-bg-surface-muted p-3 text-xs text-text-primary border border-border-subtle">
                        <strong className="text-text-primary">Kinh nghiệm & Năng lực:</strong>
                        <p className="mt-1 leading-relaxed text-text-muted">
                          {off.experienceNote || off.course?.description || 'HLV đăng ký đảm nhận huấn luyện chuyên sâu cho bộ môn này.'}
                        </p>
                      </div>

                      {off.rejectionReason && (
                        <p className="text-xs text-danger italic bg-danger/10 rounded-lg p-2.5 border border-danger/20">
                          Lý do từ chối: {off.rejectionReason}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle mt-2">
                      {off.status === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setRejectItem({ id: off.id, type: 'offering' })}
                            disabled={processingId === off.id}
                            className="text-xs"
                          >
                            <X className="h-3.5 w-3.5 mr-1" />
                            Từ chối
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleApproveOffering(off)}
                            disabled={processingId === off.id}
                            isLoading={processingId === off.id}
                            className="text-xs"
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Phê duyệt
                          </Button>
                        </>
                      )}

                      {isApproved && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleOfferingStatus(off)}
                          disabled={processingId === off.id}
                          className={`text-xs gap-1.5 ${
                            off.isActive
                              ? 'text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 border-rose-500/20'
                              : 'text-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-300 border-emerald-500/20'
                          }`}
                        >
                          <Power className={`h-3.5 w-3.5 ${processingId === off.id ? 'animate-spin' : ''}`} />
                          <span>{off.isActive ? 'Tạm dừng giảng dạy' : 'Kích hoạt giảng dạy'}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Search & Filter Bar for Packages */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-bg-surface p-3.5 rounded-2xl border border-border-subtle shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                value={packageSearch}
                onChange={(e) => setPackageSearch(e.target.value)}
                placeholder="Tìm tên gói, HLV hoặc khóa học..."
                className="w-full pl-9 pr-3.5 py-2 bg-bg-input border border-border-subtle rounded-xl text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs text-text-muted">Trạng thái:</span>
              <select
                value={packageStatusFilter}
                onChange={(e) => setPackageStatusFilter(e.target.value as any)}
                className="bg-bg-input border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-primary"
              >
                <option value="ALL">Tất cả ({packageOptions.length})</option>
                <option value="PENDING">Chờ duyệt ({packageOptions.filter((p) => p.approvalStatus === 'PENDING').length})</option>
                <option value="APPROVED">Đã duyệt ({packageOptions.filter((p) => p.approvalStatus === 'APPROVED').length})</option>
                <option value="REJECTED">Từ chối ({packageOptions.filter((p) => p.approvalStatus === 'REJECTED').length})</option>
              </select>
            </div>
          </div>

          {filteredPackages.length === 0 ? (
            <div className="text-center py-12 text-text-muted text-xs rounded-2xl border border-border-subtle bg-bg-surface">
              {packageSearch || packageStatusFilter !== 'ALL'
                ? 'Không tìm thấy gói tập PT phù hợp với bộ lọc.'
                : 'Chưa có gói tập PT nào được tạo.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredPackages.map((pkg) => {
                const coachName = (pkg as any).coach?.user?.fullName || pkg.coachName || 'Gói trung tâm'
                const courseName = (pkg as any).course?.name || pkg.courseName || 'Khóa đào tạo'

                return (
                  <div key={pkg.id} className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-bold text-text-primary">{pkg.name}</h3>
                        <p className="text-xs text-orange-500 font-medium">HLV: {coachName}</p>
                      </div>
                      <StatusBadge status={pkg.approvalStatus} />
                    </div>

                    <div className="space-y-1.5 text-xs text-text-primary bg-bg-surface-muted p-3.5 rounded-xl border border-border-subtle">
                      <div className="flex justify-between">
                        <span className="text-text-muted">Khóa áp dụng:</span>
                        <span className="font-semibold text-text-primary">{courseName}</span>
                      </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Số buổi tập:</span>
                      <span className="font-semibold text-text-primary">{pkg.sessionCount} Buổi</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Hạn sử dụng:</span>
                      <span className="font-semibold text-text-primary">{pkg.validityDays} Ngày</span>
                    </div>
                    <div className="flex justify-between border-t border-border-subtle pt-1.5">
                      <span className="text-text-muted">Giá đề xuất:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatVND(pkg.price)}</span>
                    </div>
                  </div>

                  {pkg.rejectionReason && (
                    <p className="text-xs text-danger italic bg-danger/10 rounded-lg p-2.5 border border-danger/20">
                      Lý do từ chối: {pkg.rejectionReason}
                    </p>
                  )}

                  {pkg.approvalStatus === 'PENDING' && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setRejectItem({ id: pkg.id, type: 'package' })}
                        disabled={processingId === pkg.id}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Từ chối
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleApprovePackage(pkg.id)}
                        disabled={processingId === pkg.id}
                        isLoading={processingId === pkg.id}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Phê duyệt
                      </Button>
                    </div>
                  )}

                  {pkg.approvalStatus === 'APPROVED' && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTogglePackageStatus(pkg)}
                        disabled={processingId === pkg.id}
                        className={`text-xs gap-1.5 ${
                          pkg.isActive
                            ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border-rose-500/20'
                            : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/20'
                        }`}
                      >
                        <Power className={`h-3.5 w-3.5 ${processingId === pkg.id ? 'animate-spin' : ''}`} />
                        <span>{pkg.isActive ? 'Tạm dừng mở bán' : 'Kích hoạt mở bán'}</span>
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
            </div>
          )}
        </div>
      )}

      {/* Modal Rejection with mandatory reason */}
      <Modal
        isOpen={!!rejectItem}
        onClose={() => {
          if (!isSubmittingReject) {
            setRejectItem(null)
            setRejectReason('')
          }
        }}
        title="Từ chối phê duyệt"
        description="Vui lòng cung cấp lý do từ chối để HLV điều chỉnh và gửi lại"
      >
        <form onSubmit={handleConfirmReject} className="space-y-4">
          <Textarea
            label="Lý do từ chối (Bắt buộc)"
            required
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Ví dụ: Cần bổ sung chứng chỉ chuyên môn hoặc điều chỉnh giá đề xuất..."
            disabled={isSubmittingReject}
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setRejectItem(null)}
              disabled={isSubmittingReject}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="danger"
              isLoading={isSubmittingReject}
              disabled={isSubmittingReject || !rejectReason.trim()}
            >
              Xác nhận từ chối
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
