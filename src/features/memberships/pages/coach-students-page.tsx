import { useState, useEffect, useCallback, useMemo } from 'react'
import { FileText, Activity, RefreshCw, AlertCircle, Phone, Mail, User, Calendar, Dumbbell, HeartPulse, Search, Users, CheckCircle2, Clock3, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { Input, Select } from '@/shared/components/ui/input'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { coachesService } from '@/features/coaches/services/coaches.service'
import { formatDate } from '@/shared/utils/date'
import type { Purchase } from '@/shared/types/api'

export function CoachStudentsPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<Purchase | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const loadStudents = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const res = await coachesService.getMyPackages({ limit: 50 })
      setPurchases(res.data || [])
    } catch {
      setErrorMessage('Không thể tải danh sách học viên phụ trách.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const name = (
        (p as any).member?.user?.fullName ||
        p.memberName ||
        (p as any).member?.fullName ||
        ''
      ).toLowerCase()
      const code = (
        (p as any).memberCode ||
        (p as any).member?.memberCode ||
        p.memberCode ||
        (p as any).purchaseCode ||
        ''
      ).toLowerCase()
      const phone = ((p as any).phone || (p as any).member?.user?.phone || '').toLowerCase()
      const email = ((p as any).email || (p as any).member?.user?.email || '').toLowerCase()
      const course = (p.courseNameSnapshot || '').toLowerCase()
      const q = searchQuery.toLowerCase().trim()

      const matchesSearch =
        !q ||
        name.includes(q) ||
        code.includes(q) ||
        phone.includes(q) ||
        email.includes(q) ||
        course.includes(q)
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [purchases, searchQuery, statusFilter])

  const studentStats = useMemo(() => ({
    total: purchases.length,
    active: purchases.filter((p) => p.status === 'ACTIVE').length,
    completed: purchases.filter((p) => p.status === 'COMPLETED').length,
  }), [purchases])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-orange-500">
            <span className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_0_4px_rgba(249,115,22,0.12)]" />
            Quản lý học viên
          </p>
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-text-primary flex items-center gap-2.5">
            <Dumbbell className="h-6 w-6 text-orange-500" strokeWidth={2.5} />
            <span>Học viên của tôi</span>
          </h1>
          <p className="text-sm text-text-muted mt-1.5">
            Danh sách hội viên đang theo học các gói huấn luyện PT 1:1 do bạn trực tiếp giảng dạy
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={loadStudents}
          disabled={isLoading}
          className="gap-2 text-xs self-start sm:self-auto min-h-10"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'Tổng học viên', value: studentStats.total, icon: Users, tone: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Đang hoạt động', value: studentStats.active, icon: CheckCircle2, tone: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Đã hoàn thành', value: studentStats.completed, icon: Clock3, tone: 'text-sky-500', bg: 'bg-sky-500/10' },
        ].map((stat) => {
          const Icon = stat.icon
          return <div key={stat.label} className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-bg-surface p-4 shadow-sm shadow-slate-900/[0.03]">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}><Icon className={`h-5 w-5 ${stat.tone}`} /></span>
            <span><span className="block text-xl font-bold leading-none text-text-primary">{stat.value}</span><span className="mt-1 block text-xs font-medium text-text-muted">{stat.label}</span></span>
          </div>
        })}
      </div>

      {/* Search Bar & Status Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-2xl border border-border-subtle bg-bg-surface p-3 shadow-sm shadow-slate-900/[0.03]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
          <Input
            placeholder="Tìm theo tên học viên, mã HV, SĐT, email hoặc gói tập..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
          {searchQuery && <button type="button" onClick={() => setSearchQuery('')} aria-label="Xóa tìm kiếm" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-text-muted hover:bg-bg-surface-muted hover:text-text-primary"><X className="h-3.5 w-3.5" /></button>}
        </div>
        <div className="w-full sm:w-56">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="COMPLETED">Đã hoàn thành</option>
            <option value="PENDING_PAYMENT">Chờ thanh toán</option>
          </Select>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/10 p-3.5 text-xs text-danger">
          <AlertCircle className="h-4 w-4 shrink-0 text-danger mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center p-12">
          <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : filteredPurchases.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredPurchases.map((p) => {
            const studentName =
              (p as any).member?.user?.fullName ||
              p.memberName ||
              (p as any).member?.fullName ||
              'Hội viên'
            const studentCode =
              (p as any).memberCode ||
              (p as any).member?.memberCode ||
              p.memberCode ||
              (p as any).purchaseCode ||
              'MEM'
            const studentPhone = (p as any).phone || (p as any).member?.user?.phone
            const studentEmail = (p as any).email || (p as any).member?.user?.email
            const remaining =
              p.availableCredits !== undefined
                ? p.availableCredits
                : Math.max(
                    0,
                    p.totalCredits - (p.consumedCredits || 0) - ((p as any).reservedCredits || 0)
                  )
            const progressPercent = Math.min(
              100,
              Math.round(((p.consumedCredits || 0) / (p.totalCredits || 1)) * 100)
            )

            const initials = studentName
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .slice(-2)
              .toUpperCase()

            return (
              <div
                key={p.id}
                className="group flex flex-col justify-between space-y-4 rounded-2xl border border-border-subtle bg-bg-surface p-5 shadow-sm shadow-slate-900/[0.04] transition-all hover:-translate-y-0.5 hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/[0.06]"
              >
                <div className="space-y-3.5">
                  {/* Student Header with Avatar */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-700/20 border border-orange-500/30 flex items-center justify-center text-orange-500 font-bold text-sm shrink-0 shadow-inner">
                        {initials || <User className="h-5 w-5" />}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-text-primary leading-tight">
                          {studentName}
                        </h3>
                        <p className="text-[11px] font-mono text-orange-500 font-semibold mt-0.5">
                          {studentCode}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>

                  {/* Contact Snippet */}
                  {(studentPhone || studentEmail) && (
                    <div className="flex flex-wrap gap-2 text-[11px] text-text-muted">
                      {studentPhone && (
                        <span className="inline-flex items-center gap-1 bg-bg-surface-muted px-2 py-0.5 rounded-lg text-text-primary">
                          <Phone className="h-3 w-3 text-primary" />
                          {studentPhone}
                        </span>
                      )}
                      {studentEmail && (
                        <span className="inline-flex items-center gap-1 bg-bg-surface-muted px-2 py-0.5 rounded-lg text-text-primary">
                          <Mail className="h-3 w-3 text-text-muted" />
                          {studentEmail}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Course & Credits Detail Box */}
                  <div className="rounded-xl bg-bg-surface-muted border border-border-subtle p-3.5 text-xs text-text-primary space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-text-muted">Khóa tập PT:</span>
                      <span className="font-semibold text-text-primary truncate max-w-[170px]">
                        {p.courseNameSnapshot || 'Khóa Huấn Luyện PT 1:1'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-text-muted">Số buổi khả dụng:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {remaining} <span className="text-xs text-text-muted font-normal">/ {p.totalCredits} buổi</span>
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] text-text-muted">
                        <span>Đã hoàn thành: {p.consumedCredits || 0} buổi</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-border-subtle rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-orange-500 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {p.expiresAt && (
                      <div className="flex justify-between items-center pt-1 border-t border-border-subtle text-[11px]">
                        <span className="text-text-muted flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-text-muted" />
                          Hạn gói tập:
                        </span>
                        <span className="text-text-primary font-mono">{formatDate(p.expiresAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-border-subtle mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs transition-colors group-hover:border-orange-500/40"
                    onClick={() => setSelectedStudent(p)}
                  >
                    Hồ sơ chi tiết
                  </Button>
                  <Link to={`/coach/training-plans?memberId=${p.memberId}`} className="w-full">
                    <Button size="sm" variant="primary" className="w-full text-xs">
                      Soạn giáo án
                    </Button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-border-subtle bg-bg-surface p-12 text-center space-y-2">
          <User className="h-10 w-10 text-text-muted mx-auto" />
          <h3 className="text-base font-semibold text-text-primary">Chưa có học viên nào</h3>
          <p className="text-xs text-text-muted">
            Hiện tại bạn chưa có hợp đồng huấn luyện PT 1:1 nào đang phụ trách.
          </p>
        </div>
      )}

      {/* Student Profile Modal (WEB-COA-06) */}
      <Modal
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        title={`Hồ Sơ Học Viên: ${(selectedStudent as any)?.member?.user?.fullName || selectedStudent?.memberName || 'Chi tiết học viên'}`}
        maxWidth="lg"
      >
        {selectedStudent && (
          <div className="space-y-5 text-xs text-text-primary">
            {/* Student Info Overview */}
            <div className="rounded-xl bg-bg-surface-muted border border-border-subtle p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-500 font-bold text-base">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-text-primary">
                    {(selectedStudent as any)?.member?.user?.fullName || selectedStudent?.memberName || 'Học viên'}
                  </h4>
                  <p className="text-xs font-mono text-orange-500 font-semibold">
                    Mã HV: {(selectedStudent as any)?.memberCode || (selectedStudent as any)?.member?.memberCode || (selectedStudent as any)?.purchaseCode}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-subtle text-xs">
                <div>
                  <span className="text-text-muted">Số điện thoại: </span>
                  <span className="text-text-primary font-mono">
                    {(selectedStudent as any)?.phone || (selectedStudent as any)?.member?.user?.phone || 'Chưa cập nhật'}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted">Email: </span>
                  <span className="text-text-primary">
                    {(selectedStudent as any)?.email || (selectedStudent as any)?.member?.user?.email || 'Chưa cập nhật'}
                  </span>
                </div>
                {(selectedStudent as any)?.gender && (
                  <div>
                    <span className="text-text-muted">Giới tính: </span>
                    <span className="text-text-primary">{(selectedStudent as any).gender}</span>
                  </div>
                )}
                {(selectedStudent as any)?.fitnessLevel && (
                  <div>
                    <span className="text-text-muted">Thể lực: </span>
                    <span className="text-primary font-semibold">{(selectedStudent as any).fitnessLevel}</span>
                  </div>
                )}
              </div>

              {(selectedStudent as any)?.medicalNotes && (
                <div className="pt-2 border-t border-border-subtle text-xs text-amber-600 dark:text-amber-300 flex items-center gap-1.5">
                  <HeartPulse className="h-4 w-4 shrink-0 text-amber-500" />
                  <span>Ghi chú sức khỏe: {(selectedStudent as any).medicalNotes}</span>
                </div>
              )}
            </div>

            {/* Package & Progress Info */}
            <div className="rounded-xl bg-bg-surface-muted border border-border-subtle p-4 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Khóa huấn luyện:</span>
                <span className="text-text-primary font-semibold">{selectedStudent.courseNameSnapshot}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Tiến độ buổi tập:</span>
                <span className="text-text-primary">
                  Đã tập <strong className="text-text-primary">{selectedStudent.consumedCredits || 0}</strong> buổi • Còn lại:{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    {selectedStudent.availableCredits !== undefined
                      ? selectedStudent.availableCredits
                      : Math.max(
                          0,
                          selectedStudent.totalCredits -
                            (selectedStudent.consumedCredits || 0) -
                            ((selectedStudent as any).reservedCredits || 0)
                        )}
                  </strong> / {selectedStudent.totalCredits} buổi
                </span>
              </div>
              {selectedStudent.expiresAt && (
                <div className="flex justify-between items-center pt-2 border-t border-border-subtle text-[11px]">
                  <span className="text-text-muted">Hạn sử dụng gói:</span>
                  <span className="text-text-primary font-mono">{formatDate(selectedStudent.expiresAt)}</span>
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 gap-3">
              <Link to="/coach/assessments">
                <div className="rounded-xl border border-border-subtle bg-bg-surface p-3.5 hover:border-orange-500/40 transition-colors">
                  <Activity className="h-5 w-5 text-orange-500 mb-1.5" />
                  <p className="font-bold text-text-primary">Chỉ số InBody & Thể trạng</p>
                  <p className="text-[10px] text-text-muted mt-0.5">Cân nặng, % Mỡ, Khối lượng cơ</p>
                </div>
              </Link>
              <Link to="/coach/training-plans">
                <div className="rounded-xl border border-border-subtle bg-bg-surface p-3.5 hover:border-orange-500/40 transition-colors">
                  <FileText className="h-5 w-5 text-sky-500 mb-1.5" />
                  <p className="font-bold text-text-primary">Giáo án Tập luyện</p>
                  <p className="text-[10px] text-text-muted mt-0.5">Lộ trình bài tập & Hiệp tập</p>
                </div>
              </Link>
            </div>

            <div className="flex justify-end pt-2 border-t border-border-subtle">
              <Button onClick={() => setSelectedStudent(null)}>Đóng</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
