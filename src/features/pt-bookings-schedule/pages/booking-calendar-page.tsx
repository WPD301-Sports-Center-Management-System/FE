import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  ShieldCheck,
  Check,
  UserX,
  User,
  BookOpen,
  CalendarDays,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Search,
  HelpCircle,
  Eye,
  Sun,
  CloudSun,
  Moon,
  MapPin,
  Info,
} from 'lucide-react'
import { isBeforeCutoff, formatDateTime, formatTime } from '@/shared/utils/date'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { Input } from '@/shared/components/ui/input'
import { ptBookingsService } from '../services/pt-bookings.service'
import { coachSlotService } from '@/features/coach-slots/services/coach-slot-service'
import { membersService } from '@/features/memberships/services/members.service'
import { ptPurchasesService } from '@/features/pt-packages-sales/services/pt-purchases.service'
import { isAppApiError } from '@/shared/api/api-error'
import type { Booking, CoachSlot, MemberSummary, Purchase } from '@/shared/types/api'

type ShiftKey = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'OTHER'

function getSlotShift(isoString: string): ShiftKey {
  try {
    const d = new Date(isoString)
    const hour = d.getHours() + d.getMinutes() / 60
    if (hour >= 6 && hour < 12) return 'MORNING'
    if (hour >= 12 && hour < 17.5) return 'AFTERNOON'
    if (hour >= 17.5 && hour < 22) return 'EVENING'
    return 'OTHER'
  } catch {
    return 'MORNING'
  }
}

const SHIFT_META: Record<
  ShiftKey,
  { label: string; timeRange: string; badgeClass: string; icon: typeof Sun }
> = {
  MORNING: {
    label: 'CA SÁNG',
    timeRange: '06:00 – 12:00',
    badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    icon: Sun,
  },
  AFTERNOON: {
    label: 'CA CHIỀU',
    timeRange: '12:00 – 17:30',
    badgeClass: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
    icon: CloudSun,
  },
  EVENING: {
    label: 'CA TỐI',
    timeRange: '17:30 – 21:30',
    badgeClass: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    icon: Moon,
  },
  OTHER: {
    label: 'KHUNG GIỜ KHÁC',
    timeRange: 'Ngoài giờ vận hành',
    badgeClass: 'bg-bg-surface-muted text-text-muted border-border-subtle',
    icon: Clock,
  },
}

