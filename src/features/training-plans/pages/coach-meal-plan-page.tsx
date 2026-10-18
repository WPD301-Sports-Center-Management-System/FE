import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Utensils,
  Plus,
  Calendar,
  AlertCircle,
  Check,
  RefreshCw,
  AlertTriangle,
  Trash2,
  Edit3,
  Copy,
  Eye,
  Search,
  Flame,
  Activity,
  ListFilter,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { coachesService } from '@/features/coaches/services/coaches.service'
import { mealPlansService } from '../services/meal-plans.service'
import { Button } from '@/shared/components/ui/button'
import { Input, Select } from '@/shared/components/ui/input'
import { Modal } from '@/shared/components/ui/modal'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { isAppApiError } from '@/shared/api/api-error'
import { formatDate } from '@/shared/utils/date'
import type { MemberSummary, MealPlan, MealPlanItem } from '@/shared/types/api'

interface MealFormItem {
  id?: string
  dayNumber: number
  mealType: string
  foodName: string
  quantity: string
  estimatedCalories: number
  proteinGrams: number
  carbsGrams: number
  fatGrams: number
  note?: string
  sortOrder: number
}

const DEFAULT_INITIAL_MEALS: MealFormItem[] = [
  {
    dayNumber: 1,
    mealType: 'Bữa sáng (07:30)',
    foodName: 'Yến mạch nấu sữa hạt + 3 lòng trắng trứng + 1 quả chuối',
    quantity: '1 khẩu phần (350g)',
    estimatedCalories: 480,
    proteinGrams: 32,
    carbsGrams: 65,
    fatGrams: 10,
    sortOrder: 1,
  },
  {
    dayNumber: 1,
    mealType: 'Bữa trưa (12:00)',
    foodName: '200g Ức gà áp chảo + 1 chén cơm gạo lứt + 150g Bông cải xanh luộc',
    quantity: '1 khẩu phần (450g)',
    estimatedCalories: 620,
    proteinGrams: 52,
    carbsGrams: 60,
    fatGrams: 12,
    sortOrder: 2,
  },
  {
    dayNumber: 1,
    mealType: 'Bữa phụ trước tập (16:30)',
    foodName: '1 Muỗng Whey Protein Isolate + 1 lát Bánh mì nguyên cám',
    quantity: '1 phần',
    estimatedCalories: 250,
    proteinGrams: 28,
    carbsGrams: 22,
    fatGrams: 3,
    sortOrder: 3,
  },
  {
    dayNumber: 1,
    mealType: 'Bữa tối (19:30)',
    foodName: '200g Cá hồi áp chảo + 1 củ khoai lang nướng + Xà lách sốt giấm',
    quantity: '1 khẩu phần (400g)',
    estimatedCalories: 580,
    proteinGrams: 42,
    carbsGrams: 45,
    fatGrams: 18,
    sortOrder: 4,
  },
]

const MEAL_TYPE_OPTIONS = [
  { value: 'Bữa sáng (07:00 - 08:30)', label: 'Bữa sáng (07:00 - 08:30)' },
  { value: 'Bữa phụ sáng (10:00)', label: 'Bữa phụ sáng (10:00)' },
  { value: 'Bữa trưa (11:30 - 13:00)', label: 'Bữa trưa (11:30 - 13:00)' },
  { value: 'Bữa phụ chiều / Trước tập (16:00 - 17:00)', label: 'Bữa phụ chiều / Trước tập (16:00 - 17:00)' },
  { value: 'Bữa tối (19:00 - 20:30)', label: 'Bữa tối (19:00 - 20:30)' },
  { value: 'Bữa phụ tối (21:30)', label: 'Bữa phụ tối (21:30)' },
]

