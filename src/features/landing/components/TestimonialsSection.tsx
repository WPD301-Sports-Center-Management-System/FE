import { TESTIMONIALS } from '../data/landingData';
import { Star, Quote } from 'lucide-react';

export const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-20 lg:py-28 relative bg-[#070a11] border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-semibold text-emerald-400">
            <span>KẾT QUẢ THỰC TẾ ĐO LƯỜNG ĐƯỢC</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
            Hội Viên Nói Gì Về <span className="text-gradient-emerald">ApexFit 1:1</span>?
          </h2>
          <p className="text-base text-slate-300">
            Hàng trăm hội viên đã thay đổi ngoạn mục về hình thể và lối sống sau các gói tập PT 1:1 được cá nhân hóa.
          </p>
        </div>

        {/* Testimonials 3 Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl bg-slate-900/80 border border-slate-800 p-7 flex flex-col justify-between glass-panel-hover relative group"
            >
              <div className="space-y-4">
                
                {/* Header with Avatar and Rating */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-orange-500/40"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-white">{item.name}</h4>
                      <p className="text-[11px] text-slate-400">{item.role}</p>
                    </div>
                  </div>
                  
                  {/* Rating Stars */}
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                </div>

                {/* Package & Coach Tag */}
                <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{item.package}</span>
                </div>

                {/* Quote */}
                <div className="relative pt-2">
                  <Quote className="w-6 h-6 text-orange-500/30 absolute -top-2 -left-1" />
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic pl-5">
                    "{item.quote}"
                  </p>
                </div>

              </div>

              {/* Achievement Box */}
              <div className="mt-6 pt-4 border-t border-slate-800">
                <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-emerald-300 block uppercase font-bold">Thành tích đạt được</span>
                    <span className="text-sm font-black text-emerald-400">{item.achievement.weightChange}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">{item.achievement.duration}</span>
                    <span className="text-xs font-bold text-white">{item.achievement.bodyFatChange}</span>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
