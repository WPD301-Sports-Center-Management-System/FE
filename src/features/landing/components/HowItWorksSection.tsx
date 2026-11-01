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
      title: 'Chọn Mục Tiêu & Khóa Tập',
      description: 'Lựa chọn nhóm cơ mong muốn cải thiện (Ngực, Lưng, Chân mông, Core, hoặc Đốt mỡ toàn thân) với bài tập trực quan.',
      icon: Target,
      tag: 'Khám Phá'
    },
    {
      step: '02',
      title: 'Chọn Huấn Luyện Viên & Gói PT',
      description: 'Xem chứng chỉ và phong cách dạy của Coach. Mua gói 5, 10 hoặc 20 buổi với thanh toán VietQR / tại quầy nhận credit ngay.',
      icon: CreditCard,
      tag: 'Kích Hoạt Gói'
    },
    {
      step: '03',
      title: 'Tự Do Đặt Lịch 1:1 Bằng Credit',
      description: 'Chọn khung giờ cố định hằng tuần phù hợp với bạn. Cần nghỉ, bạn hủy hoặc đổi buổi ngay trên ứng dụng.',
      icon: CalendarCheck,
      tag: 'Linh hoạt'
    },
    {
      step: '04',
      title: 'Tập Luyện & Đo Lường Kết Quả',
      description: 'Coach hướng dẫn 1:1, ghi nhận kết quả sau buổi và cập nhật chỉ số InBody & thực đơn dinh dưỡng định kỳ trên App.',
      icon: Trophy,
      tag: 'Chuyển Hóa'
    }
  ];

  return (
    <section id="how-it-works" className="py-20 lg:py-28 relative bg-[#090d16] border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-semibold text-orange-400">
            <span>QUY TRÌNH TINH GỌN & THÔNG MINH</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
            4 Bước Đơn Giản Để <span className="text-gradient-orange">Bắt Đầu Lộ Trình</span>
          </h2>
          <p className="text-base text-slate-300">
            Trải nghiệm đặt lịch và tập luyện mượt mà, chủ động hoàn toàn trên hệ sinh thái Web & Mobile.
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

                  <span className="text-xs font-bold uppercase tracking-wider text-orange-400 block">
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
              <h4 className="text-sm sm:text-base font-bold text-white">Chưa chắc chắn mình phù hợp với khóa nào?</h4>
              <p className="text-xs text-slate-400">Đăng ký để được Huấn luyện viên trưởng tư vấn và đo InBody hoàn toàn miễn phí.</p>
            </div>
          </div>

          <button
            onClick={onOpenTrialModal}
            className="px-6 py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 glow-button shrink-0 transition-all cursor-pointer"
          >
            Nhận Tư Vấn Miễn Phí
          </button>
        </div>

      </div>
    </section>
  );
};
