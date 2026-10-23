import { 
  Target, 
  CreditCard, 
  CalendarCheck, 
  Trophy, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

interface HowItWorksSectionProps {
  onOpenTrialModal: () => void;
}

export const HowItWorksSection = ({ onOpenTrialModal }: HowItWorksSectionProps) => {
  const steps = [
    {
      step: '01',
      title: 'Nói rõ mục tiêu của bạn',
      description: 'Chọn mục tiêu muốn cải thiện và chia sẻ tình trạng hiện tại để đội ngũ có cơ sở tư vấn lộ trình phù hợp.',
      icon: Target,
      tag: 'BẮT ĐẦU'
    },
    {
      step: '02',
      title: 'Chọn PT và hình thức tập',
      description: 'Xem chuyên môn, phong cách hướng dẫn và lịch trống của PT trước khi chọn gói hoặc đăng ký buổi tư vấn.',
      icon: CreditCard,
      tag: 'LỰA CHỌN'
    },
    {
      step: '03',
      title: 'Đặt lịch theo thời gian rảnh',
      description: 'Chọn slot phù hợp trên hệ thống và nhận nhắc lịch. Các thay đổi lịch được xử lý theo chính sách hiển thị rõ ràng.',
      icon: CalendarCheck,
      tag: 'CHỦ ĐỘNG'
    },
    {
      step: '04',
      title: 'Tập đều và xem lại tiến độ',
      description: 'Sau mỗi giai đoạn, bạn cùng PT nhìn lại kết quả để điều chỉnh bài tập, cường độ và thói quen cho chặng tiếp theo.',
      icon: Trophy,
      tag: 'TIẾN BỘ'
    }
  ];

  return (
    <section id="how-it-works" className="py-20 lg:py-28 relative bg-[#090d16] border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-semibold text-orange-400">
            <span>BẮT ĐẦU ĐƠN GIẢN, TIẾN BỘ RÕ RÀNG</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
            4 bước để <span className="text-gradient-orange">bắt đầu đúng hướng</span>
          </h2>
          <p className="text-base text-slate-300">
            Từ mục tiêu ban đầu đến từng buổi tập, mọi thông tin được gom về một nơi để bạn dễ theo dõi và chủ động.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((item) => {
            const IconComp = item.icon;
            return (
              <div
                key={item.step}
                className="relative rounded-2xl bg-slate-900/90 border border-slate-800 p-6 flex flex-col justify-between glass-panel-hover group"
              >
                {/* Step Number Watermark */}
                <div className="absolute top-4 right-4 text-4xl font-black font-heading text-slate-800/80 group-hover:text-orange-500/20 transition-colors">
                  {item.step}
                </div>

                <div className="space-y-4 relative z-10">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-orange-600/20 to-amber-500/20 border border-orange-500/30 text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <IconComp className="w-6 h-6" />
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 block">
                    {item.tag}
                  </span>

                  <h3 className="text-lg font-bold text-white group-hover:text-orange-300 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center text-xs text-slate-400 group-hover:text-orange-400 transition-colors">
                  <span>Bước {item.step} / 04</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto group-hover:translate-x-1 transition-transform" />
                </div>

              </div>
            );
          })}
        </div>

        {/* Bottom CTA Box */}
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-[#101827] to-slate-900 border border-orange-500/30 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-white">Chưa biết nên bắt đầu từ đâu?</h4>
              <p className="text-xs text-slate-400">Để lại thông tin, đội ngũ Sports Center sẽ tư vấn mục tiêu và lịch tập phù hợp.</p>
            </div>
          </div>

          <button
            onClick={onOpenTrialModal}
            className="px-6 py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 glow-button shrink-0 transition-all cursor-pointer"
          >
            Nhận lộ trình miễn phí
          </button>
        </div>

      </div>
    </section>
  );
};
