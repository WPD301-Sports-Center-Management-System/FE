import { useState } from 'react';
import { 
  Smartphone, 
  Calendar, 
  CreditCard, 
  Utensils, 
  LineChart, 
  QrCode
} from 'lucide-react';

interface MobileAppSectionProps {
  onOpenDownloadModal: () => void;
}

export const MobileAppSection = ({ onOpenDownloadModal }: MobileAppSectionProps) => {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      id: 0,
      title: 'Đặt Lịch Slot 1:1 & Nhắc Hẹn',
      icon: Calendar,
      tag: 'TỰ CHỦ THỜI GIAN',
      description: 'Duyệt các khung giờ trống của Coach yêu thích. Đặt lịch trong 5 giây và nhận push notification nhắc nhở trước giờ tập 60 phút.',
      screenTitle: 'Lịch Đặt Slot PT',
      screenContent: (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30">
            <span className="text-[10px] font-bold text-orange-400 block uppercase">Slot Đã Đặt Thành Công</span>
            <div className="text-xs font-bold text-white mt-1">17:30 - 18:30 • Hôm Nay</div>
            <div className="text-[11px] text-slate-300">Coach: Nguyễn Hoàng Long (Khóa Ngực)</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800/80 text-[11px] text-slate-300 flex items-center justify-between">
            <span>Slot ngày mai: 18:00 - 19:00</span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded">OPEN</span>
          </div>
        </div>
      )
    },
    {
      id: 1,
      title: 'Quản Lý Ví Credit & Hủy Linh Hoạt',
      icon: CreditCard,
      tag: 'MINH BẠCH 100%',
      description: 'Kiểm tra chính xác số credit khả dụng, credit đang giữ và credit đã dùng. Hủy lịch trước 12 tiếng để nhận hoàn credit ngay lập tức.',
      screenTitle: 'Ví Credit Gói Tập',
      screenContent: (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
              <span className="text-[9px] text-slate-400 block">Tổng mua</span>
              <span className="text-xs font-bold text-white">10 Buổi</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
              <span className="text-[9px] text-slate-400 block">Đã dùng</span>
              <span className="text-xs font-bold text-orange-400">2 Buổi</span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40">
              <span className="text-[9px] text-emerald-300 block">Khả dụng</span>
              <span className="text-xs font-bold text-emerald-400">7 Buổi</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 text-center italic">1 buổi đang giữ cho lịch tối nay 17:30</p>
        </div>
      )
    },
    {
      id: 2,
      title: 'Thực Đơn Dinh Dưỡng (Meal Plan)',
      icon: Utensils,
      tag: 'DINH DƯỠNG THỂ THAO',
      description: 'Lộ trình ăn uống khoa học theo tỷ lệ năng lượng (Macro) hỗ trợ mục tiêu tăng cơ, giảm mỡ. Được AI phân tích và Coach trực tiếp phê duyệt.',
      screenTitle: 'Thực Đơn Hôm Nay',
      screenContent: (
        <div className="space-y-2 text-xs">
          <div className="p-2 rounded-lg bg-slate-800/80 flex justify-between items-center">
            <div>
              <span className="text-white font-bold block">Bữa Sáng (07:30)</span>
              <span className="text-[10px] text-slate-400">Yến mạch + 3 Trứng gà + Chuối</span>
            </div>
            <span className="text-[11px] font-mono text-orange-400">450 kcal</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-800/80 flex justify-between items-center">
            <div>
              <span className="text-white font-bold block">Bữa Sau Tập (18:45)</span>
              <span className="text-[10px] text-slate-400">1 Muỗng Whey + Ức gà áp chảo</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400">380 kcal</span>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: 'Biểu Đồ Chỉ Số InBody & Tiến Độ',
      icon: LineChart,
      tag: 'ĐO LƯỜNG THỂ TRẠNG',
      description: 'Lưu trữ toàn bộ lịch sử đo InBody: Cân nặng, % mỡ, khối lượng cơ xương, mỡ nội tạng và số đo 3 vòng qua các biểu đồ trực quan.',
      screenTitle: 'Biểu Đồ Tiến Độ (6 Tuần)',
      screenContent: (
        <div className="space-y-2">
          <div className="h-20 flex items-end justify-between gap-1 px-2 pt-2 bg-slate-800/60 rounded-xl border border-slate-700/50">
            {[40, 55, 65, 75, 85, 95].map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div 
                  className="w-full bg-gradient-to-t from-orange-600 to-amber-400 rounded-t"
                  style={{ height: `${val}%` }}
                />
                <span className="text-[8px] text-slate-400">T{idx+1}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-slate-300 font-semibold px-1">
            <span>Khối lượng cơ: +2.8kg</span>
            <span className="text-emerald-400">Tỷ lệ mỡ: -5.4%</span>
          </div>
        </div>
      )
    }
  ];

  return (
    <section id="mobile-app" className="py-20 lg:py-28 relative bg-[#090d16] border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Interactive App Tabs */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-semibold text-sky-400">
                <Smartphone className="w-3.5 h-3.5" />
                <span>SPORTS CENTER TRÊN ĐIỆN THOẠI</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
                Chủ động lịch tập{' '}
                <span className="text-gradient-cyan">ngay trên điện thoại</span>
              </h2>
              <p className="text-base text-slate-300">
                Xem lịch trống, đặt buổi tập, theo dõi kết quả và nhận thông tin mới nhất từ phòng gym trong một nơi duy nhất.
              </p>
            </div>

            {/* Feature Tabs List */}
            <div className="space-y-3">
              {features.map((item) => {
                const IconComp = item.icon;
                const isSelected = activeFeature === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveFeature(item.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900/90 border-sky-500 shadow-lg shadow-sky-950/40'
                        : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/70 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected 
                          ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        <IconComp className="w-5 h-5" />
                      </div>

                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className={`text-sm sm:text-base font-bold ${
                            isSelected ? 'text-white' : 'text-slate-300'
                          }`}>
                            {item.title}
                          </h3>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {item.tag}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* App Store / Google Play Buttons */}
            <div className="pt-4 flex flex-wrap items-center gap-4">
              <button
                onClick={onOpenDownloadModal}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 flex items-center gap-3 transition-all cursor-pointer"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.98.6-2.61 1.34-.56.64-.99 1.68-.87 2.7.99.08 2.01-.5 2.56-1.19z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 block">Tải về trên</span>
                  <span className="font-bold text-xs">Apple App Store</span>
                </div>
              </button>

              <button
                onClick={onOpenDownloadModal}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 flex items-center gap-3 transition-all cursor-pointer"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a1.996 1.996 0 0 1-.61-1.42V3.234c0-.55.228-1.047.609-1.42zm11.597 11.598l2.585 2.585-11.45 6.611 8.865-9.196zm2.585-2.824L6.34 3.977l11.451 6.611zm1.423.824l3.155 1.821c.905.523.905 1.373 0 1.896l-3.155 1.821-2.434-2.769 2.434-2.769z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 block">Tải về trên</span>
                  <span className="font-bold text-xs">Google Play Store</span>
                </div>
              </button>
            </div>

          </div>

          {/* Right Column: Phone Screen Live Rendering */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="landing-preview w-full max-w-[340px] rounded-[36px] p-3.5 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border-2 border-slate-700 shadow-2xl">
              <div className="rounded-[28px] bg-[#070b14] p-5 border border-white/5 space-y-4">
                
                {/* Status Bar */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800">
                  <span className="font-semibold text-white">09:41</span>
                  <span className="text-sky-400 font-bold">Sports Center App</span>
                </div>

                {/* Dynamic Screen Top */}
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">
                    {features[activeFeature].screenTitle}
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                    Live Demo
                  </span>
                </div>

                {/* Feature-specific Screen Body */}
                <div className="py-2">
                  {features[activeFeature].screenContent}
                </div>

                {/* QR Code Quick Scan Widget */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-lg p-1 flex items-center justify-center shrink-0">
                    <QrCode className="w-10 h-10 text-slate-900" />
                  </div>
                  <div className="text-left">
                    <span className="text-[11px] font-bold text-white block">Quét Mã QR Cài Đặt</span>
                    <span className="text-[10px] text-slate-400 block">Tương thích iOS 15+ & Android 10+</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
