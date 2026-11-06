import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { apiClient } from '@/shared/api/client';
import { useLoad, useSubmit } from '@/features/fixed-pt/hooks';
import { PageHeader } from '@/features/workspace/ui';
import { formatDateTime } from '@/shared/utils/date';
import { Box, Btn, Err, Input, Select, LoadState } from './components';
import { journeyApi } from './journey-api';
import { JourneyProgress } from './journey-progress';
import { journeyMetrics, metricLabels, goalLabels, type Journey, type Values } from './journey-types';

export function JourneyInitialize({ data, done }: { data: Journey; done: () => void }) {
  const p = data.prefill;
  const [f, setF] = useState({ dateOfBirth: p?.dateOfBirth ?? '', gender: p?.gender && ['MALE', 'FEMALE', 'OTHER'].includes(p.gender.toUpperCase()) ? p.gender.toUpperCase() : '', heightCm: p?.heightCm ? String(p.heightCm) : '', medicalNotes: p?.medicalNotes ?? '', goalType: p?.goalType ?? 'WEIGHT_LOSS', deadline: p?.deadline ?? '' });
  const [baseline, setBaseline] = useState<Record<string, string>>({});
  const [targets, setTargets] = useState<Record<string, string>>(p?.targetValue != null ? { [p.targetMetric]: String(p.targetValue) } : {});
  const act = useSubmit();
  const set = (key: keyof typeof f) => (value: string) => setF(old => ({ ...old, [key]: value }));
  const numbers = (values: Record<string, string>): Values => Object.fromEntries(Object.entries(values).filter(([, v]) => v.trim()).map(([k, v]) => [k, Number(v.replace(',', '.'))]));
  const save = () => void act.run(async () => { await journeyApi.initialize(data.purchase.id, { ...f, heightCm: Number(f.heightCm.replace(',', '.')), baseline: numbers(baseline), targets: numbers(targets) }); done(); });
  return <Box title="Khởi tạo lộ trình">
    <p className="text-sm text-text-muted">{data.purchase.memberName} · {data.purchase.name}. Hoàn thành mốc đầu trước khi bắt đầu buổi tập.</p>
    {p?.note && <p className="text-sm">Mong muốn học viên: {p.note}</p>}
    <div className="grid gap-4 sm:grid-cols-2"><Input label="Ngày sinh *" type="date" value={f.dateOfBirth} onChange={set('dateOfBirth')} /><Select label="Giới tính *" value={f.gender} onChange={set('gender')} options={[{ value: '', label: 'Chọn giới tính' }, { value: 'MALE', label: 'Nam' }, { value: 'FEMALE', label: 'Nữ' }, { value: 'OTHER', label: 'Khác' }]} /><Input label="Chiều cao (cm) *" type="number" value={f.heightCm} onChange={set('heightCm')} /><Select label="Mục tiêu *" value={f.goalType} onChange={set('goalType')} options={Object.entries(goalLabels).map(([value, label]) => ({ value, label }))} /></div>
    <label className="block text-sm font-medium">Sức khỏe / chấn thương *<textarea className="mt-1 min-h-20 w-full rounded-lg border border-border-subtle bg-bg-surface p-3" value={f.medicalNotes} onChange={e => set('medicalNotes')(e.target.value)} placeholder="Ghi tình trạng cần lưu ý; nếu không có, ghi Không." /></label>
    <div className="space-y-4">{journeyMetrics.map((key, i) => <fieldset key={key} className="grid grid-cols-2 gap-3 border-t border-border-subtle pt-3"><legend className="text-sm font-semibold">{metricLabels[key]} ({key === 'waistCm' ? 'cm' : key === 'bodyFatPercent' ? '%' : 'kg'}){i > 1 ? ' · tùy chọn' : ''}</legend><Input label={`Mốc đầu ${metricLabels[key].toLowerCase()}${i < 2 ? ' *' : ''}`} type="number" value={baseline[key] ?? ''} onChange={v => setBaseline(old => ({ ...old, [key]: v }))} /><Input label={`Mong muốn ${metricLabels[key].toLowerCase()}`} type="number" value={targets[key] ?? ''} onChange={v => setTargets(old => ({ ...old, [key]: v }))} /></fieldset>)}</div>
    <p className="text-xs text-text-muted">Nhập ít nhất một chỉ số mong muốn. Chỉ số có đích cần có mốc đầu tương ứng.</p>
    <Input label="Ngày kết thúc lộ trình *" type="date" value={f.deadline} onChange={set('deadline')} />
    <Err error={act.error} /><Btn disabled={act.busy || !f.dateOfBirth || !f.gender || !f.heightCm || !f.medicalNotes.trim() || !f.deadline || !baseline.weightKg || !baseline.waistCm || !Object.values(targets).some(v => v.trim())} onClick={save}>{act.busy ? 'Đang lưu…' : 'Lưu khởi tạo lộ trình'}</Btn>
  </Box>;
}
export function JourneyForPurchase({ purchaseId, coach = false }: { purchaseId: string; coach?: boolean }) {
  const state = useLoad(() => journeyApi.get(purchaseId), [purchaseId]);
  return <LoadState state={state}>{state.data && (state.data.initial ? <JourneyProgress data={state.data} /> : coach && ['ACTIVE', 'PAUSED'].includes(state.data.purchase.status) ? <JourneyInitialize key={purchaseId} data={state.data} done={() => void state.reload()} /> : <p className="text-sm text-text-muted">{state.data.purchase.status === 'COMPLETED' ? 'Gói đã kết thúc trước khi có dữ liệu khởi tạo lộ trình.' : 'Coach sẽ khởi tạo mốc đầu khi bắt đầu lộ trình.'}</p>)}</LoadState>;
}
export function JourneyCoachPage({ embedded = false }: { embedded?: boolean } = {}) {
  const [params, setParams] = useSearchParams();
  const state = useLoad(async () => (await apiClient.get('/coaches/me/pt-packages', { params: { limit: 100 } })).data as { id: string; memberId: string; memberName: string; packageNameSnapshot: string; status: string }[], []);
  const packages = (state.data ?? []).filter(p => ['ACTIVE', 'PAUSED', 'COMPLETED'].includes(p.status) && (!params.get('memberId') || p.memberId === params.get('memberId')));
  const selected = params.get('purchaseId') ?? packages[0]?.id ?? '';
  return <div className="space-y-5">{!embedded && <PageHeader title="Lộ trình & tiến độ" subtitle="Mốc đầu, kết quả từng buổi và dự kiến cuối lộ trình." />}<LoadState state={state}><Select label="Lộ trình học viên" value={selected} onChange={v => { const next = new URLSearchParams(params); next.set('purchaseId', v); setParams(next); }} options={packages.map(p => ({ value: p.id, label: `${p.memberName} · ${p.packageNameSnapshot}` }))} />{!packages.length && <p className="text-sm text-text-muted">Chưa có lộ trình học viên.</p>}</LoadState>{selected && <JourneyForPurchase key={selected} purchaseId={selected} coach />}</div>;
}
export function JourneyMemberPage({ embedded = false }: { embedded?: boolean } = {}) {
  const state = useLoad(() => journeyApi.list(), []);
  const [picked, setPicked] = useState('');
  const selected = picked || state.data?.[0]?.id;
  return <div className="space-y-5">{!embedded && <PageHeader title="Tiến độ lộ trình" subtitle="Kết quả được tính từ mốc đầu và số đo Coach ghi sau mỗi buổi." />}<LoadState state={state}>{state.data?.length ? <Select label="Lộ trình" value={selected ?? ''} onChange={setPicked} options={state.data.map(p => ({ value: p.id, label: p.packageNameSnapshot }))} /> : <p className="text-sm text-text-muted">Chưa có lộ trình tập cùng Coach.</p>}</LoadState>{selected && <JourneyForPurchase key={selected} purchaseId={selected} />}</div>;
}
export function JourneySessionPage() {
  const { bookingId = '' } = useParams();
  const state = useLoad(() => journeyApi.session(bookingId), [bookingId]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [comment, setComment] = useState('');
  const act = useSubmit();
  const data = state.data;
  const save = () => void act.run(async () => { await journeyApi.save(bookingId, { values: Object.fromEntries(Object.entries(values).filter(([, v]) => v.trim()).map(([k, v]) => [k, Number(v.replace(',', '.'))])), comment }); await state.reload(); });
  return <div className="mx-auto max-w-3xl space-y-5"><Link className="text-sm text-primary" to={`/coach/sessions/${bookingId}`}>← Quay lại buổi tập</Link><PageHeader title="Đánh giá cuối buổi" subtitle="Ghi số đo đã đo hôm nay và nhận xét cho học viên." /><LoadState state={state}>{data && (!data.journey.initial ? data.booking.status === 'COMPLETED' ? <p>Buổi này đã kết thúc trước khi có mốc đầu. Khởi tạo lộ trình trước buổi tập tiếp theo.</p> : <JourneyInitialize data={data.journey} done={() => void state.reload()} /> : <>
    <p className="text-sm text-text-muted">{data.journey.purchase.memberName} · {formatDateTime(data.booking.at)}</p>
    {data.result ? <Box title={data.result.isJourney ? data.result.status === 'VOID' ? 'Đánh giá đã thu hồi' : 'Đã lưu đánh giá' : `Bản ghi theo mẫu cũ · ${data.result.status === 'DRAFT' ? 'Bản nháp' : data.result.status === 'VOID' ? 'Đã thu hồi' : 'Đã công bố'}`}><p className="whitespace-pre-wrap">{data.result.comment}</p><JourneyProgress data={data.journey} /></Box> : data.booking.status !== 'COMPLETED' || data.booking.outcomeReversedAt || Date.parse(data.booking.at) < Date.parse(data.journey.initial.startedAt) ? <p>Hoàn thành buổi tập để ghi đánh giá cuối buổi.</p> : <Box title="Số đo hôm nay"><p className="text-sm text-text-muted">Chỉ điền số thực sự đã đo. Không đo thì để trống.</p><div className="grid grid-cols-2 gap-4">{journeyMetrics.map(k => <Input key={k} label={`${metricLabels[k]} (${k === 'waistCm' ? 'cm' : k === 'bodyFatPercent' ? '%' : 'kg'})`} type="number" value={values[k] ?? ''} onChange={v => setValues(old => ({ ...old, [k]: v }))} />)}</div><label className="block text-sm font-medium">Đánh giá của Coach *<textarea className="mt-2 min-h-28 w-full rounded-lg border border-border-subtle bg-bg-surface p-3" value={comment} onChange={e => setComment(e.target.value)} placeholder="Hôm nay học viên…" /></label><Err error={act.error} /><Btn disabled={act.busy || !comment.trim()} onClick={save}>{act.busy ? 'Đang lưu…' : 'Lưu đánh giá'}</Btn></Box>}
  </>)}</LoadState></div>;
}
export function JourneyStartGate({ bookingId }: { bookingId: string }) {
  const state = useLoad(() => journeyApi.session(bookingId), [bookingId]);
  return <LoadState state={state}>{state.data && !state.data.journey.initial && <JourneyInitialize data={state.data.journey} done={() => void state.reload()} />}</LoadState>;
}
