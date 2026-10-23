import { 
  UserCheck, 
  CalendarClock, 
  Sparkles, 
  LineChart
} from 'lucide-react';

export const FeaturesSection = () => {
  const features = [
    {
      id: 'feature-1',
      icon: UserCheck,
      iconColor: 'text-orange-400',
      iconBg: 'bg-orange-500/10 border-orange-500/20',
      title: 'PT 1:1 theo mục tiêu của bạn',
      tag: 'ĐỒNG HÀNH SÁT HƠN',
      description: 'Bạn được hướng dẫn theo thể trạng và mục tiêu riêng, từ cách khởi động, kỹ thuật động tác đến mức độ tăng tải trong từng buổi tập.',
      perks: ['Chọn PT theo chuyên môn', 'Chỉnh form trực tiếp từng buổi', 'Lịch tập chủ động']
    },
    {
      id: 'feature-2',
      icon: CalendarClock,
      iconColor: 'text-sky-400',
      iconBg: 'bg-sky-500/10 border-sky-500/20',
      title: 'Đặt lịch phù hợp với lịch sống',
      tag: 'CHỦ ĐỘNG THỜI GIAN',
      description: 'Xem khung giờ trống, chọn buổi tập và quản lý credit ngay trên hệ thống. Khi có thay đổi, bạn có thể xử lý lịch theo chính sách rõ ràng.',
      perks: ['Xem slot trống theo thời gian thực', 'Theo dõi credit dễ dàng', 'Nhắc lịch trước buổi tập']
    },
    {
      id: 'feature-3',
      icon: Sparkles,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
      title: 'Giáo án và dinh dưỡng dễ theo dõi',
      tag: 'CÓ HỆ THỐNG HỖ TRỢ',
      description: 'Thông tin bài tập, kết quả và gợi ý dinh dưỡng được tổ chức trong một lộ trình. PT là người xem xét và điều chỉnh trước khi áp dụng.',
      perks: ['Gợi ý theo mục tiêu cá nhân', 'Cập nhật theo tiến độ', 'PT kiểm tra trước khi áp dụng']
    },
    {
      id: 'feature-4',
      icon: LineChart,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10 border-purple-500/20',
      title: 'Nhìn thấy tiến độ của chính mình',
      tag: 'THEO DÕI CÓ CƠ SỞ',
      description: 'Ghi nhận những thay đổi quan trọng trong quá trình tập để bạn biết điều gì đang hiệu quả và có cơ sở điều chỉnh kế hoạch tiếp theo.',
      perks: ['Lưu lịch sử chỉ số', 'Theo dõi thành tích tập luyện', 'Đánh giá lại theo từng giai đoạn']
    }
  ];

  return (
    <section id="features" className="py-20 lg:py-28 relative bg-[#070a11] border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-semibold text-orange-400">
            <span>VÌ SAO NÊN TẬP CÙNG SPORTS CENTER?</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
            Mọi thứ bạn cần để <span className="text-gradient-orange">tập đều và tập đúng</span>
          </h2>
          <p className="text-base text-slate-300">
            Không bắt đầu bằng những lời hứa quá lớn. Chúng tôi tập trung vào kế hoạch vừa sức, lịch tập rõ ràng và sự đồng hành đủ sát để bạn duy trì lâu dài.
          </p>
        </div>

        {/* 4 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat) => {
            const IconComponent = feat.icon;
            return (
              <div
                key={feat.id}
                className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 flex flex-col justify-between glass-panel-hover relative overflow-hidden group"
              >
                {/* Subtle top border accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="space-y-4">
                  {/* Icon & Badge */}
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${feat.iconBg} ${feat.iconColor}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 uppercase tracking-wider">
                      {feat.tag}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 mt-2.5 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>
                </div>

                {/* Bullet Points */}
                <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2">
                  {feat.perks.map((perk, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500/80" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
