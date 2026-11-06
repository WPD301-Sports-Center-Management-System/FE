import { useState } from 'react';
import { formatDate } from '@/shared/utils/date';
import { journeyMetrics, metricLabels, showNumber, changeText, goalLabels, type Journey, type MetricProgress, type Point } from './journey-types';
import './journey.css';

const tone = { GREEN: 'journey-green', YELLOW: 'journey-yellow', RED: 'journey-red' };
export function JourneyProgress({ data }: { data: Journey }) {
  const [metric, setMetric] = useState('weightKg');
  const selected = data.metrics.find(m => m.key === metric) ?? data.metrics[0];
  if (!data.initial) return <p className="text-sm text-text-muted">Coach chưa khởi tạo lộ trình này.</p>;
  return <section className="journey space-y-5" aria-label="Tiến độ lộ trình">
    <div><h2 className="text-lg font-semibold">{goalLabels[data.initial.goalType]} · {data.purchase.name}</h2><p className="text-sm text-text-muted">{data.purchase.memberName} · {formatDate(data.initial.startedAt)} – {formatDate(data.initial.deadline)}</p></div>
    <div className="journey-metrics">{data.metrics.map(m => <article key={m.key} className="journey-metric">
      <div className="flex flex-wrap items-center justify-between gap-2"><h3>{m.name}</h3><span className={`journey-status ${m.color ? tone[m.color] : ''}`}>{m.label}</span></div>
      <p className="journey-number">{showNumber(m.current)} <span>{m.unit}</span></p>
      <p className="text-xs text-text-muted">Đo ngày {formatDate(m.measuredAt)}</p>
      {m.target != null && <><ProgressTrack value={m.pct ?? 0} expected={m.expectedPct} boundary={m.delayBoundaryPct} /><div className="flex justify-between text-xs text-text-muted"><span>Mốc đầu {showNumber(m.baseline)}</span><span>Đích {showNumber(m.target)} {m.unit}</span></div><p className="text-sm">Đạt {showNumber(m.pct)}% · kế hoạch {showNumber(m.expectedPct)}%</p></>}
      <p className="text-sm text-text-muted">{changeText(m)}</p>
    </article>)}</div>
    {data.bmi && <aside className="journey-bmi"><span>BMI</span><strong>{showNumber(data.bmi.value)}</strong><span>{data.bmi.label}</span><small>BMI chỉ để tham khảo</small></aside>}
    <section className="journey-plot"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">Thay đổi theo thời gian</h3><label className="text-sm">Chỉ số <select className="ml-2 rounded border border-border-subtle bg-bg-surface p-2" value={selected?.key ?? ''} onChange={e => setMetric(e.target.value)}>{journeyMetrics.filter(k => data.metrics.some(m => m.key === k)).map(k => <option key={k} value={k}>{metricLabels[k]}</option>)}</select></label></div>
      {selected && <><JourneyChart metric={selected} start={data.initial.startedAt} end={data.initial.deadline} /><p className="mt-4 font-medium">{selected.forecast ? `Dự kiến đạt ${showNumber(selected.forecast.value)} ${selected.unit} vào cuối lộ trình${selected.target == null ? '' : ` (mục tiêu ${showNumber(selected.target)} ${selected.unit})`}.` : 'Chưa đủ dữ liệu để dự báo'}</p><p className="mt-1 text-xs text-text-muted">{selected.forecast ? 'Ước tính nếu xu hướng hiện tại tiếp tục.' : 'Cần ít nhất 3 buổi có số đo của chỉ số này, ở các thời điểm khác nhau.'}</p></>}
    </section>
    {data.readings.length > 0 && <section className="space-y-3"><h3 className="font-semibold">Đánh giá qua các buổi</h3>{data.readings.slice().reverse().map(r => <article key={r.bookingId} className="border-t border-border-subtle pt-3"><p className="text-xs text-text-muted">{formatDate(r.at)}</p><p className="whitespace-pre-wrap text-sm">{r.comment}</p></article>)}</section>}
  </section>;
}
export function ProgressTrack({ value, expected, boundary }: { value: number; expected: number; boundary: number }) {
  // The same progress scale positions the marker and the plan-relative colour boundaries.
  const red = Math.max(0, Math.min(100, boundary));
  const yellow = Math.max(0, Math.min(100, expected));
  return <div className="journey-track" role="img" aria-label={`Đạt ${showNumber(value)}%, kế hoạch ${showNumber(expected)}%`}><span style={{ width: `${red}%`, background: 'var(--journey-red)' }} /><span style={{ width: `${yellow - red}%`, background: 'var(--journey-yellow)' }} /><span style={{ flex: 1, background: 'var(--journey-green)' }} /><i style={{ left: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}
export function JourneyChart({ metric: m, start, end }: { metric: MetricProgress; start: string; end: string }) {
  const width = 680, height = 240, left = 52, right = 14, top = 20, bottom = 32;
  const actual = m.points;
  const plan = m.baseline != null && m.target != null ? [{ at: start, value: m.baseline }, { at: end, value: m.target }] : [];
  const forecast = m.forecast ? [m.forecast.from, m.forecast.to] : [];
  const values = [...actual, ...plan, ...forecast].map(p => p.value);
  if (!values.length) return <p>Chưa có số liệu.</p>;
  const low = Math.min(...values), high = Math.max(...values), pad = Math.max(0.5, (high - low) * 0.15), min = low - pad, max = high + pad;
  const from = Date.parse(start), until = Math.max(Date.parse(end), ...actual.map(p => Date.parse(p.at)));
  const x = (at: string) => left + (Date.parse(at) - from) / Math.max(1, until - from) * (width - left - right);
  const y = (v: number) => top + (max - v) / (max - min) * (height - top - bottom);
  const path = (points: Point[]) => points.map(p => `${x(p.at)},${y(p.value)}`).join(' ');
  return <><svg className="journey-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Biểu đồ ${m.name}: thực tế, kế hoạch, dự báo; đơn vị ${m.unit}`}>
    {[0, 1, 2, 3].map(i => { const value = min + (max - min) * i / 3; return <g key={i}><line x1={left} x2={width - right} y1={y(value)} y2={y(value)} stroke="currentColor" opacity=".12" /><text x={left - 8} y={y(value) + 4} textAnchor="end">{showNumber(value)}</text></g>; })}
    {m.target != null && <line x1={left} x2={width - right} y1={y(m.target)} y2={y(m.target)} stroke="var(--journey-green)" strokeDasharray="2 5" />}
    {plan.length > 0 && <polyline points={path(plan)} fill="none" stroke="currentColor" opacity=".5" strokeWidth="2" />}
    {forecast.length > 0 && <polyline points={path(forecast)} fill="none" stroke="var(--journey-data)" strokeDasharray="7 5" strokeWidth="2" />}
    <polyline points={path(actual)} fill="none" stroke="var(--journey-data)" strokeWidth="2.5" />
    {actual.map((p, i) => <circle key={i} cx={x(p.at)} cy={y(p.value)} r="4" fill="var(--journey-data)"><title>{formatDate(p.at)}: {showNumber(p.value)} {m.unit}</title></circle>)}
    <text x={left} y={height - 6}>{formatDate(start)}</text><text x={width - right} y={height - 6} textAnchor="end">{formatDate(new Date(until).toISOString())}</text>
  </svg><div className="journey-legend"><span><i className="actual" />Thực tế</span><span><i className="plan" />Kế hoạch</span><span><i className="forecast" />Dự báo</span><span><i className="target" />Mục tiêu</span></div></>;
}
