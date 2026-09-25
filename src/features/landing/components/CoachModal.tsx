import { useState } from 'react';
import { 
  X, 
  Star, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Sparkles
} from 'lucide-react';
import type { Coach, CoachSlot } from '../data/landingData';

interface CoachModalProps {
  coach: Coach | null;
  onClose: () => void;
  onOpenTrialWithCoach: (coach: Coach) => void;
}

export const CoachModal = ({ coach, onClose, onOpenTrialWithCoach }: CoachModalProps) => {
  const [selectedSlot, setSelectedSlot] = useState<CoachSlot | null>(coach?.availableSlots[0] || null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  if (!coach) return null;

  const handleBookSlot = () => {
    if (!selectedSlot) return;
    setBookingSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl rounded-3xl bg-[#0e1626] border border-orange-500/40 p-6 sm:p-8 shadow-2xl shadow-orange-950/50 overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {bookingSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-2xl font-bold text-white">Đã Chọn Slot Của {coach.name}!</h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto">
              Slot đã chọn: <span className="text-orange-400 font-bold">{selectedSlot?.time} ({selectedSlot?.date})</span>.
              Chuyên viên tư vấn sẽ liên hệ ngay để hướng dẫn kích hoạt Credit và xác nhận lịch chính thức trên ứng dụng.
            </p>

            <button
              onClick={() => {
                setBookingSuccess(false);
                onClose();
              }}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 glow-button cursor-pointer"
            >
              Đóng Cửa Sổ
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Coach Profile Header */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <img
                src={coach.avatar}
                alt={coach.name}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-orange-500/50 shadow-lg"
              />
              <div className="text-center sm:text-left space-y-1 flex-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-xl font-bold text-white">{coach.name}</h3>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/60 text-amber-400 text-xs font-bold border border-white/10">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{coach.rating}</span>
                  </div>
                </div>
                <p className="text-xs text-sky-400 font-semibold">{coach.title}</p>
                <p className="text-xs text-slate-400">
                  {coach.experienceYears} năm kinh nghiệm • Đã dạy {coach.completedSessions}+ buổi PT 1:1
                </p>

                {/* Certifications */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 pt-1">
                  {coach.certifications.map((cert, i) => (
                    <span key={i} className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bio & Philosophy */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-2">
              <p className="leading-relaxed">{coach.bio}</p>
              <div className="pt-2 border-t border-slate-800 flex items-center gap-2 text-[11px] text-orange-400 font-medium italic">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>"{coach.quote}"</span>
              </div>
            </div>

            {/* Available Open Slots Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <Calendar className="w-4 h-4 text-orange-400" />
                  Slot Trống Công Khai Của Coach
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  Real-time Slots
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {coach.availableSlots.map((slot) => {
                  const isSelected = selectedSlot?.id === slot.id;
                  return (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-orange-500/20 border-orange-500 text-white shadow-md'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold">{slot.date}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                          isSelected ? 'bg-orange-500 text-white' : 'bg-slate-800 text-emerald-400'
                        }`}>
                          OPEN
                        </span>
                      </div>
                      <div className="text-xs font-mono font-bold mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-orange-400" />
                        <span>{slot.time}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <button
                onClick={handleBookSlot}
                className="w-full py-3.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 glow-button cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Đặt Slot {selectedSlot?.time} ({selectedSlot?.date})</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenTrialWithCoach(coach);
                }}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
              >
                Đăng Ký Buổi Tập Thử Miễn Phí Với {coach.name}
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
