import { useState } from 'react';
import { 
  MUSCLE_GROUPS, 
  TRAINING_COURSES
} from '../data/landingData';
import type { TrainingCourse } from '../data/landingData';
import { 
  Flame, 
  Clock, 
  Users, 
  Dumbbell, 
  ChevronRight, 
  Sparkles
} from 'lucide-react';

interface CoursesSectionProps {
  onSelectCourse: (course: TrainingCourse) => void;
}

export const CoursesSection = ({ onSelectCourse }: CoursesSectionProps) => {
  const [activeTab, setActiveTab] = useState('all');

  const filteredCourses = activeTab === 'all' 
    ? TRAINING_COURSES 
    : TRAINING_COURSES.filter(c => c.muscleGroupId === activeTab);

  const getLevelBadge = (level: string) => {
    switch(level) {
      case 'Beginner':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">CƠ BẢN</span>;
      case 'Intermediate':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">TRUNG CẤP</span>;
      case 'Advanced':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">NÂNG CAO</span>;
      default:
        return null;
    }
  };

  return (
    <section id="courses" className="py-20 lg:py-28 relative bg-[#090d16] border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-semibold text-orange-400">
            <span>DANH MỤC KHÓA TẬP THEO NHÓM CƠ</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
            Khóa Tập <span className="text-gradient-orange">Cá Nhân Hóa 1:1</span> Chuyên Sâu
          </h2>
          <p className="text-base text-slate-300">
            Tập trung đúng nhóm cơ mong muốn, khắc phục điểm yếu cơ thể và đạt kết quả nhanh hơn gấp 3 lần với lộ trình bài bản.
          </p>
        </div>

        {/* Muscle Group Filter Tabs */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar">
          {MUSCLE_GROUPS.map((group) => {
            const isActive = activeTab === group.id;
            return (
              <button
                key={group.id}
                onClick={() => setActiveTab(group.id)}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-500/20 scale-105'
                    : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>{group.name}</span>
              </button>
            );
          })}
        </div>

        {/* Courses Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden flex flex-col justify-between glass-panel-hover group"
            >
              {/* Course Top Image & Level */}
              <div className="relative h-48 sm:h-52 overflow-hidden">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-[#090d16]/40 to-transparent" />
                
                {/* Level & Group Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  {getLevelBadge(course.level)}
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/60 text-slate-200 backdrop-blur-md border border-white/10">
                    {course.muscleGroupName}
                  </span>
                </div>

                {/* Calorie burn badge */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/90 text-white text-xs font-bold shadow-md">
                  <Flame className="w-3.5 h-3.5" />
                  <span>{course.caloriesBurn}</span>
                </div>
              </div>

              {/* Course Body Content */}
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors leading-snug">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 line-clamp-2">
                    {course.description}
                  </p>

                  {/* Highlights tag */}
                  <div className="mt-3 p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-start gap-2 text-xs text-orange-300">
                    <Sparkles className="w-4 h-4 shrink-0 text-orange-400 mt-0.5" />
                    <span className="text-[11px] font-medium">{course.highlight}</span>
                  </div>

                  {/* Sample Exercises List */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Bài Tập Tiêu Biểu Trong Khóa:
                    </span>
                    <div className="space-y-1.5">
                      {course.exercises.slice(0, 3).map((ex, i) => (
                        <div key={i} className="flex items-center justify-between text-xs text-slate-300">
                          <span className="flex items-center gap-1.5 truncate max-w-[180px]">
                            <Dumbbell className="w-3 h-3 text-sky-400 shrink-0" />
                            <span className="truncate">{ex.name}</span>
                          </span>
                          <span className="text-[11px] text-slate-400 shrink-0 font-mono">{ex.setsReps}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Info & CTA Button */}
                <div className="mt-6 pt-4 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {course.duration}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <Users className="w-3.5 h-3.5" />
                      {course.coachesCount} Huấn luyện viên sẵn sàng
                    </span>
                  </div>

                  <button
                    onClick={() => onSelectCourse(course)}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-600/30 border border-slate-700 hover:border-orange-500 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Chọn Khóa Này & Đặt Lịch PT</span>
                    <ChevronRight className="w-4 h-4" />
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
