import { useState } from 'react';
import { Check, Flame, Zap, CreditCard, ReceiptText, ArrowRight, Sparkles } from 'lucide-react';
import { formatVND } from '@/shared/utils/currency';
import { useCatalog, type TrialContext } from '../api';
import { SectionNotice } from './SectionNotice';

interface PricingSectionProps {
  onRequestTrial: (context: TrialContext) => void;
}

const tabClass = (active: boolean, tone: string) =>
  `px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${active ? `${tone} text-white shadow-lg` : 'text-slate-400 hover:text-white'}`;

export const PricingSection = ({ onRequestTrial }: PricingSectionProps) => {
  const [pricingType, setPricingType] = useState<'membership' | 'pt'>('membership');
  const catalog = useCatalog();
  const plans = catalog.data?.membershipPlans ?? [];
  const ptCourses = (catalog.data?.courses ?? []).filter((c) => c.priceFrom != null);
  const perMonth = (p: (typeof plans)[number]) => Number(p.price) / Math.max(1, p.paidMonths + p.bonusMonths);
  // "Best value" is derived from the real prices (lowest cost per month), never a hand-picked label.
  const bestValueId = plans.length > 1 ? [...plans].sort((a, b) => perMonth(a) - perMonth(b))[0]?.id : undefined;

  return (
    <section id="pricing" className="py-20 lg:py-28 relative bg-[#070a11] border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-semibold text-orange-400">
            <span>BẢNG GIÁ</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
            Giá Niêm Yết <span className="text-gradient-orange">Đang Áp Dụng</span>
          </h2>
          <p className="text-base text-slate-300">Giá lấy trực tiếp từ hệ thống bán vé của trung tâm, cập nhật khi quản lý thay đổi.</p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="p-1.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-2" role="tablist">
            <button type="button" role="tab" aria-selected={pricingType === 'membership'} onClick={() => setPricingType('membership')} className={tabClass(pricingType === 'membership', 'bg-gradient-to-r from-sky-600 to-blue-500')}>
              <Zap className="w-4 h-4" />
              <span>Vé tập gym</span>
            </button>
            <button type="button" role="tab" aria-selected={pricingType === 'pt'} onClick={() => setPricingType('pt')} className={tabClass(pricingType === 'pt', 'bg-gradient-to-r from-orange-600 to-amber-500')}>
              <Flame className="w-4 h-4" />
              <span>PT 1:1</span>
            </button>
          </div>
        </div>

        {catalog.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8" aria-busy="true">
            {[0, 1, 2].map((i) => <div key={i} className="h-80 rounded-3xl bg-slate-900/80 border border-slate-800 animate-pulse" />)}
          </div>
        ) : catalog.isError ? (
          <SectionNotice text="Chưa tải được bảng giá." onRetry={() => catalog.refetch()} />
        ) : pricingType === 'membership' ? (
          !plans.length ? (
            <SectionNotice text="Trung tâm đang cập nhật bảng giá vé tập. Vui lòng liên hệ quầy lễ tân." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {plans.map((plan) => {
                const best = plan.id === bestValueId;
                const months = plan.paidMonths + plan.bonusMonths;
                return (
                  <div key={plan.id} className={`rounded-3xl p-7 flex flex-col justify-between relative ${best ? 'bg-gradient-to-b from-[#142338] to-[#0a1524] border-2 border-sky-500 shadow-2xl shadow-sky-950/40' : 'bg-slate-900/80 border border-slate-800'}`}>
                    {best && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-sky-600 to-blue-500 text-white text-xs font-extrabold shadow-lg uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Rẻ nhất mỗi tháng</span>
                      </div>
                    )}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                        <p className="text-sm text-sky-300 mt-1">{months} tháng sử dụng</p>
                      </div>
                      <div className="pt-2 border-t border-slate-800/80">
                        <span className="text-3xl sm:text-4xl font-black font-heading text-white">{formatVND(plan.price)}</span>
                        <p className="text-sm text-slate-400 mt-1">≈ {formatVND(Math.round(perMonth(plan)))} / tháng</p>
                      </div>
                      <ul className="space-y-3 pt-2 text-sm text-slate-300">
                        <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />Trả {plan.paidMonths} tháng</li>
                        {plan.bonusMonths > 0 && <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />Tặng thêm {plan.bonusMonths} tháng</li>}
                        <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />Check-in bằng mã QR trên app</li>
                      </ul>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRequestTrial({ interest: `Vé tập ${plan.name}` })}
                      className={`mt-8 w-full py-3.5 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${best ? 'bg-gradient-to-r from-sky-600 to-blue-500 hover:from-sky-500 hover:to-blue-400 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-sky-500'}`}
                    >
                      <span>Tư vấn gói này</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )
        ) : !ptCourses.length ? (
          <SectionNotice text="Chưa có gói PT nào đang mở bán. Vui lòng đăng ký tư vấn để được báo giá." />
        ) : (
          <div className="max-w-3xl mx-auto space-y-3">
            <p className="text-sm text-slate-400 text-center mb-4">Giá gói PT tùy khóa và số buổi. Bảng dưới là gói thấp nhất của từng khóa; xem đủ các gói trong hồ sơ từng Coach.</p>
            {ptCourses.map((course) => (
              <div key={course.id} className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white">{course.name}</h3>
                  <p className="text-sm text-slate-400">{course.coachCount} Coach đang nhận dạy</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-300">Từ <strong className="text-lg text-white">{formatVND(course.priceFrom)}</strong></span>
                  <button type="button" onClick={() => onRequestTrial({ interest: `Gói PT khóa ${course.name}` })} className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 cursor-pointer whitespace-nowrap">
                    Tư vấn
                  </button>
                </div>
              </div>
            ))}
            <p className="text-center pt-2">
              <a href="#coaches" className="text-sm font-semibold text-orange-400 hover:text-orange-300">Xem danh sách Coach →</a>
            </p>
          </div>
        )}

        <div className="mt-14 pt-8 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-orange-400" />
            <span>Thanh toán tại quầy hoặc trực tuyến</span>
          </div>
          <div className="flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-emerald-400" />
            <span>Có hóa đơn cho mọi giao dịch</span>
          </div>
        </div>
      </div>
    </section>
  );
};
