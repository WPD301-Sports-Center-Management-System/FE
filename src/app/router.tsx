import { createBrowserRouter } from 'react-router-dom'
import { DashboardLayout } from '@/layouts/dashboard-layout'
import { LandingPage } from '@/pages/landing-page'
import { LoginPage } from '@/features/auth/pages/login-page'
import { ForgotPasswordPage } from '@/features/auth/pages/forgot-password-page'
import { PublicCoachProfilePage } from '@/features/coach-public/pages/public-coach-profile-page'
import { SystemErrorPage } from '@/pages/system-error-page'
import { ProtectedRoute, GuestRoute } from '@/features/auth/guards/auth-guards'

// Manager Pages
import { ManagerDashboardPage } from '@/features/dashboard/pages/manager-dashboard-page'
import { UserManagementPage } from '@/features/users-accounts/pages/user-management-page'
import { MembershipPlansPage } from '@/features/memberships/pages/membership-plans-page'
import { GymCategoriesPage } from '@/features/courses-exercises/pages/gym-categories-page'
import { CoachApprovalPage } from '@/features/coach-approval/pages/coach-approval-page'
import { EquipmentPage } from '@/features/equipment-maintenance/pages/equipment-page'
import { ReportsPage } from '@/features/reports-audit/pages/reports-page'
import { ReviewsAuditPage } from '@/features/support-reviews-audit/pages/reviews-audit-page'

// Receptionist Pages
import { ReceptionistDashboardPage } from '@/features/dashboard/pages/receptionist-dashboard-page'
import { CheckInCounterPage } from '@/features/memberships/pages/check-in-counter-page'
import { MemberListPage } from '@/features/memberships/pages/member-list-page'
import { MembershipSalePage } from '@/features/memberships/pages/membership-sale-page'
import { PtPackageSalePage } from '@/features/pt-packages-sales/pages/pt-package-sale-page'
import { BookingCalendarPage } from '@/features/pt-bookings-schedule/pages/booking-calendar-page'
import { PaymentListPage } from '@/features/payments-invoices/pages/payment-list-page'
import { SupportTicketsPage } from '@/features/support-reviews-audit/pages/support-tickets-page'

// Coach Pages
import { CoachDashboardPage } from '@/features/dashboard/pages/coach-dashboard-page'
import { CoachMyPackagesPage } from '@/features/coach-approval/pages/coach-my-packages-page'
import { CoachSlotsPage } from '@/features/coach-slots/pages/coach-slots-page'
import { CoachBookingDetailPage } from '@/features/pt-bookings-schedule/pages/coach-booking-detail-page'
import { CoachStudentsPage } from '@/features/memberships/pages/coach-students-page'
import { TrainingPlanBuilderPage } from '@/features/training-plans/pages/training-plan-builder-page'
import { TrainingResultPage } from '@/features/training-plans/pages/training-result-page'
import { CoachAssessmentsPage } from '@/features/member-assessments/pages/coach-assessments-page'
import { CoachMealPlanPage } from '@/features/training-plans/pages/coach-meal-plan-page'
import { CoachAiRecommendationPage } from '@/features/training-plans/pages/coach-ai-recommendation-page'

// Member Pages
import { MemberDashboardPage } from '@/features/member/pages/member-dashboard-page'
import { MemberSupportPage } from '@/features/support-reviews-audit/pages/member-support-page'

import { VnPayReturnPage } from '@/features/payments-invoices/pages/vnpay-return-page'

export const router = createBrowserRouter([

  // Common & Public
  { path: '/', element: <LandingPage /> },
  { path: '/coaches/:coachId', element: <PublicCoachProfilePage /> },
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
      // Manager Routes (WEB-MAN-01 -> 12)
      {
        element: <ProtectedRoute allowedRoles={['MANAGER']} />,
        children: [
          { path: '/manager', element: <ManagerDashboardPage /> },
          { path: '/manager/users', element: <UserManagementPage /> },
          { path: '/manager/membership-plans', element: <MembershipPlansPage /> },
          { path: '/manager/categories', element: <GymCategoriesPage /> },
          { path: '/manager/approvals', element: <CoachApprovalPage /> },
          { path: '/manager/equipment', element: <EquipmentPage /> },
          { path: '/manager/reports', element: <ReportsPage /> },
          { path: '/manager/reviews-audit', element: <ReviewsAuditPage /> },
        ],
      },

      // Receptionist Routes (WEB-REC-01 -> 10)
      {
        element: <ProtectedRoute allowedRoles={['RECEPTIONIST', 'MANAGER']} />,
        children: [
          { path: '/receptionist', element: <ReceptionistDashboardPage /> },
          { path: '/receptionist/check-in', element: <CheckInCounterPage /> },
          { path: '/receptionist/members', element: <MemberListPage /> },
          { path: '/receptionist/membership-sale', element: <MembershipSalePage /> },
          { path: '/receptionist/pt-sale', element: <PtPackageSalePage /> },
          { path: '/receptionist/calendar', element: <BookingCalendarPage /> },
          { path: '/receptionist/payments', element: <PaymentListPage /> },
          { path: '/receptionist/support', element: <SupportTicketsPage /> },
        ],
      },

      // Coach Routes (WEB-COA-01 -> 11)
      {
        element: <ProtectedRoute allowedRoles={['COACH', 'MANAGER']} />,
        children: [
          { path: '/coach', element: <CoachDashboardPage /> },
          { path: '/coach/packages', element: <CoachMyPackagesPage /> },
          { path: '/coach/slots', element: <CoachSlotsPage /> },
          { path: '/coach/bookings', element: <CoachBookingDetailPage /> },
          { path: '/coach/students', element: <CoachStudentsPage /> },
          { path: '/coach/training-plans', element: <TrainingPlanBuilderPage /> },
          { path: '/coach/training-results', element: <TrainingResultPage /> },
          { path: '/coach/assessments', element: <CoachAssessmentsPage /> },
          { path: '/coach/meal-plans', element: <CoachMealPlanPage /> },
          { path: '/coach/ai-recommendation', element: <CoachAiRecommendationPage /> },
        ],
      },

      // Member Routes (WEB-MEM-01 -> 09)
      {
        element: <ProtectedRoute allowedRoles={['MEMBER']} />,
        children: [
          { path: '/member', element: <MemberDashboardPage /> },
          { path: '/member/support', element: <MemberSupportPage /> },
        ],
      },

    ],
  },

  // Error routes
  { path: '/403', element: <SystemErrorPage code="403" /> },
  { path: '/500', element: <SystemErrorPage code="500" /> },
  { path: '*', element: <SystemErrorPage code="404" /> },
])
