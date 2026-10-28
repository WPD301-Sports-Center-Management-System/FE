import { Star, Quote } from 'lucide-react';
import { formatDate } from '@/shared/utils/date';
import { usePublicCoaches, useReviews } from '../api';

// Only real, visible reviews from members who completed a PT package. The whole section stays hidden
// until there is at least one, instead of filling the space with invented stories.
export const TestimonialsSection = () => {
  const coaches = usePublicCoaches();
  const reviews = useReviews(coaches.data);
  if (!reviews.data?.length) return null;

  return (
    <section id="testimonials" className="py-20 lg:py-28 relative bg-[#070a11] border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-semibold text-emerald-400">
            <span>ĐÁNH GIÁ TỪ HỘI VIÊN</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
            Hội Viên Nói Gì Về <span className="text-gradient-emerald">Huấn Luyện Viên</span>?
          </h2>
          <p className="text-base text-slate-300">Đánh giá được gửi sau khi hội viên hoàn thành gói PT.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.data.map((item) => (
            <figure key={item.id} className="rounded-3xl bg-slate-900/80 border border-slate-800 p-7 flex flex-col justify-between gap-6 glass-panel-hover">
              <div className="space-y-4">
                <div className="flex items-center gap-0.5 text-amber-400" aria-label={`${item.rating} trên 5 sao`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < item.rating ? 'fill-amber-400' : 'text-slate-600'}`} />
                  ))}
                </div>
                <blockquote className="relative pt-2">
                  <Quote className="w-6 h-6 text-orange-500/30 absolute -top-2 -left-1" />
                  <p className="text-sm text-slate-300 leading-relaxed italic pl-5">"{item.comment}"</p>
                </blockquote>
              </div>
              <figcaption className="pt-4 border-t border-slate-800 text-sm">
                <span className="font-bold text-white">{item.memberName ?? 'Hội viên'}</span>
                <span className="block text-slate-400 mt-0.5">
                  Coach {item.coachName}{item.courseName ? ` · ${item.courseName}` : ''} · {formatDate(item.createdAt)}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};
