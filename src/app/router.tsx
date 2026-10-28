import { createBrowserRouter, Navigate } from 'react-router-dom'
import { DashboardLayout } from '@/layouts/dashboard-layout'
import { LandingPage } from '@/pages/landing-page'
import { LoginPage } from '@/features/auth/pages/login-page'
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
import { MgrApprovalsPage } from '@/features/manager-workspace/pages/mgr-approvals-page'
import { MgrCoachIncomePage } from '@/features/manager-workspace/pages/mgr-coach-income-page'
import { MgrOpsPage } from '@/features/manager-workspace/pages/mgr-ops-page'
import { UserManagementPage } from '@/features/users-accounts/pages/user-management-page'
import { MembershipPlansPage } from '@/features/memberships/pages/membership-plans-page'
import { GymCategoriesPage } from '@/features/courses-exercises/pages/gym-categories-page'
import { EquipmentPage } from '@/features/equipment-maintenance/pages/equipment-page'
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
import { DeskPtCalendarPage } from '@/features/reception-workspace/pages/desk-pt-calendar-page'
import { DeskScheduleChangesPage } from '@/features/reception-workspace/pages/desk-schedule-changes-page'
import { DeskPaymentsPage } from '@/features/reception-workspace/pages/desk-payments-page'
import { DeskSupportPage } from '@/features/reception-workspace/pages/desk-support-page'

// Coach Pages (workspace shell + redesigned screens; older tools stay reachable inside the shell)
import { CoachShell } from '@/features/coach-workspace/shell'
import { CoachHomePage } from '@/features/coach-workspace/pages/coach-home-page'
import { CoachSchedulePage } from '@/features/coach-workspace/pages/coach-schedule-page'
import { CoachSessionPage } from '@/features/coach-workspace/pages/coach-session-page'
import { CoachScheduleChangesPage } from '@/features/coach-workspace/pages/coach-schedule-changes-page'
import { CoachStudentsPage } from '@/features/coach-workspace/pages/coach-students-page'
import { CoachStudentDetailPage } from '@/features/coach-workspace/pages/coach-student-detail-page'
import { CoachPackagesPage } from '@/features/coach-workspace/pages/coach-packages-page'
import { CoachOfferingsPage } from '@/features/coach-workspace/pages/coach-offerings-page'
import { CoachLibraryPage } from '@/features/coach-workspace/pages/coach-library-page'
import { CoachEarningsWorkspacePage } from '@/features/coach-workspace/pages/coach-earnings-page'
import { CoachMyPackagesPage } from '@/features/coach-approval/pages/coach-my-packages-page'
import { TrainingResultPage } from '@/features/training-plans/pages/training-result-page'
import { CoachAssessmentsPage } from '@/features/member-assessments/pages/coach-assessments-page'
import { CoachMealPlanPage } from '@/features/training-plans/pages/coach-meal-plan-page'
import { CoachAiRecommendationPage } from '@/features/training-plans/pages/coach-ai-recommendation-page'

// Member Pages
import { MemberDashboardPage } from '@/features/member/pages/member-dashboard-page'
import { MemberSupportPage } from '@/features/support-reviews-audit/pages/member-support-page'

import { VnPayReturnPage } from '@/features/payments-invoices/pages/vnpay-return-page'

// Fixed-schedule PT 1:1
import { CoachCalendarPage } from '@/features/fixed-pt/pages/coach-calendar-page'
import { CoachIntakePage } from '@/features/fixed-pt/pages/coach-intake-page'
import { CoachSessionsPage } from '@/features/fixed-pt/pages/coach-sessions-page'
import { CoachProgramPage } from '@/features/fixed-pt/pages/coach-program-page'
import { ReceptionEnrollmentPage } from '@/features/fixed-pt/pages/reception-enrollment-page'
import { HybridSalePage } from '@/features/fixed-pt/pages/hybrid-sale-page'
import { LinkedPurchasePage, LinkedSessionPage } from '@/features/fixed-pt/pages/linked-detail-page'
import { ReconciliationPage } from '@/features/fixed-pt/pages/reconciliation-page'
import { ManagerPoliciesPage } from '@/features/fixed-pt/pages/manager-policies-page'
import { ManagerLedgerPage } from '@/features/fixed-pt/pages/manager-ledger-page'
import { ManagerSessionsPage } from '@/features/fixed-pt/pages/manager-sessions-page'

