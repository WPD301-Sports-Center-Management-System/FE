import { MemberGymSalePage } from '@/features/member/pages/member-gym-sale-page'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { CoachSheetPage } from '@/features/goal-lab/coach-sheet-page'
import { MemberGoalsPage } from '@/features/goal-lab/member-goals-page'
import { DashboardLayout } from '@/layouts/dashboard-layout'
import { LandingPage } from '@/pages/landing-page'
import { LoginPage } from '@/features/auth/pages/login-page'
import { ChangePasswordPage } from '@/features/auth/pages/change-password-page'
import { ForgotPasswordPage } from '@/features/auth/pages/forgot-password-page'
import { ResetPasswordPage } from '@/features/auth/pages/reset-password-page'
import { PublicCoachProfilePage } from '@/features/coach-public/pages/public-coach-profile-page'
import { SystemErrorPage } from '@/pages/system-error-page'
import { ProtectedRoute, GuestRoute } from '@/features/auth/guards/auth-guards'

// Manager Pages
import { ManagerShell } from '@/features/manager-workspace/shell'
import { MgrHomePage } from '@/features/manager-workspace/pages/mgr-home-page'
import { MgrMembersPage } from '@/features/manager-workspace/pages/mgr-members-page'
import { MgrPtBoardPage } from '@/features/manager-workspace/pages/mgr-pt-board-page'
import { MgrPtPackagesPage } from '@/features/manager-workspace/pages/mgr-pt-packages-page'
import { MealLibraryPage } from '@/features/training-plans/pages/meal-library-page'
import { CoachNutritionPage, CoachProgressPage, CoachTeachingPage } from '@/features/coach-workspace/pages/coach-expertise-pages'
import { TabRedirect } from '@/features/workspace/tabbed-page'
import { MgrApprovalsPage } from '@/features/manager-workspace/pages/mgr-approvals-page'
import { MgrCoachIncomePage } from '@/features/manager-workspace/pages/mgr-coach-income-page'
import { MgrOpsPage } from '@/features/manager-workspace/pages/mgr-ops-page'
import { UserManagementPage } from '@/features/users-accounts/pages/user-management-page'
import { MembershipPlansPage } from '@/features/memberships/pages/membership-plans-page'
import { GymCategoriesPage } from '@/features/courses-exercises/pages/gym-categories-page'
import { ReportsPage } from '@/features/reports-audit/pages/reports-page'
import { ReviewsAuditPage } from '@/features/support-reviews-audit/pages/reviews-audit-page'

// Receptionist Pages (front-desk shell + redesigned screens; PT sale and reconciliation keep their pages)
import { ReceptionShell } from '@/features/reception-workspace/shell'
import { DeskHomePage } from '@/features/reception-workspace/pages/desk-home-page'
import { DeskTrialsPage } from '@/features/reception-workspace/pages/desk-trials-page'
import { DeskMembersPage } from '@/features/reception-workspace/pages/desk-members-page'
import { DeskMemberPage } from '@/features/reception-workspace/pages/desk-member-page'
import { DeskCheckinPage } from '@/features/reception-workspace/pages/desk-checkin-page'
import { DeskPosPage } from '@/features/reception-workspace/pages/desk-pos-page'
import { DeskPtHubPage, PaymentsHubPage } from '@/features/reception-workspace/pages/desk-hub-pages'
import { DeskSupportPage } from '@/features/reception-workspace/pages/desk-support-page'

// Coach Pages (workspace shell + redesigned screens; older tools stay reachable inside the shell)
import { CoachShell } from '@/features/coach-workspace/shell'
import { CoachHomePage } from '@/features/coach-workspace/pages/coach-home-page'
import { CoachScheduleHubPage } from '@/features/coach-workspace/pages/coach-schedule-hub-page'
import { CoachSessionPage } from '@/features/coach-workspace/pages/coach-session-page'
import { CoachStudentsPage } from '@/features/coach-workspace/pages/coach-students-page'
import { CoachStudentDetailPage } from '@/features/coach-workspace/pages/coach-student-detail-page'
import { CoachPackagesPage } from '@/features/coach-workspace/pages/coach-packages-page'
import { WalletPage as CoachEarningsWorkspacePage } from '@/features/fixed-pt/pages/wallet-page'
import { CoachApplicationPage, CoachApplicationGate } from '@/features/fixed-pt/pages/application-page'
import { PackageCatalogPage as CoachMyPackagesPage } from '@/features/fixed-pt/pages/package-catalog-page'

