import { Link } from 'react-router-dom';
import { 
  Dumbbell, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  LogIn, 
  ShieldCheck, 
  Smartphone
} from 'lucide-react';

interface FooterProps {
  onOpenDownloadModal: () => void;
}

export const Footer = ({ onOpenDownloadModal }: FooterProps) => {
  return (
    <footer className="bg-[#05080f] text-slate-400 border-t border-slate-800/80 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main 4 Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-slate-800/80">
          
          {/* Column 1: Brand Info (Span 4) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                <Dumbbell className="w-5 h-5 text-white transform -rotate-45" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight font-heading text-white">
                  APEX<span className="text-orange-500">FIT</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 ml-2">
                  1:1 PT
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Hệ thống phòng Gym cao cấp tích hợp nền tảng quản trị và đặt lịch Huấn luyện viên Cá nhân PT 1:1. Đồng hành cùng bạn trên từng bước chuyển hóa vóc dáng.
            </p>

            <div className="pt-2 space-y-1.5 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Hệ thống đạt chuẩn an toàn & cấp phép thể thao</span>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-sky-400" />
                <span>Hỗ trợ ứng dụng iOS & Android</span>
              </div>
            </div>

            {/* Social Icons using inline SVGs */}
            <div className="flex items-center gap-3 pt-3">
              <a href="#" aria-label="Facebook" className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-orange-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" aria-label="Instagram" className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-orange-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="#" aria-label="Youtube" className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-orange-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links (Span 3) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Khám Phá Nhanh</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <a href="#courses" className="hover:text-orange-400 transition-colors">Khóa tập theo nhóm cơ</a>
              </li>
              <li>
                <a href="#coaches" className="hover:text-orange-400 transition-colors">Đội ngũ Huấn luyện viên</a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-orange-400 transition-colors">Quy trình đặt lịch bằng Credit</a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-orange-400 transition-colors">Gói PT 5, 10, 20 buổi</a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-orange-400 transition-colors">Bảng giá Thẻ Membership</a>
              </li>
              <li>
                <button 
                  onClick={onOpenDownloadModal} 
                  className="text-sky-400 hover:text-sky-300 transition-colors text-left cursor-pointer"
                >
                  Tải Ứng dụng Mobile
                </button>
              </li>
              <li>
                <a href="#faq" className="hover:text-orange-400 transition-colors">Câu hỏi thường gặp (FAQ)</a>
              </li>
            </ul>
          </div>

          {/* Column 3: Internal Portals for Staff (Span 2) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Cổng Nội Bộ</h4>
            <p className="text-[11px] text-slate-400 leading-snug">
              Dành cho nhân sự và ban điều hành hệ thống:
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/login" className="flex items-center gap-1.5 text-slate-300 hover:text-orange-400 transition-colors">
                  <LogIn className="w-3.5 h-3.5 text-orange-400" />
                  <span>Center Manager</span>
                </Link>
              </li>
              <li>
                <Link to="/login" className="flex items-center gap-1.5 text-slate-300 hover:text-orange-400 transition-colors">
                  <LogIn className="w-3.5 h-3.5 text-sky-400" />
                  <span>Receptionist Quầy</span>
                </Link>
              </li>
              <li>
                <Link to="/login" className="flex items-center gap-1.5 text-slate-300 hover:text-orange-400 transition-colors">
                  <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Coach Web Portal</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Operations (Span 3) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">Liên Hệ & Phòng Gym</h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <span>Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-orange-400 shrink-0" />
                <span>Hotline: 1900 6868 (06:00 - 22:00)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-orange-400 shrink-0" />
                <span>support@apexfit.vn</span>
              </div>
              <div className="flex items-start gap-2.5 pt-1">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">Giờ Hoạt Động</span>
                  <span className="text-slate-400">Thứ 2 - Chủ Nhật: 06:00 - 22:00</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 ApexFit Gym Management System. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-300 transition-colors">Điều khoản dịch vụ</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Chính sách bảo mật</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Quy định hoàn hủy Credit</a>
          </div>
        </div>

      </div>
    </footer>
  );
};
