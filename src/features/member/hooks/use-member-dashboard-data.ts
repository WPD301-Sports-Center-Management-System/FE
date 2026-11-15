import { useCallback, useEffect, useState } from 'react'
import { meService } from '@/features/auth/services/me.service'
import { dashboardService } from '@/features/dashboard/services/dashboard.service'
import { isAppApiError } from '@/shared/api/api-error'
import type { MemberProgressData } from '@/features/auth/types/me.types'
import type { Subscription, Purchase, Booking, Payment, Invoice, TrainingPlan, MealPlan, SupportRequest } from '@/shared/types/api'

export function useMemberDashboardData() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [ptPackages, setPtPackages] = useState<Purchase[]>([])
  const [ptBookings, setPtBookings] = useState<Booking[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>([])
  const [progress, setProgress] = useState<MemberProgressData | null>(null)
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [failedSections, setFailedSections] = useState<string[]>([])

  const loadMemberData = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const results = await Promise.allSettled([
        dashboardService.getMemberDashboard(),
        meService.getMySubscriptions(),
        meService.getMyPtPackages(),
        meService.getMyPtBookings(),
        meService.getMyPayments(),
        meService.getMyInvoices(),
        meService.getMyTrainingPlans(),
        meService.getMyProgress(),
        meService.getMyMealPlans(),
        meService.getMySupportRequests(),
      ])
      const groups: Record<string, number[]> = { overview:[0,1,2], pt:[3], training:[6,7,8], billing:[4,5], support:[9] }
      setFailedSections(Object.keys(groups).filter(key => groups[key]!.some(i => results[i]!.status === 'rejected')))

      const extractData = <T,>(res: PromiseSettledResult<any>, fallback: T): T => {
        if (res.status === 'fulfilled') {
          const val = res.value
          if (Array.isArray(val)) return val as T
          if (val && Array.isArray(val.data)) return val.data as T
          if (val && val.data) return val.data as T
          return val as T
        }
        return fallback
      }

      // If dashboard/member fulfilled, it provides membership, packages, upcomingBookings
      const dashOverview = results[0].status === 'fulfilled' ? results[0].value : null
      const subs = extractData<Subscription[]>(results[1], [])
      if (subs.length === 0 && dashOverview?.membership) {
        subs.push(dashOverview.membership)
      }

      setSubscriptions(subs)
      setPtPackages(extractData<Purchase[]>(results[2], dashOverview?.packages || []))
      setPtBookings(extractData<Booking[]>(results[3], dashOverview?.upcomingBookings || []))
      setPayments(extractData<Payment[]>(results[4], []))
      setInvoices(extractData<Invoice[]>(results[5], []))
      setTrainingPlans(extractData<TrainingPlan[]>(results[6], []))
      if (results[7].status === 'fulfilled') {
        setProgress(results[7].value)
      }
      setMealPlans(extractData<MealPlan[]>(results[8], []))
      setSupportRequests(extractData<SupportRequest[]>(results[9], []))

      // Check errors
      const criticalIndices = [0, 1, 2] // dashboard overview, subscriptions, pt packages
      const criticalFailures = results.filter((r, idx) => criticalIndices.includes(idx) && r.status === 'rejected') as PromiseRejectedResult[]
      const anyFailure = results.find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined

      if (criticalFailures.length > 0) {
        const firstErr = criticalFailures[0].reason
        if (isAppApiError(firstErr)) {
          if (firstErr.status === 401) setErrorMessage('Hết phiên đăng nhập. Vui lòng đăng nhập lại.')
          else if (firstErr.status === 403) setErrorMessage('Bạn không có quyền truy cập trang hội viên (403 Forbidden).')
          else setErrorMessage(`Không thể tải dữ liệu hội viên: ${firstErr.message || 'Lỗi kết nối máy chủ'}`)
        } else {
          setErrorMessage('Không thể tải dữ liệu cốt lõi của hội viên. Vui lòng thử lại.')
        }
      } else if (anyFailure) {
        const err = anyFailure.reason
        if (isAppApiError(err)) {
          if (err.status === 401) setErrorMessage('Hết phiên đăng nhập. Vui lòng đăng nhập lại.')
          else if (err.status === 403) setErrorMessage('Bạn không có quyền truy cập một số mục (403 Forbidden).')
          else setErrorMessage('Một số thông tin chưa tải được. Dữ liệu trống bên dưới có thể chưa phản ánh đúng hồ sơ của bạn. Bấm Làm mới dữ liệu để thử lại.')
        }
        else setErrorMessage('Một số thông tin chưa tải được. Bấm Làm mới dữ liệu để thử lại trước khi thực hiện giao dịch.')
      }

    } catch {
      setErrorMessage('Lỗi hệ thống khi tải trang cá nhân hội viên.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMemberData()
  }, [loadMemberData])

  return { subscriptions, ptPackages, ptBookings, payments, invoices, trainingPlans, progress, mealPlans, supportRequests, isLoading, errorMessage, setErrorMessage, failedSections, loadMemberData }
}
