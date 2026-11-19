export const journeyMetrics = ['weightKg', 'waistCm', 'bodyFatPercent', 'muscleMassKg'] as const;
export type Metric = typeof journeyMetrics[number];
export const metricLabels: Record<Metric, string> = { weightKg: 'Cân nặng', waistCm: 'Vòng eo', bodyFatPercent: 'Tỷ lệ mỡ', muscleMassKg: 'Khối lượng cơ' };
export const goalLabels: Record<string, string> = { WEIGHT_LOSS: 'Giảm cân', WEIGHT_GAIN: 'Tăng cân', FAT_LOSS: 'Giảm mỡ', MUSCLE_GAIN: 'Tăng cơ', RECOMPOSITION: 'Tăng cơ giảm mỡ', BODY_SHAPING: 'Cải thiện vóc dáng' };
type Dir = Partial<Record<Metric, -1 | 1>>;
/** Mirrors BE. Level 1 (hard, blocks saving): these metrics need a target moving this way from baseline (-1 lower, +1 higher). */
const goalDirections: Record<string, Dir> = { WEIGHT_LOSS: { weightKg: -1 }, WEIGHT_GAIN: { weightKg: 1 }, FAT_LOSS: { bodyFatPercent: -1 }, MUSCLE_GAIN: { muscleMassKg: 1 }, RECOMPOSITION: { bodyFatPercent: -1, muscleMassKg: 1 } };
/** Level 1 for goals needing at least one improving metric. */
const goalAnyImprovement: Record<string, Dir> = { BODY_SHAPING: { waistCm: -1, bodyFatPercent: -1, muscleMassKg: 1 } };
/** Level 2 (soft, warning only): other metrics that normally move this way. */
const goalSoftDirections: Record<string, Dir> = { WEIGHT_LOSS: { waistCm: -1 }, FAT_LOSS: { weightKg: -1, waistCm: -1 }, MUSCLE_GAIN: { weightKg: 1 }, RECOMPOSITION: { waistCm: -1 }, BODY_SHAPING: { waistCm: -1, bodyFatPercent: -1, muscleMassKg: 1 } };
const num = (v?: string) => v?.trim() ? Number(v.replace(',', '.')) : NaN;
const dirOf = (baseline: Record<string, string>, targets: Record<string, string>, key: Metric) => { const b = num(baseline[key]), t = num(targets[key]); return Number.isNaN(b) || Number.isNaN(t) ? null : Math.sign(t - b); };
/** Level 1: form-level messages that block saving, keyed by metric. */
export const goalDirectionIssues = (goalType: string, baseline: Record<string, string>, targets: Record<string, string>) => {
  const issues: Partial<Record<Metric, string>> = {};
  for (const [key, dir] of Object.entries(goalDirections[goalType] ?? {}) as [Metric, -1 | 1][]) {
    if (Number.isNaN(num(targets[key]))) issues[key] = `Mục tiêu ${goalLabels[goalType]} cần đặt ${metricLabels[key].toLowerCase()} mong muốn.`;
    else if (dirOf(baseline, targets, key) !== null && dirOf(baseline, targets, key) !== dir) issues[key] = `Mục tiêu ${goalLabels[goalType]} cần ${metricLabels[key].toLowerCase()} mong muốn ${dir < 0 ? 'thấp' : 'cao'} hơn mốc đầu (${num(baseline[key])}).`;
  }
  const any = Object.entries(goalAnyImprovement[goalType] ?? {}) as [Metric, -1 | 1][];
  if (any.length && !any.some(([key, dir]) => dirOf(baseline, targets, key) === dir)) issues[any[0]![0]] = `Mục tiêu ${goalLabels[goalType]} cần ít nhất một chỉ số tốt lên: ${any.map(([key, dir]) => `${metricLabels[key].toLowerCase()} ${dir < 0 ? 'giảm' : 'tăng'}`).join(', ')}.`;
  return issues;
};
/** Level 2: warnings that never block saving, keyed by metric. */
export const goalDirectionWarnings = (goalType: string, baseline: Record<string, string>, targets: Record<string, string>) => Object.fromEntries((Object.entries(goalSoftDirections[goalType] ?? {}) as [Metric, -1 | 1][]).flatMap(([key, dir]) => {
  const d = dirOf(baseline, targets, key);
  return d === null || d === dir ? [] : [[key, `Thường ${goalLabels[goalType]} đi kèm ${metricLabels[key].toLowerCase()} ${dir < 0 ? 'giảm' : 'tăng'}; mục tiêu này đang ngược lại. Bạn vẫn có thể lưu nếu đã cân nhắc.`]];
})) as Partial<Record<Metric, string>>;
export type Values = Partial<Record<Metric, number>>;
export type Initial = { startedAt: string; deadline: string; goalType: string; baseline: Values; targets: Values; profile: { dateOfBirth: string; gender: string; heightCm: number; medicalNotes: string } };
export type Point = { at: string; value: number };
export type MetricProgress = { key: Metric; name: string; unit: string; baseline: number | null; target: number | null; current: number | null; measuredAt: string; change: number | null; remaining: number | null; pct: number | null; expectedPct: number; delayBoundaryPct: number; color: 'GREEN' | 'YELLOW' | 'RED' | null; label: string; points: Point[]; forecast: { value: number; from: Point; to: Point } | null; sessions: number };
export type Journey = { purchase: { id: string; name: string; memberId: string; memberName: string; status: string }; initial: Initial | null; prefill: { dateOfBirth: string | null; gender: string | null; heightCm: number | null; medicalNotes: string; goalType: string; targetMetric: Metric; targetValue: number | null; note: string | null; deadline: string | null } | null; metrics: MetricProgress[]; bmi: { value: number; label: string } | null; expectedPct: number; readings: { bookingId: string; at: string; values: Values; comment: string }[] };
export type JourneyPackage = { id: string; packageNameSnapshot: string; status: string };
export type SessionJourney = { journey: Journey; booking: { id: string; at: string; status: string; outcomeReversedAt: string | null }; result: { id: string; comment: string; status: string; isJourney: boolean } | null };
export const showNumber = (n: number | null) => n == null ? '—' : n.toLocaleString('vi-VN', { maximumFractionDigits: 1 });
export const changeText = (m: MetricProgress) => m.change == null ? m.current == null ? 'Chưa có số đo' : 'Chưa có mốc đầu để so sánh' : `${m.change < 0 ? 'Giảm' : m.change > 0 ? 'Tăng' : 'Thay đổi'} ${showNumber(Math.abs(m.change))} ${m.unit} từ mốc đầu${m.remaining == null ? '' : m.remaining === 0 ? ' · Đã chạm mục tiêu' : ` · Còn ${showNumber(m.remaining)} ${m.unit}`}`;