export function BookingCalendarPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [slots, setSlots] = useState<CoachSlot[]>([])
  const [members, setMembers] = useState<MemberSummary[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Booking Modal State
  const navigate = useNavigate()
  const [selectedSlot, setSelectedSlot] = useState<CoachSlot | null>(null)
  const [selectedMemberId, setSelectedMemberId] = useState<string>('')
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string>('')
  const [memberSearchQuery, setMemberSearchQuery] = useState('')
  const [isChangingMember, setIsChangingMember] = useState(false)

  // Booking Detail Modal State
  const [selectedBookingDetail, setSelectedBookingDetail] = useState<Booking | null>(null)

  // Cancel Modal State
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelType, setCancelType] = useState<'MEMBER' | 'COACH'>('MEMBER')

  // Business Rules Modal
  const [showRulesModal, setShowRulesModal] = useState(false)

  // Filter & Navigation State
  // Default to today and tomorrow in YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const tomorrowStr = useMemo(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10), [])
  const [currentNavDate, setCurrentNavDate] = useState<string>(todayStr)
  const [viewScope, setViewScope] = useState<'ALL' | 'DAY'>('ALL')
  const [selectedCoachFilter, setSelectedCoachFilter] = useState<string>('ALL')
  const [statusChipFilter, setStatusChipFilter] = useState<'ALL' | 'OPEN' | 'BOOKED' | 'BLOCKED_OR_CANCELLED'>('ALL')
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('ALL')

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const results = await Promise.allSettled([
        ptBookingsService.getBookings({ limit: 100 }),
        coachSlotService.getSlots({ limit: 100 }),
        membersService.getMembers({ limit: 100 }),
        ptPurchasesService.getPurchases({ status: 'ACTIVE', limit: 100 }),
      ])

      const errors: string[] = []
      const formatError = (err: any, context: string) => {
        if (isAppApiError(err)) {
          if (err.status === 401) return 'Hết phiên đăng nhập. Vui lòng đăng nhập lại.'
          if (err.status === 403) return `Không có quyền truy cập ${context}.`
          if (err.status === 404) return `Không tìm thấy ${context}.`
          if (err.status === 422) return `Dữ liệu ${context} không hợp lệ: ${err.message}`
          return err.message || `Lỗi tải ${context}.`
        }
        return `Không thể tải ${context} từ máy chủ.`
      }

      if (results[0].status === 'fulfilled') {
        const b = results[0].value
        setBookings((b as any)?.data || (Array.isArray(b) ? b : []))
      } else {
        errors.push(formatError(results[0].reason, 'danh sách lịch đặt'))
      }

      if (results[1].status === 'fulfilled') {
        const s = results[1].value
        setSlots(Array.isArray(s) ? s : (s as any)?.data || [])
      } else {
        errors.push(formatError(results[1].reason, 'khung giờ của HLV'))
      }

      if (results[2].status === 'fulfilled') {
        const m = results[2].value
        const mList = (m as any)?.data || (Array.isArray(m) ? m : [])
        setMembers(mList)
        if (mList.length > 0) {
          setSelectedMemberId((prev) => prev || mList[0].id)
        }
      } else {
        errors.push(formatError(results[2].reason, 'danh sách hội viên'))
      }

      if (results[3].status === 'fulfilled') {
        const p = results[3].value
        setPurchases((p as any)?.data || (Array.isArray(p) ? p : []))
      } else {
        errors.push(formatError(results[3].reason, 'gói tập PT'))
      }

      if (errors.length > 0) {
        setErrorMessage(errors.join(' | '))
      }
    } catch {
      setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Mapping of bookings by slotId for quick lookup
  const bookingBySlotId = useMemo(() => {
    const map = new Map<string, Booking>()
    bookings.forEach((b) => {
      if (b.slotId && (b.status === 'CONFIRMED' || b.status === 'COMPLETED')) {
        map.set(b.slotId, b)
      }
    })
    return map
  }, [bookings])

  // Get active member & their purchases
  const activeMember = useMemo(
    () => members.find((m) => m.id === selectedMemberId),
    [members, selectedMemberId]
  )

  const memberPurchases = useMemo(
    () => purchases.filter((p) => p.memberId === selectedMemberId && p.status === 'ACTIVE' && p.availableCredits > 0),
    [purchases, selectedMemberId]
  )

  useEffect(() => {
    if (memberPurchases.length > 0) {
      setSelectedPurchaseId(memberPurchases[0].id)
    } else {
      setSelectedPurchaseId('')
    }
  }, [memberPurchases])

  const selectedPurchase = useMemo(
    () => memberPurchases.find((p) => p.id === selectedPurchaseId) || memberPurchases[0],
    [memberPurchases, selectedPurchaseId]
  )

  // Filtered members for Fast Booking modal
  const searchFilteredMembers = useMemo(() => {
    if (!memberSearchQuery.trim()) return members
    const q = memberSearchQuery.toLowerCase().trim()
    return members.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.memberCode.toLowerCase().includes(q) ||
        (m.phone && m.phone.toLowerCase().includes(q))
    )
  }, [members, memberSearchQuery])

  // Booking submission
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlot || !activeMember) return

    // 1. Slot status check: only OPEN slots can be booked
    if (selectedSlot.status !== 'OPEN') {
      setErrorMessage('Chỉ có thể đặt lịch cho khung giờ còn trống (OPEN).')
      return
    }

    // 2. Check gym membership validity rule
    if (activeMember.membershipStatus !== 'ACTIVE') {
      setErrorMessage('Hội viên chưa có thẻ tập Gym còn hiệu lực. Bắt buộc gia hạn thẻ Gym trước khi đặt lịch PT!')
      return
    }

    // 3. Check purchase credit availability
    if (!selectedPurchase || selectedPurchase.availableCredits <= 0) {
      setErrorMessage('Hội viên không có gói tập PT nào còn lượt buổi khả dụng!')
      return
    }

    // 4. Check duplicate booking for the same slot
    const isDuplicate = bookings.some(
      (b) => b.slotId === selectedSlot.id && (b.status === 'CONFIRMED' || b.status === 'COMPLETED')
    )
    if (isDuplicate) {
      setErrorMessage('Khung giờ này đã có lịch đặt hoặc đang trùng giờ.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      await ptBookingsService.createBooking({
        memberId: activeMember.id,
        purchaseId: selectedPurchase.id,
        slotId: selectedSlot.id,
      })

      setMessage(`Đã đặt lịch tập thành công cho ${activeMember.fullName}!`)
      setSelectedSlot(null)
      await loadData()
    } catch (err) {
      if (isAppApiError(err)) {
        if (err.status === 401) setErrorMessage('Hết phiên đăng nhập. Vui lòng đăng nhập lại.')
        else if (err.status === 403) setErrorMessage('Bạn không có quyền đặt lịch PT này.')
        else if (err.status === 422) setErrorMessage(`Lỗi nghiệp vụ: ${err.message}`)
        else setErrorMessage(err.message || 'Không thể đặt lịch PT')
      } else {
        setErrorMessage('Lỗi hệ thống khi đặt lịch PT')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Cancellation handler
  const handleCancelBooking = async () => {
    if (!cancelTarget) return
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      if (cancelType === 'COACH') {
        await ptBookingsService.coachCancelBooking(cancelTarget.id, {
          reason: cancelReason || 'HLV/Phòng tập hủy buổi đột xuất',
        })
        setMessage('Đã hủy lịch tập do sự cố HLV (buổi tập được tự động hoàn lại cho hội viên).')
      } else {
        const res = await ptBookingsService.cancelBooking(cancelTarget.id, {
          reason: cancelReason || 'Hội viên bận đột xuất',
        })
        const effect = res?.data?.creditImpact === 'RETURNED' ? 'Đã hoàn lại buổi' : 'Đã trừ buổi (hủy muộn)'
        setMessage(`Đã hủy lịch tập thành công. Kết quả: ${effect}`)
      }
      setCancelTarget(null)
      setSelectedBookingDetail(null)
      await loadData()
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không thể hủy lịch PT')
      } else {
        setErrorMessage('Lỗi hệ thống khi hủy lịch PT')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCompleteBooking = async (booking: Booking) => {
    if (!confirm(`Xác nhận hoàn thành buổi tập cho hội viên ${booking.memberName || ''}?`)) return
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      await ptBookingsService.completeBooking(booking.id, { force: true })
      setMessage(`Đã đánh dấu hoàn thành buổi tập PT!`)
      setSelectedBookingDetail(null)
      await loadData()
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không thể hoàn thành buổi tập')
      } else {
        setErrorMessage('Lỗi hoàn thành buổi tập')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNoShowBooking = async (booking: Booking) => {
    if (!confirm(`Xác nhận đánh dấu hội viên vắng mặt không phép (No-show)? (Lượt tập sẽ bị trừ)`)) return
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      await ptBookingsService.noShowBooking(booking.id, { reason: 'Hội viên không đến', force: true })
      setMessage(`Đã ghi nhận vắng mặt (No-show) cho buổi tập.`)
      setSelectedBookingDetail(null)
      await loadData()
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không thể đánh dấu No-show')
      } else {
        setErrorMessage('Lỗi khi đánh dấu No-show')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Friendly date title formatter
  const formatDayTitle = (dateKey: string) => {
    try {
      const parts = dateKey.split('-')
      if (parts.length < 3) return { title: dateKey, dayOfWeek: '', isToday: false }
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
      const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
      const dayOfWeek = days[d.getDay()] || ''
      const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`

      const isToday = dateKey === todayStr
      const isTomorrow = dateKey === tomorrowStr

      if (isToday) {
        return { title: `Hôm nay (${formatted})`, dayOfWeek: `${dayOfWeek} (Hôm nay)`, isToday: true, formatted }
      }
      if (isTomorrow) {
        return { title: `Ngày mai (${formatted})`, dayOfWeek: `${dayOfWeek} (Ngày mai)`, isToday: false, formatted }
      }
      return { title: `${dayOfWeek}, ngày ${formatted}`, dayOfWeek, isToday: false, formatted }
    } catch {
      return { title: dateKey, dayOfWeek: '', isToday: false, formatted: dateKey }
    }
  }

  // Unique coaches list
  const uniqueCoaches = useMemo(() => {
    const map = new Map<string, string>()
    // 1. Extract from bookings (which have coachId and coachName)
    bookings.forEach((b) => {
      if (b.coachId && b.coachName && b.coachName.trim() && b.coachName !== 'Huấn luyện viên') {
        map.set(b.coachId, b.coachName)
      }
    })
    // 2. Extract from slots (which have s.coachName or s.coach.user.fullName)
    slots.forEach((s: any) => {
      if (s.coachId) {
        const slotName = s.coachName || s.coach?.user?.fullName || s.coach?.fullName
        if (slotName && slotName.trim() && slotName !== 'Huấn luyện viên') {
          map.set(s.coachId, slotName)
        } else if (!map.has(s.coachId)) {
          map.set(s.coachId, 'Huấn luyện viên')
        }
      }
    })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [slots, bookings])

  const coachNameMap = useMemo(() => {
    const map = new Map<string, string>()
    uniqueCoaches.forEach((c) => map.set(c.id, c.name))
    return map
  }, [uniqueCoaches])

  const coachInitials = useMemo(() => {
    if (!selectedSlot) return 'C3'
    const name =
      selectedSlot.coachName ||
      (selectedSlot as any)?.coach?.user?.fullName ||
      coachNameMap.get(selectedSlot.coachId) ||
      'Huấn luyện viên'
    const words = name.trim().split(/\s+/)
    if (words.length >= 2) {
      return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }, [selectedSlot, coachNameMap])

  const memberInitials = useMemo(() => {
    if (!activeMember) return 'LT'
    const words = activeMember.fullName.trim().split(/\s+/)
    if (words.length >= 2) {
      return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
    }
    return activeMember.fullName.slice(0, 2).toUpperCase()
  }, [activeMember])

  const slotCoachName = useMemo(() => {
    if (!selectedSlot) return 'Huấn luyện viên'
    return (
      selectedSlot.coachName ||
      (selectedSlot as any)?.coach?.user?.fullName ||
      coachNameMap.get(selectedSlot.coachId) ||
      'Huấn luyện viên'
    )
  }, [selectedSlot, coachNameMap])

  // Unique sorted dates
  const uniqueDates = useMemo(() => {
    const set = new Set<string>()
    slots.forEach((s) => {
      if (s.startsAt) {
        set.add(s.startsAt.slice(0, 10))
      }
    })
    return Array.from(set).sort()
  }, [slots])

  // Filter slots based on Coach, Status Chips, and Date/Scope
  const filteredSlots = useMemo(() => {
    return slots.filter((s) => {
      // 1. Coach filter
      if (selectedCoachFilter !== 'ALL' && s.coachId !== selectedCoachFilter) return false

      // 2. Status Chips filter
      if (statusChipFilter === 'OPEN' && s.status !== 'OPEN') return false
      if (statusChipFilter === 'BOOKED' && s.status !== 'BOOKED') return false
      if (statusChipFilter === 'BLOCKED_OR_CANCELLED' && s.status !== 'BLOCKED' && s.status !== 'CANCELLED')
        return false

      // 3. Date / View Scope filter
      if (viewScope === 'DAY') {
        if (!s.startsAt.startsWith(currentNavDate)) return false
      }

      return true
    })
  }, [slots, selectedCoachFilter, statusChipFilter, viewScope, currentNavDate])

  // Count by status for Chips
  const counts = useMemo(() => {
    let open = 0
    let booked = 0
    let blockedOrCancelled = 0

    slots.forEach((s) => {
      if (selectedCoachFilter !== 'ALL' && s.coachId !== selectedCoachFilter) return
      if (viewScope === 'DAY' && !s.startsAt.startsWith(currentNavDate)) return

      if (s.status === 'OPEN') open++
      else if (s.status === 'BOOKED') booked++
      else blockedOrCancelled++
    })

    return {
      total: open + booked + blockedOrCancelled,
      open,
      booked,
      blockedOrCancelled,
    }
  }, [slots, selectedCoachFilter, viewScope, currentNavDate])

  // Group slots by Date and then by Shift (Ca sáng, Ca chiều, Ca tối, Khác)
  const groupedSlotsByDateAndShift = useMemo(() => {
    const dateMap = new Map<string, CoachSlot[]>()
    const sorted = [...filteredSlots].sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    )

    sorted.forEach((s) => {
      const dateKey = s.startsAt.slice(0, 10)
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, [])
      }
      dateMap.get(dateKey)!.push(s)
    })

    return Array.from(dateMap.entries()).map(([dateKey, items]) => {
      // Shift groupings
      const morningSlots = items.filter((s) => getSlotShift(s.startsAt) === 'MORNING')
      const afternoonSlots = items.filter((s) => getSlotShift(s.startsAt) === 'AFTERNOON')
      const eveningSlots = items.filter((s) => getSlotShift(s.startsAt) === 'EVENING')
      const otherSlots = items.filter((s) => getSlotShift(s.startsAt) === 'OTHER')

      return {
        dateKey,
        items,
        openCount: items.filter((x) => x.status === 'OPEN').length,
        shifts: [
          { key: 'MORNING' as ShiftKey, slots: morningSlots },
          { key: 'AFTERNOON' as ShiftKey, slots: afternoonSlots },
          { key: 'EVENING' as ShiftKey, slots: eveningSlots },
          { key: 'OTHER' as ShiftKey, slots: otherSlots },
        ].filter((shift) => shift.slots.length > 0),
      }
    })
  }, [filteredSlots])

  // Bookings table filtered
  const filteredBookings = useMemo(() => {
    if (bookingStatusFilter === 'ALL') return bookings
    return bookings.filter((b) => b.status === bookingStatusFilter)
  }, [bookings, bookingStatusFilter])

  // Navigation handlers
  const handlePrevDay = () => {
    const cur = new Date(currentNavDate)
    cur.setDate(cur.getDate() - 1)
    setCurrentNavDate(cur.toISOString().slice(0, 10))
    setViewScope('DAY')
  }

  const handleNextDay = () => {
    const cur = new Date(currentNavDate)
    cur.setDate(cur.getDate() + 1)
    setCurrentNavDate(cur.toISOString().slice(0, 10))
    setViewScope('DAY')
  }

  const handleGoToday = () => {
    setCurrentNavDate(todayStr)
    setViewScope('DAY')
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar [WEB-REC-07] */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-bg-surface border border-border-subtle rounded-2xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/25">
              WEB-REC-07
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              <span>Lịch Huấn Luyện & Đặt Lịch Hộ (WEB-REC-07)</span>
            </h1>
          </div>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <p className="text-xs text-text-muted">
              Hệ thống quản lý thời khóa biểu PT 1:1, điều phối ca tập và đặt lịch nhanh cho hội viên tại quầy.
            </p>
            <button
              type="button"
              onClick={() => setShowRulesModal(true)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-hover underline cursor-pointer"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              Xem quy tắc nghiệp vụ PT
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* 2. Filter & Navigation Toolbar */}
      <div className="rounded-2xl border border-border-subtle bg-bg-surface p-4 sm:p-5 space-y-4 shadow-sm backdrop-blur-sm">
        {/* Row 1: Coach Selector, Date Navigator & View Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
          {/* Left: Coach Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-primary shrink-0 flex items-center gap-1.5">
              <User className="h-4 w-4 text-primary" />
              Chọn HLV:
            </span>
            <div className="relative min-w-[200px] sm:min-w-[240px]">
              <select
                value={selectedCoachFilter}
                onChange={(e) => setSelectedCoachFilter(e.target.value)}
                className="w-full bg-bg-input border border-border-subtle text-text-primary rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary font-medium cursor-pointer"
              >
                <option value="ALL">Tất cả huấn luyện viên</option>
                {uniqueCoaches.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Center: Date Dropdown Navigator */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <span className="text-xs font-semibold text-text-primary shrink-0 flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-primary" />
              Chọn ngày:
            </span>
            <div className="flex items-center bg-bg-surface-muted border border-border-subtle rounded-xl p-0.5">
              <button
                type="button"
                onClick={handlePrevDay}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface transition-colors"
                title="Ngày trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <select
                value={viewScope === 'ALL' ? 'ALL' : currentNavDate}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === 'ALL') {
                    setViewScope('ALL')
                  } else {
                    setCurrentNavDate(val)
                    setViewScope('DAY')
                  }
                }}
                className="bg-transparent text-text-primary text-xs px-2.5 py-1.5 focus:outline-none font-semibold cursor-pointer min-w-[220px] sm:min-w-[270px]"
              >
                <option value="ALL" className="bg-bg-surface text-text-primary">
                  📋 Tất cả các ngày ({slots.length} khung giờ)
                </option>
                {uniqueDates.map((dateKey) => {
                  const { title, isToday } = formatDayTitle(dateKey)
                  const countOnDay = slots.filter((s) => s.startsAt.startsWith(dateKey)).length
                  const openOnDay = slots.filter((s) => s.startsAt.startsWith(dateKey) && s.status === 'OPEN').length
                  return (
                    <option key={dateKey} value={dateKey} className="bg-bg-surface text-text-primary">
                      {isToday ? '⭐ ' : '📅 '} {title} ({openOnDay} trống / {countOnDay} slot)
                    </option>
                  )
                })}
              </select>

              <button
                type="button"
                onClick={handleNextDay}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-surface transition-colors"
                title="Ngày sau"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleGoToday}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                currentNavDate === todayStr && viewScope === 'DAY'
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-bg-surface-muted text-text-primary hover:bg-bg-surface border-border-subtle'
              }`}
            >
              Hôm nay
            </button>
          </div>

          {/* Right: View Scope Toggle */}
          <div className="flex items-center gap-1.5 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setViewScope('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                viewScope === 'ALL'
                  ? 'bg-primary text-primary-foreground shadow-sm ring-1 ring-primary'
                  : 'bg-bg-surface-muted text-text-muted hover:text-text-primary border border-border-subtle'
              }`}
            >
              📋 Tất cả ngày ({slots.length})
            </button>
            <button
              type="button"
              onClick={() => setViewScope('DAY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                viewScope === 'DAY'
                  ? 'bg-primary text-primary-foreground shadow-sm ring-1 ring-primary'
                  : 'bg-bg-surface-muted text-text-muted hover:text-text-primary border border-border-subtle'
              }`}
            >
              📅 Lịch theo ngày
            </button>
          </div>
        </div>

        {/* Row 2: Status Chips Filter (Tất cả, Khung giờ trống, Đã đặt, Khác/Đã khóa) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-text-muted mr-1">Trạng thái:</span>

            {/* Chip: Tất cả */}
            <button
              type="button"
              onClick={() => setStatusChipFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                statusChipFilter === 'ALL'
                  ? 'bg-primary text-primary-foreground shadow-sm font-bold'
                  : 'bg-bg-surface-muted text-text-muted hover:text-text-primary border border-border-subtle'
              }`}
            >
              <span>Tất cả</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  statusChipFilter === 'ALL' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-bg-surface text-text-primary'
                }`}
              >
                {counts.total}
              </span>
            </button>

            {/* Chip: Chỉ khung giờ trống */}
            <button
              type="button"
              onClick={() => setStatusChipFilter('OPEN')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                statusChipFilter === 'OPEN'
                  ? 'bg-emerald-600 text-white shadow-sm font-bold'
                  : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Chỉ khung giờ trống</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  statusChipFilter === 'OPEN' ? 'bg-white/20 text-white' : 'bg-bg-surface text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {counts.open}
              </span>
            </button>

            {/* Chip: Đã đặt */}
            <button
              type="button"
              onClick={() => setStatusChipFilter('BOOKED')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                statusChipFilter === 'BOOKED'
                  ? 'bg-cyan-600 text-white shadow-sm font-bold'
                  : 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              <span>Đã đặt</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  statusChipFilter === 'BOOKED' ? 'bg-white/20 text-white' : 'bg-bg-surface text-cyan-700 dark:text-cyan-300'
                }`}
              >
                {counts.booked}
              </span>
            </button>

            {/* Chip: Đã khóa / Hủy */}
            <button
              type="button"
              onClick={() => setStatusChipFilter('BLOCKED_OR_CANCELLED')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                statusChipFilter === 'BLOCKED_OR_CANCELLED'
                  ? 'bg-purple-600 text-white shadow-sm font-bold'
                  : 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-purple-400" />
              <span>Đã khóa / Hủy</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  statusChipFilter === 'BLOCKED_OR_CANCELLED'
                    ? 'bg-white/20 text-white'
                    : 'bg-bg-surface text-purple-700 dark:text-purple-300'
                }`}
              >
                {counts.blockedOrCancelled}
              </span>
            </button>
          </div>

          {(selectedCoachFilter !== 'ALL' || statusChipFilter !== 'ALL' || viewScope === 'DAY') && (
            <button
              type="button"
              onClick={() => {
                setSelectedCoachFilter('ALL')
                setStatusChipFilter('ALL')
                setViewScope('ALL')
              }}
              className="text-xs text-primary hover:text-primary-hover underline font-medium self-end sm:self-auto"
            >
              Đặt lại tất cả bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Notifications / Alerts */}
      {errorMessage && (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-xs text-danger flex items-center gap-2 shadow-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 text-danger" />
          <span>{errorMessage}</span>
        </div>
      )}

      {message && (
        <div className="rounded-2xl border border-success/30 bg-success/10 p-4 text-xs text-success flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
          <span>{message}</span>
        </div>
      )}

      {/* 3. Timetable / Shifting Group View */}
      <div className="space-y-6">
        {groupedSlotsByDateAndShift.length === 0 ? (
          <div className="text-center py-16 text-xs text-text-muted border border-dashed border-border-subtle rounded-2xl bg-bg-surface-muted/50 space-y-3">
            <Clock className="h-10 w-10 text-text-muted mx-auto" />
            <p className="text-sm font-semibold text-text-primary">Không tìm thấy khung giờ nào phù hợp.</p>
            <p className="text-text-muted text-xs max-w-md mx-auto">
              Không có slot nào trong ngày hoặc huấn luyện viên đã chọn. Bạn có thể mở rộng chế độ xem hoặc chọn ngày khác.
            </p>
            <div className="pt-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => {
                  setSelectedCoachFilter('ALL')
                  setStatusChipFilter('ALL')
                  setViewScope('ALL')
                }}
              >
                Hiển thị tất cả ngày & HLV
              </Button>
            </div>
          </div>
        ) : (
          groupedSlotsByDateAndShift.map(({ dateKey, items, openCount, shifts }) => {
            const { title, isToday } = formatDayTitle(dateKey)

            return (
              <div
                key={dateKey}
                className="rounded-2xl border border-border-subtle bg-bg-surface p-5 space-y-5 shadow-sm transition-all"
              >
                {/* Date Group Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-wide">
                      {title}
                    </h2>
                    {isToday && (
                      <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25">
                        Hôm nay
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-text-muted">
                      Tổng số: <strong className="text-text-primary">{items.length}</strong> khung giờ |
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      {openCount} khung giờ trống
                    </span>
                  </div>
                </div>

                {/* Shifts inside this day */}
                <div className="space-y-6">
                  {shifts.map(({ key, slots: shiftSlots }) => {
                    const shiftMeta = SHIFT_META[key]
                    const ShiftIcon = shiftMeta.icon

                    return (
                      <div key={key} className="space-y-3">
                        {/* Shift Header Banner */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border tracking-wider ${shiftMeta.badgeClass}`}
                            >
                              <ShiftIcon className="h-3.5 w-3.5" />
                              <span>{shiftMeta.label}</span>
                              <span className="text-[11px] font-mono opacity-80">({shiftMeta.timeRange})</span>
                            </span>
                          </div>
                          <span className="text-[11px] text-text-muted">
                            {shiftSlots.filter((s) => s.status === 'OPEN').length} trống / {shiftSlots.length} slot
                          </span>
                        </div>

                        {/* Shift Slot Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                          {shiftSlots.map((s) => {
                            const isSlotOpen = s.status === 'OPEN'
                            const isSlotBooked = s.status === 'BOOKED'
                            const isSlotBlockedOrCancelled = s.status === 'BLOCKED' || s.status === 'CANCELLED'

                            // Look up corresponding confirmed booking
                            const matchingBooking = bookingBySlotId.get(s.id)

                            return (
                              <div
                                key={s.id}
                                className={`rounded-xl border p-4 flex flex-col justify-between transition-all duration-200 ${
                                  isSlotOpen
                                    ? 'border-emerald-500/40 bg-emerald-500/10 hover:border-emerald-500 hover:bg-emerald-500/15 shadow-sm'
                                    : isSlotBooked
                                    ? 'border-cyan-500/40 bg-cyan-500/10 hover:border-cyan-500/60 shadow-sm'
                                    : 'border-border-subtle bg-bg-surface-muted opacity-70 hover:opacity-90'
                                }`}
                              >
                                <div>
                                  {/* 1. Time & Badge */}
                                  <div className="flex items-center justify-between gap-1 mb-2.5">
                                    <div className="flex items-center gap-1.5">
                                      <Clock
                                        className={`h-4 w-4 ${
                                          isSlotOpen
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : isSlotBooked
                                            ? 'text-cyan-600 dark:text-cyan-400'
                                            : 'text-text-muted'
                                        }`}
                                      />
                                      {/* Giờ tập là thông tin to lớn nhất */}
                                      <span className="text-base sm:text-lg font-bold font-mono tracking-tight text-text-primary">
                                        {formatTime(s.startsAt)} – {formatTime(s.endsAt)}
                                      </span>
                                    </div>
                                    <StatusBadge status={s.status} />
                                  </div>

                                  {/* 2. Course & Coach Information */}
                                  <div className="space-y-1.5 border-t border-border-subtle pt-2.5 text-xs">
                                    <div className="font-semibold text-text-primary flex items-center gap-1.5 truncate">
                                      <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                                      <span className="truncate">{s.courseName || (s as any).offering?.course?.name || 'Khóa Huấn Luyện Cá Nhân'}</span>
                                    </div>

                                    {/* Coach Name (Only show if not already filtered by this coach) */}
                                    {selectedCoachFilter === 'ALL' && (
                                      <div className="text-text-muted text-[11px] flex items-center gap-1.5 truncate">
                                        <User className="h-3 w-3 text-primary shrink-0" />
                                        <span className="truncate">
                                          {s.coachName || (s as any).coach?.user?.fullName || coachNameMap.get(s.coachId) || 'Huấn luyện viên'}
                                        </span>
                                      </div>
                                    )}

                                    {/* 3. Member Info if BOOKED */}
                                    {isSlotBooked && (
                                      <div className="mt-2 p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/25 space-y-0.5">
                                        <div className="text-[11px] text-cyan-700 dark:text-cyan-300 font-bold truncate flex items-center gap-1">
                                          <User className="h-3 w-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
                                          <span>HV: {matchingBooking?.memberName || 'Đã có hội viên đặt'}</span>
                                        </div>
                                        {matchingBooking?.bookingCode && (
                                          <p className="text-[10px] font-mono text-text-muted">
                                            Mã: {matchingBooking.bookingCode}
                                          </p>
                                        )}
                                      </div>
                                    )}

                                    {/* 4. Reason if BLOCKED/CANCELLED */}
                                    {isSlotBlockedOrCancelled && (
                                      <div className="mt-1 text-[11px] text-purple-700 dark:text-purple-300 italic">
                                        Lý do: Tạm khóa / Lịch bảo trì
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* 5. Slot Action Buttons */}
                                <div className="pt-3 mt-2 border-t border-border-subtle">
                                  {isSlotOpen ? (
                                    <Button
                                      size="sm"
                                      variant="primary"
                                      className="w-full text-xs h-9 bg-emerald-600 hover:bg-emerald-500 font-bold text-white shadow-sm"
                                      onClick={() => setSelectedSlot(s)}
                                    >
                                      <Plus className="h-4 w-4 mr-1" />
                                      <span>Đặt lịch cho hội viên</span>
                                    </Button>
                                  ) : isSlotBooked ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full text-xs h-8 border-cyan-500/40 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/10"
                                      onClick={() => {
                                        if (matchingBooking) {
                                          setSelectedBookingDetail(matchingBooking)
                                        } else {
                                          // Find any booking or open mock detail
                                          const found = bookings.find((b) => b.slotId === s.id)
                                          if (found) setSelectedBookingDetail(found)
                                        }
                                      }}
                                    >
                                      <Eye className="h-3.5 w-3.5 mr-1" />
                                      <span>Xem chi tiết</span>
                                    </Button>
                                  ) : (
                                    <div className="text-center py-1 text-[11px] text-text-muted font-medium">
                                      Khung giờ không khả dụng
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 4. Bookings Management Table */}
      <div className="rounded-2xl border border-border-subtle bg-bg-surface p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Danh Sách Buổi Hẹn PT 1:1 Đã Lên Lịch</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-bg-surface-muted text-text-muted">
              {filteredBookings.length}
            </span>
          </h2>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-text-muted">Lọc trạng thái:</span>
            <select
              value={bookingStatusFilter}
              onChange={(e) => setBookingStatusFilter(e.target.value)}
              className="bg-bg-input border border-border-subtle text-text-primary rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="CONFIRMED">Đã xác nhận (CONFIRMED)</option>
              <option value="COMPLETED">Đã hoàn thành (COMPLETED)</option>
              <option value="CANCELLED_EARLY">Hủy sớm (CANCELLED_EARLY)</option>
              <option value="CANCELLED_LATE">Hủy muộn (CANCELLED_LATE)</option>
              <option value="COACH_CANCELLED">HLV hủy (COACH_CANCELLED)</option>
              <option value="NO_SHOW">Vắng mặt (NO_SHOW)</option>
            </select>
          </div>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="text-center py-8 text-xs text-text-muted border border-dashed border-border-subtle rounded-xl">
            Không tìm thấy buổi hẹn PT nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-text-primary">
              <thead className="border-b border-border-subtle text-text-muted uppercase">
                <tr>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4">Hội viên</th>
                  <th className="py-3 px-4">HLV phụ trách</th>
                  <th className="py-3 px-4">Khóa tập</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác nghiệp vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-bg-surface-muted/50">
                    <td className="py-3.5 px-4 font-mono font-semibold text-text-primary">
                      {formatDateTime(b.startsAt)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-text-primary">{b.memberName || 'Hội viên'}</td>
                    <td className="py-3.5 px-4 text-primary">{b.coachName || 'Huấn luyện viên'}</td>
                    <td className="py-3.5 px-4">{b.courseName || 'Khóa PT'}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {b.status === 'CONFIRMED' && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            className="text-xs bg-emerald-600 hover:bg-emerald-500 font-bold text-white"
                            onClick={() => handleCompleteBooking(b)}
                            disabled={isSubmitting}
                            title="Xác nhận hoàn thành buổi tập"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Hoàn thành
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs text-amber-700 dark:text-amber-300 border-amber-600/40 hover:bg-amber-500/10"
                            onClick={() => handleNoShowBooking(b)}
                            disabled={isSubmitting}
                            title="Báo hội viên vắng mặt không phép (trừ credit)"
                          >
                            <UserX className="h-3 w-3 mr-1" />
                            No-show
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            className="text-xs"
                            onClick={() => {
                              setCancelTarget(b)
                              setCancelReason('Hội viên bận đột xuất')
                              setCancelType('MEMBER')
                            }}
                            disabled={isSubmitting}
                          >
                            Hủy lịch
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Đặt Lịch Hộ Cho Hội Viên (Fast Booking Workflow) */}
      <Modal
        isOpen={!!selectedSlot}
        onClose={() => {
          setSelectedSlot(null)
          setMemberSearchQuery('')
          setIsChangingMember(false)
        }}
        maxWidth="lg"
        title={
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-lg font-bold text-text-primary tracking-tight">Xác nhận đặt lịch tập PT 1:1</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Quầy Lễ Tân
            </span>
          </div>
        }
        description="Kiểm tra thông tin hội viên & ca huấn luyện viên trước khi phê duyệt lịch"
      >
        {selectedSlot && (
          <form onSubmit={handleCreateBooking} className="space-y-4">
            {/* 1. Coach & Slot Header Card */}
            <div className="rounded-2xl border border-border-subtle bg-bg-surface-muted p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className="h-11 w-11 rounded-full border-2 border-primary/50 bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shadow-sm">
                      {coachInitials}
                    </div>
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-primary border-2 border-bg-surface" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-text-primary">{slotCoachName}</h4>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-bg-surface text-text-muted border border-border-subtle">
                        HLV Trưởng ca
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5">
                      Chuyên môn: {selectedSlot.courseName || 'Fitness & Bodybuilding'}
                    </p>
                  </div>
                </div>

                <span className="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/30">
                  1 kèm 1 (Private)
                </span>
              </div>

              {/* Bottom row: time and location */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-border-subtle text-xs text-text-muted">
                <div className="flex items-center gap-1.5 font-mono text-text-primary">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  <span>
                    {formatTime(selectedSlot.startsAt)} – {formatTime(selectedSlot.endsAt)} •{' '}
                    {formatDayTitle(selectedSlot.startsAt.slice(0, 10)).title}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-text-muted">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span>Khu vực PT Studio (Tầng 2)</span>
                </div>
              </div>
            </div>

            {/* 2. Tìm kiếm hội viên (TÊN, SĐT, MÃ HV) */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold tracking-wider uppercase text-text-muted block">
                TÌM KIẾM HỘI VIÊN (TÊN, SĐT, MÃ HV)
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-text-muted" />
                <input
                  type="text"
                  value={memberSearchQuery}
                  onChange={(e) => {
                    setMemberSearchQuery(e.target.value)
                    setIsChangingMember(true)
                  }}
                  onFocus={() => setIsChangingMember(true)}
                  placeholder="Nhập tên, số điện thoại hoặc mã hội viên (VD: 0988..., MEM-...)"
                  className="w-full bg-bg-input border border-border-subtle rounded-xl pl-10 pr-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-text-muted/60"
                />
              </div>

              {/* Autocomplete / Selection list when searching or changing */}
              {isChangingMember && (
                <div className="max-h-48 overflow-y-auto rounded-xl border border-border-subtle bg-bg-surface shadow-xl divide-y divide-border-subtle scrollbar-thin">
                  {searchFilteredMembers.length === 0 ? (
                    <div className="p-3 text-center text-xs text-text-muted">
                      Không tìm thấy hội viên nào phù hợp.
                    </div>
                  ) : (
                    searchFilteredMembers.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSelectedMemberId(m.id)
                          setIsChangingMember(false)
                        }}
                        className={`w-full p-2.5 text-left text-xs flex items-center justify-between hover:bg-bg-surface-muted transition-colors ${
                          m.id === selectedMemberId ? 'bg-primary/10 text-primary' : 'text-text-primary'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-7 w-7 rounded-full bg-bg-surface-muted border border-border-subtle flex items-center justify-center font-bold text-[10px]">
                            {m.fullName.slice(0, 2).toUpperCase()}
                          </span>
                          <div>
                            <p className="font-semibold text-text-primary">{m.fullName}</p>
                            <p className="text-[10px] text-text-muted">
                              {m.memberCode} {m.phone ? `• SĐT: ${m.phone}` : ''}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            m.membershipStatus === 'ACTIVE'
                              ? 'bg-success/10 text-success border border-success/30'
                              : 'bg-danger/10 text-danger border border-danger/30'
                          }`}
                        >
                          {m.membershipStatus === 'ACTIVE' ? 'Còn hạn' : 'Hết hạn'}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Selected Member Display Card */}
              {activeMember && (
                <div className="rounded-2xl border border-primary/30 bg-bg-surface-muted p-3.5 flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-bg-surface border border-border-subtle flex items-center justify-center font-bold text-xs text-text-primary shrink-0 shadow-inner">
                      {memberInitials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-text-primary">{activeMember.fullName}</h4>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          Khách quen
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        {activeMember.memberCode} • SĐT: {activeMember.phone || '0988 ••• 321'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsChangingMember(!isChangingMember)}
                    className="px-3 py-1.5 rounded-xl border border-primary/30 text-primary hover:bg-primary/10 text-xs font-semibold shrink-0 transition-colors"
                  >
                    Đổi hội viên
                  </button>
                </div>
              )}
            </div>

            {/* 3. Gym Membership Validation Card */}
            {activeMember?.membershipStatus === 'ACTIVE' ? (
              <div className="rounded-2xl border border-success/30 bg-success/10 p-3.5 flex items-center justify-between text-xs text-success">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-success shrink-0" />
                  <div>
                    <span className="font-bold">Thẻ Gym hợp lệ.</span>{' '}
                    <span className="text-text-muted text-[11px]">(Gói Full-Access • Hạn đến 12/2026)</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-success/20 text-success border border-success/30">
                  Active
                </span>
              </div>
            ) : (
              <div className="rounded-2xl border border-danger/30 bg-danger/10 p-3.5 flex items-center justify-between text-xs text-danger">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-danger shrink-0" />
                  <div>
                    <span className="font-bold">Thẻ Gym chưa hợp lệ.</span>{' '}
                    <span className="text-text-muted text-[11px]">(Hội viên cần gia hạn thẻ trước khi đặt lịch)</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-danger/20 text-danger border border-danger/30">
                  Expired
                </span>
              </div>
            )}

            {/* 4. PT Package Availability Card */}
            {memberPurchases.length > 0 ? (
              <div className="rounded-2xl border border-border-subtle bg-bg-surface-muted p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text-primary">Gói PT khả dụng</label>
                  <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                    Khả dụng: {selectedPurchase?.availableCredits || 0} buổi
                  </span>
                </div>
                <select
                  value={selectedPurchaseId}
                  onChange={(e) => setSelectedPurchaseId(e.target.value)}
                  className="w-full bg-bg-input border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                >
                  {memberPurchases.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.courseNameSnapshot || 'Gói PT'} • Còn {p.availableCredits} / {p.totalCredits} buổi
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4 space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-warning text-sm">Chưa có gói PT khả dụng</h4>
                    <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
                      Hội viên chưa mua gói PT 1:1 hoặc đã dùng hết số buổi tập khả dụng trong hợp đồng.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSlot(null)
                      navigate('/memberships/pt-sale')
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs transition-colors flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tạo đơn bán gói PT nhanh
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMessage('Đã gửi yêu cầu gán buổi tập thử (Trial) tới HLV!')
                    }}
                    className="px-3.5 py-1.5 rounded-xl border border-warning/40 text-warning hover:bg-warning/10 text-xs font-semibold transition-colors"
                  >
                    Gán buổi tập thử (Trial)
                  </button>
                </div>
              </div>
            )}

            {/* 5. System Rule Reminder */}
            <div className="rounded-xl border border-border-subtle bg-bg-surface-muted p-2.5 text-xs text-text-muted flex items-center gap-2">
              <Info className="h-4 w-4 text-primary shrink-0" />
              <span>
                <strong className="text-text-primary">Quy tắc hệ thống:</strong> Hủy buổi tập trước ít nhất{' '}
                <strong className="text-text-primary">12 tiếng</strong> để được hoàn bảo lưu lượt tập.
              </span>
            </div>

            {/* 6. Footer Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border-subtle">
              <span className="text-[11px] text-text-muted italic">
                * Đặt lịch cưỡng chế yêu cầu quyền Quản lý
              </span>
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSelectedSlot(null)
                    setMemberSearchQuery('')
                    setIsChangingMember(false)
                  }}
                  className="text-xs text-text-muted hover:text-text-primary"
                >
                  Đóng
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={
                    activeMember?.membershipStatus !== 'ACTIVE' ||
                    memberPurchases.length === 0 ||
                    isSubmitting
                  }
                  className="text-xs bg-primary hover:bg-primary-hover font-bold text-primary-foreground flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="h-4 w-4" />
                  <span>{isSubmitting ? 'Đang xử lý...' : 'Xác nhận Đặt Lịch'}</span>
                </Button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Xem Chi Tiết Buổi Đã Đặt */}
      <Modal
        isOpen={!!selectedBookingDetail}
        onClose={() => setSelectedBookingDetail(null)}
        title="Chi tiết buổi tập PT 1:1"
        description="Thông tin chi tiết hội viên và lịch tập"
      >
        {selectedBookingDetail && (
          <div className="space-y-4">
            <div className="rounded-xl bg-bg-surface-muted p-4 text-xs text-text-muted space-y-2">
              <div className="flex justify-between items-center border-b border-border-subtle pb-2">
                <span className="text-text-muted">Mã Booking:</span>
                <span className="font-mono font-bold text-text-primary">{selectedBookingDetail.bookingCode || selectedBookingDetail.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Hội viên:</span>
                <strong className="text-text-primary text-sm">{selectedBookingDetail.memberName || 'Hội viên'}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">HLV Phụ trách:</span>
                <strong className="text-primary">{selectedBookingDetail.coachName || 'Huấn luyện viên'}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Khóa tập:</span>
                <span className="text-text-primary">{selectedBookingDetail.courseName || 'Khóa PT'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Thời gian tập:</span>
                <span className="font-mono font-semibold text-text-primary">{formatDateTime(selectedBookingDetail.startsAt)}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-border-subtle">
                <span className="text-text-muted">Trạng thái:</span>
                <StatusBadge status={selectedBookingDetail.status} />
              </div>
            </div>

            {selectedBookingDetail.status === 'CONFIRMED' && (
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleCompleteBooking(selectedBookingDetail)}
                  disabled={isSubmitting || Boolean(selectedBookingDetail.startsAt && new Date(selectedBookingDetail.startsAt).getTime() > Date.now())}
                  title={selectedBookingDetail.startsAt && new Date(selectedBookingDetail.startsAt).getTime() > Date.now() ? 'Chỉ kích hoạt khi thời gian thực tế chạm mốc giờ hẹn trở đi' : undefined}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Hoàn thành buổi tập
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-amber-700 dark:text-amber-300 border-amber-600/40 text-xs hover:bg-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleNoShowBooking(selectedBookingDetail)}
                  disabled={isSubmitting || Boolean(selectedBookingDetail.startsAt && new Date(selectedBookingDetail.startsAt).getTime() > Date.now())}
                  title={selectedBookingDetail.startsAt && new Date(selectedBookingDetail.startsAt).getTime() > Date.now() ? 'Chỉ kích hoạt khi thời gian thực tế chạm mốc giờ hẹn trở đi' : undefined}
                >
                  <UserX className="h-3 w-3 mr-1" />
                  Báo No-show
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  className="text-xs"
                  onClick={() => {
                    setCancelTarget(selectedBookingDetail)
                    setCancelReason('Hội viên bận đột xuất')
                    setCancelType('MEMBER')
                  }}
                  disabled={isSubmitting}
                >
                  Hủy lịch
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Hủy Lịch - Áp dụng quy tắc cắt giờ */}
      <Modal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Xác nhận hủy buổi tập PT 1:1"
        description="Quy tắc nghiệp vụ: Hệ thống tự động tính toán thời gian cắt giờ 12 tiếng"
      >
        {cancelTarget && (
          <div className="space-y-4">
            <div className="rounded-xl bg-bg-surface-muted p-4 text-xs text-text-muted space-y-1">
              <p>
                Hội viên: <strong className="text-text-primary">{cancelTarget.memberName || 'Hội viên'}</strong>
              </p>
              <p>
                HLV: <strong className="text-text-primary">{cancelTarget.coachName || 'Huấn luyện viên'}</strong>
              </p>
              <p>
                Giờ tập: <strong className="text-text-primary">{formatDateTime(cancelTarget.startsAt)}</strong>
              </p>
            </div>

            {/* Selection between member cancel vs coach emergency cancel */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary">Đối tượng yêu cầu hủy</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCancelType('MEMBER')}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                    cancelType === 'MEMBER'
                      ? 'border-cyan-500 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'
                      : 'border-border-subtle bg-bg-surface-muted text-text-muted'
                  }`}
                >
                  <p className="font-bold">Hội viên / Lễ tân</p>
                  <p className="text-[10px] text-text-muted">Áp dụng mốc cắt giờ 12h</p>
                </button>
                <button
                  type="button"
                  onClick={() => setCancelType('COACH')}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                    cancelType === 'COACH'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border-subtle bg-bg-surface-muted text-text-muted'
                  }`}
                >
                  <p className="font-bold">HLV / Phòng gym hủy</p>
                  <p className="text-[10px] text-text-muted">Luôn hoàn lại buổi tập</p>
                </button>
              </div>
            </div>

            {/* Dynamic cancellation rule indicator */}
            {cancelType === 'MEMBER' ? (
              isBeforeCutoff(cancelTarget.startsAt, 12) ? (
                <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-xs text-success space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Được hoàn buổi / cấp lượt bù (CANCELLED_EARLY)</span>
                  </div>
                  <p className="text-[11px] text-text-muted">
                    Thời gian báo trước &ge; 12 giờ. Buổi tập sẽ được hoàn trả lại ngay vào tài khoản hội viên.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-xs text-danger space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-danger">
                    <XCircle className="h-4 w-4" />
                    <span>Hủy muộn: Trừ lượt tập (CANCELLED_LATE)</span>
                  </div>
                  <p className="text-[11px] text-text-muted">
                    Thời gian báo trước &lt; 12 giờ. Buổi tập sẽ bị tính phí (CONSUME credit) và không được hoàn lại.
                  </p>
                </div>
              )
            ) : (
              <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-xs text-primary space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm text-primary">
                  <ShieldCheck className="h-4 w-4" />
                  <span>HLV hủy buổi: Hoàn 100% lượt tập</span>
                </div>
                <p className="text-[11px] text-text-muted">
                  Do HLV hoặc phòng tập gặp sự cố khẩn cấp. Lượt tập được hoàn trả ngay cho hội viên.
                </p>
              </div>
            )}

            <Input
              label="Lý do hủy buổi"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Nhập lý do chi tiết..."
              required
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setCancelTarget(null)} disabled={isSubmitting}>
                Giữ lịch tập
              </Button>
              <Button variant="danger" onClick={handleCancelBooking} disabled={isSubmitting}>
                {isSubmitting ? 'Đang hủy...' : 'Đồng ý Hủy Buổi'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Quy Tắc Nghiệp Vụ PT */}
      <Modal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        title="Quy tắc nghiệp vụ Lịch Huấn Luyện PT"
        description="Quy chế quản lý buổi tập cá nhân 1:1 dành cho Lễ tân và HLV"
      >
        <div className="space-y-3.5 text-xs text-text-primary">
          <div className="p-3 rounded-xl border border-border-subtle bg-bg-surface-muted space-y-1">
            <h4 className="font-bold text-text-primary flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-success" />
              1. Điều kiện tiên quyết để đặt lịch PT
            </h4>
            <p className="text-text-muted text-[11px]">
              Hội viên bắt buộc phải có Thẻ Hội Viên Gym còn hiệu lực (Status ACTIVE) và Gói PT còn lượt buổi khả dụng (Available Credits &gt; 0).
            </p>
          </div>

          <div className="p-3 rounded-xl border border-border-subtle bg-bg-surface-muted space-y-1">
            <h4 className="font-bold text-text-primary flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary" />
              2. Quy định Cắt Giờ Hủy Buổi (Cutoff Policy)
            </h4>
            <p className="text-text-muted text-[11px]">
              - <strong>Hủy trước 12 tiếng</strong>: Được coi là Hủy sớm (CANCELLED_EARLY), lượt buổi tập được tự động hoàn lại cho hội viên.<br />
              - <strong>Hủy dưới 12 tiếng</strong>: Được coi là Hủy muộn (CANCELLED_LATE), lượt buổi tập sẽ bị trừ (CONSUMED) để bù đắp chi phí giữ ca của HLV.
            </p>
          </div>

          <div className="p-3 rounded-xl border border-border-subtle bg-bg-surface-muted space-y-1">
            <h4 className="font-bold text-text-primary flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-warning" />
              3. Trường hợp Huấn Luyện Viên hủy buổi đột xuất
            </h4>
            <p className="text-text-muted text-[11px]">
              Nếu HLV hoặc phòng gym hủy buổi vì lý do kỹ thuật/sức khỏe, hội viên luôn được hoàn trả 100% lượt tập bất kể thời gian báo trước.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="primary" onClick={() => setShowRulesModal(false)}>
              Đã hiểu
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
