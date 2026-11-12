import { TabbedPage } from '@/features/workspace/tabbed-page'
import { CoachProgramPage } from '@/features/fixed-pt/pages/coach-program-page'
import { CoachAiRecommendationPage } from '@/features/training-plans/pages/coach-ai-recommendation-page'
import { CoachMealPlanPage } from '@/features/training-plans/pages/coach-meal-plan-page'
import { MealLibraryPage } from '@/features/training-plans/pages/meal-library-page'
import { CoachSheetsPage } from '@/features/goal-lab/coach-sheets-page'
import { CoachLibraryPage } from './coach-library-page'
import { CoachGoalsPage } from '@/features/goal-lab/coach-goals-page'
import { useSearchParams } from 'react-router-dom'
import { useState } from 'react'

// The Coach's professional tools, one page per job. Each page starts with the daily task (a Member's
// package / progress / meals), then the reusable library, then AI drafts of the same kind.

export function CoachTeachingPage() {
  return <TabbedPage title="Giáo án" tabs={[
    { key: 'packages', label: 'Buổi tập học viên', render: () => <CoachProgramPage embedded /> },
    { key: 'templates', label: 'Thư viện giáo án', render: () => <CoachLibraryPage /> },
    { key: 'ai', label: 'Soạn bằng AI', hint: 'AI soạn nháp; bạn kiểm tra và chọn buổi tập để dùng ngay.', render: () => <CoachAiRecommendationPage kind="TRAINING_PLAN" /> },
  ]} />
}

export function CoachProgressPage() {
  return <div className="[&_[role=tab]]:text-text-primary"><TabbedPage title="Tiến độ học viên" tabs={[
    { key: 'goals', label: 'Lộ trình & tiến độ', render: () => <CoachGoalsPage embedded /> },
    { key: 'results', label: 'Đánh giá cuối buổi', render: () => <CoachSheetsPage /> },
  ]} /></div>
}

export function CoachNutritionPage() {
  const [params] = useSearchParams()
  return <TabbedPage title="Thực đơn" tabs={[
    { key: 'plans', label: 'Thực đơn học viên', render: () => <div className="space-y-5"><CoachMealPlanPage /><MealAiHistory key={String(params.get('tab') === 'ai')} initiallyOpen={params.get('tab') === 'ai'} /></div> },
    { key: 'templates', label: 'Mẫu thực đơn', render: () => <MealLibraryPage embedded /> },
  ]} />
}

function MealAiHistory({ initiallyOpen }: { initiallyOpen: boolean }) {
  const [open, setOpen] = useState(initiallyOpen)
  return <details open={open} onToggle={e => setOpen(e.currentTarget.open)} className="rounded-xl border border-border-subtle p-4"><summary className="cursor-pointer text-sm text-text-muted">Bản nháp AI đã lưu trước đây</summary>{open && <div className="mt-4"><CoachAiRecommendationPage kind="MEAL_PLAN" historyOnly /></div>}</details>
}
