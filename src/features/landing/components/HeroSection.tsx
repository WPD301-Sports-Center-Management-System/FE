import { 
  Sparkles, 
  Flame, 
  ArrowRight, 
  Clock, 
  TrendingUp, 
  Award,
  Smartphone
} from 'lucide-react';
import { useCatalog } from '../api';

interface HeroSectionProps {
  onOpenTrialModal: () => void;
  onOpenDownloadModal: () => void;
}

export const HeroSection = ({ onOpenTrialModal, onOpenDownloadModal }: HeroSectionProps) => {
  const stats = useCatalog().data?.stats;
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-radial-gradient">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[350px] h-[350px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headlines & Call to Actions */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-orange-500/30 text-xs font-semibold text-orange-400 shadow-inner">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              <span>Huấn luyện 1:1 • Theo dõi tiến độ trên ứng dụng</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-heading leading-[1.15] text-white">
                Bứt Phá Thể Hình Với Lộ Trình{' '}
                <span className="text-gradient-orange">PT 1:1 Cá Nhân Hóa</span>{' '}
                Toàn Diện
              </h1>
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Không lớp nhóm xô bồ. Chọn Huấn luyện viên chuyên môn, chủ động đặt lịch theo slot linh hoạt và theo dõi từng chuyển biến cơ thể ngay trên ứng dụng di động.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={onOpenTrialModal}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 glow-button transition-all transform active:scale-95 cursor-pointer"
              >
                <Flame className="w-5 h-5 text-white" />
                <span>Đăng Ký Tập Thử & Nhận Tư Vấn</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#courses"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 hover:border-slate-600 transition-all"
              >
                <span>Khám Phá Khóa Tập</span>
              </a>
            </div>

            {/* Live numbers from the catalog; hidden until loaded instead of showing invented figures */}
            {stats && (
              <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-center lg:text-left">
                {[
                  { value: stats.coaches, label: 'Huấn luyện viên đang nhận dạy' },
                  { value: stats.courses, label: 'Khóa tập PT 1:1' },
                  { value: stats.exercises, label: 'Bài tập có hướng dẫn trong thư viện' },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="text-2xl sm:text-3xl font-extrabold font-heading text-white">{s.value}</div>
                    <p className="text-sm text-slate-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Right Column: Interactive App & Live Session Showcase */}
          <div className="lg:col-span-5 relative flex justify-center">
            
            {/* Phone Mockup Frame */}
            <div className="relative w-full max-w-[360px] sm:max-w-[390px] rounded-[38px] p-3.5 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border-2 border-slate-700 shadow-2xl shadow-orange-950/40">
              
              {/* Screen Content */}
              <div className="rounded-[30px] bg-[#090d16] p-4 sm:p-5 border border-white/5 space-y-4 text-left overflow-hidden relative">
                
                {/* Status Bar */}
                <div className="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-slate-800/60">
                  <span className="font-semibold text-white">09:41</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium">5G</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Member App Top Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Chào buổi sáng,</p>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      Minh Đức <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">Hội viên PRO</span>
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Ví Credit PT</span>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                      8 / 10 Buổi
                    </span>
                  </div>
                </div>

                {/* Active Session Booking Card */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-orange-500/40 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      LỊCH TẬP HÔM NAY • 1:1
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                      CONFIRMED
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white">Ngực & Tay Sau Cắt Nét (Hypertrophy)</h4>

                  <div className="mt-2.5 pt-2.5 border-t border-slate-700/60 grid grid-cols-2 gap-2 text-xs text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-orange-400" />
                      <span>17:30 - 18:30</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-sky-400" />
                      <span>Coach Hoàng Long</span>
                    </div>
                  </div>
                </div>

                {/* InBody Progress Widget */}
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      Chỉ Số InBody (Tuần 6)
                    </span>
                    <span className="text-xs text-slate-400">Cập nhật 2 ngày trước</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-xl bg-slate-800/70 border border-slate-700/50">
                      <span className="text-xs text-slate-400 block">Khối lượng cơ</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-sm font-bold text-white">34.8 kg</span>
                        <span className="text-xs font-bold text-emerald-400">+2.4kg</span>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-800/70 border border-slate-700/50">
                      <span className="text-xs text-slate-400 block">Tỷ lệ mỡ (Body Fat)</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-sm font-bold text-white">14.2%</span>
                        <span className="text-xs font-bold text-emerald-400">-5.1%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Meal Plan & Coach Note Snippet */}
                <div className="p-3 rounded-2xl bg-sky-950/30 border border-sky-500/20 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-sky-300">AI Meal Plan • Đã duyệt</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">
                      Mục tiêu: 2,150 kcal • Protein: 165g. Uống 1 muỗng Whey Protein sau buổi tập 18:30.
                    </p>
                  </div>
                </div>

                {/* App Download Action inside Phone */}
                <button
                  onClick={onOpenDownloadModal}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                  <span>Mở Ứng Dụng ApexFit Mobile</span>
                </button>

              </div>
            </div>

            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#0e1626]/95 border border-slate-600 text-xs font-semibold text-slate-300 shadow-lg">
              Hình minh họa giao diện ứng dụng
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
