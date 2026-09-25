import { Flame, ArrowRight, Smartphone, ShieldCheck } from 'lucide-react';

interface CtaBannerProps {
  onOpenTrialModal: () => void;
  onOpenDownloadModal: () => void;
}

export const CtaBanner = ({ onOpenTrialModal, onOpenDownloadModal }: CtaBannerProps) => {
  return (
    <section className="py-20 relative bg-[#070a11] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="rounded-3xl p-8 sm:p-12 lg:p-16 bg-gradient-to-r from-orange-950/80 via-slate-900 to-orange-950/80 border-2 border-orange-500/50 relative overflow-hidden shadow-2xl shadow-orange-950/50">
          
          {/* Background Ambient Glows */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/15 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5" />
              <span>KHỞI ĐẦU HÀNH TRÌNH BỨT PHÁ</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading text-white tracking-tight leading-tight">
              Sẵn Sàng Thay Đổi Vóc Dáng Cùng <span className="text-gradient-orange">Chuyên Gia 1:1</span> Ngay Hôm Nay?
            </h2>

            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
              Nhận ngay 01 buổi đo InBody phân tích thể trạng toàn diện & buổi tập thử 1:1 có chuyên môn kiểm duyệt hoàn toàn miễn phí.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={onOpenTrialModal}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 glow-button cursor-pointer transition-all transform active:scale-95"
              >
                <Flame className="w-5 h-5" />
                <span>Đăng Ký Tập Thử 1:1 Miễn Phí</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenDownloadModal}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-slate-600 transition-all cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-sky-400" />
                <span>Tải App Cho iOS & Android</span>
              </button>
            </div>

            <div className="pt-6 flex items-center justify-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Không ép buộc mua gói
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Tư vấn thực đơn phù hợp
              </span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
