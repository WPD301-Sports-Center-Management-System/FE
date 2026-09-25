import { createBrowserRouter } from 'react-router-dom'
import { DashboardLayout } from '@/layouts/dashboard-layout'
import { LoginPage } from '@/features/auth/pages/login-page'
import { HomePage } from '@/features/dashboard/pages/home-page'
import { NotFoundPage } from '@/pages/not-found-page'
import { LandingPage } from '@/pages/landing-page'

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  {
    element: <DashboardLayout />,
    children: [
      { path: '/manager', element: <HomePage role="Center Manager" /> },
      { path: '/receptionist', element: <HomePage role="Receptionist" /> },
      { path: '/coach', element: <HomePage role="Coach" /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
