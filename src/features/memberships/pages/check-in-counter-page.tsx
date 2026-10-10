import { useState, useEffect, useCallback } from 'react'
import { Search, CheckCircle2, AlertOctagon, User, Clock, ArrowRight, Loader2, QrCode } from 'lucide-react'
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
        setErrorMessage(`Không tìm thấy hội viên nào khớp với "${query}".`)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi khi tra cứu hội viên.'
      setErrorMessage(msg)
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
      setSuccessMessage(`Check-in thành công cho hội viên ${searchedMember.fullName}!`)
      // Refresh check-in list or prepend
      const recordWithMember: CheckIn = {
        ...created,
        member: created.member || searchedMember,
      }
      setRecentCheckIns((prev) => [recordWithMember, ...prev.filter((c) => c.id !== created.id)])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Check-in thất bại. Vui lòng kiểm tra lại trạng thái thẻ.'
      setErrorMessage(msg)
    } finally {
      setIsSubmittingCheckIn(false)
    }
  }

  const isMemberActive = searchedMember?.membershipStatus === 'ACTIVE'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Quầy Điểm Danh & Check-in (WEB-REC-04)</h1>
        <p className="text-xs text-slate-400 mt-1">
          Quét mã vạch hoặc nhập mã thẻ/số điện thoại để kiểm tra quyền hạn ra vào phòng tập
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (7 cols): Search & Verification Card */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Nhập mã thẻ (vd: MEM-00109) hoặc số điện thoại..."
                autoFocus
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/90 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </div>
            <Button type="submit" variant="primary" className="px-6 rounded-2xl" disabled={isSearching || !searchCode.trim()}>
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Tìm kiếm
            </Button>
          </form>

          {successMessage && (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-sm text-emerald-300 animate-in fade-in">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-sm text-red-300 animate-in fade-in">
              <AlertOctagon className="h-5 w-5 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {searchedMember ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl space-y-6">
              <div className="flex items-center gap-6">
                <img
                  src={searchedMember.avatarUrl || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'}
                  alt={searchedMember.fullName}
                  className="h-24 w-24 rounded-2xl object-cover border-2 border-slate-700 shadow-lg"
                />
                <div className="space-y-1">
                  <span className="text-xs font-mono text-orange-400 font-bold">{searchedMember.memberCode}</span>
                  <h2 className="text-2xl font-bold text-white">{searchedMember.fullName}</h2>
                  <p className="text-xs text-slate-400">SĐT: {searchedMember.phone || '—'}</p>
                  <div className="pt-1">
                    <StatusBadge status={searchedMember.membershipStatus} />
                  </div>
                </div>
              </div>

              {/* Status Decision Box */}
              {isMemberActive ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-500/20 p-2 text-emerald-400">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-300">Thẻ Gym Hợp Lệ (Cho phép vào)</p>
                      <p className="text-xs text-slate-400">
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
                <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-red-500/20 p-2 text-red-400">
                      <AlertOctagon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-red-300">Thẻ Đã Hết Hạn / Chưa Kích Hoạt</p>
                      <p className="text-xs text-slate-400">Không đủ điều kiện vào phòng hoặc tập PT</p>
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
            <div className="rounded-2xl border border-slate-800 p-12 flex justify-center items-center text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : hasSearched ? (
            <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-500">
              Không tìm thấy hội viên nào khớp với mã vừa nhập.
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-800/80 p-12 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400">
                <QrCode className="h-6 w-6 text-orange-400" />
              </div>
              <p className="text-sm font-medium text-slate-300">Sẵn sàng điểm danh</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Quét mã thẻ barcode/QR hoặc nhập mã thẻ, số điện thoại của hội viên vào ô bên trên để kiểm tra quyền hạn ra vào.
              </p>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): History of recent check-ins */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-400" />
              <span>Lịch Sử Vào Phòng ({recentCheckIns.length})</span>
            </h3>
            {isLoadingHistory && <Loader2 className="h-4 w-4 animate-spin text-orange-400" />}
          </div>

          <div className="divide-y divide-slate-800/80 max-h-[500px] overflow-y-auto pr-1">
            {recentCheckIns.length === 0 && !isLoadingHistory ? (
              <p className="text-xs text-slate-500 py-6 text-center">Chưa có lượt check-in nào</p>
            ) : (
              recentCheckIns.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{item.member?.fullName || 'Hội viên'}</p>
                      <p className="text-[10px] font-mono text-slate-400">{item.member?.memberCode}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {formatTime(item.checkedInAt)}
                    </span>
                    <p className="text-[10px] text-slate-500">{item.note}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