export const router = createBrowserRouter([

  // Common & Public
  { path: '/', element: <LandingPage /> },
  { path: '/coaches/:coachId', element: <PublicCoachProfilePage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
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
          { path: '/member/support', element: <MemberSupportPage /> },
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
      { path: '/manager/calendar', element: <Navigate to="/manager/pt-board" replace /> },
      { path: '/manager/sessions/:id', element: <LinkedSessionPage /> },
      { path: '/manager/pt-purchases/:id', element: <LinkedPurchasePage /> },
      { path: '/manager/categories', element: <GymCategoriesPage /> },
      { path: '/manager/pt-packages', element: <MgrPtPackagesPage /> },
      { path: '/manager/approvals', element: <MgrApprovalsPage /> },
      { path: '/manager/coach-income', element: <MgrCoachIncomePage /> },
      { path: '/manager/coach-ledger', element: <ManagerLedgerPage /> },
      { path: '/manager/payments', element: <DeskPaymentsPage /> },
      { path: '/manager/reconciliation', element: <ReconciliationPage /> },
      { path: '/manager/reports', element: <ReportsPage /> },
      { path: '/manager/equipment', element: <EquipmentPage /> },
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
      { path: '/receptionist/legacy-enrollments', element: <ReceptionEnrollmentPage /> },
      { path: '/receptionist/calendar', element: <DeskPtCalendarPage /> },
      { path: '/receptionist/schedule-changes', element: <DeskScheduleChangesPage /> },
      { path: '/receptionist/sessions/:id', element: <LinkedSessionPage /> },
      { path: '/receptionist/pt-purchases/:id', element: <LinkedPurchasePage /> },
      { path: '/receptionist/payments', element: <DeskPaymentsPage /> },
      { path: '/receptionist/invoices', element: <Navigate to="/receptionist/payments?view=invoices" replace /> },
      { path: '/receptionist/reconciliation', element: <ReconciliationPage /> },
      { path: '/receptionist/support', element: <DeskSupportPage /> },
    ],
  },

  // Coach workspace (own sidebar/topbar). COACH only: every page reads /coaches/me/*.
  {
    element: (
      <ProtectedRoute allowedRoles={['COACH']}>
        <CoachShell />
      </ProtectedRoute>
    ),
    children: [
      { path: '/coach', element: <CoachHomePage /> },
      { path: '/coach/schedule', element: <CoachSchedulePage /> },
      { path: '/coach/sessions/:id', element: <CoachSessionPage /> },
      { path: '/coach/schedule-changes', element: <CoachScheduleChangesPage /> },
      { path: '/coach/students', element: <CoachStudentsPage /> },
      { path: '/coach/students/:memberId', element: <CoachStudentDetailPage /> },
      { path: '/coach/packages', element: <CoachPackagesPage /> },
      { path: '/coach/pt-purchases/:id', element: <LinkedPurchasePage /> },
      { path: '/coach/offerings', element: <CoachOfferingsPage /> },
      { path: '/coach/teaching-rights', element: <CoachMyPackagesPage /> },
      { path: '/coach/library', element: <CoachLibraryPage /> },
      { path: '/coach/earnings', element: <CoachEarningsWorkspacePage /> },
      { path: '/coach/slots', element: <CoachCalendarPage /> },
      { path: '/coach/legacy-intake', element: <CoachIntakePage /> },
      { path: '/coach/bookings', element: <CoachSessionsPage /> },
      { path: '/coach/training-plans', element: <CoachProgramPage /> },
      { path: '/coach/training-results', element: <TrainingResultPage /> },
      { path: '/coach/assessments', element: <CoachAssessmentsPage /> },
      { path: '/coach/meal-plans', element: <CoachMealPlanPage /> },
      { path: '/coach/ai-recommendation', element: <CoachAiRecommendationPage /> },
    ],
  },

  // Error routes
  { path: '/403', element: <SystemErrorPage code="403" /> },
  { path: '/500', element: <SystemErrorPage code="500" /> },
  { path: '*', element: <SystemErrorPage code="404" /> },
])
