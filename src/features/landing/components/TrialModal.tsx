import { useState } from 'react';
import { 
  X, 
  Flame, 
  CheckCircle2, 
  User, 
  Phone, 
  Sparkles
} from 'lucide-react';
import { COACHES } from '../data/landingData';
import type { TrainingCourse, PtPackage, MembershipPlan } from '../data/landingData';

interface TrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCourse?: TrainingCourse | null;
  initialPtPackage?: PtPackage | null;
  initialMembership?: MembershipPlan | null;
}

export const TrialModal = ({ 
  isOpen, 
  onClose, 
  initialCourse, 
  initialPtPackage, 
  initialMembership 
}: TrialModalProps) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [goal, setGoal] = useState('fatloss');
  const [selectedCoach, setSelectedCoach] = useState(COACHES[0].id);
  const [preferredTime, setPreferredTime] = useState('evening');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) return;
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg rounded-3xl bg-[#0e1626] border border-orange-500/40 p-6 sm:p-8 shadow-2xl shadow-orange-950/50 overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-2xl font-bold text-white">Đăng Ký Thành Công!</h3>
            <p className="text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
              Cảm ơn <span className="text-orange-400 font-semibold">{fullName}</span>! Huấn luyện viên trưởng sẽ liên hệ lại qua số <span className="text-white font-semibold">{phone}</span> trong vòng 15 phút để sắp xếp lịch đo InBody và buổi tập thử 1:1.
            </p>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-left space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Khóa/Mục tiêu:</span>
                <span className="text-slate-200 font-semibold">
                  {initialCourse ? initialCourse.title : 'Tập Thử 1:1 Cá Nhân Hóa'}
                </span>
              </div>
              {initialPtPackage && (
                <div className="flex justify-between text-slate-400">
                  <span>Gói quan tâm:</span>
                  <span className="text-orange-400 font-semibold">{initialPtPackage.title}</span>
                </div>
              )}
              {initialMembership && (
                <div className="flex justify-between text-slate-400">
                  <span>Thẻ quan tâm:</span>
                  <span className="text-sky-400 font-semibold">{initialMembership.name}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 glow-button cursor-pointer"
            >
              Hoàn Tất & Trở Về
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold uppercase mb-2">
                <Flame className="w-3.5 h-3.5" />
                <span>Trải Nghiệm Miễn Phí</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                Đăng Ký Tư Vấn & Tập Thử 1:1
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {initialCourse 
                  ? `Khóa đang chọn: ${initialCourse.title}`
                  : initialPtPackage 
                    ? `Gói đang chọn: ${initialPtPackage.title} (${initialPtPackage.price})`
                    : 'Đo lường chỉ số cơ mỡ InBody + 45 phút huấn luyện chuẩn cùng Coach chuyên môn.'}
              </p>
            </div>

            {/* Input Fields */}
            <div className="space-y-3.5 text-left">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Họ và tên của bạn *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="VD: Nguyễn Văn An"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Số điện thoại nhận lịch hẹn *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="VD: 0912 345 678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              {/* Target Goal */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Mục tiêu chính
                  </label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    <option value="muscle">Tăng cơ / Định hình vóc dáng</option>
                    <option value="fatloss">Giảm mỡ / Siết cân</option>
                    <option value="rehab">Cải thiện đau mỏi / Chỉnh form</option>
                    <option value="strength">Tăng sức bền & Thể lực</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Khung giờ tập thuận tiện
                  </label>
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    <option value="morning">Buổi sáng (06:00 - 11:00)</option>
                    <option value="afternoon">Buổi chiều (14:00 - 17:00)</option>
                    <option value="evening">Buổi tối (17:30 - 21:00)</option>
                    <option value="weekend">Cuối tuần (Thứ 7 - CN)</option>
                  </select>
                </div>
              </div>

              {/* Preferred Coach */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Chọn Huấn luyện viên mong muốn (tùy chọn)
                </label>
                <select
                  value={selectedCoach}
                  onChange={(e) => setSelectedCoach(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                >
                  {COACHES.map((coach) => (
                    <option key={coach.id} value={coach.id}>
                      {coach.name} ({coach.title})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 glow-button cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Xác Nhận Đăng Ký Tập Thử</span>
              </button>
              <p className="text-[10px] text-slate-400 text-center mt-2">
                Thông tin của bạn được bảo mật theo chính sách của Sports Center.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
