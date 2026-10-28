import { X, Smartphone, QrCode, CheckCircle2 } from 'lucide-react';

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppDownloadModal = ({ isOpen, onClose }: AppDownloadModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md rounded-3xl bg-[#0e1626] border border-sky-500/40 p-6 sm:p-8 shadow-2xl shadow-sky-950/50 overflow-hidden text-center space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-bold uppercase">
            <Smartphone className="w-3.5 h-3.5" />
            <span>APEXFIT MEMBER APP</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white">
            Tải Ứng Dụng Di Động
          </h3>
          <p className="text-xs text-slate-300">
            Đặt slot 1:1, quản lý credit và theo dõi tiến độ InBody mọi lúc mọi nơi.
          </p>
        </div>

        {/* QR Code Big Frame */}
        <div className="p-5 rounded-2xl bg-white w-48 h-48 mx-auto flex flex-col items-center justify-center shadow-lg border-2 border-slate-700">
          <QrCode className="w-36 h-36 text-slate-300" aria-hidden="true" />
          <span className="text-xs text-slate-600 font-bold mt-1 uppercase tracking-wider">
            Mã cài đặt sẽ có khi phát hành
          </span>
        </div>

        {/* App Store & Google Play Links */}
        <div className="grid grid-cols-2 gap-3">
          {['App Store', 'Google Play'].map((store) => (
            <div key={store} aria-disabled="true" className="p-3 rounded-xl bg-slate-800/60 text-slate-300 text-sm font-bold border border-slate-700 flex flex-col items-center justify-center">
              <span>{store}</span>
              <span className="text-xs font-medium text-slate-400">Sắp ra mắt</span>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 text-left space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Dành cho Hội Viên Member & Huấn Luyện Viên</span>
          </div>
          <p>Tương thích hoàn toàn với iOS 15.0+ và Android 10.0+.</p>
        </div>

      </div>
    </div>
  );
};
