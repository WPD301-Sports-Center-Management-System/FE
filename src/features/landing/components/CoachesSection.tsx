import { COACHES } from '../data/landingData';
import type { Coach } from '../data/landingData';
import { 
  Star, 
  Calendar, 
  Clock
} from 'lucide-react';

interface CoachesSectionProps {
  onSelectCoach: (coach: Coach) => void;
}

export const CoachesSection = ({ onSelectCoach }: CoachesSectionProps) => {
  return (
    <section id="coaches" className="py-20 lg:py-28 relative bg-[#070a11] border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-semibold text-orange-400">
            <span>ĐỘI NGŨ HUẤN LUYỆN VIÊN ĐẠT CHUẨN</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
            Chuyên Gia PT 1:1 <span className="text-gradient-orange">Được Phê Duyệt</span> Chuyên Môn
          </h2>
          <p className="text-base text-slate-300">
            100% Huấn luyện viên sở hữu bằng cấp quốc tế, kinh nghiệm thực chiến và được Center Manager duyệt năng lực cho từng khóa tập.
          </p>
        </div>

        {/* Coaches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {COACHES.map((coach) => (
            <div
              key={coach.id}
              className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden flex flex-col justify-between glass-panel-hover group"
            >
              {/* Avatar & Badges */}
              <div className="relative h-64 overflow-hidden bg-slate-800">
                <img
                  src={coach.avatar}
                  alt={coach.name}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/30" />

                {/* Rating badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-white text-xs font-bold">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>{coach.rating}</span>
                  <span className="text-slate-400 text-[10px]">({coach.reviewCount})</span>
                </div>

                {/* Experience badge */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-white">
                  <span className="px-2 py-0.5 rounded bg-orange-600/90 font-bold">
                    {coach.experienceYears} Năm Kinh Nghiệm
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800/90 backdrop-blur-md text-emerald-400 font-semibold border border-slate-700">
                    {coach.completedSessions}+ Buổi Đã Dạy
                  </span>
                </div>
              </div>

              {/* Coach Details */}
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors">
                    {coach.name}
                  </h3>
                  <p className="text-xs text-sky-400 font-medium">
                    {coach.title}
                  </p>

                  {/* Certifications badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {coach.certifications.map((cert, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700"
                      >
                        {cert}
                      </span>
                    ))}
                  </div>

                  {/* Quote / Specialization */}
                  <p className="text-xs text-slate-300 italic pt-2 line-clamp-2">
                    "{coach.quote}"
                  </p>

                  {/* Next Available Slot Badge */}
                  <div className="pt-2">
                    <div className="p-2 rounded-xl bg-slate-800/60 border border-emerald-500/30 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-400" />
                        Slot gần nhất:
                      </span>
                      <span className="text-xs font-bold text-emerald-300">
                        {coach.availableSlots[0]?.time} ({coach.availableSlots[0]?.date})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Booking Action */}
                <div className="pt-3 border-t border-slate-800">
                  <button
                    onClick={() => onSelectCoach(coach)}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 glow-button flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Xem Lịch Trống & Đặt Lịch</span>
                  </button>
                </div>

              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
