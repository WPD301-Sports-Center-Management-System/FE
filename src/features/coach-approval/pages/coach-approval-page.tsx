import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { db } from '@/mocks/mock-server'
import { formatVND } from '@/shared/utils/currency'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { Textarea } from '@/shared/components/ui/input'
import type { Offering, PackageOption } from '@/shared/types/api'

export function CoachApprovalPage() {
  const [activeTab, setActiveTab] = useState<'package' | 'offering'>('package')
  const [packageOptions, setPackageOptions] = useState<PackageOption[]>([...db.packageOptions])
  const [offerings, setOfferings] = useState<Offering[]>([...db.offerings])

  // Reject Modal State
  const [rejectItem, setRejectItem] = useState<{ id: string; type: 'package' | 'offering' } | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const handleApprovePackage = (id: string) => {
    const pkg = db.packageOptions.find((p) => p.id === id)
    if (pkg) {
      pkg.approvalStatus = 'APPROVED'
      setPackageOptions([...db.packageOptions])
    }
  }

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectItem || !rejectReason.trim()) return

    if (rejectItem.type === 'package') {
      const pkg = db.packageOptions.find((p) => p.id === rejectItem.id)
      if (pkg) {
        pkg.approvalStatus = 'REJECTED'
        pkg.rejectionReason = rejectReason
        setPackageOptions([...db.packageOptions])
      }
    } else {
      const off = db.offerings.find((o) => o.id === rejectItem.id)
      if (off) {
        off.status = 'REJECTED'
        off.rejectionReason = rejectReason
        setOfferings([...db.offerings])
      }
    }

    setRejectItem(null)
    setRejectReason('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Phê Duyệt HLV & Gói Tập (WEB-MAN-07)</h1>
        <p className="text-xs text-slate-400 mt-1">
          Xét duyệt năng lực dạy khóa học và các gói huấn luyện PT 1:1 do Huấn luyện viên đề xuất
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('package')}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'package'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Gói PT HLV đề xuất ({packageOptions.length})
        </button>
        <button
          onClick={() => setActiveTab('offering')}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'offering'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Khóa đăng ký giảng dạy ({offerings.length})
        </button>
      </div>

      {/* Tab: Package Options */}
      {activeTab === 'package' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {packageOptions.map((pkg) => (
            <div key={pkg.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">{pkg.name}</h3>
                  <p className="text-xs text-orange-400 font-medium">HLV: {pkg.coachName || 'Gói trung tâm'}</p>
                </div>
                <StatusBadge status={pkg.approvalStatus} />
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 bg-slate-800/40 p-3.5 rounded-xl">
                <div className="flex justify-between">
                  <span className="text-slate-400">Khóa áp dụng:</span>
                  <span className="font-semibold text-slate-200">{pkg.courseName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Số buổi tập:</span>
                  <span className="font-semibold text-slate-200">{pkg.sessionCount} Buổi</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Hạn sử dụng:</span>
                  <span className="font-semibold text-slate-200">{pkg.validityDays} Ngày</span>
                </div>
                <div className="flex justify-between border-t border-slate-700/60 pt-1.5">
                  <span className="text-slate-400">Giá đề xuất:</span>
                  <span className="font-bold text-emerald-400">{formatVND(pkg.price)}</span>
                </div>
              </div>

              {pkg.rejectionReason && (
                <p className="text-xs text-red-400 italic">Lý do từ chối: {pkg.rejectionReason}</p>
              )}

              {pkg.approvalStatus === 'PENDING' && (
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setRejectItem({ id: pkg.id, type: 'package' })}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Từ chối
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleApprovePackage(pkg.id)}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Phê duyệt
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab: Offerings */}
      {activeTab === 'offering' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {offerings.map((off) => (
            <div key={off.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">{off.courseName}</h3>
                  <p className="text-xs text-orange-400">HLV: {off.coachName}</p>
                </div>
                <StatusBadge status={off.status} />
              </div>

              <p className="text-xs text-slate-300">{off.experienceNote}</p>

              {off.status === 'PENDING' && (
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setRejectItem({ id: off.id, type: 'offering' })}
                  >
                    Từ chối
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      off.status = 'APPROVED'
                      setOfferings([...db.offerings])
                    }}
                  >
                    Phê duyệt
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Rejection with mandatory reason */}
      <Modal
        isOpen={!!rejectItem}
        onClose={() => {
          setRejectItem(null)
          setRejectReason('')
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
            placeholder="Ví dụ: Giá đề xuất quá cao so với mặt bằng chung..."
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setRejectItem(null)}>
              Hủy
            </Button>
            <Button type="submit" variant="danger">
              Xác nhận từ chối
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
