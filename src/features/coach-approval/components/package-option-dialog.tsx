import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Input, Select, Textarea } from '@/shared/components/ui/input'
import { Modal } from '@/shared/components/ui/modal'
import { ErrorBanner, Notice } from '@/features/fixed-pt/components/ui'
import { useSubmit } from '@/features/fixed-pt/hooks'
import { coachApprovalService } from '../services/coach-approval.service'
import type { PackageOption, TrainingCourse } from '@/shared/types/api'

export function PackageOptionDialog({
  courses,
  initial,
  shared = false,
  onClose,
  onSaved,
}: {
  courses: TrainingCourse[]
  initial?: PackageOption
  shared?: boolean
  onClose: () => void
  onSaved: (option: PackageOption) => void
}) {
  const [form, setForm] = useState({
    courseId: initial?.courseId ?? courses[0]?.id ?? '',
    name: initial?.name ?? '',
    durationMinutes: initial?.durationMinutes ?? 60,
    sessionCount: initial ? String(initial.sessionCount) : '',
    validityDays: initial ? String(initial.validityDays) : '',
    price: initial ? String(initial.price) : '',
    description: initial?.description ?? '',
  })
  const submit = useSubmit()
  const update = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }))
  return (
    <Modal
      isOpen
      onClose={() => !submit.busy && onClose()}
      maxWidth="lg"
      title={
        initial
          ? 'Chỉnh sửa gói PT'
          : shared
            ? 'Tạo gói PT chung'
            : 'Đề xuất gói PT mới'
      }
      description={
        shared
          ? 'Gói chung được mở bán cho Coach có quyền dạy khóa tương ứng.'
          : 'Gói riêng được gửi Manager duyệt trước khi mở bán.'
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          void submit.run(async () => {
            const details = {
              name: form.name.trim(),
              durationMinutes: Number(form.durationMinutes),
              sessionCount: Number(form.sessionCount),
              validityDays: Number(form.validityDays),
              price: Number(form.price),
              description: form.description.trim() || undefined,
            }
            const result = initial
              ? await coachApprovalService.updatePtPackageOption(
                  initial.id,
                  details,
                )
              : await coachApprovalService.createPtPackageOption({
                  ...details,
                  courseId: form.courseId,
                  price: String(details.price),
                })
            onSaved(result)
          })
        }}
      >
        <ErrorBanner message={submit.error} />
        <fieldset disabled={submit.busy} className="space-y-4">
          <Select
            label="Khóa học áp dụng"
            value={form.courseId}
            required
            disabled={!!initial}
            options={courses.map((c) => ({ value: c.id, label: c.name }))}
            onChange={(e) => update('courseId', e.target.value)}
          />
          <Input
            label="Tên gói tập"
            required
            maxLength={180}
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
          />
          <Select
            label="Thời lượng một buổi"
            value={form.durationMinutes}
            options={[60, 90, 120].map((n) => ({
              value: String(n),
              label: `${n} phút`,
            }))}
            onChange={(e) => update('durationMinutes', Number(e.target.value))}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Số buổi tập"
              required
              type="number"
              min={1}
              max={1000}
              step={1}
              value={form.sessionCount}
              onChange={(e) => update('sessionCount', e.target.value)}
            />
            <Input
              label="Hạn sử dụng (ngày)"
              required
              type="number"
              min={1}
              max={3650}
              step={1}
              value={form.validityDays}
              onChange={(e) => update('validityDays', e.target.value)}
            />
          </div>
          <Input
            label="Học phí (VND)"
            required
            type="number"
            min={1}
            max={999999999999}
            step={1}
            value={form.price}
            onChange={(e) => update('price', e.target.value)}
          />
          <Textarea
            label="Mô tả và điều khoản gói"
            maxLength={5000}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
          />
        </fieldset>
        <Notice>
          Hạn sử dụng tính từ lịch buổi đầu tiên được xác nhận. Hạn bắt đầu sử
          dụng theo chính sách lưu tại thời điểm mua.
        </Notice>
        {initial && !shared && (
          <Notice tone="warning">
            Lưu thay đổi sẽ tạm đóng bán và gửi Manager duyệt lại. Đơn đã mua
            giữ điều khoản đã lưu.
          </Notice>
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={submit.busy}
            onClick={onClose}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={!form.courseId || !form.name.trim()}
            isLoading={submit.busy}
          >
            {shared
              ? 'Lưu gói chung'
              : initial
                ? 'Cập nhật & gửi duyệt lại'
                : 'Gửi Manager duyệt'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
