import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Flame, CheckCircle2, User, Phone, Sparkles, AlertTriangle, Loader2 } from 'lucide-react';
import { isAppApiError } from '@/shared/api/api-error';
import { landingApi, usePublicCoaches, type TrialContext } from '../api';

interface TrialModalProps {
  onClose: () => void;
  context?: TrialContext | null;
}

const GOALS = ['Tăng cơ / Định hình vóc dáng', 'Giảm mỡ / Siết cân', 'Cải thiện đau mỏi / Chỉnh form', 'Tăng sức bền & Thể lực'];
const TIMES = ['Buổi sáng (06:00 - 11:00)', 'Buổi chiều (14:00 - 17:00)', 'Buổi tối (17:30 - 21:00)', 'Cuối tuần (Thứ 7 - CN)'];
const fieldClass = 'w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-orange-500';

// Mounted only while open (see LandingPage), so the form always starts from the visitor's current context.
export const TrialModal = ({ onClose, context }: TrialModalProps) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [goal, setGoal] = useState(GOALS[1]);
  const [preferredTime, setPreferredTime] = useState(TIMES[2]);
  const [coachId, setCoachId] = useState(context?.coachId ?? '');
  const coaches = usePublicCoaches();
  const submit = useMutation({ mutationFn: landingApi.submitTrial });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) return;
    submit.mutate({ fullName: fullName.trim(), phone: phone.trim(), goal, preferredTime, coachId: coachId || undefined, interest: context?.interest });
  };

  const errorMessage = submit.error
    ? isAppApiError(submit.error) ? submit.error.message : 'Không gửi được đăng ký. Vui lòng thử lại hoặc gọi trực tiếp cho trung tâm.'
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="trial-title"
        className="relative w-full max-w-lg rounded-3xl bg-[#0e1626] border border-orange-500/40 p-6 sm:p-8 shadow-2xl shadow-orange-950/50 overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} aria-label="Đóng" className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer">
          <X className="w-5 h-5" />
        </button>

        {submit.isSuccess ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 id="trial-title" className="text-2xl font-bold text-white">Đã nhận đăng ký</h3>
            <p className="text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
              Cảm ơn <span className="text-orange-400 font-semibold">{fullName}</span>! Lễ tân sẽ gọi lại số <span className="text-white font-semibold">{phone}</span> trong giờ làm việc để hẹn buổi tư vấn và tập thử.
            </p>
            {context?.interest && (
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-sm text-left flex justify-between gap-3 text-slate-400">
                <span>Bạn quan tâm:</span>
                <span className="text-slate-200 font-semibold text-right">{context.interest}</span>
              </div>
            )}
            <button onClick={onClose} className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 glow-button cursor-pointer">
              Đóng
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold uppercase mb-2">
                <Flame className="w-3.5 h-3.5" />
                <span>Tư vấn miễn phí</span>
              </div>
              <h3 id="trial-title" className="text-xl sm:text-2xl font-bold text-white">Đăng ký tư vấn & tập thử</h3>
              <p className="text-sm text-slate-400 mt-1">
                {context?.interest ? `Bạn đang xem: ${context.interest}` : 'Để lại thông tin, lễ tân sẽ gọi lại để hẹn lịch phù hợp với bạn.'}
              </p>
            </div>

            <div className="space-y-3.5 text-left">
              <div>
                <label htmlFor="trial-name" className="text-sm font-semibold text-slate-300 block mb-1">Họ và tên *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input id="trial-name" type="text" required maxLength={120} autoComplete="name" placeholder="VD: Nguyễn Văn An" value={fullName} onChange={(e) => setFullName(e.target.value)} className={`${fieldClass} pl-10`} />
                </div>
              </div>

              <div>
                <label htmlFor="trial-phone" className="text-sm font-semibold text-slate-300 block mb-1">Số điện thoại *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input id="trial-phone" type="tel" required autoComplete="tel" placeholder="VD: 0912 345 678" value={phone} onChange={(e) => setPhone(e.target.value)} className={`${fieldClass} pl-10`} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="trial-goal" className="text-sm font-semibold text-slate-300 block mb-1">Mục tiêu chính</label>
                  <select id="trial-goal" value={goal} onChange={(e) => setGoal(e.target.value)} className={fieldClass}>
                    {GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="trial-time" className="text-sm font-semibold text-slate-300 block mb-1">Khung giờ thuận tiện</label>
                  <select id="trial-time" value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} className={fieldClass}>
                    {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="trial-coach" className="text-sm font-semibold text-slate-300 block mb-1">Huấn luyện viên mong muốn (tùy chọn)</label>
                <select id="trial-coach" value={coachId} onChange={(e) => setCoachId(e.target.value)} className={fieldClass}>
                  <option value="">Để trung tâm gợi ý</option>
                  {context?.coachId && !coaches.data?.some((c) => c.id === context.coachId) && (
                    <option value={context.coachId}>{context.coachName ?? 'Coach đã chọn'}</option>
                  )}
                  {coaches.data?.map((coach) => (
                    <option key={coach.id} value={coach.id}>{coach.fullName}{coach.specialization ? ` – ${coach.specialization}` : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            {errorMessage && (
              <div role="alert" className="flex items-start gap-2 p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-sm text-red-200">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="pt-2">
              <button type="submit" disabled={submit.isPending} className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 glow-button cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait">
                {submit.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{submit.isPending ? 'Đang gửi…' : 'Gửi đăng ký'}</span>
              </button>
              <p className="text-xs text-slate-400 text-center mt-2">Thông tin chỉ dùng để trung tâm liên hệ tư vấn cho bạn.</p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
