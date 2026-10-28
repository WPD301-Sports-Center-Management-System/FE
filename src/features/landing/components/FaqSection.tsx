import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'booking' | 'payment' | 'coaching' | 'policy';
}

// Policy answers stay general on purpose: the actual cut-offs are configurable by the manager and shown in the app.
const FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'booking',
    question: 'Tôi có được chọn cố định một Huấn luyện viên cho toàn bộ gói tập không?',
    answer: 'Có. Mỗi gói PT gắn với một Huấn luyện viên đã được duyệt dạy khóa đó. Khi mua gói, bạn chọn lịch tập cố định hằng tuần cùng Coach và các buổi được xếp theo lịch này.'
  },
  {
    id: 'faq-2',
    category: 'policy',
    question: 'Quy định hủy lịch tập và hoàn lại Credit như thế nào?',
    answer: 'Bạn có thể hủy hoặc đổi buổi trên ứng dụng. Nếu báo trước mốc thời gian trung tâm quy định (hiển thị ngay khi bạn hủy), buổi tập được bảo toàn; báo muộn hoặc vắng mặt sẽ tính là đã dùng. Khi Coach hoặc trung tâm hủy, buổi tập luôn được hoàn lại.'
  },
  {
    id: 'faq-3',
    category: 'payment',
    question: 'Tôi có cần mua thẻ Membership Gym trước khi mua gói PT 1:1 không?',
    answer: 'Có. Để vào phòng tập bạn cần vé tập gym còn hiệu lực. Bạn có thể mua vé và gói PT tại quầy lễ tân hoặc trên ứng dụng.'
  },
  {
    id: 'faq-4',
    category: 'coaching',
    question: 'Tính năng AI Recommendation hoạt động ra sao và có an toàn không?',
    answer: 'AI chỉ gợi ý bản nháp giáo án và thực đơn dựa trên chỉ số và mục tiêu của bạn. Huấn luyện viên phụ trách luôn kiểm tra, chỉnh sửa và phê duyệt trước khi bạn nhận được.'
  },
  {
    id: 'faq-5',
    category: 'payment',
    question: 'Các hình thức thanh toán được hỗ trợ trên hệ thống?',
    answer: 'Bạn có thể thanh toán tại quầy lễ tân (tiền mặt, chuyển khoản, thẻ) hoặc trực tuyến trên ứng dụng khi trung tâm bật cổng thanh toán. Mọi giao dịch đều có hóa đơn.'
  },
  {
    id: 'faq-6',
    category: 'coaching',
    question: 'Gợi ý dinh dưỡng (Meal Plan) trên ứng dụng có thay thế bác sĩ không?',
    answer: 'Thực đơn dinh dưỡng trên hệ thống được xây dựng nhằm mục đích hỗ trợ năng lượng và tỷ lệ dinh dưỡng đa lượng (Protein, Carbs, Fats) cho quá trình tập luyện thể thao. Thực đơn không mang tính chất thay thế chỉ định y tế hoặc tư vấn từ bác sĩ chuyên khoa dinh dưỡng.'
  }
];

export const FaqSection = () => {
  const [openId, setOpenId] = useState<string | null>('faq-1');

  const toggleFaq = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq" className="py-20 lg:py-28 relative bg-[#090d16] border-t border-slate-800/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-semibold text-orange-400">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>GIẢI ĐÁP THẮC MẮC</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
            Câu Hỏi Thường Gặp <span className="text-gradient-orange">(FAQ)</span>
          </h2>
          <p className="text-base text-slate-300">
            Tất cả những thông tin bạn cần biết về cách đặt lịch, thanh toán và quy trình tập luyện 1:1.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {FAQS.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isOpen
                    ? 'bg-slate-900/90 border-orange-500/50 shadow-lg shadow-orange-950/20'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full py-5 px-6 flex items-center justify-between text-left gap-4 cursor-pointer"
                >
                  <span className="text-sm sm:text-base font-bold text-white">
                    {faq.question}
                  </span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${
                    isOpen ? 'bg-orange-500 text-white rotate-180' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 animate-in fade-in duration-200">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
