import { tierLabel } from '@/shared/utils/coach-tier'
import { RefreshCw, Layers, ListOrdered, UserCheck, Package } from 'lucide-react'
import { Modal } from '@/shared/components/ui/modal'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import type { TrainingCourseDetail } from '../../types/courses-exercises.types'

interface CourseDetailModalProps {
  isOpen: boolean
  onClose: () => void
  isLoading: boolean
  courseDetail: TrainingCourseDetail | null
}

export function CourseDetailModal({
  isOpen,
  onClose,
  isLoading,
  courseDetail,
}: CourseDetailModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi Tiết Khóa Đào Tạo & Giáo Án"
      description="Toàn bộ thông tin nhóm cơ, bài tập theo thứ tự, HLV phụ trách và gói cước PT"
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <p className="text-xs text-text-muted">Đang tải chi tiết khóa học...</p>
        </div>
      ) : courseDetail ? (
        <div className="space-y-5 text-xs text-text-muted">
          {/* Basic Info */}
          <div className="rounded-xl border border-border-subtle bg-bg-surface-muted p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-text-primary">{courseDetail.name}</h4>
              <StatusBadge status={courseDetail.isActive ? 'ACTIVE' : 'INACTIVE'} />
            </div>
            <p className="text-text-muted leading-relaxed">
              {courseDetail.description || 'Không có mô tả.'}
            </p>
            {courseDetail.objective && (
              <div className="text-text-muted">
                <strong className="text-primary">Mục tiêu:</strong> {courseDetail.objective}
              </div>
            )}
          </div>

          {/* Target Muscle Groups */}
          <div className="space-y-2">
            <h5 className="font-bold text-text-primary flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-emerald-500" /> Nhóm cơ tác động (
              {courseDetail.courseMuscleGroupsCourseId?.length || 0})
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {courseDetail.courseMuscleGroupsCourseId &&
              courseDetail.courseMuscleGroupsCourseId.length > 0 ? (
                courseDetail.courseMuscleGroupsCourseId.map((cmg, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg p-2.5 border flex items-center justify-between ${
                      cmg.isPrimary
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'bg-bg-surface-muted border-border-subtle text-text-primary'
                    }`}
                  >
                    <span>{cmg.muscleGroup?.name || 'Nhóm cơ'}</span>
                    {cmg.isPrimary && (
                      <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        Nhóm cơ chính
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-text-muted italic col-span-2">Chưa gán nhóm cơ nào.</p>
              )}
            </div>
          </div>

          {/* Exercises Syllabus */}
          <div className="space-y-2">
            <h5 className="font-bold text-text-primary flex items-center gap-1.5">
              <ListOrdered className="h-4 w-4 text-purple-500" /> Giáo trình bài tập (
              {courseDetail.courseExercisesCourseId?.length || 0})
            </h5>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {courseDetail.courseExercisesCourseId &&
              courseDetail.courseExercisesCourseId.length > 0 ? (
                courseDetail.courseExercisesCourseId
                  .slice()
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-border-subtle bg-bg-surface-muted p-3 flex items-start gap-3"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold shrink-0 text-xs">
                        {item.sortOrder}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-text-primary">
                            {item.exercise?.name || 'Bài tập'}
                          </span>
                          <span className="text-xs text-text-muted">
                            Độ khó: {item.exercise?.difficultyLevel || 'N/A'}
                          </span>
                        </div>
                        {item.coachNote && (
                          <p className="text-xs text-primary mt-1 bg-primary/10 rounded p-1.5 border border-primary/20">
                            <strong>Lưu ý HLV:</strong> {item.coachNote}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-text-muted italic">
                  Chưa cấu hình giáo trình bài tập cho khóa học này.
                </p>
              )}
            </div>
          </div>

          {/* Approved Coaches & PT Packages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border-subtle">
            <div className="space-y-1.5">
              <h6 className="font-semibold text-text-primary flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5 text-sky-500" /> HLV được phân công:
              </h6>
              <div className="text-xs text-text-muted">
                {courseDetail.coachCourseOfferingsCourseId &&
                courseDetail.coachCourseOfferingsCourseId.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {courseDetail.coachCourseOfferingsCourseId.map((offering, idx) => (
                      <span key={idx} className="rounded bg-bg-surface-muted border border-border-subtle px-2 py-0.5 text-text-primary">
                        {offering.coach?.user?.fullName || 'HLV chuyên trách'}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span>Chưa có HLV đăng ký nhận lớp.</span>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <h6 className="font-semibold text-text-primary flex items-center gap-1">
                <Package className="h-3.5 w-3.5 text-amber-500" /> Gói PT đang mở bán:
              </h6>
              <div className="text-xs text-text-muted">
                {courseDetail.ptPackageOptionsCourseId &&
                courseDetail.ptPackageOptionsCourseId.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {courseDetail.ptPackageOptionsCourseId.map((pkg, idx) => (
                      <span key={idx} className="rounded bg-bg-surface-muted border border-border-subtle px-2 py-0.5 text-text-primary">
                        {pkg.name} ({pkg.sessionCount} buổi) · Giá từ {Number(pkg.priceFrom ?? pkg.price).toLocaleString('vi-VN')} ₫{pkg.minCoachTier && pkg.minCoachTier !== 'STANDARD' ? ' · Từ bậc ' + tierLabel(pkg.minCoachTier) : ''}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span>Chưa tạo gói cước bán lẻ.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