export function CoachMealPlanPage() {
  // Navigation & View mode
  const [activeTab, setActiveTab] = useState<'list' | 'builder'>('list')

  // Real data states from BE
  const [members, setMembers] = useState<MemberSummary[]>([])
  const [plans, setPlans] = useState<MealPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Filters for list view
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'ACTIVE' | 'ARCHIVED'>('ALL')
  const [memberFilter, setMemberFilter] = useState('')

  // Builder form states
  const [memberId, setMemberId] = useState('')
  const [title, setTitle] = useState('')
  const [targetCalories, setTargetCalories] = useState('2000')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [meals, setMeals] = useState<MealFormItem[]>(DEFAULT_INITIAL_MEALS)
  const [selectedDay, setSelectedDay] = useState<number>(1)

  // Modal states: Add/Edit Meal Item
  const [isMealModalOpen, setIsMealModalOpen] = useState(false)
  const [editingMealIndex, setEditingMealIndex] = useState<number | null>(null)
  const [mealFormType, setMealFormType] = useState('Bữa sáng (07:00 - 08:30)')
  const [mealFormFood, setMealFormFood] = useState('')
  const [mealFormQuantity, setMealFormQuantity] = useState('1 phần')
  const [mealFormCalories, setMealFormCalories] = useState('400')
  const [mealFormProtein, setMealFormProtein] = useState('30')
  const [mealFormCarbs, setMealFormCarbs] = useState('45')
  const [mealFormFat, setMealFormFat] = useState('10')
  const [mealFormNote, setMealFormNote] = useState('')

  // Modal state: Duplicate Day
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false)
  const [targetDuplicateDay, setTargetDuplicateDay] = useState<number>(2)

  // Modal state: View Plan Detail
  const [viewingPlan, setViewingPlan] = useState<MealPlan | null>(null)
  const [viewingPlanItems, setViewingPlanItems] = useState<MealPlanItem[]>([])
  const [viewingSelectedDay, setViewingSelectedDay] = useState<number>(1)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  // Load members and meal plans from Real Backend
  const loadData = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const [membersRes, plansRes] = await Promise.allSettled([
        coachesService.getMyMembers(),
        mealPlansService.getMealPlans(),
      ])

      if (membersRes.status === 'fulfilled') {
        const raw = membersRes.value
        const items = (raw?.data || (Array.isArray(raw) ? raw : [])) as MemberSummary[]
        setMembers(items)
      }

      if (plansRes.status === 'fulfilled') {
        setPlans(plansRes.value.data || [])
      } else {
        const err = plansRes.reason
        if (isAppApiError(err)) {
          setErrorMessage(err.message || 'Lỗi khi tải danh sách thực đơn từ máy chủ.')
        }
      }
    } catch {
      setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Get distinct day numbers in current builder meals
  const builderDays = useMemo(() => {
    const days = Array.from(new Set(meals.map((m) => m.dayNumber))).sort((a, b) => a - b)
    return days.length > 0 ? days : [1]
  }, [meals])

  // Current day meals in builder
  const currentDayMeals = useMemo(() => {
    return meals.filter((m) => m.dayNumber === selectedDay)
  }, [meals, selectedDay])

  // Live macro calculation for selected day
  const dayMacroSummary = useMemo(() => {
    const totalCal = currentDayMeals.reduce((acc, m) => acc + (Number(m.estimatedCalories) || 0), 0)
    const totalP = currentDayMeals.reduce((acc, m) => acc + (Number(m.proteinGrams) || 0), 0)
    const totalC = currentDayMeals.reduce((acc, m) => acc + (Number(m.carbsGrams) || 0), 0)
    const totalF = currentDayMeals.reduce((acc, m) => acc + (Number(m.fatGrams) || 0), 0)

    const target = Number(targetCalories) || 2000
    const percentCal = Math.min(Math.round((totalCal / target) * 100), 100)

    return { totalCal, totalP, totalC, totalF, target, percentCal }
  }, [currentDayMeals, targetCalories])

  // Open modal to add meal
  const handleOpenAddMeal = () => {
    setEditingMealIndex(null)
    setMealFormType('Bữa sáng (07:00 - 08:30)')
    setMealFormFood('')
    setMealFormQuantity('1 khẩu phần')
    setMealFormCalories('400')
    setMealFormProtein('30')
    setMealFormCarbs('45')
    setMealFormFat('10')
    setMealFormNote('')
    setIsMealModalOpen(true)
  }

  // Open modal to edit meal
  const handleOpenEditMeal = (indexInAllMeals: number) => {
    const item = meals[indexInAllMeals]
    if (!item) return
    setEditingMealIndex(indexInAllMeals)
    setMealFormType(item.mealType)
    setMealFormFood(item.foodName)
    setMealFormQuantity(item.quantity || '')
    setMealFormCalories(String(item.estimatedCalories || 0))
    setMealFormProtein(String(item.proteinGrams || 0))
    setMealFormCarbs(String(item.carbsGrams || 0))
    setMealFormFat(String(item.fatGrams || 0))
    setMealFormNote(item.note || '')
    setIsMealModalOpen(true)
  }

  // Save meal in modal
  const handleSaveMealItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!mealFormFood.trim()) return

    const newItem: MealFormItem = {
      dayNumber: selectedDay,
      mealType: mealFormType,
      foodName: mealFormFood.trim(),
      quantity: mealFormQuantity.trim(),
      estimatedCalories: Number(mealFormCalories) || 0,
      proteinGrams: Number(mealFormProtein) || 0,
      carbsGrams: Number(mealFormCarbs) || 0,
      fatGrams: Number(mealFormFat) || 0,
      note: mealFormNote.trim(),
      sortOrder: currentDayMeals.length + 1,
    }

    if (editingMealIndex !== null) {
      setMeals((prev) => {
        const next = [...prev]
        next[editingMealIndex] = { ...newItem, dayNumber: prev[editingMealIndex].dayNumber }
        return next
      })
    } else {
      setMeals((prev) => [...prev, newItem])
    }

    setIsMealModalOpen(false)
  }

  // Remove meal
  const handleDeleteMeal = (indexInAllMeals: number) => {
    setMeals((prev) => prev.filter((_, idx) => idx !== indexInAllMeals))
  }

  // Add a new empty day
  const handleAddNewDay = () => {
    const maxDay = builderDays.length > 0 ? Math.max(...builderDays) : 0
    const nextDay = maxDay + 1
    setSelectedDay(nextDay)
  }

  // Duplicate current day to target day
  const handleDuplicateDay = () => {
    if (targetDuplicateDay === selectedDay) return

    // Clone all meals of selectedDay into targetDuplicateDay
    const sourceItems = meals.filter((m) => m.dayNumber === selectedDay)
    if (sourceItems.length === 0) return

    const clonedItems = sourceItems.map((item) => ({
      ...item,
      dayNumber: targetDuplicateDay,
    }))

    setMeals((prev) => {
      // Remove any existing meals on target day, then append cloned
      const filtered = prev.filter((m) => m.dayNumber !== targetDuplicateDay)
      return [...filtered, ...clonedItems]
    })

    setSelectedDay(targetDuplicateDay)
    setIsDuplicateModalOpen(false)
    setSuccessMessage(`Đã sao chép các món từ Ngày ${selectedDay} sang Ngày ${targetDuplicateDay}!`)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  // Handle Save Meal Plan (status: DRAFT or ACTIVE)
  const handleSubmitMealPlan = async (assignImmediately: boolean) => {
    if (!memberId) {
      setErrorMessage('Vui lòng chọn học viên áp dụng thực đơn.')
      return
    }
    if (!title.trim()) {
      setErrorMessage('Vui lòng nhập tên kế hoạch thực đơn dinh dưỡng.')
      return
    }
    if (meals.length === 0) {
      setErrorMessage('Thực đơn phải có ít nhất một món ăn.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const disclaimer =
        'Thực đơn và chỉ số dinh dưỡng do Huấn luyện viên thể hình gợi ý nhằm mục tiêu tập luyện, không thay thế cho chỉ định của bác sĩ chuyên khoa hoặc chế độ điều trị y tế.'

      // Step 1: Create real draft meal plan via POST /meal-plans
      const plan = await mealPlansService.createMealPlan({
        memberId,
        title: title.trim(),
        dailyCalorieTarget: Number(targetCalories) || 2000,
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || undefined,
        description: notes.trim() || undefined,
        medicalDisclaimer: disclaimer,
      })

      // Step 2: Add all meal items to the plan via POST /meal-plans/:id/items
      for (const m of meals) {
        await mealPlansService.addMealItem(plan.id, {
          dayNumber: m.dayNumber,
          mealType: m.mealType,
          foodName: m.foodName,
          quantity: m.quantity,
          estimatedCalories: m.estimatedCalories,
          proteinGrams: m.proteinGrams,
          carbsGrams: m.carbsGrams,
          fatGrams: m.fatGrams,
          note: m.note,
          sortOrder: m.sortOrder,
        })
      }

      // Step 3: If assign immediately, call POST /meal-plans/:id/assign
      if (assignImmediately) {
        await mealPlansService.assignMealPlan(plan.id)
        setSuccessMessage('Đã tạo và chính thức giao thực đơn dinh dưỡng cho học viên thành công!')
      } else {
        setSuccessMessage('Đã lưu bản nháp thực đơn dinh dưỡng thành công!')
      }

      // Reload real plans list
      await loadData()
      setActiveTab('list')

      // Reset builder form
      setTitle('')
      setMemberId('')
      setTargetCalories('2000')
      setNotes('')
      setMeals(DEFAULT_INITIAL_MEALS)
      setSelectedDay(1)
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Lỗi khi lưu thực đơn dinh dưỡng lên máy chủ.')
      } else {
        setErrorMessage('Không thể kết nối máy chủ để lưu thực đơn. Vui lòng thử lại.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle assign an existing draft plan directly from list
  const handleAssignExistingPlan = async (planId: string) => {
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      await mealPlansService.assignMealPlan(planId)
      setSuccessMessage('Đã giao thực đơn thành công! Học viên đã nhận được thông báo.')
      await loadData()
      if (viewingPlan?.id === planId) {
        setViewingPlan((prev) => (prev ? { ...prev, status: 'ACTIVE' } : null))
      }
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không thể giao thực đơn.')
      } else {
        setErrorMessage('Lỗi kết nối máy chủ khi giao thực đơn.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Open plan detail modal
  const handleViewPlanDetail = async (plan: MealPlan) => {
    setViewingPlan(plan)
    setIsLoadingDetail(true)
    setViewingPlanItems([])
    setViewingSelectedDay(1)

    try {
      const fullPlan = await mealPlansService.getMealPlanById(plan.id)
      const items = (fullPlan.mealPlanItemsMealPlanId || fullPlan.items || []) as MealPlanItem[]
      setViewingPlanItems(items)
      if (items.length > 0) {
        const days = Array.from(new Set(items.map((i) => i.dayNumber))).sort((a, b) => a - b)
        setViewingSelectedDay(days[0] || 1)
      }
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Lỗi khi tải chi tiết các bữa ăn.')
      }
    } finally {
      setIsLoadingDetail(false)
    }
  }

  // Filtered plans for list view
  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      const matchSearch =
        searchQuery === '' ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.member?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.member?.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter
      const matchMember = memberFilter === '' || p.memberId === memberFilter

      return matchSearch && matchStatus && matchMember
    })
  }, [plans, searchQuery, statusFilter, memberFilter])

  // Distinct day numbers in viewing modal
  const viewingDays = useMemo(() => {
    const days = Array.from(new Set(viewingPlanItems.map((i) => i.dayNumber))).sort((a, b) => a - b)
    return days.length > 0 ? days : [1]
  }, [viewingPlanItems])

  const viewingCurrentDayMeals = useMemo(() => {
    return viewingPlanItems.filter((i) => i.dayNumber === viewingSelectedDay)
  }, [viewingPlanItems, viewingSelectedDay])

  const viewingDayMacro = useMemo(() => {
    const cal = viewingCurrentDayMeals.reduce((acc, m) => acc + (Number(m.estimatedCalories) || 0), 0)
    const p = viewingCurrentDayMeals.reduce((acc, m) => acc + (Number(m.proteinGrams) || 0), 0)
    const c = viewingCurrentDayMeals.reduce((acc, m) => acc + (Number(m.carbsGrams) || 0), 0)
    const f = viewingCurrentDayMeals.reduce((acc, m) => acc + (Number(m.fatGrams) || 0), 0)
    return { cal, p, c, f }
  }, [viewingCurrentDayMeals])

  // Helper: map memberId to full name
  const getMemberDisplayName = (mId: string) => {
    const found = members.find((m) => m.id === mId)
    if (found) {
      return `${found.fullName || (found as any).user?.fullName || 'Hội viên'} (${found.memberCode || 'HV'})`
    }
    return 'Hội viên'
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">
              Kế Hoạch Dinh Dưỡng Thể Hình (WEB-COA-10)
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
              REAL BACKEND API
            </span>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Soạn thực đơn theo ngày, kiểm soát Calo và cân bằng chỉ số Macro (Đạm, Tinh bột, Chất béo) cho học viên PT.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={loadData}
            disabled={isLoading || isSubmitting}
            className="gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>

          {activeTab === 'list' ? (
            <Button
              size="sm"
              variant="primary"
              onClick={() => setActiveTab('builder')}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Soạn thực đơn mới</span>
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveTab('list')}
              className="gap-1.5"
            >
              <ListFilter className="h-4 w-4" />
              <span>Danh sách thực đơn</span>
            </Button>
          )}
        </div>
      </div>

      {/* Global Alerts */}
      {errorMessage && (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-xs text-danger flex items-center justify-between gap-2 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-danger" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-danger hover:underline font-semibold cursor-pointer">
            Đóng
          </button>
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 shadow-sm animate-in fade-in">
          <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Mandatory Medical Disclaimer Notice */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-3 shadow-sm">
        <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div>
          <p className="font-bold">Lưu ý Pháp lý / Y tế (Medical Disclaimer):</p>
          <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5 leading-relaxed">
            Thực đơn và các chỉ số calo/macro do Huấn luyện viên thể hình gợi ý nhằm mục tiêu tập luyện nâng cao thể lực,
            không thay thế cho chỉ định của bác sĩ chuyên khoa hoặc chế độ điều trị y tế đối với bệnh lý đặc thù.
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border-subtle bg-bg-surface p-4 space-y-1 shadow-sm">
          <p className="text-xs text-text-muted flex items-center gap-1.5">
            <Utensils className="h-3.5 w-3.5 text-primary" />
            <span>Tổng thực đơn</span>
          </p>
          <p className="text-2xl font-extrabold text-text-primary">{plans.length}</p>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-bg-surface p-4 space-y-1 shadow-sm">
          <p className="text-xs text-text-muted flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>Đang hoạt động (Active)</span>
          </p>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {plans.filter((p) => p.status === 'ACTIVE').length}
          </p>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-bg-surface p-4 space-y-1 shadow-sm">
          <p className="text-xs text-text-muted flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            <span>Bản nháp (Draft)</span>
          </p>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
            {plans.filter((p) => p.status === 'DRAFT').length}
          </p>
        </div>
        <div className="rounded-2xl border border-border-subtle bg-bg-surface p-4 space-y-1 shadow-sm">
          <p className="text-xs text-text-muted flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-cyan-500" />
            <span>Học viên phụ trách</span>
          </p>
          <p className="text-2xl font-extrabold text-cyan-600 dark:text-cyan-400">{members.length}</p>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex border-b border-border-subtle gap-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl transition-colors border-b-2 cursor-pointer ${
            activeTab === 'list'
              ? 'border-primary text-primary bg-bg-surface'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <ListFilter className="h-4 w-4" />
          <span>Danh Sách Thực Đơn ({plans.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('builder')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl transition-colors border-b-2 cursor-pointer ${
            activeTab === 'builder'
              ? 'border-primary text-primary bg-bg-surface'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <Plus className="h-4 w-4" />
          <span>Trình Soạn Thực Đơn Mới</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LIST OF MEAL PLANS                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-4 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="h-4 w-4 absolute left-3 top-3 text-text-muted" />
              <input
                type="text"
                placeholder="Tìm theo tên thực đơn hoặc tên học viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border-subtle bg-bg-surface-muted text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                aria-label="Lọc theo trạng thái"
                className="text-xs px-3 py-2 rounded-xl border border-border-subtle bg-bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang hoạt động (Active)</option>
                <option value="DRAFT">Bản nháp (Draft)</option>
                <option value="ARCHIVED">Đã lưu trữ (Archived)</option>
              </select>

              <select
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
                aria-label="Lọc theo học viên"
                className="text-xs px-3 py-2 rounded-xl border border-border-subtle bg-bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-primary max-w-[200px]"
              >
                <option value="">Tất cả học viên</option>
                {members.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName || m.user?.fullName || 'Hội viên'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Plan Cards Grid */}
          {isLoading ? (
            <div className="p-16 text-center text-text-muted text-xs flex flex-col items-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              <span>Đang tải danh sách thực đơn từ máy chủ...</span>
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border-subtle bg-bg-surface p-12 text-center space-y-3">
              <Utensils className="h-10 w-10 text-text-muted mx-auto opacity-50" />
              <p className="text-sm font-semibold text-text-primary">Chưa có thực đơn nào</p>
              <p className="text-xs text-text-muted max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'ALL' || memberFilter
                  ? 'Không tìm thấy thực đơn phù hợp với điều kiện lọc hiện tại.'
                  : 'Bạn chưa tạo thực đơn dinh dưỡng nào cho học viên. Hãy bắt đầu ngay!'}
              </p>
              <Button size="sm" variant="primary" onClick={() => setActiveTab('builder')} className="gap-1.5 mt-2">
                <Plus className="h-4 w-4" />
                <span>Soạn thực đơn đầu tiên</span>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="rounded-2xl border border-border-subtle bg-bg-surface p-5 space-y-4 shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-text-primary text-sm line-clamp-1">{plan.title}</h3>
                      <StatusBadge status={plan.status} />
                    </div>

                    <p className="text-xs text-text-muted flex items-center gap-1.5">
                      <span>Áp dụng cho:</span>
                      <strong className="text-text-primary font-medium">
                        {plan.member?.fullName || plan.member?.user?.fullName || getMemberDisplayName(plan.memberId)}
                      </strong>
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-subtle text-[11px]">
                      <div className="p-2 rounded-xl bg-bg-surface-muted space-y-0.5">
                        <span className="text-text-muted block text-[10px]">Mục tiêu Calo</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                          {plan.dailyCalorieTarget ? `${plan.dailyCalorieTarget} kcal/ngày` : 'Chưa đặt'}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-bg-surface-muted space-y-0.5">
                        <span className="text-text-muted block text-[10px]">Bắt đầu từ</span>
                        <span className="font-semibold text-text-primary">{formatDate(plan.startDate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-border-subtle">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewPlanDetail(plan)}
                      className="gap-1 text-xs flex-1"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Chi tiết</span>
                    </Button>

                    {plan.status === 'DRAFT' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleAssignExistingPlan(plan.id)}
                        disabled={isSubmitting}
                        className="gap-1 text-xs flex-1"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Giao học viên</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MEAL PLAN BUILDER                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'builder' && (
        <div className="space-y-6">
          {/* General Information Card */}
          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Utensils className="h-4 w-4 text-primary" />
              <span>1. Thông Tin Kế Hoạch Dinh Dưỡng</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Tên kế hoạch bữa ăn"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Thực Đơn Tăng Cơ Nạc & Giảm Mỡ (High Protein 2200 kcal)..."
                />
              </div>

              <Input
                label="Mục tiêu Calorie hàng ngày (kcal/ngày)"
                type="number"
                required
                value={targetCalories}
                onChange={(e) => setTargetCalories(e.target.value)}
                placeholder="2000"
              />

              <div className="md:col-span-2">
                <Select
                  label="Học viên nhận thực đơn (Bắt buộc)"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  options={[
                    { value: '', label: '-- Chọn học viên của bạn --' },
                    ...members.map((m: any) => ({
                      value: m.id,
                      label: `${m.fullName || m.user?.fullName || 'Hội viên'} (${m.memberCode || 'HV'})`,
                    })),
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Ngày bắt đầu"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  label="Ngày kết thúc (tùy chọn)"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2">
              <Input
                label="Ghi chú tổng quát của HLV cho học viên"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ví dụ: Uống tối thiểu 2.5 - 3 lít nước mỗi ngày, ăn trước giờ tập 90 phút..."
              />
            </div>
          </div>

          {/* Day Navigation & Action Bar */}
          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
              <div>
                <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-500" />
                  <span>2. Chi Tiết Thực Đơn Theo Ngày</span>
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Chọn ngày để chỉnh sửa các món ăn hoặc nhân bản nhanh thực đơn sang các ngày khác trong tuần.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsDuplicateModalOpen(true)}
                  className="gap-1.5 text-xs"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Nhân bản Ngày {selectedDay}</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddNewDay}
                  className="gap-1.5 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Thêm ngày mới</span>
                </Button>
              </div>
            </div>

            {/* Day Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {builderDays.map((d) => {
                const count = meals.filter((m) => m.dayNumber === d).length
                const isSelected = selectedDay === d
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDay(d)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-bg-surface-muted text-text-muted border-border-subtle hover:text-text-primary'
                    }`}
                  >
                    <span>Ngày {d}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-border-subtle text-text-muted'
                      }`}
                    >
                      {count} món
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Live Macro Distribution Bar */}
            <div className="rounded-xl border border-border-subtle bg-bg-surface-muted p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-bold text-text-primary">Tổng Năng Lượng Ngày {selectedDay}:</span>
                  <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                    {dayMacroSummary.totalCal} kcal
                  </span>
                  <span className="text-xs text-text-muted">/ mục tiêu {dayMacroSummary.target} kcal</span>
                </div>

                <span className="text-xs font-mono text-text-muted">{dayMacroSummary.percentCal}% mục tiêu ngày</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-border-subtle h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    dayMacroSummary.percentCal > 105
                      ? 'bg-danger'
                      : dayMacroSummary.percentCal >= 90
                      ? 'bg-emerald-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${dayMacroSummary.percentCal}%` }}
                />
              </div>

              {/* Macro Pills */}
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="p-2.5 rounded-lg bg-bg-surface border border-border-subtle flex flex-col">
                  <span className="text-[10px] text-text-muted">Chất đạm (Protein)</span>
                  <span className="text-xs font-extrabold text-primary">{dayMacroSummary.totalP}g</span>
                  <span className="text-[10px] text-text-muted">~{dayMacroSummary.totalP * 4} kcal</span>
                </div>

                <div className="p-2.5 rounded-lg bg-bg-surface border border-border-subtle flex flex-col">
                  <span className="text-[10px] text-text-muted">Tinh bột (Carbs)</span>
                  <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                    {dayMacroSummary.totalC}g
                  </span>
                  <span className="text-[10px] text-text-muted">~{dayMacroSummary.totalC * 4} kcal</span>
                </div>

                <div className="p-2.5 rounded-lg bg-bg-surface border border-border-subtle flex flex-col">
                  <span className="text-[10px] text-text-muted">Chất béo (Fat)</span>
                  <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400">
                    {dayMacroSummary.totalF}g
                  </span>
                  <span className="text-[10px] text-text-muted">~{dayMacroSummary.totalF * 9} kcal</span>
                </div>
              </div>
            </div>

            {/* Meals in Selected Day */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Danh Sách Món Ăn Trong Ngày {selectedDay} ({currentDayMeals.length})
                </h3>
                <Button size="sm" variant="primary" onClick={handleOpenAddMeal} className="gap-1 text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Thêm món vào Ngày {selectedDay}</span>
                </Button>
              </div>

              {currentDayMeals.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border-subtle p-8 text-center text-xs text-text-muted space-y-2">
                  <p>Ngày {selectedDay} hiện chưa có món ăn nào.</p>
                  <Button size="sm" variant="outline" onClick={handleOpenAddMeal} className="gap-1 text-xs">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Thêm bữa ăn đầu tiên</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {currentDayMeals.map((meal) => {
                    const indexInAll = meals.indexOf(meal)
                    return (
                      <div
                        key={indexInAll}
                        className="rounded-xl border border-border-subtle bg-bg-surface-muted p-4 space-y-2.5 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary font-bold text-[11px]">
                              {meal.mealType}
                            </span>
                            <span className="font-bold text-text-primary text-xs">{meal.foodName}</span>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">
                              {meal.estimatedCalories} kcal
                            </span>
                            <button
                              onClick={() => handleOpenEditMeal(indexInAll)}
                              className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-surface cursor-pointer"
                              title="Chỉnh sửa món"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteMeal(indexInAll)}
                              className="p-1 rounded-md text-danger/80 hover:text-danger hover:bg-danger/10 cursor-pointer"
                              title="Xóa món"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {meal.quantity && (
                          <p className="text-[11px] text-text-muted">
                            Định lượng: <span className="text-text-primary">{meal.quantity}</span>
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-[10px] text-text-muted border-t border-border-subtle pt-2">
                          <span>
                            Protein: <strong className="text-primary">{meal.proteinGrams}g</strong>
                          </span>
                          <span>
                            Carbs: <strong className="text-amber-600 dark:text-amber-400">{meal.carbsGrams}g</strong>
                          </span>
                          <span>
                            Fat: <strong className="text-rose-600 dark:text-rose-400">{meal.fatGrams}g</strong>
                          </span>
                          {meal.note && <span className="italic text-text-muted/80">Lưu ý: {meal.note}</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border-subtle">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab('list')}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Hủy & Quay lại
              </Button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSubmitMealPlan(false)}
                  disabled={isSubmitting || !memberId}
                  className="w-full sm:w-auto gap-1.5"
                >
                  {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                  <span>Lưu Bản Nháp</span>
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  onClick={() => handleSubmitMealPlan(true)}
                  disabled={isSubmitting || !memberId}
                  className="w-full sm:w-auto gap-1.5"
                >
                  {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  <span>Lưu & Giao Cho Học Viên</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT MEAL ITEM                                             */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isMealModalOpen}
        onClose={() => setIsMealModalOpen(false)}
        title={editingMealIndex !== null ? 'Chỉnh Sửa Món Ăn' : `Thêm Món Ăn - Ngày ${selectedDay}`}
        description="Nhập thông tin món ăn, khối lượng khẩu phần và các chỉ số dinh dưỡng macro."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveMealItem} className="space-y-4">
          <Select
            label="Loại bữa ăn"
            value={mealFormType}
            onChange={(e) => setMealFormType(e.target.value)}
            options={MEAL_TYPE_OPTIONS}
          />

          <Input
            label="Tên món ăn & nguyên liệu"
            required
            value={mealFormFood}
            onChange={(e) => setMealFormFood(e.target.value)}
            placeholder="Ví dụ: 200g Ức gà áp chảo + Cơm gạo lứt + Bông cải xanh"
          />

          <Input
            label="Khẩu phần / Định lượng"
            value={mealFormQuantity}
            onChange={(e) => setMealFormQuantity(e.target.value)}
            placeholder="Ví dụ: 1 phần (400g), 1 muỗng 30g..."
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Input
              label="Calo (kcal)"
              type="number"
              required
              value={mealFormCalories}
              onChange={(e) => setMealFormCalories(e.target.value)}
            />
            <Input
              label="Đạm (Protein g)"
              type="number"
              value={mealFormProtein}
              onChange={(e) => setMealFormProtein(e.target.value)}
            />
            <Input
              label="Tinh bột (Carb g)"
              type="number"
              value={mealFormCarbs}
              onChange={(e) => setMealFormCarbs(e.target.value)}
            />
            <Input
              label="Béo (Fat g)"
              type="number"
              value={mealFormFat}
              onChange={(e) => setMealFormFat(e.target.value)}
            />
          </div>

          <Input
            label="Ghi chú chế biến / Cách dùng"
            value={mealFormNote}
            onChange={(e) => setMealFormNote(e.target.value)}
            placeholder="Ví dụ: Hạn chế nêm muối, uống cùng 300ml nước ấm..."
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-border-subtle">
            <Button type="button" variant="outline" onClick={() => setIsMealModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" disabled={!mealFormFood.trim()}>
              {editingMealIndex !== null ? 'Lưu Thay Đổi' : 'Thêm Vào Bữa Ăn'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: DUPLICATE DAY MEALS                                              */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        title={`Nhân Bản Thực Đơn Ngày ${selectedDay}`}
        description="Sao chép toàn bộ món ăn và macro của ngày này sang một ngày khác."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-text-muted">
            Chọn số thứ tự ngày bạn muốn sao chép đến. Nếu ngày đích đã có món ăn, nội dung sẽ được ghi đè bằng các món
            từ Ngày {selectedDay}.
          </p>

          <Input
            label="Ngày đích (Số thứ tự ngày)"
            type="number"
            min={1}
            max={365}
            value={targetDuplicateDay}
            onChange={(e) => setTargetDuplicateDay(Math.max(1, Number(e.target.value) || 1))}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
            <Button variant="outline" onClick={() => setIsDuplicateModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleDuplicateDay} disabled={targetDuplicateDay === selectedDay}>
              Tiến Hành Sao Chép
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: VIEW PLAN DETAIL                                                 */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!viewingPlan}
        onClose={() => setViewingPlan(null)}
        title={viewingPlan?.title || 'Chi Tiết Thực Đơn Dinh Dưỡng'}
        description={`Học viên: ${viewingPlan?.member?.fullName || viewingPlan?.member?.user?.fullName || (viewingPlan ? getMemberDisplayName(viewingPlan.memberId) : '')}`}
        maxWidth="xl"
      >
        {viewingPlan && (
          <div className="space-y-5">
            {/* Header info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-bg-surface-muted border border-border-subtle text-xs">
              <div>
                <span className="text-text-muted block text-[10px]">Trạng thái:</span>
                <StatusBadge status={viewingPlan.status} />
              </div>
              <div>
                <span className="text-text-muted block text-[10px]">Mục tiêu calo:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {viewingPlan.dailyCalorieTarget ? `${viewingPlan.dailyCalorieTarget} kcal/ngày` : 'Chưa đặt'}
                </span>
              </div>
              <div>
                <span className="text-text-muted block text-[10px]">Áp dụng từ:</span>
                <span className="font-medium text-text-primary">{formatDate(viewingPlan.startDate)}</span>
              </div>
            </div>

            {/* Medical Disclaimer Reminder */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-200 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <span>{viewingPlan.medicalDisclaimer}</span>
            </div>

            {isLoadingDetail ? (
              <div className="p-8 text-center text-text-muted text-xs flex flex-col items-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                <span>Đang tải các bữa ăn từ máy chủ...</span>
              </div>
            ) : viewingPlanItems.length === 0 ? (
              <div className="p-6 text-center text-text-muted text-xs border border-dashed border-border-subtle rounded-xl">
                Thực đơn này hiện chưa có món ăn nào được lưu.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Day selector tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {viewingDays.map((d) => (
                    <button
                      key={d}
                      onClick={() => setViewingSelectedDay(d)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border ${
                        viewingSelectedDay === d
                          ? 'bg-primary text-white border-primary'
                          : 'bg-bg-surface-muted text-text-muted border-border-subtle'
                      }`}
                    >
                      Ngày {d}
                    </button>
                  ))}
                </div>

                {/* Day macro overview */}
                <div className="grid grid-cols-4 gap-2 p-3 rounded-xl bg-bg-surface-muted border border-border-subtle text-center text-xs">
                  <div>
                    <span className="text-[10px] text-text-muted block">Tổng Calo</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {viewingDayMacro.cal} kcal
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted block">Protein</span>
                    <span className="font-bold text-primary">{viewingDayMacro.p}g</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted block">Carbs</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">{viewingDayMacro.c}g</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted block">Fat</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">{viewingDayMacro.f}g</span>
                  </div>
                </div>

                {/* Meals list */}
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {viewingCurrentDayMeals.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl border border-border-subtle bg-bg-surface space-y-1.5"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                          {item.mealType}
                        </span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {item.estimatedCalories || 0} kcal
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-text-primary">{item.foodName}</p>
                      {item.quantity && (
                        <p className="text-[11px] text-text-muted">Định lượng: {item.quantity}</p>
                      )}
                      <div className="flex gap-4 text-[10px] text-text-muted border-t border-border-subtle pt-1">
                        <span>P: <strong className="text-primary">{item.proteinGrams || 0}g</strong></span>
                        <span>C: <strong className="text-amber-600 dark:text-amber-400">{item.carbsGrams || 0}g</strong></span>
                        <span>F: <strong className="text-rose-600 dark:text-rose-400">{item.fatGrams || 0}g</strong></span>
                        {item.note && <span className="italic">Ghi chú: {item.note}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal actions */}
            <div className="flex justify-between items-center pt-3 border-t border-border-subtle">
              <Button variant="outline" onClick={() => setViewingPlan(null)}>
                Đóng
              </Button>

              {viewingPlan.status === 'DRAFT' && (
                <Button
                  variant="primary"
                  onClick={() => handleAssignExistingPlan(viewingPlan.id)}
                  disabled={isSubmitting}
                  className="gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Giao Ngay Cho Học Viên</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
