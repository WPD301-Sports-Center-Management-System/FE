export const journeyMetrics = ['weightKg', 'waistCm', 'bodyFatPercent', 'muscleMassKg'] as const;
export type Metric = typeof journeyMetrics[number];
export const metricLabels: Record<Metric, string> = { weightKg: 'Cân nặng', waistCm: 'Vòng eo', bodyFatPercent: 'Tỷ lệ mỡ', muscleMassKg: 'Khối lượng cơ' };
export const goalLabels: Record<string, string> = { WEIGHT_LOSS: 'Giảm cân', WEIGHT_GAIN: 'Tăng cân', FAT_LOSS: 'Giảm mỡ', MUSCLE_GAIN: 'Tăng cơ' };
export type Values = Partial<Record<Metric, number>>;
export type Initial = { startedAt: string; deadline: string; goalType: string; baseline: Values; targets: Values; profile: { dateOfBirth: string; gender: string; heightCm: number; medicalNotes: string } };
export type Point = { at: string; value: number };
export type MetricProgress = { key: Metric; name: string; unit: string; baseline: number | null; target: number | null; current: number | null; measuredAt: string; change: number | null; remaining: number | null; pct: number | null; expectedPct: number; delayBoundaryPct: number; color: 'GREEN' | 'YELLOW' | 'RED' | null; label: string; points: Point[]; forecast: { value: number; from: Point; to: Point } | null; sessions: number };
export type Journey = { purchase: { id: string; name: string; memberId: string; memberName: string; status: string }; initial: Initial | null; prefill: { dateOfBirth: string | null; gender: string | null; heightCm: number | null; medicalNotes: string; goalType: string; targetMetric: Metric; targetValue: number | null; note: string | null; deadline: string | null } | null; metrics: MetricProgress[]; bmi: { value: number; label: string } | null; expectedPct: number; readings: { bookingId: string; at: string; values: Values; comment: string }[] };
export type JourneyPackage = { id: string; packageNameSnapshot: string; status: string };
export type SessionJourney = { journey: Journey; booking: { id: string; at: string; status: string; outcomeReversedAt: string | null }; result: { id: string; comment: string; status: string; isJourney: boolean } | null };
export const showNumber = (n: number | null) => n == null ? '—' : n.toLocaleString('vi-VN', { maximumFractionDigits: 1 });
export const changeText = (m: MetricProgress) => m.change == null ? m.current == null ? 'Chưa có số đo' : 'Chưa có mốc đầu để so sánh' : `${m.change < 0 ? 'Giảm' : m.change > 0 ? 'Tăng' : 'Thay đổi'} ${showNumber(Math.abs(m.change))} ${m.unit} từ mốc đầu${m.remaining == null ? '' : m.remaining === 0 ? ' · Đã chạm mục tiêu' : ` · Còn ${showNumber(m.remaining)} ${m.unit}`}`;

