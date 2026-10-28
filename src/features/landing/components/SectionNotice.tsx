import { Info } from 'lucide-react';

/** Calm placeholder for a landing section that has no real data to show (empty or failed to load). */
export const SectionNotice = ({ text, onRetry }: { text: string; onRetry?: () => void }) => (
  <div className="max-w-xl mx-auto p-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-3">
    <Info className="w-6 h-6 text-slate-400 mx-auto" />
    <p className="text-sm text-slate-300">{text}</p>
    {onRetry && (
      <button type="button" onClick={onRetry} className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 cursor-pointer">
        Thử lại
      </button>
    )}
  </div>
);
