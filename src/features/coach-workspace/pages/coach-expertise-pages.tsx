import { TabbedPage } from '@/features/workspace/tabbed-page'
import { CoachProgramPage } from '@/features/fixed-pt/pages/coach-program-page'
import { CoachAiRecommendationPage } from '@/features/training-plans/pages/coach-ai-recommendation-page'
import { CoachMealPlanPage } from '@/features/training-plans/pages/coach-meal-plan-page'
import { MealLibraryPage } from '@/features/training-plans/pages/meal-library-page'
import { CoachSheetsPage } from '@/features/goal-lab/coach-sheets-page'
import { CoachLibraryPage } from './coach-library-page'
import { CoachGoalsPage } from '@/features/goal-lab/coach-goals-page'

// The Coach's professional tools, one page per job. Each page starts with the daily task (a Member's
// package / progress / meals), then the reusable library, then AI drafts of the same kind.

export function CoachTeachingPage() {
  return <TabbedPage title="Giáo án" tabs={[
    { key: 'packages', label: 'Theo gói học viên', hint: 'Điền giáo án cho nhiều buổi theo chu kỳ, kiểm tra rồi giao cho học viên.', render: () => <CoachProgramPage embedded /> },
    { key: 'templates', label: 'Thư viện giáo án', hint: 'Giáo án mẫu cho một buổi và chương trình A/B/C xoay vòng cho cả gói.', render: () => <CoachLibraryPage /> },
    { key: 'ai', label: 'Soạn bằng AI', hint: 'AI chọn bài trong thư viện bài tập; duyệt xong thành giáo án mẫu của bạn.', render: () => <CoachAiRecommendationPage kind="TRAINING_PLAN" /> },
  ]} />
}

export function CoachProgressPage() {
  return <div className="[&_[role=tab]]:text-text-primary"><TabbedPage title="Tiến độ học viên" tabs={[
    { key: 'goals', label: 'Lộ trình & tiến độ', render: () => <CoachGoalsPage embedded /> },
    { key: 'results', label: 'Đánh giá cuối buổi', render: () => <CoachSheetsPage /> },
  ]} /></div>
}

export function CoachNutritionPage() {
  return <TabbedPage title="Thực đơn" tabs={[
    { key: 'plans', label: 'Thực đơn học viên', render: () => <CoachMealPlanPage /> },
    { key: 'templates', label: 'Mẫu thực đơn', render: () => <MealLibraryPage embedded /> },
    { key: 'ai', label: 'Soạn bằng AI', hint: 'AI ghép món trong thư viện theo kcal mục tiêu; duyệt xong thành thực đơn nháp.', render: () => <CoachAiRecommendationPage kind="MEAL_PLAN" /> },
  ]} />
}
