import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/input'
import { Modal } from '@/shared/components/ui/modal'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { coachesService } from '@/features/coaches/services/coaches.service'
import { coursesExercisesService } from '@/features/courses-exercises/services/courses-exercises.service'
import {
  Empty,
  ErrorBanner,
  Loadable,
  Notice,
  Page,
  Panel,
  money,
} from '@/features/fixed-pt/components/ui'
import { useLoad, useSubmit } from '@/features/fixed-pt/hooks'
import { coachApprovalService } from '../services/coach-approval.service'
import { PackageOptionDialog } from '../components/package-option-dialog'
import type { OfferingDetail } from '../types/coach-approval.types'
import type { PackageOption } from '@/shared/types/api'
import { fetchAllPages } from '@/shared/api/pagination'

export function CoachMyPackagesPage() {
  const state = useLoad(async () => {
    const [packages, courses, offerings, options] = await Promise.all([
      fetchAllPages((params) => coachesService.getMyPackageOptions(params)),
      fetchAllPages((params) =>
        coursesExercisesService.getTrainingCourses(params),
      ),
      fetchAllPages((params) => coachApprovalService.getMyOfferings(params)),
      fetchAllPages((params) =>
        coachApprovalService.getPtPackageOptions(params),
      ),
    ])
    return { packages, courses, offerings, options }
  })
  const [tab, setTab] = useState<'offering' | 'own' | 'shared'>('offering')
  const [dialog, setDialog] = useState<{
    offering: OfferingDetail | null
    courseId: string
  } | null>(null)
  const [note, setNote] = useState('')
  const [packageDialog, setPackageDialog] = useState<
    PackageOption | 'new' | null
  >(null)
  const [success, setSuccess] = useState('')
  const action = useSubmit()
  const [filter, setFilter] = useState('ALL')
  const data = state.data
  const activeCourses = data?.courses.filter((c) => c.isActive) ?? []
  const approvedIds = new Set(
    data?.offerings
      .filter((o) => o.status === 'APPROVED' && o.isActive)
      .map((o) => o.courseId),
  )
  const eligible = activeCourses.filter((c) => approvedIds.has(c.id))
  const shared =
    data?.options.filter(
      (p) =>
        !p.coachId &&
        approvedIds.has(p.courseId) &&
        activeCourses.some((c) => c.id === p.courseId),
    ) ?? []
  const changed = (message: string) => {
    setSuccess(message)
    void state.reload()
  }
  const openOffering = (courseId: string, offering: OfferingDetail | null) => {
    action.clear()
    setNote(offering?.experienceNote ?? '')
    setDialog({ courseId, offering })
  }
  const renderPackage = (p: PackageOption, common: boolean) => (
    <Panel key={p.id} title={p.name}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusBadge status={p.approvalStatus} />
        <span className="text-sm text-text-muted">
          {p.isActive ? 'Đang mở bán' : 'Chưa mở bán / tạm dừng'}
        </span>
      </div>
      <p className="mt-3 text-sm text-text-muted">
        {data?.courses.find((c) => c.id === p.courseId)?.name ??
          p.courseName ??
          'Khóa học'}
      </p>
      <p className="my-2 text-sm">
        {p.sessionCount} buổi · {p.durationMinutes ?? 60} phút/buổi ·{' '}
        {p.validityDays} ngày
      </p>
      <p className="font-semibold text-primary">{money(p.price)}</p>
      {p.description && (
        <p className="mt-2 whitespace-pre-wrap break-words text-sm text-text-muted">
          {p.description}
        </p>
      )}
      {p.rejectionReason && (
        <div className="mt-3">
          <Notice tone="warning">Lý do từ chối: {p.rejectionReason}</Notice>
        </div>
      )}
      {!common && (
        <div className="mt-4 flex flex-wrap gap-2">
          {p.approvalStatus === 'PENDING' ? (
            <p className="text-sm text-text-muted">
              Đã gửi Manager. Bấm Làm mới sau khi Manager xét duyệt.
            </p>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              disabled={action.busy}
              onClick={() => setPackageDialog(p)}
            >
              {p.approvalStatus === 'REJECTED'
                ? 'Sửa & gửi duyệt lại'
                : 'Chỉnh sửa gói'}
            </Button>
          )}
          {p.approvalStatus === 'APPROVED' && (
            <Button
              size="sm"
              variant="outline"
              disabled={
                action.busy ||
                (!p.isActive && !eligible.some((c) => c.id === p.courseId))
              }
              onClick={() =>
                void action.run(async () => {
                  await coachApprovalService.updatePtPackageOptionStatus(p.id, {
                    isActive: !p.isActive,
                  })
                  changed(
                    p.isActive ? 'Đã tạm dừng bán gói.' : 'Đã mở bán gói.',
                  )
                })
              }
            >
              {p.isActive ? 'Tạm dừng bán' : 'Kích hoạt mở bán'}
            </Button>
          )}
          {!approvedIds.has(p.courseId) && (
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Quyền dạy khóa chưa hoạt động. Kiểm tra tab Quyền dạy khóa.
            </p>
          )}
        </div>
      )}
      {common && (
        <p className="mt-3 text-sm text-text-muted">
          Manager quản lý giá và điều khoản. Coach không cần đề xuất thêm gói
          riêng để dùng gói này.
        </p>
      )}
    </Panel>
  )
  return (
    <Page
      title="Quyền dạy & gói PT của tôi"
      subtitle="Đăng ký dạy khóa có sẵn, theo dõi phê duyệt và quản lý gói bán cho học viên."
      actions={
        <>
          <Button
            variant="secondary"
            disabled={state.loading || action.busy}
            onClick={() => void state.reload()}
          >
            Làm mới
          </Button>
          <Button
            disabled={state.loading || !!state.error || !eligible.length}
            onClick={() => setPackageDialog('new')}
          >
            Đề xuất gói PT mới
          </Button>
        </>
      }
    >
      <Panel title="Bắt đầu nhận học viên">
        <ol className="grid gap-3 text-sm sm:grid-cols-3">
          <li>
            <strong>1. Được duyệt quyền dạy</strong>
            <p className="text-text-muted">
              Chọn khóa bên dưới → đăng ký → Manager duyệt.
            </p>
          </li>
          <li>
            <strong>2. Có gói được mở bán</strong>
            <p className="text-text-muted">
              Dùng gói chung hoặc đề xuất gói riêng để Manager duyệt.
            </p>
          </li>
          <li>
            <strong>3. Thiết lập giờ nhận buổi</strong>
            <p>
              <Link className="text-primary underline" to="/coach/slots">
                Mở lịch làm việc
              </Link>{' '}
              → Member/lễ tân mua và đặt →{' '}
              <Link className="text-primary underline" to="/coach/bookings">
                vận hành buổi tập
              </Link>
              .
            </p>
          </li>
        </ol>
      </Panel>
      {success && <Notice tone="success">{success}</Notice>}
      {!dialog && <ErrorBanner message={action.error} />}
      <Loadable state={state}>
        {(d) => (
          <>
            {!eligible.length && (
              <Notice tone="warning">
                Chưa có khóa đang mở và được duyệt quyền dạy. Hãy đăng ký ở tab
                Quyền dạy khóa; lịch rảnh không thay thế bước duyệt này.
              </Notice>
            )}
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Quản lý quyền dạy và gói"
            >
              {(
                [
                  ['offering', 'Quyền dạy khóa'],
                  ['own', `Gói riêng (${d.packages.length})`],
                  ['shared', `Gói chung có thể dùng (${shared.length})`],
                ] as const
              ).map(([value, text]) => (
                <Button
                  key={value}
                  aria-pressed={tab === value}
                  variant={tab === value ? 'primary' : 'secondary'}
                  onClick={() => setTab(value)}
                >
                  {text}
                </Button>
              ))}
            </div>
            {tab === 'offering' && (
              <div className="grid gap-4 md:grid-cols-2">
                {!d.courses.length && (
                  <Empty>
                    Chưa có khóa học. Manager cần tạo và mở khóa trong Bài tập &
                    Khóa học.
                  </Empty>
                )}
                {d.courses.map((c) => {
                  const offering = d.offerings.find((o) => o.courseId === c.id)
                  return (
                    <Panel key={c.id} title={c.name}>
                      <p className="mb-3 text-sm text-text-muted">
                        {c.description ||
                          'Đăng ký năng lực giảng dạy cho khóa này.'}
                      </p>
                      {offering && <StatusBadge status={offering.status} />}
                      {!c.isActive && (
                        <Notice tone="warning">
                          Manager đang đóng khóa này.
                        </Notice>
                      )}
                      {offering?.experienceNote && (
                        <p className="my-3 whitespace-pre-wrap break-words text-sm">
                          {offering.experienceNote}
                        </p>
                      )}
                      {offering?.rejectionReason && (
                        <Notice tone="warning">
                          Lý do từ chối: {offering.rejectionReason}
                        </Notice>
                      )}
                      <div className="mt-3">
                        {!offering && (
                          <Button
                            disabled={!c.isActive || action.busy}
                            onClick={() => openOffering(c.id, null)}
                          >
                            Đăng ký dạy khóa này
                          </Button>
                        )}
                        {offering?.status === 'PENDING' && (
                          <p className="text-sm text-text-muted">
                            Đang chờ Manager duyệt quyền dạy. Chưa thể đề xuất
                            gói cho khóa này.
                          </p>
                        )}
                        {offering?.status === 'REJECTED' && (
                          <Button
                            disabled={!c.isActive || action.busy}
                            onClick={() => openOffering(c.id, offering)}
                          >
                            Bổ sung & gửi lại
                          </Button>
                        )}
                        {offering?.status === 'APPROVED' && (
                          <Button
                            variant="secondary"
                            disabled={action.busy || !c.isActive}
                            onClick={() =>
                              void action.run(async () => {
                                await coachApprovalService.updateOfferingStatus(
                                  offering.id,
                                  { isActive: !offering.isActive },
                                )
                                changed(
                                  offering.isActive
                                    ? 'Đã tạm dừng nhận mới cho khóa.'
                                    : 'Đã bật quyền dạy cho khóa.',
                                )
                              })
                            }
                          >
                            {offering.isActive
                              ? 'Tạm dừng dạy khóa'
                              : 'Bật lại quyền dạy'}
                          </Button>
                        )}
                      </div>
                    </Panel>
                  )
                })}
              </div>
            )}
            {tab === 'own' && (
              <>
                <select
                  className="rounded-xl border border-border-subtle bg-bg-input p-2 text-sm"
                  aria-label="Lọc trạng thái gói"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="PENDING">Chờ duyệt</option>
                  <option value="APPROVED">Đã duyệt</option>
                  <option value="REJECTED">Bị từ chối</option>
                </select>
                {!d.packages.filter(
                  (p) => filter === 'ALL' || p.approvalStatus === filter,
                ).length && (
                  <Empty>
                    Chưa có gói phù hợp. Khi được duyệt quyền dạy, anh có thể đề
                    xuất gói hoặc dùng gói chung.
                  </Empty>
                )}
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {d.packages
                    .filter(
                      (p) => filter === 'ALL' || p.approvalStatus === filter,
                    )
                    .map((p) => renderPackage(p, false))}
                </div>
              </>
            )}
            {tab === 'shared' && (
              <>
                {!shared.length && (
                  <Empty>
                    Chưa có gói chung phù hợp với quyền dạy đang hoạt động.
                    Manager có thể tạo gói chung hoặc anh đề xuất gói riêng.
                  </Empty>
                )}
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {shared.map((p) => renderPackage(p, true))}
                </div>
              </>
            )}
          </>
        )}
      </Loadable>
      {packageDialog && (
        <PackageOptionDialog
          initial={packageDialog === 'new' ? undefined : packageDialog}
          courses={packageDialog === 'new' ? eligible : (data?.courses ?? [])}
          onClose={() => setPackageDialog(null)}
          onSaved={() => {
            setPackageDialog(null)
            setTab('own')
            changed(
              'Đã gửi gói sang Manager xét duyệt. Không cần gửi thêm lần nữa.',
            )
          }}
        />
      )}
      {dialog && (
        <Modal
          isOpen
          title={
            dialog.offering
              ? 'Bổ sung hồ sơ đăng ký dạy'
              : 'Đăng ký quyền dạy khóa'
          }
          onClose={() => !action.busy && setDialog(null)}
          description={
            data?.courses.find((c) => c.id === dialog.courseId)?.name
          }
        >
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              void action.run(async () => {
                if (dialog.offering)
                  await coachApprovalService.resubmitCoachCourseOffering(
                    dialog.offering.id,
                    { experienceNote: note.trim() },
                  )
                else
                  await coachApprovalService.createCoachCourseOffering({
                    courseId: dialog.courseId,
                    experienceNote: note.trim() || undefined,
                  })
                setDialog(null)
                changed(
                  'Đã gửi đăng ký quyền dạy. Manager xem tại Duyệt HLV & Gói PT → Khóa đăng ký giảng dạy.',
                )
              })
            }}
          >
            <ErrorBanner message={action.error} />
            <Textarea
              label="Kinh nghiệm và năng lực giảng dạy"
              required={!!dialog.offering}
              maxLength={5000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={action.busy}
            />
            <Notice>
              Đây là đăng ký quyền dạy, chưa phải gói bán. Sau khi được duyệt,
              anh dùng gói chung hoặc đề xuất gói riêng.
            </Notice>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={action.busy}
                onClick={() => setDialog(null)}
              >
                Hủy
              </Button>
              <Button type="submit" isLoading={action.busy}>
                Gửi đăng ký dạy
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </Page>
  )
}
