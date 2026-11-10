import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { journeyApi } from './journey-api';
import { JourneyInitialize, JourneySessionPage } from './journey-pages';
import { JourneyProgress } from './journey-progress';
import type { Journey, SessionJourney } from './journey-types';
vi.mock('./journey-api', () => ({ journeyApi: { initialize: vi.fn(), session: vi.fn(), save: vi.fn() } }));
const initial = { startedAt: '2026-10-01T00:00:00Z', deadline: '2027-01-01T00:00:00Z', goalType: 'WEIGHT_LOSS', baseline: { weightKg: 80, waistCm: 90 }, targets: { weightKg: 70 }, profile: { dateOfBirth: '1995-01-01', gender: 'MALE', heightCm: 170, medicalNotes: 'Không' } };
const journey: Journey = { purchase: { id: 'purchase', name: '12 tuần', memberId: 'member', memberName: 'Học viên thử nghiệm', status: 'ACTIVE' }, initial, prefill: null, metrics: [{ key: 'weightKg', name: 'Cân nặng', unit: 'kg', baseline: 80, target: 70, current: 78, measuredAt: '2026-11-01T00:00:00Z', change: -2, remaining: 8, pct: 20, expectedPct: 40, delayBoundaryPct: 32, color: 'RED', label: 'Chậm nhiều', points: [{ at: initial.startedAt, value: 80 }, { at: '2026-11-01T00:00:00Z', value: 78 }], forecast: null, sessions: 1 }], bmi: { value: 27, label: 'Béo phì' }, readings: [], expectedPct: 40 };
const session: SessionJourney = { journey, booking: { id: 'booking', status: 'COMPLETED', at: '2026-11-01T00:00:00Z', outcomeReversedAt: null }, result: null };
function editor() { return render(<MemoryRouter initialEntries={['/sheet/booking']}><Routes><Route path="/sheet/:bookingId" element={<JourneySessionPage />} /></Routes></MemoryRouter>); }
beforeEach(() => { vi.resetAllMocks(); vi.mocked(journeyApi.session).mockResolvedValue(session); vi.mocked(journeyApi.save).mockResolvedValue({ id: 'result' }); });
afterEach(cleanup);
it('prefills wishes and profile before the coach initializes, without inventing measured baselines', () => {
  render(<JourneyInitialize data={{ ...journey, initial: null, prefill: { dateOfBirth: '1995-01-01', gender: 'MALE', heightCm: 170, medicalNotes: 'Không', goalType: 'WEIGHT_LOSS', targetMetric: 'weightKg', targetValue: 70, note: 'Muốn giảm cân', deadline: '2027-01-01' } }} done={() => {}} />);
  expect(screen.getByLabelText('Mong muốn cân nặng')).toHaveValue(70);
  expect(screen.getByLabelText('Cân nặng *')).toHaveValue(null);
  expect(screen.getByRole('button', { name: 'Lưu khởi tạo lộ trình' })).toBeDisabled();
});
it('saves actual values and comment only; leaves unmeasured optional metrics absent', async () => {
  editor(); await screen.findByLabelText('Cân nặng (kg)');
  expect(screen.getByLabelText('Tỷ lệ mỡ (%)')).toHaveValue(null);
  expect(screen.getByLabelText('Khối lượng cơ (kg)')).toHaveValue(null);
  fireEvent.change(screen.getByLabelText('Cân nặng (kg)'), { target: { value: '77.5' } });
  fireEvent.change(screen.getByLabelText('Đánh giá của Coach *'), { target: { value: 'Hôm nay tập tốt' } });
  fireEvent.click(screen.getByRole('button', { name: 'Lưu đánh giá' }));
  await waitFor(() => expect(journeyApi.save).toHaveBeenCalledWith('booking', { values: { weightKg: 77.5 }, comment: 'Hôm nay tập tốt' }));
});
it('allows a comment-only session and retains inputs on an API failure', async () => {
  vi.mocked(journeyApi.save).mockRejectedValueOnce(new Error('Mất kết nối'));
  editor(); await screen.findByLabelText('Đánh giá của Coach *');
  fireEvent.change(screen.getByLabelText('Đánh giá của Coach *'), { target: { value: 'Không đo hôm nay' } });
  fireEvent.click(screen.getByRole('button', { name: 'Lưu đánh giá' }));
  await screen.findByText('Mất kết nối');
  expect(screen.getByLabelText('Đánh giá của Coach *')).toHaveValue('Không đo hôm nay');
  expect(journeyApi.save).toHaveBeenCalledWith('booking', { values: {}, comment: 'Không đo hôm nay' });
});
it('does not offer initialization on a historical completed session', async () => {
  vi.mocked(journeyApi.session).mockResolvedValue({ ...session, journey: { ...journey, initial: null } });
  editor(); await screen.findByText(/Buổi này đã kết thúc trước khi có mốc đầu/);
  expect(screen.queryByRole('button', { name: 'Lưu khởi tạo lộ trình' })).not.toBeInTheDocument();
});
it('shows progress read-only, omits absent optional metrics, and explains missing forecast data', () => {
  render(<JourneyProgress data={journey} />);
  expect(screen.getByText('Chậm nhiều')).toBeInTheDocument();
  expect(screen.getByText('Chưa đủ dữ liệu để dự báo')).toBeInTheDocument();
  expect(screen.getByText('BMI chỉ để tham khảo')).toBeInTheDocument();
  expect(screen.queryByText('Tỷ lệ mỡ')).not.toBeInTheDocument();
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
});
