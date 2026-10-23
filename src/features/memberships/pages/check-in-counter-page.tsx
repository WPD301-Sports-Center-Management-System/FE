import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Search, CheckCircle2, AlertOctagon, Clock, ArrowRight, Loader2, QrCode, RotateCw, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatTime, formatDate } from '@/shared/utils/date'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { Button } from '@/shared/components/ui/button'
import { membersService } from '@/features/memberships/services/members.service'
import { subscriptionsService } from '@/features/memberships/services/subscriptions.service'
import { checkInsService } from '@/features/memberships/services/check-ins.service'
import type { MemberSummary, CheckIn, Subscription } from '@/shared/types/api'

export function CheckInCounterPage() {
  const [searchCode, setSearchCode] = useState('')
  const [searchedMember, setSearchedMember] = useState<MemberSummary | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null)
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([])
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmittingCheckIn, setIsSubmittingCheckIn] = useState(false)

  // Fetch recent check-ins
  const fetchRecentCheckIns = useCallback(async () => {
    try {
      setIsLoadingHistory(true)
      const res = await checkInsService.getCheckIns({ limit: 20 })
      setRecentCheckIns(res.data || [])
    } catch (err) {
      console.error('Failed to load check-in history:', err)
    } finally {
      setIsLoadingHistory(false)
    }
  }, [])

  // Robust search function
  const searchMemberByCode = useCallback(async (query: string) => {
    const trimmed = query.trim()
    if (!trimmed) return
    setIsSearching(true)
    setHasSearched(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    setActiveSubscription(null)
    try {
      let foundMember: MemberSummary | null = null

      // Step 1: Try memberCode search
      try {
        const byCode = await membersService.getMembers({ memberCode: trimmed })
        if (byCode.data && byCode.data.length > 0) {
          foundMember = byCode.data[0]
        }
      } catch {
        // continue
      }

      // Step 2: Try search query (matches fullName / email)
      if (!foundMember) {
        try {
          const bySearch = await membersService.getMembers({ search: trimmed })
          if (bySearch.data && bySearch.data.length > 0) {
            foundMember = bySearch.data[0]
          }
        } catch {
          // continue
        }
      }

      // Step 3: Fallback fetch general list & search phone or partial member code
      if (!foundMember) {
        try {
          const allMembers = await membersService.getMembers({ limit: 50 })
          const s = trimmed.toLowerCase()
          const matched = (allMembers.data || []).find(
            (m) =>
              m.memberCode.toLowerCase().includes(s) ||
              m.fullName.toLowerCase().includes(s) ||
              (m.phone && m.phone.includes(s)) ||
              (m.email && m.email.toLowerCase().includes(s))
          )
          if (matched) {
            foundMember = matched
          }
        } catch {
          // continue
        }
      }

      if (foundMember) {
        // Verify active gym subscription
        try {
          const subsRes = await subscriptionsService.getSubscriptions({
            memberId: foundMember.id,
            status: 'ACTIVE',
          })
          const activeSub = (subsRes.data || []).find((s) => s.status === 'ACTIVE')
          setActiveSubscription(activeSub || null)
          setSearchedMember({
            ...foundMember,
            membershipStatus: activeSub ? 'ACTIVE' : 'EXPIRED',
          })
        } catch {
          setActiveSubscription(null)
          setSearchedMember(foundMember)
        }
      } else {
        setSearchedMember(null)
        setActiveSubscription(null)
        const msg = `Không tìm thấy hội viên nào khớp với "${query}".`
        setErrorMessage(msg)
        toast.error(msg)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi khi tra cứu hội viên.'
      setErrorMessage(msg)
      toast.error(msg)
      setSearchedMember(null)
      setActiveSubscription(null)
    } finally {
      setIsSearching(false)
    }
  }, [])

  // On mount, only fetch recent check-ins history (do not auto-search any member)
  useEffect(() => {
    fetchRecentCheckIns()
  }, [fetchRecentCheckIns])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchMemberByCode(searchCode)
  }

  const handleConfirmCheckIn = async () => {
    if (!searchedMember) return
    setIsSubmittingCheckIn(true)
    setSuccessMessage(null)
    setErrorMessage(null)
    try {
      const created = await checkInsService.createCheckIn({
        memberId: searchedMember.id,
        note: 'Vào phòng tập tại quầy',
      })
      const msg = `Check-in thành công cho hội viên ${searchedMember.fullName}!`
      setSuccessMessage(msg)
      toast.success(msg)
      // Refresh check-in list or prepend
      const recordWithMember: CheckIn = {
        ...created,
        member: created.member || searchedMember,
      }
      setRecentCheckIns((prev) => [recordWithMember, ...prev.filter((c) => c.id !== created.id)])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Check-in thất bại. Vui lòng kiểm tra lại trạng thái thẻ.'
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setIsSubmittingCheckIn(false)
    }
  }

  const isMemberActive = searchedMember?.membershipStatus === 'ACTIVE'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Quầy Điểm Danh & Check-in (WEB-REC-04)</h1>
        <p className="text-xs text-text-muted mt-1">
          Quét mã vạch hoặc nhập mã thẻ/số điện thoại để kiểm tra quyền hạn ra vào phòng tập
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (7 cols): Search & Verification Card */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Nhập mã thẻ (vd: MEM-00109) hoặc số điện thoại..."
                autoFocus
                className="w-full rounded-2xl border border-border-subtle bg-bg-input py-3 pl-11 pr-4 text-sm text-text-primary placeholder:text-text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-focus-ring/40"
              />
            </div>
            <Button type="submit" variant="primary" className="px-6 rounded-2xl" disabled={isSearching || !searchCode.trim()}>
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Tìm kiếm
            </Button>
          </form>

          {successMessage && (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300 animate-in fade-in">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger animate-in fade-in">
              <AlertOctagon className="h-5 w-5 shrink-0 text-danger" />
              <span>{errorMessage}</span>
            </div>
          )}

          {searchedMember ? (
            <div className="rounded-3xl border border-border-subtle bg-bg-surface p-8 shadow-sm backdrop-blur-xl space-y-6">
              <div className="flex items-center gap-6">
                <img
                  src={searchedMember.avatarUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'}
                  alt={searchedMember.fullName}
                  className="h-24 w-24 rounded-2xl object-cover border-2 border-border-subtle shadow-md"
                />
                <div className="space-y-1">
                  <span className="text-xs font-mono text-primary font-bold">{searchedMember.memberCode}</span>
                  <h2 className="text-2xl font-bold text-text-primary">{searchedMember.fullName}</h2>
                  <p className="text-xs text-text-muted">SĐT: {searchedMember.phone || '—'}</p>
                  <div className="pt-1">
                    <StatusBadge status={searchedMember.membershipStatus} />
                  </div>
                </div>
              </div>

              {/* Status Decision Box */}
              {isMemberActive ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-500/20 p-2 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Thẻ Gym Hợp Lệ (Cho phép vào)</p>
                      <p className="text-xs text-text-muted">
                        {activeSubscription
                          ? `Gói ${activeSubscription.planNameSnapshot || 'tập'} · Hạn đến ${formatDate(activeSubscription.endDate)}`
                          : 'Gói tập còn hạn hiệu lực'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleConfirmCheckIn}
                    disabled={isSubmittingCheckIn}
                    className="gap-2 shrink-0"
                  >
                    {isSubmittingCheckIn ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    <span>Xác nhận Check-in</span>
                  </Button>
                </div>
              ) : (
                <div className="rounded-2xl border border-danger/30 bg-danger/10 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-danger/20 p-2 text-danger">
                      <AlertOctagon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-danger">Thẻ Đã Hết Hạn / Chưa Kích Hoạt</p>
                      <p className="text-xs text-text-muted">Không đủ điều kiện vào phòng hoặc tập PT</p>
                    </div>
                  </div>
                  <Link to="/receptionist/membership-sale">
                    <Button variant="danger" className="gap-2 text-xs shrink-0">
                      <span>Gia hạn vé ngay</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ) : isSearching ? (
            <div className="rounded-2xl border border-border-subtle bg-bg-surface p-12 flex justify-center items-center text-text-muted">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : hasSearched ? (
            <div className="rounded-2xl border border-dashed border-border-subtle bg-bg-surface p-12 text-center text-text-muted">
              Không tìm thấy hội viên nào khớp với mã vừa nhập.
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border-subtle bg-bg-surface p-12 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-bg-surface-muted flex items-center justify-center text-text-muted">
                <QrCode className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-text-primary">Sẵn sàng điểm danh</p>
              <p className="text-xs text-text-muted max-w-sm mx-auto">
                Quét mã thẻ barcode/QR hoặc nhập mã thẻ, số điện thoại của hội viên vào ô bên trên để kiểm tra quyền hạn ra vào.
              </p>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): History of recent check-ins */}
        <div className="lg:col-span-5 rounded-3xl border border-border-subtle bg-bg-surface p-6 space-y-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary tracking-tight flex items-center gap-2">
                  <span>Lịch Sử Vào Phòng ({recentCheckIns.length})</span>
                </h3>
                <p className="text-[11px] text-text-muted">Danh sách lượt check-in theo thời gian thực</p>
              </div>
            </div>
            <button
              type="button"
              onClick={fetchRecentCheckIns}
              disabled={isLoadingHistory}
              className="p-2 rounded-xl border border-border-subtle bg-bg-surface-muted hover:bg-border-subtle text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              title="Làm mới lịch sử"
            >
              <RotateCw className={`h-3.5 w-3.5 ${isLoadingHistory ? 'animate-spin text-primary' : ''}`} />
            </button>
          </div>

          {/* Quick Overview Badges */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl border border-border-subtle bg-bg-surface-muted p-2.5 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="truncate">
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Cổng kiểm soát</p>
                <p className="font-semibold text-text-primary text-xs">Sẵn sàng nhận thẻ</p>
              </div>
            </div>
            <div className="rounded-xl border border-border-subtle bg-bg-surface-muted p-2.5 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              <div className="truncate">
                <p className="text-[10px] text-text-muted uppercase tracking-wider">Lượt gần nhất</p>
                <p className="font-semibold text-text-primary text-xs font-mono">
                  {recentCheckIns.length > 0 ? formatTime(recentCheckIns[0].checkedInAt) : 'Chưa có'}
                </p>
              </div>
            </div>
          </div>

          {/* Check-in items list */}
          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
            {recentCheckIns.length === 0 && !isLoadingHistory ? (
              <div className="rounded-2xl border border-dashed border-border-subtle p-8 text-center space-y-1.5">
                <Clock className="h-6 w-6 text-text-muted mx-auto" />
                <p className="text-xs font-medium text-text-muted">Chưa có lượt check-in nào trong ca này</p>
                <p className="text-[11px] text-text-muted/80">
                  Lượt quét thẻ thành công sẽ tự động xuất hiện tại đây
                </p>
              </div>
            ) : (
              recentCheckIns.map((item) => {
                const memberName = item.member?.fullName || 'Hội viên'
                const memberCode = item.member?.memberCode || 'MEM-00109'
                const initials = memberName.slice(0, 2).toUpperCase()

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-border-subtle bg-bg-surface hover:bg-bg-surface-muted/50 p-3.5 flex items-center justify-between gap-3 transition-colors shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-xl border border-primary/20 bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                        {initials}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-xs font-bold text-text-primary truncate">{memberName}</p>
                        <div className="flex items-center gap-2 text-[10px] text-text-muted font-mono">
                          <span className="bg-bg-surface-muted border border-border-subtle px-1.5 py-0.5 rounded text-text-primary">
                            {memberCode}
                          </span>
                          {item.member?.phone && (
                            <span className="truncate">SĐT: {item.member.phone}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{formatTime(item.checkedInAt)}</span>
                      </div>
                      <p className="text-[10px] text-text-muted mt-1">
                        {item.note || 'Vào phòng tập tại quầy'}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
