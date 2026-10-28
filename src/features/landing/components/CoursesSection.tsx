import { useState } from 'react';
import { Users, Dumbbell, ChevronRight, Target } from 'lucide-react';
import { formatVND } from '@/shared/utils/currency';
import { useCatalog, difficultyLabel, type TrialContext } from '../api';
import { SectionNotice } from './SectionNotice';

interface CoursesSectionProps {
  onRequestTrial: (context: TrialContext) => void;
}

const levelTone: Record<string, string> = {
  'Cơ bản': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Trung cấp': 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  'Nâng cao': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
};

export const CoursesSection = ({ onRequestTrial }: CoursesSectionProps) => {
  const catalog = useCatalog();
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const courses = catalog.data?.courses ?? [];
  const groups = [...new Set(courses.flatMap((c) => c.muscleGroups))].sort((a, b) => a.localeCompare(b, 'vi'));
  const visible = activeGroup ? courses.filter((c) => c.muscleGroups.includes(activeGroup)) : courses;

  const tabClass = (active: boolean) =>
    `px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
      active ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-500/20' : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
    }`;

  return (
    <section id="courses" className="py-20 lg:py-28 relative bg-[#090d16] border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-semibold text-orange-400">
            <span>KHÓA TẬP PT 1:1</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
            Khóa Tập <span className="text-gradient-orange">Cá Nhân Hóa 1:1</span>
          </h2>
          <p className="text-base text-slate-300">
            Chọn khóa theo nhóm cơ và mục tiêu. Giá hiển thị là gói thấp nhất hiện đang mở bán cho khóa đó.
          </p>
        </div>

        {groups.length > 1 && (
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar" role="tablist" aria-label="Lọc theo nhóm cơ">
            <button type="button" role="tab" aria-selected={!activeGroup} onClick={() => setActiveGroup(null)} className={tabClass(!activeGroup)}>Tất cả</button>
            {groups.map((group) => (
              <button key={group} type="button" role="tab" aria-selected={activeGroup === group} onClick={() => setActiveGroup(group)} className={tabClass(activeGroup === group)}>
                {group}
              </button>
            ))}
          </div>
        )}

        {catalog.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" aria-busy="true">
            {[0, 1, 2].map((i) => <div key={i} className="h-96 rounded-2xl bg-slate-900/80 border border-slate-800 animate-pulse" />)}
          </div>
        ) : catalog.isError ? (
          <SectionNotice text="Chưa tải được danh sách khóa tập." onRetry={() => catalog.refetch()} />
        ) : !visible.length ? (
          <SectionNotice text="Trung tâm đang cập nhật khóa tập. Bạn vẫn có thể đăng ký tư vấn để được gợi ý lộ trình." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {visible.map((course) => {
              const level = difficultyLabel(course.difficultyLevel);
              return (
                <div key={course.id} className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden flex flex-col glass-panel-hover group">
                  <div className="relative h-48 sm:h-52 overflow-hidden bg-slate-800">
                    {course.imageUrl ? (
                      <img src={course.imageUrl} alt={course.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-orange-950/40" aria-hidden="true">
                        <Dumbbell className="w-14 h-14 text-orange-400/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-[#090d16]/30 to-transparent" />
                    <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2">
                      {level && <span className={`px-2 py-0.5 rounded text-xs font-bold border ${levelTone[level] ?? 'bg-slate-800 text-slate-200 border-slate-700'}`}>{level}</span>}
                      {course.muscleGroups.slice(0, 2).map((g) => (
                        <span key={g} className="px-2 py-0.5 rounded text-xs font-bold bg-black/60 text-slate-200 backdrop-blur-md border border-white/10">{g}</span>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between gap-6">
                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors leading-snug">{course.name}</h3>
                      {course.description && <p className="text-sm text-slate-300 line-clamp-3">{course.description}</p>}
                      {course.objective && (
                        <p className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-start gap-2 text-sm text-orange-200">
                          <Target className="w-4 h-4 shrink-0 text-orange-400 mt-0.5" />
                          <span>{course.objective}</span>
                        </p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-800 space-y-3">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-slate-300">
                          {course.priceFrom != null ? <>Từ <strong className="text-white">{formatVND(course.priceFrom)}</strong></> : 'Liên hệ để báo giá'}
                        </span>
                        <span className="flex items-center gap-1 text-emerald-400 font-medium">
                          <Users className="w-4 h-4" />
                          {course.coachCount} Coach
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRequestTrial({ interest: `Khóa ${course.name}` })}
                        className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-slate-800 hover:bg-orange-600 border border-slate-700 hover:border-orange-500 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Tư vấn khóa này</span>
                        <ChevronRight className="w-4 h-4" />
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
