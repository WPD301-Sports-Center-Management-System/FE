import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Star, Award, CheckCircle, Clock, Calendar, ArrowLeft, LogIn, RefreshCw, AlertCircle } from 'lucide-react'
import { coachesService } from '@/features/coaches/services/coaches.service'
import { formatVND } from '@/shared/utils/currency'
import { formatDate } from '@/shared/utils/date'
import { Button } from '@/shared/components/ui/button'
import type { CoachDetail, CoachReview, PackageOption } from '@/shared/types/api'

export function PublicCoachProfilePage() {
  const { coachId } = useParams<{ coachId: string }>()
  const [coach, setCoach] = useState<CoachDetail | null>(null)
  const [reviews, setReviews] = useState<CoachReview[]>([])
  const [packages, setPackages] = useState<PackageOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    async function loadCoachProfile() {
      setIsLoading(true)
      setErrorMessage(null)
      try {
        let targetId = coachId
        // If param is a mock ID or missing, load active coach from list
        if (!targetId || targetId.startsWith('coa-')) {
          const list = await coachesService.getCoaches({ limit: 1 })
          if (list.data && list.data.length > 0) {
            targetId = list.data[0].id
          }
        }

        if (targetId) {
          const [detailRes, reviewsRes] = await Promise.allSettled([
            coachesService.getCoachById(targetId),
            coachesService.getCoachReviews(targetId),
          ])

          if (detailRes.status === 'fulfilled') {
            setCoach(detailRes.value)
            setPackages(detailRes.value.availablePackageOptions || [])
          }
          if (reviewsRes.status === 'fulfilled') {
            const list = (reviewsRes.value.data || []).filter((r: any) => r.moderationStatus !== 'HIDDEN')
            setReviews(list)
          }

        }
      } catch {
        setErrorMessage('Không thể tải thông tin hồ sơ HLV.')
      } finally {
        setIsLoading(false)
      }
    }

    loadCoachProfile()
  }, [coachId])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-app text-text-primary">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-text-muted">Đang tải hồ sơ Huấn luyện viên...</p>
        </div>
      </div>
    )
  }

  if (errorMessage || !coach) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg-app p-6 text-center text-text-primary">
        <AlertCircle className="h-10 w-10 text-danger mb-3" />
        <h2 className="text-xl font-bold text-text-primary">Hồ sơ HLV không tìm thấy</h2>
        <p className="text-xs text-text-muted mt-1 max-w-sm">
          {errorMessage || 'Huấn luyện viên bạn tìm kiếm hiện không khả dụng.'}
        </p>
        <Link to="/" className="mt-6">
          <Button variant="outline">Về trang chủ</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-app text-text-primary">
      {/* Top Navbar */}
      <header className="border-b border-border-subtle bg-bg-surface/90 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xs text-text-muted hover:text-text-primary transition-colors">
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
        <div className="flex flex-col md:flex-row gap-8 items-start rounded-3xl border border-border-subtle bg-bg-surface p-8 shadow-sm backdrop-blur-xl">
          <img
            src={
              coach.avatarUrl ||
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
            }
            alt={coach.fullName}
            className="h-36 w-36 rounded-2xl border-2 border-primary/40 object-cover shadow-lg"
          />
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-text-primary">{coach.fullName}</h1>
                <p className="text-sm font-medium text-primary mt-0.5">
                  {coach.specialization || 'Chuyên gia Huấn luyện Cá nhân (PT 1:1)'}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <span className="text-lg font-bold text-amber-600 dark:text-amber-300">
                  {coach.averageRating ? Number(coach.averageRating).toFixed(1) : '5.0'}
                </span>
                <span className="text-xs text-text-muted">({coach.reviewCount || reviews.length} đánh giá)</span>
              </div>
            </div>

            <p className="text-sm text-text-muted leading-relaxed">
              {coach.bio || 'Huấn luyện viên giàu kinh nghiệm chuyên sâu về tập luyện thể hình, cải thiện vóc dáng và phục hồi chức năng vận động.'}
            </p>

            <div className="flex flex-wrap gap-4 pt-2 text-xs text-text-muted">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" />
                <span>Kinh nghiệm: <strong className="text-text-primary">{coach.yearsOfExperience || 3} năm</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-sky-500" />
                <span>Chứng chỉ: <strong className="text-text-primary">{coach.certification || 'NASM / ISSA Certified Personal Trainer'}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Courses & Packages */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span>Khóa học & Gói Huấn Luyện 1:1 Đang Giảng Dạy</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.length > 0 ? (
              packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="flex flex-col justify-between rounded-2xl border border-border-subtle bg-bg-surface p-6 shadow-sm hover:border-primary/40 transition-all"
                >
                  <div className="space-y-2">
                    <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                      {pkg.sessionCount} Buổi Tập
                    </span>
                    <h3 className="text-base font-bold text-text-primary">{pkg.name}</h3>
                    <p className="text-xs text-text-muted">{pkg.courseName || 'Khóa tập thể hình chuyên sâu'}</p>
                  </div>

                  <div className="mt-6 border-t border-border-subtle pt-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase text-text-muted">Học phí trọn gói</p>
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatVND(pkg.price)}</p>
                    </div>
                    <Link to="/login">
                      <Button size="sm" variant="primary">
                        Đăng ký mua
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-text-muted col-span-full">
                Hiện tại HLV đang cập nhật các gói huấn luyện mới.
              </p>
            )}
          </div>
        </div>

        {/* Section: Public Reviews */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            <span>Nhận Xét Từ Hội Viên ({reviews.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.length > 0 ? (
              reviews.map((rev) => (
                <div key={rev.id} className="rounded-2xl border border-border-subtle bg-bg-surface p-5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-text-primary">
                        {rev.memberDisplayName || (rev as any).memberName || 'Hội viên'}
                      </p>
                      <p className="text-[10px] text-text-muted">
                        {rev.courseNameSnapshot || (rev as any).courseName || 'Khóa PT 1:1'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400">
                      {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed italic">"{rev.comment}"</p>
                  <div className="flex items-center gap-1 text-[10px] text-text-muted/80">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(rev.createdAt)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-text-muted col-span-full">
                Chưa có đánh giá nào được gửi cho Huấn luyện viên.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
