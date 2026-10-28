import { useState, useEffect, useCallback } from 'react'
import { Avatar } from '@/shared/components/ui/avatar'
import { Search, CheckCircle2, AlertOctagon, Clock, ArrowRight, Loader2, QrCode, RotateCw, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { centerDate, formatTime, formatDate } from '@/shared/utils/date'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { Button } from '@/shared/components/ui/button'
import { membersService } from '@/features/memberships/services/members.service'
import { subscriptionsService } from '@/features/memberships/services/subscriptions.service'
import { checkInsService } from '@/features/memberships/services/check-ins.service'
import { fixedPtApi } from '@/features/fixed-pt/api'
import type { GymVisit } from '@/features/fixed-pt/types'
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
  // Gym visit (vào/ra) is separate from PT attendance; today's PT sessions are offered for 'Đã đến'.
  const [visit, setVisit] = useState<GymVisit | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<MemberSummary[]>([])
  const [ticketCheck, setTicketCheck] = useState<'loading' | 'valid' | 'upcoming' | 'invalid' | 'error'>('loading')
  const [historyFilter, setHistoryFilter] = useState<'all' | 'inside'>('all')
  const [insideTotal, setInsideTotal] = useState<number | null>(null)
  const [historyError, setHistoryError] = useState(false)

  // Fetch recent check-ins
  // The "inside now" count comes from the server total of OPEN visits, not from the 20 rows shown.
  const fetchRecentCheckIns = useCallback(async () => {
    try {
      setIsLoadingHistory(true)
      const [res, inside] = await Promise.all([
        checkInsService.getCheckIns({ limit: 20, status: historyFilter === 'inside' ? 'OPEN' : undefined }),
        checkInsService.getCheckIns({ limit: 1, status: 'OPEN' }).catch(() => null),
      ])
      setRecentCheckIns(res.data || [])
      setInsideTotal(inside?.meta?.total ?? null)
      setHistoryError(false)
    } catch {
      setHistoryError(true)
    } finally {
      setIsLoadingHistory(false)
    }
  }, [historyFilter])

  // Checks the gym ticket the way the server does: ACTIVE and valid on today's center date.
  // A failed request is reported as such, never as an expired ticket.
  const selectMember = useCallback(async (member: MemberSummary) => {
    setCandidates([])
    setSearchedMember(member)
    setActiveSubscription(null)
    setTicketCheck('loading')
    try {
      const subsRes = await subscriptionsService.getSubscriptions({ memberId: member.id, status: 'ACTIVE' })
      const today = centerDate()
      const valid = (subsRes.data || []).find((s) => s.status === 'ACTIVE' && s.startDate.slice(0, 10) <= today && s.endDate.slice(0, 10) >= today)
      const upcoming = (subsRes.data || []).find((s) => s.status === 'ACTIVE' && s.startDate.slice(0, 10) > today)
      setActiveSubscription(valid ?? upcoming ?? null)
      setTicketCheck(valid ? 'valid' : upcoming ? 'upcoming' : 'invalid')
    } catch {
      setTicketCheck('error')
    }
  }, [])

  // Exact member code first, then name / phone / email. Several matches are listed so the receptionist
  // picks the right person instead of the first result.
  const searchMemberByCode = useCallback(async (query: string) => {
    const trimmed = query.trim()
    if (!trimmed) return
    setIsSearching(true)
    setHasSearched(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    setSearchedMember(null)
    setCandidates([])
    setVisit(null)
    try {
      const byCode = await membersService.getMembers({ memberCode: trimmed.toUpperCase() })
      const found = byCode.data?.length ? byCode.data : (await membersService.getMembers({ search: trimmed, limit: 10 })).data || []
      if (found.length === 1) await selectMember(found[0]!)
      else if (found.length > 1) setCandidates(found)
      else setErrorMessage(`Không tìm thấy hội viên nào khớp với "${trimmed}". Kiểm tra lại mã thẻ, số điện thoại hoặc tên.`)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Không tra cứu được hội viên. Kiểm tra kết nối rồi thử lại.')
    } finally {
      setIsSearching(false)
    }
  }, [selectMember])

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
      const gymVisit = created as unknown as GymVisit
      setVisit(gymVisit)
      setSuccessMessage(gymVisit.reused ? `${searchedMember.fullName} đang có lượt vào gym chưa ra (từ ${formatTime(gymVisit.checkedInAt)}); không tạo lượt mới.` : `Check-in thành công cho hội viên ${searchedMember.fullName}!`)
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

  const isMemberActive = ticketCheck === 'valid'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Quầy check-in</h1>
        <p className="text-xs text-text-muted mt-1">
          Nhập mã thẻ, số điện thoại hoặc tên hội viên để kiểm tra vé gym rồi cho vào phòng tập.
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
                placeholder="Mã thẻ, số điện thoại hoặc tên hội viên"
                aria-label="Tìm hội viên"
                autoFocus
                className="w-full rounded-2xl border border-border-subtle bg-bg-input py-3 pl-11 pr-4 text-sm text-text-primary placeholder:text-text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-focus-ring/40"
              />
            </div>
            <Button type="submit" variant="primary" className="px-6 rounded-2xl" disabled={isSearching || !searchCode.trim()}>
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Tìm kiếm
            </Button>
          </form>

          {visit?.todaySessions && visit.todaySessions.length > 0 && (
            <div className="rounded-2xl border border-border-subtle bg-bg-surface p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Buổi PT hôm nay</p>
              {visit.todaySessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-2 text-sm">
                  <span>{formatTime(s.plannedStartsAt)}–{formatTime(s.plannedEndsAt)} · Coach {s.coach?.user.fullName} · <StatusBadge status={s.status} /></span>
                  {s.status === 'CONFIRMED' && (
                    <Button size="sm" variant="secondary" isLoading={busyId === s.id} onClick={async () => {
                      setBusyId(s.id); setErrorMessage(null)
                      try { await fixedPtApi.arrive(s.id); setVisit((v) => v && { ...v, todaySessions: v.todaySessions?.map((x) => (x.id === s.id ? { ...x, status: 'ARRIVED' } : x)) }) }
                      catch (err) { setErrorMessage(err instanceof Error ? err.message : 'Không ghi được Member đã đến buổi PT.') }
                      finally { setBusyId(null) }
                    }}>Ghi đã đến buổi PT</Button>
                  )}
                </div>
              ))}
            </div>
          )}

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

          {candidates.length > 0 && (
            <div className="rounded-2xl border border-border-subtle bg-bg-surface p-4 space-y-2">
              <p className="text-sm font-semibold text-text-primary">Có {candidates.length} hội viên khớp. Chọn đúng người:</p>
              {candidates.map((m) => (
                <button key={m.id} type="button" onClick={() => void selectMember(m)}
                  className="w-full flex items-center gap-3 rounded-xl border border-border-subtle p-3 text-left hover:bg-bg-surface-muted cursor-pointer">
                  <Avatar src={m.avatarUrl} name={m.fullName} size={40} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-text-primary truncate">{m.fullName}</span>
                    <span className="block text-xs text-text-muted">{m.memberCode} · {m.phone || 'chưa có SĐT'}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-text-muted" />
                </button>
              ))}
            </div>
          )}

          {searchedMember ? (
            <div className="rounded-3xl border border-border-subtle bg-bg-surface p-8 shadow-sm backdrop-blur-xl space-y-6">
              <div className="flex items-center gap-6">
                <Avatar src={searchedMember.avatarUrl} name={searchedMember.fullName} size={96} className="rounded-2xl border-2" />
                <div className="space-y-1">
                  <span className="text-xs font-mono text-primary font-bold">{searchedMember.memberCode}</span>
                  <h2 className="text-2xl font-bold text-text-primary">{searchedMember.fullName}</h2>
                  <p className="text-xs text-text-muted">SĐT: {searchedMember.phone || '—'}</p>
                </div>
              </div>

              {/* Status Decision Box */}
              {ticketCheck === 'loading' ? (
                <div className="rounded-2xl border border-border-subtle p-5 flex items-center gap-3 text-sm text-text-muted">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" /> Đang kiểm tra vé gym…
                </div>
              ) : ticketCheck === 'error' ? (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-amber-700 dark:text-amber-300">Chưa kiểm tra được vé gym</p>
                    <p className="text-xs text-text-muted">Mất kết nối tới máy chủ. Đây không phải là vé hết hạn.</p>
                  </div>
                  <Button variant="secondary" onClick={() => void selectMember(searchedMember)}>Kiểm tra lại</Button>
                </div>
              ) : isMemberActive ? (
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
                      <p className="text-sm font-bold text-danger">{ticketCheck === 'upcoming' ? 'Vé gym chưa tới ngày bắt đầu' : 'Không có vé gym còn hạn hôm nay'}</p>
                      <p className="text-xs text-text-muted">{ticketCheck === 'upcoming' && activeSubscription ? `Vé ${activeSubscription.planNameSnapshot} bắt đầu từ ${formatDate(activeSubscription.startDate)}.` : 'Hội viên cần mua hoặc gia hạn vé trước khi vào phòng tập.'}</p>
                    </div>
                  </div>
                  <Link to={`/receptionist/membership-sale?memberId=${searchedMember.id}`}>
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
                <p className="text-xs text-text-muted">Danh sách lượt check-in theo thời gian thực</p>
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
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <div className="truncate">
                <p className="text-xs text-text-muted">Đang trong phòng tập</p>
                <p className="font-semibold text-text-primary text-sm">{insideTotal === null ? '—' : `${insideTotal} người`}</p>
              </div>
            </div>
            <div className="rounded-xl border border-border-subtle bg-bg-surface-muted p-2.5 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              <div className="truncate">
                <p className="text-xs text-text-muted uppercase tracking-wider">Lượt gần nhất</p>
                <p className="font-semibold text-text-primary text-xs font-mono">
                  {recentCheckIns.length > 0 ? formatTime(recentCheckIns[0].checkedInAt) : 'Chưa có'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2" role="tablist" aria-label="Lọc lượt vào">
            {([['all', 'Gần đây'], ['inside', 'Đang trong phòng']] as const).map(([key, text]) => (
              <button key={key} type="button" role="tab" aria-selected={historyFilter === key} onClick={() => setHistoryFilter(key)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${historyFilter === key ? 'border-primary bg-primary text-white' : 'border-border-subtle text-text-secondary hover:bg-bg-surface-muted'}`}>
                {text}
              </button>
            ))}
          </div>
          {historyError && (
            <p role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">Không tải được danh sách lượt vào. Bấm làm mới để thử lại.</p>
          )}

          {/* Check-in items list */}
          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
            {recentCheckIns.length === 0 && !isLoadingHistory && !historyError ? (
              <div className="rounded-2xl border border-dashed border-border-subtle p-8 text-center space-y-1.5">
                <Clock className="h-6 w-6 text-text-muted mx-auto" />
                <p className="text-xs font-medium text-text-muted">{historyFilter === 'inside' ? 'Không có ai đang trong phòng tập' : 'Chưa có lượt check-in nào'}</p>
                <p className="text-xs text-text-muted/80">
                  Lượt quét thẻ thành công sẽ tự động xuất hiện tại đây
                </p>
              </div>
            ) : (
              recentCheckIns.map((item) => {
                const memberName = item.member?.fullName || 'Hội viên'
                const memberCode = item.member?.memberCode || '—'
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
                        <div className="flex items-center gap-2 text-xs text-text-muted font-mono">
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
                      <p className="text-xs text-text-muted mt-1">
                        {item.note || 'Vào phòng tập tại quầy'}
                      </p>
                      {(item as unknown as GymVisit).status === 'OPEN' ? (
                        <Button size="sm" variant="ghost" isLoading={busyId === item.id} onClick={async () => {
                          setBusyId(item.id); setErrorMessage(null)
                          try { await fixedPtApi.checkOut(item.id); await fetchRecentCheckIns() }
                          catch (err) { setErrorMessage(err instanceof Error ? err.message : 'Không ghi được lượt ra.') }
                          finally { setBusyId(null) }
                        }}>Ghi ra gym</Button>
                      ) : (
                        <p className="text-xs text-text-muted">
                          {(item as unknown as GymVisit).status === 'AUTO_CLOSED' ? 'Đóng kỹ thuật – giờ ra chưa xác minh' : (item as unknown as GymVisit).checkedOutAt ? `Ra lúc ${formatTime((item as unknown as GymVisit).checkedOutAt)}` : (item as unknown as GymVisit).status === 'LEGACY_IMPORTED' ? 'Dữ liệu cũ (không có giờ ra)' : ''}
                        </p>
                      )}
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
