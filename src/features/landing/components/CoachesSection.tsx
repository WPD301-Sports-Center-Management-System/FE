import { Link } from 'react-router-dom';
import { Star, Award, ChevronRight, Sparkles } from 'lucide-react';
import { initialsOf } from '@/shared/components/ui/avatar';
import { usePublicCoaches, type TrialContext } from '../api';
import { SectionNotice } from './SectionNotice';

interface CoachesSectionProps {
  onRequestTrial: (context: TrialContext) => void;
}

export const CoachesSection = ({ onRequestTrial }: CoachesSectionProps) => {
  const coaches = usePublicCoaches();

  return (
    <section id="coaches" className="py-20 lg:py-28 relative bg-[#070a11] border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-semibold text-orange-400">
            <span>ĐỘI NGŨ HUẤN LUYỆN VIÊN</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
            Huấn Luyện Viên <span className="text-gradient-orange">Được Duyệt</span> Theo Từng Khóa
          </h2>
          <p className="text-base text-slate-300">
            Mỗi Coach chỉ nhận dạy những khóa đã được quản lý trung tâm duyệt năng lực. Điểm đánh giá đến từ hội viên đã hoàn thành gói tập.
          </p>
        </div>

        {coaches.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" aria-busy="true">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-96 rounded-2xl bg-slate-900/80 border border-slate-800 animate-pulse" />)}
          </div>
        ) : coaches.isError ? (
          <SectionNotice text="Chưa tải được danh sách Huấn luyện viên." onRetry={() => coaches.refetch()} />
        ) : !coaches.data?.length ? (
          <SectionNotice text="Trung tâm đang cập nhật đội ngũ Huấn luyện viên." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {coaches.data.map((coach) => {
              const rating = Number(coach.averageRating ?? 0);
              return (
                <div key={coach.id} className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden flex flex-col glass-panel-hover group">
                  <div className="relative h-64 overflow-hidden bg-slate-800">
                    {coach.avatarUrl ? (
                      <img src={coach.avatarUrl} alt={coach.fullName} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-5xl font-black text-orange-400/80" aria-hidden="true">
                        {initialsOf(coach.fullName)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/30" />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-white text-xs font-bold">
                      {coach.reviewCount ? (
                        <>
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span>{rating.toFixed(1)}</span>
                          <span className="text-slate-300 font-medium">({coach.reviewCount} đánh giá)</span>
                        </>
                      ) : (
                        <span className="text-slate-200 font-medium">Chưa có đánh giá</span>
                      )}
                    </div>
                    {coach.yearsOfExperience ? (
                      <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-orange-600/90 text-xs font-bold text-white">
                        {coach.yearsOfExperience} năm kinh nghiệm
                      </span>
                    ) : null}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors">{coach.fullName}</h3>
                      {coach.specialization && <p className="text-sm text-sky-400 font-medium">{coach.specialization}</p>}
                      {coach.certification && (
                        <p className="flex items-start gap-1.5 text-xs text-slate-300">
                          <Award className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{coach.certification}</span>
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <Link
                        to={`/coaches/${coach.id}`}
                        className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 glow-button flex items-center justify-center gap-1.5 transition-all"
                      >
                        <span>Xem hồ sơ & gói PT</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => onRequestTrial({ coachId: coach.id, coachName: coach.fullName, interest: `Tập với Coach ${coach.fullName}` })}
                        className="w-full py-2 px-4 rounded-xl text-sm font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-orange-400" />
                        <span>Đăng ký tập thử</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
