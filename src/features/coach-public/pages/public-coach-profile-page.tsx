import { useParams, Link } from 'react-router-dom'
import { Star, Award, CheckCircle, Clock, Calendar, ArrowLeft, LogIn } from 'lucide-react'
import { mockCoaches } from '@/mocks/fixtures-base'
import { mockPackageOptions, mockReviews } from '@/mocks/fixtures-training'
import { formatVND } from '@/shared/utils/currency'
import { formatDate } from '@/shared/utils/date'
import { Button } from '@/shared/components/ui/button'

export function PublicCoachProfilePage() {
  const { coachId } = useParams<{ coachId: string }>()
  const coach = mockCoaches.find((c) => c.id === coachId) || mockCoaches[0]

  // Filter public visible reviews and approved packages
  const publicReviews = mockReviews.filter(
    (r) => r.coachId === coach.id && r.moderationStatus === 'VISIBLE'
  )
  const approvedPackages = mockPackageOptions.filter(
    (p) => p.approvalStatus === 'APPROVED' && (!p.coachId || p.coachId === coach.id)
  )

  return (
    <div className="min-h-screen bg-[#070a11] text-slate-100">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Về trang chủ</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button size="sm" variant="outline" className="gap-2">
                <LogIn className="h-4 w-4" />
                <span>Đăng nhập</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6 lg:p-10 space-y-10">
        {/* Coach Header Card */}
        <div className="flex flex-col md:flex-row gap-8 items-start rounded-3xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur-xl">
          <img
            src={coach.avatarUrl}
            alt={coach.fullName}
            className="h-36 w-36 rounded-2xl border-2 border-orange-500/40 object-cover shadow-2xl shadow-orange-500/20"
          />
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-white">{coach.fullName}</h1>
                <p className="text-sm font-medium text-orange-400 mt-0.5">{coach.specialization}</p>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <span className="text-lg font-bold text-amber-300">{coach.averageRating}</span>
                <span className="text-xs text-slate-400">({coach.reviewCount} đánh giá)</span>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">{coach.bio}</p>

            <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-orange-400" />
                <span>Kinh nghiệm: <strong>{coach.yearsOfExperience} năm</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-sky-400" />
                <span>Chứng chỉ: <strong>{coach.certification}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Courses & Packages */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
            <span>Khóa học & Gói Huấn Luyện 1:1 Đang Giảng Dạy</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {approvedPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg hover:border-orange-500/40 transition-all"
              >
                <div className="space-y-2">
                  <span className="rounded-full bg-orange-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-orange-400">
                    {pkg.sessionCount} Buổi Tập
                  </span>
                  <h3 className="text-base font-bold text-white">{pkg.name}</h3>
                  <p className="text-xs text-slate-400">{pkg.courseName}</p>
                </div>

                <div className="mt-6 border-t border-slate-800 pt-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase text-slate-400">Học phí trọn gói</p>
                    <p className="text-lg font-bold text-emerald-400">{formatVND(pkg.price)}</p>
                  </div>
                  <Link to="/login">
                    <Button size="sm" variant="primary">
                      Đăng ký mua
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section: Public Reviews */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            <span>Nhận Xét Từ Hội Viên ({publicReviews.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {publicReviews.map((rev) => (
              <div key={rev.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-200">{rev.memberDisplayName}</p>
                    <p className="text-[10px] text-slate-400">{rev.courseNameSnapshot}</p>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">"{rev.comment}"</p>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(rev.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