// Member Pages
import { MemberDashboardPage } from '@/features/member/pages/member-dashboard-page'
import { MemberSupportPage } from '@/features/support-reviews-audit/pages/member-support-page'

import { VnPayReturnPage } from '@/features/payments-invoices/pages/vnpay-return-page'

// Fixed-schedule PT 1:1
import { HybridSalePage } from '@/features/fixed-pt/pages/hybrid-sale-page'
import { LinkedPurchasePage, LinkedSessionPage } from '@/features/fixed-pt/pages/linked-detail-page'
import { ManagerPoliciesPage } from '@/features/fixed-pt/pages/manager-policies-page'
import { ManagerLedgerPage } from '@/features/fixed-pt/pages/manager-ledger-page'
import { ManagerSessionsPage } from '@/features/fixed-pt/pages/manager-sessions-page'

export const router = createBrowserRouter([

  // Common & Public
  { path: '/', element: <LandingPage /> },
  { path: '/coaches/:coachId', element: <PublicCoachProfilePage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/account/change-password', element: <ProtectedRoute><ChangePasswordPage /></ProtectedRoute> },
  { path: '/payment/vnpay-return', element: <VnPayReturnPage /> },
  { path: '/payment/vnpay/return', element: <VnPayReturnPage /> },
  { path: '/payments/vnpay-return', element: <VnPayReturnPage /> },

  // Guest Only Routes (Redirect to dashboard if already authenticated)
  {
    element: <GuestRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
    ],
  },

  // Role Protected Dashboards
  {
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      // Linked detail pages opened from notifications
      { path: '/pt-sessions/:id', element: <LinkedSessionPage /> },
      { path: '/pt-purchases/:id', element: <LinkedPurchasePage /> },

      // Member routes
      {
        element: <ProtectedRoute allowedRoles={['MEMBER']} />,
        children: [
          { path: '/member', element: <MemberDashboardPage /> },
          { path: '/member/membership-sale', element: <MemberGymSalePage /> },
          { path: '/member/pt-sale', element: <HybridSalePage /> },
          { path: '/member/support', element: <MemberSupportPage /> },
          { path: '/member/goals', element: <MemberGoalsPage /> },
        ],
      },

    ],
  },

  // Manager console (own sidebar/topbar). Older CRUD pages keep their content inside the new shell.
  {
    element: (
      <ProtectedRoute allowedRoles={['MANAGER']}>
        <ManagerShell />
      </ProtectedRoute>
    ),
    children: [
      { path: '/manager', element: <MgrHomePage /> },
      { path: '/manager/members', element: <MgrMembersPage /> },
      { path: '/manager/members/:id', element: <DeskMemberPage /> },
      { path: '/manager/pt-board', element: <MgrPtBoardPage /> },
      { path: '/manager/sessions/:id', element: <LinkedSessionPage /> },
      { path: '/manager/pt-purchases/:id', element: <LinkedPurchasePage /> },
      { path: '/manager/categories', element: <GymCategoriesPage /> },
      { path: '/manager/pt-packages', element: <MgrPtPackagesPage /> },
      { path: '/manager/meal-library', element: <MealLibraryPage manager /> },
      { path: '/manager/approvals', element: <MgrApprovalsPage /> },
      { path: '/manager/coach-income', element: <MgrCoachIncomePage /> },
      { path: '/manager/coach-ledger', element: <ManagerLedgerPage /> },
      { path: '/manager/payments', element: <PaymentsHubPage /> },
      { path: '/manager/reconciliation', element: <TabRedirect to="/manager/payments" tab="reconciliation" /> },
      { path: '/manager/reports', element: <ReportsPage /> },
      { path: '/manager/equipment', element: <Navigate to="/manager/ops" replace /> },
      { path: '/manager/users', element: <UserManagementPage /> },
      { path: '/manager/ops', element: <MgrOpsPage /> },
      { path: '/manager/policies', element: <ManagerPoliciesPage /> },
      { path: '/manager/sessions', element: <ManagerSessionsPage /> },
      { path: '/manager/reviews-audit', element: <ReviewsAuditPage /> },
      { path: '/manager/support', element: <DeskSupportPage /> },
      { path: '/manager/membership-plans', element: <MembershipPlansPage /> },
    ],
  },

  // Front desk (own sidebar/topbar; managers can open it too)
  {
    element: (
      <ProtectedRoute allowedRoles={['RECEPTIONIST', 'MANAGER']}>
        <ReceptionShell />
      </ProtectedRoute>
    ),
    children: [
      { path: '/receptionist', element: <DeskHomePage /> },
      { path: '/receptionist/trial-requests', element: <DeskTrialsPage /> },
      { path: '/receptionist/members', element: <DeskMembersPage /> },
      { path: '/receptionist/members/:id', element: <DeskMemberPage /> },
      { path: '/receptionist/check-in', element: <DeskCheckinPage /> },
      { path: '/receptionist/membership-sale', element: <DeskPosPage /> },
      { path: '/receptionist/pt-sale', element: <HybridSalePage /> },
      { path: '/receptionist/calendar', element: <DeskPtHubPage /> },
      { path: '/receptionist/schedule-changes', element: <TabRedirect to="/receptionist/calendar" tab="changes" /> },
      { path: '/receptionist/sessions/:id', element: <LinkedSessionPage /> },
      { path: '/receptionist/pt-purchases/:id', element: <LinkedPurchasePage /> },
      { path: '/receptionist/payments', element: <PaymentsHubPage /> },
      { path: '/receptionist/invoices', element: <Navigate to="/receptionist/payments?view=invoices" replace /> },
      { path: '/receptionist/reconciliation', element: <TabRedirect to="/receptionist/payments" tab="reconciliation" /> },
      { path: '/receptionist/support', element: <DeskSupportPage /> },
    ],
  },

  // Coach workspace (own sidebar/topbar). COACH only: every page reads /coaches/me/*.
  {
    element: (
      <ProtectedRoute allowedRoles={['COACH']}>
        <CoachApplicationGate><CoachShell /></CoachApplicationGate>
      </ProtectedRoute>
    ),
    children: [
      { path: '/coach/application', element: <CoachApplicationPage /> },
      { path: '/coach', element: <CoachHomePage /> },
      { path: '/coach/schedule', element: <CoachScheduleHubPage /> },
      { path: '/coach/sessions/:id', element: <CoachSessionPage /> },
      { path: '/coach/schedule-changes', element: <TabRedirect to="/coach/schedule" tab="changes" /> },
      { path: '/coach/students', element: <CoachStudentsPage /> },
      { path: '/coach/students/:memberId', element: <CoachStudentDetailPage /> },
      { path: '/coach/packages', element: <CoachPackagesPage /> },
      { path: '/coach/pt-purchases/:id', element: <LinkedPurchasePage /> },
      { path: '/coach/teaching-rights', element: <CoachMyPackagesPage /> },
      { path: '/coach/library', element: <CoachTeachingPage /> },
      { path: '/coach/progress', element: <CoachProgressPage /> },
      { path: '/coach/goals', element: <TabRedirect to="/coach/progress" tab="goals" /> },
      { path: '/coach/goals/sheet/:bookingId', element: <CoachSheetPage /> },
      { path: '/coach/earnings', element: <CoachEarningsWorkspacePage /> },
      { path: '/coach/slots', element: <TabRedirect to="/coach/schedule" tab="hours" /> },
      { path: '/coach/bookings', element: <Navigate to="/coach/schedule" replace /> },
      { path: '/coach/meal-plans', element: <CoachNutritionPage /> },
      // Merged into tabbed pages; old links keep their query (purchaseId, bookingId…).
      { path: '/coach/training-plans', element: <TabRedirect to="/coach/library" tab="packages" /> },
      { path: '/coach/training-results', element: <TabRedirect to="/coach/progress" tab="results" /> },
      { path: '/coach/assessments', element: <TabRedirect to="/coach/progress" tab="metrics" /> },
      { path: '/coach/meal-templates', element: <TabRedirect to="/coach/meal-plans" tab="templates" /> },
      { path: '/coach/ai-recommendation', element: <TabRedirect to="/coach/library" tab="ai" /> },
    ],
  },

  // Error routes
  { path: '/403', element: <SystemErrorPage code="403" /> },
  { path: '/500', element: <SystemErrorPage code="500" /> },
  { path: '*', element: <SystemErrorPage code="404" /> },
])
