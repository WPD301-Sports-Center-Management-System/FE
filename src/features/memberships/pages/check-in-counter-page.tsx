import { useState } from 'react'
import { Search, CheckCircle2, AlertOctagon, User, Clock, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { db } from '@/mocks/mock-server'
import { formatTime } from '@/shared/utils/date'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { Button } from '@/shared/components/ui/button'
import type { MemberDetail, CheckIn } from '@/shared/types/api'

export function CheckInCounterPage() {
  const [searchCode, setSearchCode] = useState('MEM-00109')
  const [searchedMember, setSearchedMember] = useState<MemberDetail | null>(db.members[0])
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([...db.checkIns])
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSuccessMessage(null)
    const code = searchCode.trim().toLowerCase()
    const found = db.members.find(
      (m) => m.memberCode.toLowerCase().includes(code) || (m.phone && m.phone.includes(code))
    )
    setSearchedMember(found || null)
  }

  const handleConfirmCheckIn = () => {
    if (!searchedMember) return
    const newRecord: CheckIn = {
      id: 'chk-' + Date.now(),
      memberId: searchedMember.id,
      checkedInBy: 'usr-rec-01',
      checkedInAt: new Date().toISOString(),
      note: 'Vào phòng tập tại quầy',
      member: searchedMember,
    }
    db.checkIns.unshift(newRecord)
    setRecentCheckIns([...db.checkIns])
    setSuccessMessage(`Check-in thành công cho hội viên ${searchedMember.fullName}!`)
  }

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
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/90 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </div>
            <Button type="submit" variant="primary" className="px-6 rounded-2xl">
              Tìm kiếm
            </Button>
          </form>

          {successMessage && (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-sm text-emerald-300">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
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
              {searchedMember.membershipStatus === 'ACTIVE' ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-500/20 p-2 text-emerald-400">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-300">Thẻ Gym Hợp Lệ (Cho phép vào)</p>
                      <p className="text-xs text-slate-400">Gói tập còn hạn đến hết 31/12/2026</p>
                    </div>
                  </div>
                  <Button variant="primary" onClick={handleConfirmCheckIn} className="gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Xác nhận Check-in</span>
                  </Button>
                </div>
              ) : (
                <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-5 flex items-center justify-between">
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
                    <Button variant="danger" className="gap-2 text-xs">
                      <span>Gia hạn vé ngay</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-500">
              Không tìm thấy hội viên nào khớp với mã vừa nhập.
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
          </div>

          <div className="divide-y divide-slate-800/80 max-h-[500px] overflow-y-auto pr-1">
            {recentCheckIns.map((item) => (
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
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
