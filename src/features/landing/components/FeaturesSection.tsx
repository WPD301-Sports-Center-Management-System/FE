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
      title: 'Huấn Luyện Viên 1:1 Chuyên Nghiệp',
      tag: 'CÁ NHÂN HÓA 100%',
      description: 'Nói không với các lớp nhóm đại trà. Huấn luyện viên đồng hành độc quyền, chỉnh sửa từng động tác, mức tạ và nhịp thở để bạn tập đúng - an toàn - hiệu quả.',
      perks: ['Kiểm duyệt chứng chỉ quốc tế', 'Theo sát kỹ thuật từng hiệp', 'Không chung đụng thời gian']
    },
    {
      id: 'feature-2',
      icon: CalendarClock,
      iconColor: 'text-sky-400',
      iconBg: 'bg-sky-500/10 border-sky-500/20',
      title: 'Hệ Thống Credit & Đặt Lịch Linh Hoạt',
      tag: 'CHỦ ĐỘNG THỜI GIAN',
      description: 'Mua gói 5, 10 hoặc 20 buổi. Dùng credit chọn slot mở của Coach ngay trên điện thoại trong 5 giây. Hủy lịch trước 12 tiếng được hoàn 100% credit tự động.',
      perks: ['Slot thời gian thực (Real-time)', 'Chính sách hoàn credit minh bạch', 'Thông báo nhắc lịch thông minh']
    },
    {
      id: 'feature-3',
      icon: Sparkles,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
      title: 'Giáo Án Tối Ưu Bởi AI & Coach Duyệt',
      tag: 'CÔNG NGHỆ TIÊN TIẾN',
      description: 'Thuật toán thông minh phân tích thể trạng và mục tiêu để đề xuất bài tập và thực đơn dinh dưỡng (Meal Plan). Huấn luyện viên kiểm duyệt nghiêm ngặt trước khi áp dụng.',
      perks: ['Gợi ý dinh dưỡng theo calo/macro', 'Lộ trình bài tập đa dạng', 'Coach trực tiếp chịu trách nhiệm']
    },
    {
      id: 'feature-4',
      icon: LineChart,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10 border-purple-500/20',
      title: 'Theo Dõi Chỉ Số Thể Trạng InBody',
      tag: 'KHOA HỌC & ĐO LƯỜNG',
      description: 'Mọi thay đổi về cân nặng, % mỡ dưới da, khối lượng cơ bắp và số đo 3 vòng được ghi nhận sau từng buổi và trực quan hóa bằng biểu đồ trên Mobile App.',
      perks: ['Biểu đồ tiến độ đa chiều', 'Lịch sử thành tích mức tạ', 'Báo cáo chi tiết sau mỗi chu kỳ']
    }
  ];

  return (
    <section id="features" className="py-20 lg:py-28 relative bg-[#070a11] border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-semibold text-orange-400">
            <span>GIÁ TRỊ CỐT LÕI KHÁC BIỆT</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
            Vì Sao Chọn Nền Tảng <span className="text-gradient-orange">ApexFit 1:1</span>?
          </h2>
          <p className="text-base text-slate-300">
            Chúng tôi xây dựng hệ sinh thái tập luyện bài bản nhất nhằm đảm bảo từng đồng chi phí và từng phút bạn bỏ ra tại phòng gym đều mang lại kết quả vượt trội.
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
