import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Eye,
  Plus,
  CreditCard,
  Dumbbell,
  RefreshCw,
  AlertCircle,
  Check,
  Copy,
  Edit2,
  Activity,
  History,
  User,
  RotateCcw,
  Ban,
  Calendar,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { DataTable, type Column } from '@/shared/components/ui/data-table'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { Input, Select } from '@/shared/components/ui/input'
import { formatDate } from '@/shared/utils/date'
import { formatVND } from '@/shared/utils/currency'
import { membersService } from '@/features/memberships/services/members.service'
import { subscriptionsService } from '@/features/memberships/services/subscriptions.service'
import { ptPurchasesService } from '@/features/pt-packages-sales/services/pt-purchases.service'
import { paymentsService } from '@/features/payments-invoices/services/payments.service'
import { isAppApiError } from '@/shared/api/api-error'
import type { MemberDetail, MemberSummary, Subscription, Purchase } from '@/shared/types/api'
import type {
  MemberHistoryResponseData,
  MemberProgressResponseData,
} from '@/features/memberships/types/members.types'

type MemberWithUser = MemberSummary & {
  fitnessLevel?: string | null
  createdAt?: string
  updatedAt?: string
  user?: {
    id: string
    email: string
    phone: string
    fullName: string
    avatarUrl?: string | null
    role: string
    status: string
  }
}

