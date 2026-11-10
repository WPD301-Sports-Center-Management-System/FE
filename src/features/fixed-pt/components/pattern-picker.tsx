import type { PatternResult, PatternSlot, SeriesPreview } from '../series-api'
import { Notice } from './ui'
import { centerDate, formatDate, formatTime } from '@/shared/utils/date'
import { WeeklySchedulePicker } from '@/features/workspace/weekly-schedule-picker'
export function PatternPicker({ data, value, onChange, summary }: { data: PatternResult; value: PatternSlot[]; onChange: (p: PatternSlot[]) => void; summary?: {label:string;value:string}[] }) {
  return <WeeklySchedulePicker mode="pattern" verified={false} summary={summary} slots={data.slots} maxDays={6} value={value} onChange={onChange} />
}
export function SeriesPreviewList({ data }: { data: SeriesPreview }) {
  return <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{data.items.length} buổi · Giờ Việt Nam (GMT+7)</p><span className={`rounded-md px-2 py-1 text-xs font-semibold ${data.canConfirmAll?'bg-green-50 text-green-800':'bg-amber-50 text-amber-800'}`}>{data.canConfirmAll?'Đã kiểm tra toàn bộ lịch':'Cần chọn lại lịch'}</span></div>
    {data.skipped.length>0&&<Notice>Đã bỏ qua {data.skipped.length} ngày HLV nghỉ và nối buổi vào cuối chuỗi.</Notice>}{data.cadenceError&&<Notice>{data.cadenceError}</Notice>}
    <ol className="divide-y divide-border-subtle rounded-lg border border-border-subtle px-4">{data.items.map((item,n)=>{const day=centerDate(item.startsAt);return <li key={item.startsAt} className="flex items-center gap-3 py-3"><div className="w-11 shrink-0 rounded-lg bg-bg-surface-muted py-2 text-center"><strong className="block text-base">{day.slice(8)}</strong><span className="text-[11px] text-text-primary">TH {day.slice(5,7)}</span></div><div className="flex-1"><p className="text-sm font-semibold">Buổi {n+1} · {formatDate(item.startsAt)}</p><p className="mt-1 text-xs text-text-muted">{formatTime(item.startsAt)} – {formatTime(item.endsAt)}</p></div></li>})}</ol><p className="text-xs text-text-muted">Hoàn thành dự kiến {formatDate(data.expectedCompletionAt)}. Xem trước chưa giữ chỗ hoặc thu tiền.</p></div>
}
