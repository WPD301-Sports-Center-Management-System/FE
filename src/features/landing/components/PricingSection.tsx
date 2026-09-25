import { useState } from 'react';
import { 
  PT_PACKAGES, 
  MEMBERSHIP_PLANS
} from '../data/landingData';
import type { PtPackage, MembershipPlan } from '../data/landingData';
import { 
  Check, 
  Flame, 
  Zap, 
  ShieldCheck, 
  CreditCard, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface PricingSectionProps {
  onSelectPtPackage: (pkg: PtPackage) => void;
  onSelectMembership: (plan: MembershipPlan) => void;
}

export const PricingSection = ({ onSelectPtPackage, onSelectMembership }: PricingSectionProps) => {
  const [pricingType, setPricingType] = useState<'pt' | 'membership'>('pt');

  return (
    <section id="pricing" className="py-20 lg:py-28 relative bg-[#070a11] border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-semibold text-orange-400">
            <span>BẢNG GIÁ MINH BẠCH & LINH HOẠT</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
            Đầu Tư Cho Vóc Dáng & Sức Khỏe <span className="text-gradient-orange">Đúng Cách</span>
          </h2>
          <p className="text-base text-slate-300">
            Không chi phí ẩn. Đặt lịch linh hoạt bằng Credit, bảo lưu theo quy định và thanh toán trực tuyến an toàn qua VNPay.
          </p>
        </div>

        {/* Pricing Category Switcher Tabs */}
        <div className="flex justify-center mb-12">
          <div className="p-1.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-2">
            <button
              onClick={() => setPricingType('pt')}
              className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                pricingType === 'pt'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-lg shadow-orange-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>Gói PT 1:1 Kèm Huấn Luyện Viên</span>
            </button>

            <button
              onClick={() => setPricingType('membership')}
              className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                pricingType === 'membership'
                  ? 'bg-gradient-to-r from-sky-600 to-blue-500 text-white shadow-lg shadow-sky-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Thẻ Hội Viên Membership Gym</span>
            </button>
          </div>
        </div>

        {/* PT PACKAGES GRID */}
        {pricingType === 'pt' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {PT_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`rounded-3xl p-7 flex flex-col justify-between relative transition-all duration-300 ${
                  pkg.popular
                    ? 'bg-gradient-to-b from-[#161f33] to-[#0d1524] border-2 border-orange-500 shadow-2xl shadow-orange-950/40 transform -translate-y-2'
                    : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Popular Badge */}
                {pkg.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-orange-600 to-amber-500 text-white text-[11px] font-extrabold shadow-lg uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{pkg.badge || 'GÓI PHỔ BIẾN NHẤT'}</span>
                  </div>
                )}

                {pkg.badge && !pkg.popular && (
                  <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-emerald-500/40 text-[10px] font-extrabold uppercase tracking-wider">
                    {pkg.badge}
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-white">{pkg.title}</h3>
                    <p className="text-xs text-slate-400 mt-1.5">{pkg.description}</p>
                  </div>

                  {/* Price */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-black font-heading text-white">{pkg.price}</span>
                      {pkg.originalPrice && (
                        <span className="text-sm text-slate-500 line-through">{pkg.originalPrice}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                      <span className="text-orange-400 font-semibold">{pkg.pricePerSession}</span>
                      <span className="bg-slate-800 px-2 py-0.5 rounded font-mono text-[11px]">
                        Hạn: {pkg.validityDays} ngày
                      </span>
                    </div>
                  </div>

                  {/* Credit Allowance */}
                  <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs font-bold text-orange-300 flex items-center justify-between">
                    <span>Số buổi Credit nhận được:</span>
                    <span className="text-sm text-white font-black">{pkg.credits} Buổi 1:1</span>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 pt-2">
                    {pkg.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Action */}
                <div className="mt-8 pt-4 border-t border-slate-800/60">
                  <button
                    onClick={() => onSelectPtPackage(pkg)}
                    className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      pkg.popular
                        ? 'bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white glow-button'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-orange-500'
                    }`}
                  >
                    <span>Chọn Gói {pkg.credits} Buổi</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* MEMBERSHIP PLANS GRID */}
        {pricingType === 'membership' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {MEMBERSHIP_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-3xl p-7 flex flex-col justify-between relative transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-b from-[#142338] to-[#0a1524] border-2 border-sky-500 shadow-2xl shadow-sky-950/40 transform -translate-y-2'
                    : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-sky-600 to-blue-500 text-white text-[11px] font-extrabold shadow-lg uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>LỰA CHỌN KHUYÊN DÙNG</span>
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <p className="text-xs text-sky-300 mt-1">Thời hạn sử dụng: {plan.duration}</p>
                  </div>

                  {/* Price */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-black font-heading text-white">{plan.price}</span>
                      {plan.originalPrice && (
                        <span className="text-sm text-slate-500 line-through">{plan.originalPrice}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Check-in tự do không giới hạn số lần</p>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 pt-2">
                    {plan.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <Check className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Action */}
                <div className="mt-8 pt-4 border-t border-slate-800/60">
                  <button
                    onClick={() => onSelectMembership(plan)}
                    className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      plan.popular
                        ? 'bg-gradient-to-r from-sky-600 to-blue-500 hover:from-sky-500 hover:to-blue-400 text-white shadow-lg shadow-sky-500/25'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-sky-500'
                    }`}
                  >
                    <span>Đăng Ký {plan.name}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Payment & Policy Guarantee Badges */}
        <div className="mt-14 pt-8 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-8 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-orange-400" />
            <span>Thanh toán Cổng VNPay & Thẻ Ngân Hàng</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Hoàn 100% Credit khi hủy trước 12 tiếng</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>Xuất hóa đơn điện tử tự động</span>
          </div>
        </div>

      </div>
    </section>
  );
};