export function MemberListPage() {
  const [members, setMembers] = useState<MemberWithUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Modals & Drawers
  const [selectedMember, setSelectedMember] = useState<(MemberDetail & { createdAt?: string }) | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'subscriptions' | 'ptPackages' | 'history' | 'progress'>('profile')
  const [memberSubscriptions, setMemberSubscriptions] = useState<Subscription[]>([])
  const [memberPtPackages, setMemberPtPackages] = useState<Purchase[]>([])
  const [memberHistory, setMemberHistory] = useState<MemberHistoryResponseData | null>(null)
  const [memberProgress, setMemberProgress] = useState<MemberProgressResponseData | null>(null)

  // Subscription Actions State
  const [renewingSubId, setRenewingSubId] = useState<string | null>(null)
  const [payingSubId, setPayingSubId] = useState<string | null>(null)
  const [cancellingSub, setCancellingSub] = useState<Subscription | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createdResult, setCreatedResult] = useState<{
    memberCode: string
    fullName: string
    temporaryPassword?: string
  } | null>(null)
  const [isCopied, setIsCopied] = useState(false)

  // Edit Modal
  const [editingMember, setEditingMember] = useState<MemberDetail | null>(null)
  const [editForm, setEditForm] = useState({
    address: '',
    emergencyPhone: '',
    fitnessLevel: 'BEGINNER',
    medicalNotes: '',
  })

  // Create Form State
  const [createForm, setCreateForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    gender: 'MALE',
    dateOfBirth: '1995-01-01',
    address: '',
    emergencyPhone: '',
  })

  // Fetch Members List
  const fetchMembers = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const res = await membersService.getMembers({
        limit: 50,
      })
      setMembers((res.data as MemberWithUser[]) || [])
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không thể tải danh sách hội viên.')
      } else {
        setErrorMessage('Không thể kết nối đến máy chủ.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg)
    toast.success(msg)
    setTimeout(() => setSuccessMessage(null), 4000)
  }

  // View Member Detail
  const handleOpenDetail = async (memberSummary: MemberWithUser) => {
    setIsDetailLoading(true)
    setActiveTab('profile')
    setSelectedMember(null)
    setMemberSubscriptions([])
    setMemberPtPackages([])
    setMemberHistory(null)
    setMemberProgress(null)
    try {
      const detail = await membersService.getMemberById(memberSummary.id)
      setSelectedMember(detail as MemberDetail & { createdAt?: string })

      // Fetch subscriptions, ptPackages, history & progress in parallel
      const [subsRes, ptRes, histRes, progRes] = await Promise.allSettled([
        subscriptionsService.getSubscriptions({ memberId: memberSummary.id }),
        ptPurchasesService.getPurchases({ memberId: memberSummary.id, limit: 50 }),
        membersService.getMemberHistory(memberSummary.id),
        membersService.getMemberProgress(memberSummary.id),
      ])

      if (subsRes.status === 'fulfilled') {
        setMemberSubscriptions(subsRes.value.data || [])
      }
      if (ptRes.status === 'fulfilled') {
        setMemberPtPackages(ptRes.value.data || [])
      }
      if (histRes.status === 'fulfilled') {
        setMemberHistory(histRes.value)
      }
      if (progRes.status === 'fulfilled') {
        setMemberProgress(progRes.value)
      }
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không thể tải chi tiết hội viên.')
      }
    } finally {
      setIsDetailLoading(false)
    }
  }

  // Handle Renew Subscription
  const handleRenewSubscription = async (sub: Subscription) => {
    if (!selectedMember) return
    setRenewingSubId(sub.id)
    try {
      await subscriptionsService.renewSubscription(sub.id)
      showSuccess(`Đã gia hạn thành công gói ${sub.planNameSnapshot}!`)
      // Refresh member subscriptions
      const updatedSubs = await subscriptionsService.getSubscriptions({ memberId: selectedMember.id })
      setMemberSubscriptions(updatedSubs.data || [])
    } catch (err) {
      const msg = isAppApiError(err) ? (err.message || 'Gia hạn gói tập thất bại.') : 'Lỗi hệ thống khi gia hạn gói.'
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setRenewingSubId(null)
    }
  }

  // Handle Cancel Subscription
  const handleConfirmCancelSubscription = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cancellingSub || !selectedMember) return
    if (!cancelReason.trim()) {
      setErrorMessage('Vui lòng nhập lý do hủy gói.')
      toast.warning('Vui lòng nhập lý do hủy gói.')
      return
    }

    setIsCancelling(true)
    setCancelError(null)
    setErrorMessage(null)
    try {
      await subscriptionsService.cancelSubscription(cancellingSub.id, {
        reason: cancelReason.trim(),
      })
      showSuccess(`Đã hủy gói tập ${cancellingSub.planNameSnapshot} thành công.`)
      setCancellingSub(null)
      setCancelReason('')
      setCancelError(null)
      // Refresh subscriptions
      const updatedSubs = await subscriptionsService.getSubscriptions({ memberId: selectedMember.id })
      setMemberSubscriptions(updatedSubs.data || [])
      fetchMembers()
    } catch (err) {
      const msg = isAppApiError(err) ? (err.message || 'Hủy gói tập thất bại.') : 'Lỗi hệ thống khi hủy gói tập.'
      setCancelError(msg)
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setIsCancelling(false)
    }
  }

  // Handle Settle Counter Payment for Pending Subscription
  const handlePayCounter = async (sub: Subscription) => {
    if (!selectedMember) return
    setPayingSubId(sub.id)
    setErrorMessage(null)
    try {
      await paymentsService.payCounter({
        subscriptionId: sub.id,
        method: 'CASH',
        receivedAmount: Number(sub.priceSnapshot),
      })
      showSuccess(`Đã thu tiền và kích hoạt thẻ tập ${sub.planNameSnapshot}!`)
      const updatedSubs = await subscriptionsService.getSubscriptions({ memberId: selectedMember.id })
      setMemberSubscriptions(updatedSubs.data || [])
      fetchMembers()
    } catch (err) {
      const msg = isAppApiError(err) ? (err.message || 'Thanh toán kích hoạt thất bại.') : 'Lỗi hệ thống khi thanh toán.'
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setPayingSubId(null)
    }
  }

  // Handle Create Member
  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    setErrorMessage(null)

    const cleanPhone = createForm.phone.trim().replace(/[\s.-]/g, '')
    if (!cleanPhone || cleanPhone.length < 9 || cleanPhone.length > 15) {
      const msg = 'Số điện thoại phải từ 9 đến 15 chữ số.'
      setCreateError(msg)
      toast.warning(msg)
      return
    }

    setIsSubmitting(true)
    try {
      const emailValue = createForm.email.trim() ? createForm.email.trim().toLowerCase() : undefined
      const res = await membersService.createMember({
        fullName: createForm.fullName.trim(),
        phone: cleanPhone,
        email: emailValue,
        gender: createForm.gender,
        dateOfBirth: createForm.dateOfBirth ? createForm.dateOfBirth : undefined,
        address: createForm.address.trim() || undefined,
        emergencyPhone: createForm.emergencyPhone.trim().replace(/[\s.-]/g, '') || undefined,
      })

      setIsCreateModalOpen(false)
      setCreatedResult({
        memberCode: res.member.memberCode,
        fullName: res.user.fullName,
        temporaryPassword: res.temporaryPassword,
      })
      setCreateForm({
        fullName: '',
        phone: '',
        email: '',
        gender: 'MALE',
        dateOfBirth: '1995-01-01',
        address: '',
        emergencyPhone: '',
      })
      setCreateError(null)
      fetchMembers()
      showSuccess(`Đã đăng ký thành công hội viên ${res.user.fullName}`)
    } catch (err: any) {
      const detail = err.errors && err.errors.length > 0
        ? ` (${err.errors.map((e: any) => e.message).join(', ')})`
        : ''
      const msg = isAppApiError(err)
        ? `${err.message || 'Đăng ký hội viên thất bại.'}${detail}`
        : 'Lỗi hệ thống khi tạo hội viên.'
      setCreateError(msg)
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Edit Member
  const handleOpenEdit = (member: MemberDetail) => {
    setEditingMember(member)
    setEditForm({
      address: member.address || '',
      emergencyPhone: member.emergencyPhone || '',
      fitnessLevel: member.fitnessLevel || 'BEGINNER',
      medicalNotes: member.medicalNotes || '',
    })
  }

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMember) return

    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      await membersService.updateMember(editingMember.id, {
        address: editForm.address.trim() || undefined,
        emergencyPhone: editForm.emergencyPhone.trim() || undefined,
        fitnessLevel: editForm.fitnessLevel,
        medicalNotes: editForm.medicalNotes.trim() || undefined,
      })

      setEditingMember(null)
      fetchMembers()
      if (selectedMember && selectedMember.id === editingMember.id) {
        setSelectedMember({
          ...selectedMember,
          ...editForm,
        })
      }
      showSuccess('Cập nhật hồ sơ hội viên thành công!')
    } catch (err) {
      const msg = isAppApiError(err) ? (err.message || 'Không thể cập nhật thông tin.') : 'Lỗi hệ thống khi cập nhật hội viên.'
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyPassword = () => {
    if (createdResult?.temporaryPassword) {
      navigator.clipboard.writeText(createdResult.temporaryPassword)
      setIsCopied(true)
      toast.success('Đã sao chép mật khẩu tạm thời!')
      setTimeout(() => setIsCopied(false), 2500)
    }
  }

  // Data Table Columns
  const columns: Column<MemberWithUser>[] = [
    {
      header: 'Mã HV',
      accessor: (row) => (
        <span className="font-mono text-xs font-bold text-primary">{row.memberCode}</span>
      ),
    },
    {
      header: 'Hội viên',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={
              row.avatarUrl ||
              row.user?.avatarUrl ||
              '/favicon.svg'
            }
            alt={row.fullName || row.user?.fullName}
            className="h-9 w-9 rounded-xl object-cover border border-border-subtle"
          />
          <div>
            <p className="font-bold text-text-primary text-xs">{row.fullName || row.user?.fullName}</p>
            <p className="text-[11px] text-text-muted">
              {row.phone || row.user?.phone || row.user?.email || '—'}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Gói Thẻ Gym',
      accessor: (row) => (
        <StatusBadge status={row.membershipStatus || 'PENDING'} />
      ),
    },
    {
      header: 'Gói PT 1:1',
      accessor: (row) => (
        <div className="flex items-center gap-1 text-xs">
          <span className="font-semibold text-text-primary">
            {row.activePackageCount !== undefined ? row.activePackageCount : 0}
          </span>
          <span className="text-text-muted text-[11px]">gói</span>
        </div>
      ),
    },
    {
      header: 'Trạng thái TK',
      accessor: (row) => <StatusBadge status={row.user?.status || 'ACTIVE'} />,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Danh sách hội viên
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Quản lý hồ sơ hội viên phòng Gym, theo dõi thể trạng InBody, gói thẻ tập và lịch sử rèn luyện
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchMembers}
            disabled={isLoading}
            className="gap-1.5 text-xs"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>
          <Button
            onClick={() => {
              setCreateError(null)
              setIsCreateModalOpen(true)
            }}
            className="gap-2 text-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Đăng ký hội viên mới</span>
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/10 p-3.5 text-xs text-danger">
          <AlertCircle className="h-4 w-4 shrink-0 text-danger mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-2.5 rounded-xl border border-success/30 bg-success/10 p-3.5 text-xs text-success">
          <Check className="h-4 w-4 shrink-0 text-success mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={members}
        isLoading={isLoading}
        searchKey="fullName"
        searchPlaceholder="Tìm theo tên hoặc số điện thoại..."
        actions={(row) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-8 px-2.5"
              onClick={() => handleOpenDetail(row)}
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              <span>Hồ sơ</span>
            </Button>
          </div>
        )}
      />

      {/* Member Detail Modal */}
      <Modal
        isOpen={!!selectedMember || isDetailLoading}
        onClose={() => setSelectedMember(null)}
        title={selectedMember ? `Hồ Sơ Hội Viên: ${selectedMember.fullName || (selectedMember as any).user?.fullName}` : 'Đang tải thông tin...'}
        maxWidth="2xl"
      >
        {isDetailLoading ? (
          <div className="flex flex-col items-center justify-center p-8 gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs text-text-muted">Đang tải hồ sơ từ máy chủ...</p>
          </div>
        ) : selectedMember ? (
          <div className="space-y-5">
            {/* Header Badge Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-bg-surface-muted p-4 border border-border-subtle">
              <div className="flex items-center gap-3.5">
                <img
                  src={
                    selectedMember.avatarUrl ||
                    (selectedMember as any).user?.avatarUrl ||
                    '/favicon.svg'
                  }
                  alt={selectedMember.fullName}
                  className="h-14 w-14 rounded-2xl object-cover border border-primary/30"
                />
                <div>
                  <h3 className="text-base font-bold text-text-primary">
                    {selectedMember.fullName || (selectedMember as any).user?.fullName}
                  </h3>
                  <p className="text-xs font-mono text-primary font-semibold">
                    {selectedMember.memberCode}
                  </p>
                  <p className="text-[11px] text-text-muted">
                    Gia nhập: {formatDate(selectedMember.createdAt || new Date().toISOString())}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-8"
                  onClick={() => handleOpenEdit(selectedMember)}
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1" />
                  <span>Sửa hồ sơ</span>
                </Button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-border-subtle overflow-x-auto">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'profile'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                <User className="h-3.5 w-3.5" />
                <span>Thông tin cá nhân</span>
              </button>
              <button
                onClick={() => setActiveTab('subscriptions')}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'subscriptions'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>Gói Thẻ Gym ({memberSubscriptions.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('ptPackages')}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'ptPackages'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                <Dumbbell className="h-3.5 w-3.5" />
                <span>Gói PT 1:1 ({memberPtPackages.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'history'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                <History className="h-3.5 w-3.5" />
                <span>Lịch sử tập luyện</span>
              </button>
              <button
                onClick={() => setActiveTab('progress')}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'progress'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                <span>Tiến độ & Mục tiêu</span>
              </button>
            </div>

            {/* Tab Contents: Profile */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs text-text-primary">
                  <div className="rounded-lg bg-bg-surface p-3 border border-border-subtle">
                    <span className="text-text-muted block text-[11px]">Số điện thoại:</span>
                    <p className="font-semibold text-text-primary mt-0.5">
                      {selectedMember.phone || (selectedMember as any).user?.phone || '—'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-bg-surface p-3 border border-border-subtle">
                    <span className="text-text-muted block text-[11px]">Email liên kết:</span>
                    <p className="font-semibold text-text-primary mt-0.5">
                      {selectedMember.email || (selectedMember as any).user?.email || '—'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-bg-surface p-3 border border-border-subtle">
                    <span className="text-text-muted block text-[11px]">Ngày sinh:</span>
                    <p className="font-semibold text-text-primary mt-0.5">
                      {formatDate(selectedMember.dateOfBirth)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-bg-surface p-3 border border-border-subtle">
                    <span className="text-text-muted block text-[11px]">Giới tính:</span>
                    <p className="font-semibold text-text-primary mt-0.5">
                      {selectedMember.gender === 'MALE'
                        ? 'Nam'
                        : selectedMember.gender === 'FEMALE'
                        ? 'Nữ'
                        : selectedMember.gender || '—'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-bg-surface p-3 border border-border-subtle">
                    <span className="text-text-muted block text-[11px]">SĐT khẩn cấp:</span>
                    <p className="font-semibold text-text-primary mt-0.5">
                      {selectedMember.emergencyPhone || '—'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-bg-surface p-3 border border-border-subtle">
                    <span className="text-text-muted block text-[11px]">Trình độ thể lực:</span>
                    <p className="font-semibold text-primary mt-0.5">
                      {selectedMember.fitnessLevel || 'Chưa đánh giá'}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-bg-surface p-3 border border-border-subtle text-xs">
                  <span className="text-text-muted block text-[11px]">Địa chỉ liên lạc:</span>
                  <p className="font-medium text-text-primary mt-0.5">
                    {selectedMember.address || 'Chưa có thông tin'}
                  </p>
                </div>

                {selectedMember.medicalNotes && (
                  <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
                    <span className="font-bold">Lưu ý sức khỏe / Chấn thương:</span>{' '}
                    {selectedMember.medicalNotes}
                  </div>
                )}
              </div>
            )}

            {/* Tab Contents: Subscriptions */}
            {activeTab === 'subscriptions' && (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center pb-1">
                  <span className="font-semibold text-text-primary">
                    Danh sách các thẻ tập đã đăng ký:
                  </span>
                  <Link to={`/receptionist/membership-sale?memberId=${selectedMember.id}`}>
                    <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1 border-primary/40 text-primary">
                      <Plus className="h-3 w-3" />
                      <span>Mua gói mới</span>
                    </Button>
                  </Link>
                </div>

                {memberSubscriptions.length > 0 ? (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {memberSubscriptions.map((sub) => {
                      return (
                        <div
                          key={sub.id}
                          className="rounded-xl bg-bg-surface border border-border-subtle p-3.5 space-y-2.5 hover:border-primary/40 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-text-primary text-sm">
                                {sub.planNameSnapshot || 'Gói thẻ tập'}
                              </p>
                              <p className="text-[11px] text-text-muted mt-0.5 flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-text-muted" />
                                <span>{formatDate(sub.startDate)} → {formatDate(sub.endDate)}</span>
                              </p>
                            </div>
                            <StatusBadge status={sub.status} />
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-[11px]">
                            <span className="text-success font-bold text-xs">
                              {formatVND(sub.priceSnapshot)}
                            </span>

                            {sub.status === 'PENDING' ? (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="primary"
                                  disabled={payingSubId === sub.id}
                                  isLoading={payingSubId === sub.id}
                                  onClick={() => handlePayCounter(sub)}
                                  className="h-7 px-2.5 text-[11px] gap-1 bg-success hover:bg-success/90 text-white"
                                >
                                  <Check className="h-3 w-3" />
                                  <span>Thu tiền & Kích hoạt</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setCancelError(null)
                                    setCancellingSub(sub)
                                    setCancelReason('')
                                  }}
                                  className="h-7 px-2 text-[11px] text-danger hover:text-danger hover:bg-danger/10 gap-1"
                                >
                                  <Ban className="h-3 w-3" />
                                  <span>Hủy gói</span>
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                {(sub.status === 'ACTIVE' || sub.status === 'EXPIRED') && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={renewingSubId === sub.id}
                                    onClick={() => handleRenewSubscription(sub)}
                                    className="h-7 px-2 text-[11px] text-info hover:text-info hover:bg-info/10 gap-1"
                                  >
                                    <RotateCcw className={`h-3 w-3 ${renewingSubId === sub.id ? 'animate-spin' : ''}`} />
                                    <span>Gia hạn</span>
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center rounded-xl bg-bg-surface-muted border border-border-subtle space-y-2">
                    <CreditCard className="h-8 w-8 text-text-muted mx-auto" />
                    <p className="text-xs text-text-muted">
                      Hội viên này hiện chưa có gói thẻ Gym nào.
                    </p>
                    <Link to={`/receptionist/membership-sale?memberId=${selectedMember.id}`}>
                      <Button size="sm" variant="primary" className="text-xs mt-2">
                        Đăng ký gói thẻ Gym ngay
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Tab Contents: PT Packages */}
            {activeTab === 'ptPackages' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-1">
                  <span className="font-semibold text-text-primary">
                    Danh sách các gói huấn luyện viên 1:1 đã đăng ký:
                  </span>
                  <Link to={`/receptionist/pt-sale?memberId=${selectedMember.id}`}>
                    <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1 border-primary/40 text-primary">
                      <Plus className="h-3 w-3" />
                      <span>Mua gói PT mới</span>
                    </Button>
                  </Link>
                </div>

                {memberPtPackages.length > 0 ? (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {memberPtPackages.map((pkg) => {
                      const total = pkg.totalCredits || 0
                      const consumed = pkg.consumedCredits || 0
                      const reserved = pkg.reservedCredits || 0
                      const remaining = Math.max(0, total - consumed - reserved)

                      return (
                        <div
                          key={pkg.id}
                          className="rounded-xl bg-bg-surface border border-border-subtle p-3.5 space-y-2.5 hover:border-primary/40 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-text-primary text-sm">
                                  {pkg.courseNameSnapshot || 'Gói PT 1:1'}
                                </p>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg-surface-muted text-text-muted border border-border-subtle">
                                  {pkg.purchaseCode}
                                </span>
                              </div>
                              <p className="text-[11px] text-text-muted mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span className="text-primary font-medium">
                                  Khóa: {pkg.courseNameSnapshot || 'PT 1:1'}
                                </span>
                                <span className="text-text-primary">
                                  HLV: {pkg.coachNameSnapshot || 'Huấn luyện viên'}
                                </span>
                                {pkg.expiresAt && (
                                  <span className="flex items-center gap-1 text-text-muted">
                                    <Calendar className="h-3 w-3" />
                                    <span>Hạn đến: {formatDate(pkg.expiresAt)}</span>
                                  </span>
                                )}
                              </p>
                            </div>
                            <StatusBadge status={pkg.status} />
                          </div>

                          <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-bg-surface-muted border border-border-subtle text-center text-[11px]">
                            <div>
                              <span className="text-text-muted block text-[10px]">Đã tập</span>
                              <span className="font-bold text-text-primary">{consumed} buổi</span>
                            </div>
                            <div>
                              <span className="text-text-muted block text-[10px]">Đang giữ chỗ</span>
                              <span className="font-bold text-warning">{reserved} buổi</span>
                            </div>
                            <div>
                              <span className="text-text-muted block text-[10px]">Còn lại</span>
                              <span className="font-bold text-success">{remaining} buổi</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 text-[11px]">
                            <span className="text-success font-bold text-xs">
                              {formatVND(pkg.priceSnapshot)}
                            </span>
                            <span className="text-text-muted text-[10px]">
                              Tổng số: {total} buổi
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center rounded-xl bg-bg-surface-muted border border-border-subtle space-y-2">
                    <Dumbbell className="h-8 w-8 text-text-muted mx-auto" />
                    <p className="text-xs text-text-muted">
                      Hội viên này hiện chưa mua gói tập Huấn luyện viên cá nhân PT nào.
                    </p>
                    <Link to={`/receptionist/pt-sale?memberId=${selectedMember.id}`}>
                      <Button size="sm" variant="primary" className="text-xs mt-2">
                        Đăng ký gói PT ngay
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Tab Contents: History */}
            {activeTab === 'history' && (
              <div className="space-y-3 text-xs">
                {memberHistory && memberHistory.bookings.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {memberHistory.bookings.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-bg-surface border border-border-subtle"
                      >
                        <div>
                          <p className="font-semibold text-text-primary">{b.courseName || 'Buổi tập PT 1:1'}</p>
                          <p className="text-[11px] text-text-muted">
                            HLV: {b.coachName || 'HLV chuyên trách'} • {formatDate(b.startsAt)}
                          </p>
                        </div>
                        <StatusBadge status={b.status} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-text-muted text-center py-6">
                    Chưa có lịch sử buổi tập nào được ghi nhận.
                  </p>
                )}
              </div>
            )}

            {/* Tab Contents: Progress */}
            {activeTab === 'progress' && (
              <div className="space-y-3 text-xs">
                {memberProgress && memberProgress.assessments.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {memberProgress.assessments.map((a) => (
                      <div
                        key={a.id}
                        className="p-3 rounded-lg bg-bg-surface border border-border-subtle space-y-1.5"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-primary">
                            Đo InBody ngày {formatDate(a.assessedAt)}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-[11px] text-text-muted pt-1">
                          <span>Cân nặng: <strong className="text-text-primary">{a.weightKg || '—'} kg</strong></span>
                          <span>Chiều cao: <strong className="text-text-primary">{a.heightCm || '—'} cm</strong></span>
                          <span>Mỡ: <strong className="text-text-primary">{a.bodyFatPercent || '—'} %</strong></span>
                          <span>Cơ: <strong className="text-text-primary">{a.muscleMassKg || '—'} kg</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-text-muted text-center py-6">
                    Chưa có số đo chỉ số thể hình InBody.
                  </p>
                )}
              </div>
            )}

            {/* Quick Actions Footer */}
            <div className="flex justify-between items-center border-t border-border-subtle pt-4">
              <span className="text-[11px] text-text-muted">
                Thao tác nhanh cho nhân viên quầy:
              </span>
              <div className="flex gap-2">
                <Link to={`/receptionist/membership-sale?memberId=${selectedMember.id}`}>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>Mua thẻ Gym</span>
                  </Button>
                </Link>
                <Link to={`/receptionist/pt-sale?memberId=${selectedMember.id}`}>
                  <Button size="sm" variant="primary" className="gap-1.5 text-xs">
                    <Dumbbell className="h-3.5 w-3.5" />
                    <span>Mua gói PT</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Cancel Subscription Modal */}
      <Modal
        isOpen={!!cancellingSub}
        onClose={() => {
          if (!isCancelling) {
            setCancelError(null)
            setCancellingSub(null)
          }
        }}
        title="Xác Nhận Hủy Gói Thẻ Gym"
        description={`Bạn đang thực hiện hủy gói: ${cancellingSub?.planNameSnapshot}`}
      >
        <form onSubmit={handleConfirmCancelSubscription} className="space-y-4">
          {cancelError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/10 p-3.5 text-xs text-danger">
              <AlertCircle className="h-4 w-4 shrink-0 text-danger mt-0.5" />
              <span>{cancelError}</span>
            </div>
          )}
          <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-xs text-danger">
            Cảnh báo: Sau khi hủy, gói thẻ tập sẽ ngừng kích hoạt ngay lập tức và không thể hoàn tác.
          </div>
          <Input
            label="Lý do hủy gói"
            required
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Ví dụ: Hội viên chuyển nơi cư trú, lý do sức khỏe..."
            disabled={isCancelling}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setCancelError(null)
                setCancellingSub(null)
              }}
              disabled={isCancelling}
            >
              Quay lại
            </Button>
            <Button
              type="submit"
              variant="danger"
              isLoading={isCancelling}
              disabled={isCancelling || !cancelReason.trim()}
            >
              Xác nhận hủy gói
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Member Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          if (!isSubmitting) {
            setCreateError(null)
            setIsCreateModalOpen(false)
          }
        }}
        title="Đăng Ký Hồ Sơ Hội Viên Mới"
        description="Nhập thông tin cá nhân của hội viên để tạo mã định danh và cấp tài khoản"
      >
        <form onSubmit={handleCreateMember} className="space-y-4">
          {createError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/10 p-3.5 text-xs text-danger">
              <AlertCircle className="h-4 w-4 shrink-0 text-danger mt-0.5" />
              <span>{createError}</span>
            </div>
          )}
          <Input
            label="Họ và tên hội viên"
            required
            value={createForm.fullName}
            onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
            placeholder="Ví dụ: Nguyễn Văn An"
            disabled={isSubmitting}
          />
          <Input
            label="Số điện thoại"
            required
            value={createForm.phone}
            onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
            placeholder="0987654321"
            disabled={isSubmitting}
          />
          <Input
            label="Email liên hệ (tùy chọn)"
            type="email"
            value={createForm.email}
            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            placeholder="an.nguyen@gmail.com"
            disabled={isSubmitting}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Giới tính"
              value={createForm.gender}
              onChange={(e) => setCreateForm({ ...createForm, gender: e.target.value })}
              options={[
                { value: 'MALE', label: 'Nam' },
                { value: 'FEMALE', label: 'Nữ' },
                { value: 'OTHER', label: 'Khác' },
              ]}
              disabled={isSubmitting}
            />
            <Input
              label="Ngày sinh"
              type="date"
              value={createForm.dateOfBirth}
              onChange={(e) => setCreateForm({ ...createForm, dateOfBirth: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <Input
            label="Số điện thoại khẩn cấp"
            value={createForm.emergencyPhone}
            onChange={(e) => setCreateForm({ ...createForm, emergencyPhone: e.target.value })}
            placeholder="0911223344"
            disabled={isSubmitting}
          />

          <Input
            label="Địa chỉ thường trú"
            value={createForm.address}
            onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
            placeholder="Số nhà, phố, quận/huyện..."
            disabled={isSubmitting}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setCreateError(null)
                setIsCreateModalOpen(false)
              }}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
              Đăng ký ngay
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Member Modal */}
      <Modal
        isOpen={!!editingMember}
        onClose={() => !isSubmitting && setEditingMember(null)}
        title="Chỉnh sửa hồ sơ hội viên"
        description={`Cập nhật thông tin cho: ${editingMember?.fullName}`}
      >
        <form onSubmit={handleUpdateMember} className="space-y-4">
          <Input
            label="Địa chỉ"
            value={editForm.address}
            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
            placeholder="Số nhà, đường, quận/huyện"
            disabled={isSubmitting}
          />
          <Input
            label="Số điện thoại khẩn cấp"
            value={editForm.emergencyPhone}
            onChange={(e) => setEditForm({ ...editForm, emergencyPhone: e.target.value })}
            placeholder="0988776655"
            disabled={isSubmitting}
          />
          <Select
            label="Trình độ thể lực"
            value={editForm.fitnessLevel}
            onChange={(e) => setEditForm({ ...editForm, fitnessLevel: e.target.value })}
            options={[
              { value: 'BEGINNER', label: 'Mới bắt đầu (Beginner)' },
              { value: 'INTERMEDIATE', label: 'Trung cấp (Intermediate)' },
              { value: 'ADVANCED', label: 'Nâng cao (Advanced)' },
            ]}
            disabled={isSubmitting}
          />
          <Input
            label="Lưu ý sức khỏe / Chấn thương"
            value={editForm.medicalNotes}
            onChange={(e) => setEditForm({ ...editForm, medicalNotes: e.target.value })}
            placeholder="Tiền sử thoát vị đĩa đệm, tim mạch..."
            disabled={isSubmitting}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditingMember(null)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Result after Member Creation */}
      <Modal
        isOpen={!!createdResult}
        onClose={() => setCreatedResult(null)}
        title="Đăng Ký Hội Viên Thành Công"
        description={`Hội viên ${createdResult?.fullName} đã được tạo thành công trên hệ thống.`}
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-success/30 bg-success/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Mã thẻ hội viên:</span>
              <span className="font-mono font-bold text-primary bg-bg-surface px-2.5 py-1 rounded border border-border-subtle">
                {createdResult?.memberCode}
              </span>
            </div>

            {createdResult?.temporaryPassword && (
              <div>
                <span className="text-xs text-text-muted block mb-1">Mật khẩu đăng nhập tạm thời:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-success bg-bg-surface px-3 py-1.5 rounded border border-border-subtle flex-1 select-all">
                    {createdResult.temporaryPassword}
                  </span>
                  <Button size="sm" variant="outline" onClick={handleCopyPassword} className="h-8 gap-1 text-xs">
                    {isCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-success" />
                        <span>Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-text-muted leading-relaxed">
            Vui lòng bàn giao mã hội viên và hướng dẫn hội viên đăng nhập vào ứng dụng di động để theo dõi lịch tập.
          </p>

          <div className="flex justify-end pt-2">
            <Button onClick={() => setCreatedResult(null)}>Đóng</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
