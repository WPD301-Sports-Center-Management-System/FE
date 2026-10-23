import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Utensils,
  Plus,
  Calendar,
  AlertCircle,
  RefreshCw,
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
  Sparkles,
  Lock,
  UserCheck,
  Scale,
  BookOpen,
  ArrowRight,
  Info,
  Check,
} from 'lucide-react'
import { coachesService } from '@/features/coaches/services/coaches.service'
import { membersService } from '@/features/memberships/services/members.service'
import { mealPlansService } from '../services/meal-plans.service'
import {
  MEAL_PRESETS,
  calculateBiometricNutrition,
  type MealPreset,
  type BiometricNutritionAnalysis,
} from '../utils/meal-presets'
import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { Input, Select } from '@/shared/components/ui/input'
import { Modal } from '@/shared/components/ui/modal'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { isAppApiError } from '@/shared/api/api-error'
import { formatDate } from '@/shared/utils/date'
import type { MemberSummary, MealPlan, MealPlanItem, BodyAssessment, FitnessGoal } from '@/shared/types/api'

interface MealFormItem {
  id?: string
  dayNumber: number
  mealType: string
  foodName: string
  quantity?: string
  estimatedCalories: number
  proteinGrams: number
  carbsGrams: number
  fatGrams: number
  note?: string
  sortOrder: number
}

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
  const [meals, setMeals] = useState<MealFormItem[]>([])
  const [selectedDay, setSelectedDay] = useState<number>(1)

  // Member physical stats & biometric analysis
  const [biometricAnalysis, setBiometricAnalysis] = useState<BiometricNutritionAnalysis | null>(null)
  const [isLoadingMemberStats, setIsLoadingMemberStats] = useState(false)

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

  // Modal state: Preset Template Picker
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<MealPreset | null>(null)

  // Modal state: Copy from Existing Plans
  const [isCopyPlanModalOpen, setIsCopyPlanModalOpen] = useState(false)
  const [selectedPlanToCopyId, setSelectedPlanToCopyId] = useState<string>('')
  const [isCopyingPlan, setIsCopyingPlan] = useState(false)

  // Modal state: View Plan Detail
  const [viewingPlan, setViewingPlan] = useState<MealPlan | null>(null)
  const [viewingPlanItems, setViewingPlanItems] = useState<MealPlanItem[]>([])
  const [viewingSelectedDay, setViewingSelectedDay] = useState<number>(1)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  // Load members and meal plans from Real Backend
  const loadData = useCallback(async () => {
    setIsLoading(true)
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
          toast.error(err.message || 'Lỗi khi tải danh sách thực đơn từ máy chủ.')
        }
      }
    } catch {
      toast.error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối.')
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
    const percentCal = target > 0 ? Math.min(Math.round((totalCal / target) * 100), 100) : 0

    return { totalCal, totalP, totalC, totalF, target, percentCal }
  }, [currentDayMeals, targetCalories])

  // Reset builder state
  const handleResetBuilder = useCallback(() => {
    setMemberId('')
    setTitle('')
    setTargetCalories('2000')
    setStartDate(new Date().toISOString().split('T')[0])
    setEndDate('')
    setNotes('')
    setMeals([])
    setSelectedDay(1)
    setBiometricAnalysis(null)
  }, [])

  // Handle member selection and auto-derive physical stats
  const handleMemberSelect = async (newMemberId: string) => {
    setMemberId(newMemberId)
    if (!newMemberId) {
      setBiometricAnalysis(null)
      setMeals([])
      setTitle('')
      return
    }

    setIsLoadingMemberStats(true)
    const memberObj = members.find((m) => m.id === newMemberId)
    const memberName = memberObj?.fullName || (memberObj as any)?.user?.fullName || 'Học viên'

    try {
      const [assessmentsRes, goalsRes] = await Promise.allSettled([
        membersService.getMemberBodyAssessments(newMemberId),
        membersService.getMemberFitnessGoals(newMemberId),
      ])

      let latestAssessment: BodyAssessment | null = null
      if (assessmentsRes.status === 'fulfilled') {
        const raw = assessmentsRes.value
        const list = (raw?.data || (Array.isArray(raw) ? raw : [])) as BodyAssessment[]
        if (list.length > 0) {
          latestAssessment = list[0]
        }
      }

      let activeGoals: FitnessGoal[] = []
      if (goalsRes.status === 'fulfilled') {
        const raw = goalsRes.value
        const list = (raw?.data || (Array.isArray(raw) ? raw : [])) as FitnessGoal[]
        activeGoals = list.filter((g) => g.status === 'ACTIVE')
        if (activeGoals.length === 0 && list.length > 0) {
          activeGoals = [list[0]]
        }
      }

      const analysis = calculateBiometricNutrition(latestAssessment, activeGoals)
      setBiometricAnalysis(analysis)

      if (analysis) {
        setTargetCalories(String(analysis.suggestedCalories))
        if (!title || title.startsWith('Thực Đơn Dinh Dưỡng - ') || title.startsWith('Kế hoạch thực đơn')) {
          setTitle(`Thực Đơn Dinh Dưỡng - ${memberName} (${analysis.suggestedCalories} kcal)`)
        }
        toast.success(
          `Đã đọc thông số của ${memberName}: ${analysis.weightKg}kg, TDEE ~${analysis.tdee} kcal -> Đã tự động điền gợi ý: ${analysis.suggestedCalories} kcal/ngày!`
        )
      } else {
        setTargetCalories('2000')
        if (!title || title.startsWith('Thực Đơn Dinh Dưỡng - ') || title.startsWith('Kế hoạch thực đơn')) {
          setTitle(`Thực Đơn Dinh Dưỡng - ${memberName} (2000 kcal)`)
        }
        toast.info(`Đã chọn học viên ${memberName}. Hãy thiết lập các bữa ăn hoặc chọn từ thực đơn mẫu!`)
      }
    } catch {
      toast.error('Lỗi khi tải thông số thể trạng của học viên.')
    } finally {
      setIsLoadingMemberStats(false)
    }
  }

  // Apply suggested calories and note from analysis
  const handleApplyBiometricSuggestion = () => {
    if (!biometricAnalysis) return
    setTargetCalories(String(biometricAnalysis.suggestedCalories))
    setNotes((prev) =>
      prev.trim()
        ? prev
        : `Mục tiêu dinh dưỡng: ${biometricAnalysis.primaryGoal}. ${biometricAnalysis.rationale}. Khuyến nghị Đạm: ~${biometricAnalysis.suggestedProtein}g, Tinh bột: ~${biometricAnalysis.suggestedCarbs}g, Chất béo: ~${biometricAnalysis.suggestedFat}g.`
    )
    toast.success(`Đã áp dụng mức Calo khuyến nghị ${biometricAnalysis.suggestedCalories} kcal/ngày!`)
  }

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
    if (!mealFormFood.trim()) {
      toast.warning('Vui lòng nhập tên món ăn.')
      return
    }

    const newItem: MealFormItem = {
      dayNumber: selectedDay,
      mealType: mealFormType,
      foodName: mealFormFood.trim(),
      quantity: mealFormQuantity.trim() || undefined,
      estimatedCalories: Number(mealFormCalories) || 0,
      proteinGrams: Number(mealFormProtein) || 0,
      carbsGrams: Number(mealFormCarbs) || 0,
      fatGrams: Number(mealFormFat) || 0,
      note: mealFormNote.trim() || undefined,
      sortOrder: currentDayMeals.length + 1,
    }

    if (editingMealIndex !== null) {
      setMeals((prev) => {
        const next = [...prev]
        next[editingMealIndex] = { ...newItem, dayNumber: prev[editingMealIndex].dayNumber }
        return next
      })
      toast.success('Đã cập nhật món ăn thành công!')
    } else {
      setMeals((prev) => [...prev, newItem])
      toast.success(`Đã thêm món ăn vào Ngày ${selectedDay}!`)
    }

    setIsMealModalOpen(false)
  }

  // Remove meal
  const handleDeleteMeal = (indexInAllMeals: number) => {
    const item = meals[indexInAllMeals]
    setMeals((prev) => prev.filter((_, idx) => idx !== indexInAllMeals))
    toast.success(`Đã xóa món ăn khỏi Ngày ${item?.dayNumber || selectedDay}.`)
  }

  // Add a new empty day
  const handleAddNewDay = () => {
    const maxDay = builderDays.length > 0 ? Math.max(...builderDays) : 0
    const nextDay = maxDay + 1
    setSelectedDay(nextDay)
    toast.info(`Đã chuyển sang soạn thực đơn cho Ngày ${nextDay}.`)
  }

  // Duplicate current day to target day
  const handleDuplicateDay = () => {
    if (targetDuplicateDay === selectedDay) {
      toast.warning('Ngày sao chép phải khác ngày hiện tại.')
      return
    }

    const sourceItems = meals.filter((m) => m.dayNumber === selectedDay)
    if (sourceItems.length === 0) {
      toast.warning(`Ngày ${selectedDay} chưa có món ăn nào để nhân bản.`)
      return
    }

    const clonedItems = sourceItems.map((item) => ({
      ...item,
      dayNumber: targetDuplicateDay,
      quantity: item.quantity?.trim() || undefined,
      note: item.note?.trim() || undefined,
    }))

    setMeals((prev) => {
      const filtered = prev.filter((m) => m.dayNumber !== targetDuplicateDay)
      return [...filtered, ...clonedItems]
    })

    setSelectedDay(targetDuplicateDay)
    setIsDuplicateModalOpen(false)
    toast.success(`Đã nhân bản ${clonedItems.length} món từ Ngày ${selectedDay} sang Ngày ${targetDuplicateDay}!`)
  }

  // Load a preset template into the current day
  const handleApplyPreset = (preset: MealPreset, applyToAllDays = false) => {
    const newItems: MealFormItem[] = preset.meals.map((m) => ({
      ...m,
      dayNumber: selectedDay,
    }))

    if (applyToAllDays) {
      // Apply preset to days 1 to 7
      const weekItems: MealFormItem[] = []
      for (let d = 1; d <= 7; d++) {
        preset.meals.forEach((m) => {
          weekItems.push({
            ...m,
            dayNumber: d,
          })
        })
      }
      setMeals(weekItems)
      toast.success(`Đã nạp thực đơn "${preset.name}" cho toàn bộ 7 ngày trong tuần!`)
    } else {
      setMeals((prev) => {
        const withoutCurrentDay = prev.filter((m) => m.dayNumber !== selectedDay)
        return [...withoutCurrentDay, ...newItems]
      })
      toast.success(`Đã nạp thực đơn mẫu "${preset.name}" vào Ngày ${selectedDay}!`)
    }

    // Optionally adapt calories if not customized
    if (!targetCalories || targetCalories === '2000') {
      setTargetCalories(String(preset.targetCalories))
    }
    if (!notes) {
      setNotes(preset.defaultNotes)
    }

    setIsPresetModalOpen(false)
  }

  // AI Meal Recommendation Generator based on student biometrics
  const handleGenerateAiMealPlan = () => {
    const memberObj = members.find((m) => m.id === memberId)
    const memberName = memberObj?.fullName || (memberObj as any)?.user?.fullName || 'Học viên'
    const targetKcal = Number(targetCalories) || biometricAnalysis?.suggestedCalories || 2000
    const goalText = biometricAnalysis?.primaryGoal || 'Tăng cường thể lực & Vóc dáng cân đối'

    // Smart generator tailored to calories & goals
    let aiItems: MealFormItem[] = []
    if (targetKcal >= 2100) {
      // High Calorie / Bulk
      aiItems = [
        {
          dayNumber: selectedDay,
          mealType: 'Bữa sáng (07:00 - 08:30)',
          foodName: 'Yến mạch nấu sữa tươi + 3 quả trứng gà luộc + 1 quả chuối sứ',
          quantity: '1 tô (350g)',
          estimatedCalories: 520,
          proteinGrams: 34,
          carbsGrams: 68,
          fatGrams: 12,
          note: 'Bổ sung carbs phức hợp giúp tràn đầy năng lượng buổi sáng.',
          sortOrder: 1,
        },
        {
          dayNumber: selectedDay,
          mealType: 'Bữa trưa (11:30 - 13:00)',
          foodName: '220g Ức gà áp chảo sốt tiêu + 1.5 chén cơm gạo lứt + 150g Bông cải xanh xào dầu oliu',
          quantity: '1 đĩa lớn (500g)',
          estimatedCalories: 680,
          proteinGrams: 56,
          carbsGrams: 75,
          fatGrams: 14,
          note: 'Đạm chất lượng cao kích thích phục hồi cơ bắp.',
          sortOrder: 2,
        },
        {
          dayNumber: selectedDay,
          mealType: 'Bữa phụ chiều / Trước tập (16:00 - 17:00)',
          foodName: '1 Muỗng Whey Protein Isolate + 2 lát Bánh mì nguyên cám phết bơ đậu phộng',
          quantity: '1 phần',
          estimatedCalories: 360,
          proteinGrams: 30,
          carbsGrams: 38,
          fatGrams: 9,
          note: 'Dùng trước giờ tập 60 - 75 phút để nạp năng lượng.',
          sortOrder: 3,
        },
        {
          dayNumber: selectedDay,
          mealType: 'Bữa tối (19:00 - 20:30)',
          foodName: '200g Cá hồi áp chảo + 1 củ khoai lang nướng + Salad rau trộn dầu giấm',
          quantity: '1 đĩa (420g)',
          estimatedCalories: 580,
          proteinGrams: 44,
          carbsGrams: 42,
          fatGrams: 18,
          note: 'Chất béo Omega-3 giúp ngủ sâu và chống viêm cơ bắp.',
          sortOrder: 4,
        },
      ]
    } else if (targetKcal <= 1800) {
      // Deficit / Fat Loss
      aiItems = [
        {
          dayNumber: selectedDay,
          mealType: 'Bữa sáng (07:00 - 08:30)',
          foodName: '2 quả trứng luộc + 1 lát bánh mì lúa mạch đen + 1 quả dưa leo & cà chua bi',
          quantity: '1 phần',
          estimatedCalories: 340,
          proteinGrams: 22,
          carbsGrams: 28,
          fatGrams: 11,
          note: 'Uống 1 cốc nước ấm thanh lọc cơ thể ngay khi thức dậy.',
          sortOrder: 1,
        },
        {
          dayNumber: selectedDay,
          mealType: 'Bữa trưa (11:30 - 13:00)',
          foodName: '180g Thịt thăn bò nạc áp chảo + 1/2 chén cơm lứt + 200g Bắp cải luộc chấm trứng dầm',
          quantity: '1 đĩa (400g)',
          estimatedCalories: 510,
          proteinGrams: 45,
          carbsGrams: 42,
          fatGrams: 12,
          note: 'Ăn rau xanh trước tinh bột để ổn định đường huyết.',
          sortOrder: 2,
        },
        {
          dayNumber: selectedDay,
          mealType: 'Bữa phụ chiều / Trước tập (16:00 - 17:00)',
          foodName: '1 cốc Sữa chua Hy Lạp không đường + 1 quả táo xanh',
          quantity: '1 phần',
          estimatedCalories: 210,
          proteinGrams: 16,
          carbsGrams: 30,
          fatGrams: 2,
          note: 'Nhẹ bụng, dễ tiêu hóa trước buổi tập cùng Coach.',
          sortOrder: 3,
        },
        {
          dayNumber: selectedDay,
          mealType: 'Bữa tối (19:00 - 20:30)',
          foodName: '180g Tôm sú hấp sả + Canh rong biển đậu phụ non + Nộm dưa chuột',
          quantity: '1 tô lớn (380g)',
          estimatedCalories: 440,
          proteinGrams: 42,
          carbsGrams: 32,
          fatGrams: 7,
          note: 'Bữa tối giàu đạm nhẹ nhàng giúp đốt mỡ tự nhiên khi ngủ.',
          sortOrder: 4,
        },
      ]
    } else {
      // Balanced 1850 - 2050
      aiItems = [
        {
          dayNumber: selectedDay,
          mealType: 'Bữa sáng (07:00 - 08:30)',
          foodName: 'Phở gạo lứt thịt bò tái nạc + Rau mùi & giá đỗ trần',
          quantity: '1 tô (400g)',
          estimatedCalories: 450,
          proteinGrams: 32,
          carbsGrams: 52,
          fatGrams: 10,
          note: 'Nước dùng thanh đạm, ít dầu mỡ.',
          sortOrder: 1,
        },
        {
          dayNumber: selectedDay,
          mealType: 'Bữa trưa (11:30 - 13:00)',
          foodName: '200g Ức gà sốt cam mật ong + 1 chén cơm gạo lứt + Canh bí đỏ thịt bằm',
          quantity: '1 đĩa (450g)',
          estimatedCalories: 590,
          proteinGrams: 48,
          carbsGrams: 62,
          fatGrams: 13,
          note: 'Bí đỏ giàu vitamin A hỗ trợ phục hồi mô cơ.',
          sortOrder: 2,
        },
        {
          dayNumber: selectedDay,
          mealType: 'Bữa phụ chiều / Trước tập (16:00 - 17:00)',
          foodName: '1 thanh Protein Bar hoặc 1 cốc Sữa hạt hạnh nhân + 1 quả chuối',
          quantity: '1 phần',
          estimatedCalories: 240,
          proteinGrams: 18,
          carbsGrams: 32,
          fatGrams: 4,
          note: 'Bổ sung khoáng chất ngừa chuột rút khi tập tạ.',
          sortOrder: 3,
        },
        {
          dayNumber: selectedDay,
          mealType: 'Bữa tối (19:00 - 20:30)',
          foodName: '200g Cá basa áp chảo thì là + 1 củ khoai lang vàng luộc + Đậu cove xào tỏi',
          quantity: '1 đĩa (400g)',
          estimatedCalories: 520,
          proteinGrams: 40,
          carbsGrams: 46,
          fatGrams: 14,
          note: 'Cá trắng ít calo, giàu collagen và đạm hấp thu nhanh.',
          sortOrder: 4,
        },
      ]
    }

    setMeals((prev) => {
      const withoutCurrentDay = prev.filter((m) => m.dayNumber !== selectedDay)
      return [...withoutCurrentDay, ...aiItems]
    })

    toast.success(
      `AI đã tạo thành công thực đơn tối ưu cho ${memberName} (${targetKcal} kcal) theo mục tiêu: ${goalText}!`
    )
  }

  // Copy meals from another existing plan
  const handleCopyFromExistingPlan = async () => {
    if (!selectedPlanToCopyId) {
      toast.warning('Vui lòng chọn thực đơn nguồn để sao chép.')
      return
    }

    setIsCopyingPlan(true)
    try {
      const fullPlan = await mealPlansService.getMealPlanById(selectedPlanToCopyId)
      const items = (fullPlan.mealPlanItemsMealPlanId || fullPlan.items || []) as MealPlanItem[]

      if (items.length === 0) {
        toast.warning('Thực đơn nguồn không có món ăn nào.')
        return
      }

      const importedItems: MealFormItem[] = items.map((it) => ({
        dayNumber: it.dayNumber,
        mealType: it.mealType,
        foodName: it.foodName,
        quantity: it.quantity || undefined,
        estimatedCalories: Number(it.estimatedCalories) || 0,
        proteinGrams: Number(it.proteinGrams) || 0,
        carbsGrams: Number(it.carbsGrams) || 0,
        fatGrams: Number(it.fatGrams) || 0,
        note: it.note || undefined,
        sortOrder: it.sortOrder || 1,
      }))

      setMeals(importedItems)
      if (fullPlan.dailyCalorieTarget) {
        setTargetCalories(String(fullPlan.dailyCalorieTarget))
      }
      if (fullPlan.description && !notes) {
        setNotes(fullPlan.description)
      }

      setIsCopyPlanModalOpen(false)
      toast.success(
        `Đã sao chép thành công ${importedItems.length} món ăn từ thực đơn "${fullPlan.title}"!`
      )
    } catch {
      toast.error('Lỗi khi tải chi tiết thực đơn nguồn.')
    } finally {
      setIsCopyingPlan(false)
    }
  }

  // Handle Save Meal Plan (status: DRAFT or ACTIVE)
  const handleSubmitMealPlan = async (assignImmediately: boolean) => {
    if (!memberId) {
      toast.error('Vui lòng chọn học viên áp dụng thực đơn.')
      return
    }
    if (!title.trim()) {
      toast.error('Vui lòng nhập tên kế hoạch thực đơn dinh dưỡng.')
      return
    }
    if (meals.length === 0) {
      toast.error('Thực đơn phải có ít nhất một món ăn trước khi lưu.')
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading(
      assignImmediately ? 'Đang tạo & giao thực đơn cho học viên...' : 'Đang lưu bản nháp thực đơn...'
    )

    try {
      const disclaimer =
        'Thực đơn và chỉ số dinh dưỡng do Huấn luyện viên thể hình gợi ý nhằm mục tiêu tập luyện, không thay thế cho chỉ định của bác sĩ chuyên khoa hoặc chế độ điều trị y tế.'

      // Step 1: Create real draft meal plan via POST /meal-plans
      const plan = await mealPlansService.createMealPlan({
        memberId,
        title: title.trim(),
        dailyCalorieTarget: Number(targetCalories) || 2000,
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate ? endDate : undefined,
        description: notes.trim() ? notes.trim() : undefined,
        medicalDisclaimer: disclaimer,
      })

      // Step 2: Add all meal items to the plan via POST /meal-plans/:id/items
      for (const m of meals) {
        await mealPlansService.addMealItem(plan.id, {
          dayNumber: m.dayNumber,
          mealType: m.mealType,
          foodName: m.foodName.trim(),
          quantity: m.quantity?.trim() || undefined,
          estimatedCalories: Number(m.estimatedCalories) || 0,
          proteinGrams: Number(m.proteinGrams) || 0,
          carbsGrams: Number(m.carbsGrams) || 0,
          fatGrams: Number(m.fatGrams) || 0,
          note: m.note?.trim() || undefined,
          sortOrder: m.sortOrder,
        })
      }

      // Step 3: If assign immediately, call POST /meal-plans/:id/assign
      if (assignImmediately) {
        await mealPlansService.assignMealPlan(plan.id)
        toast.success('Đã tạo và chính thức giao thực đơn dinh dưỡng cho học viên thành công!', { id: toastId })
      } else {
        toast.success('Đã lưu bản nháp thực đơn dinh dưỡng thành công!', { id: toastId })
      }

      // Reload real plans list
      await loadData()
      setActiveTab('list')

      // Reset builder form
      handleResetBuilder()
    } catch (err) {
      let msg = 'Không thể kết nối máy chủ để lưu thực đơn. Vui lòng thử lại.'
      if (isAppApiError(err)) {
        msg = err.message || 'Lỗi khi lưu thực đơn dinh dưỡng lên máy chủ.'
      } else if (err instanceof Error) {
        msg = err.message
      }
      toast.error(msg, { id: toastId })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle assign an existing draft plan directly from list
  const handleAssignExistingPlan = async (planId: string) => {
    setIsSubmitting(true)
    const toastId = toast.loading('Đang giao thực đơn cho học viên...')
    try {
      await mealPlansService.assignMealPlan(planId)
      toast.success('Đã giao thực đơn thành công! Học viên đã nhận được thông báo.', { id: toastId })
      await loadData()
      if (viewingPlan?.id === planId) {
        setViewingPlan((prev) => (prev ? { ...prev, status: 'ACTIVE' } : null))
      }
    } catch (err) {
      let msg = 'Lỗi kết nối máy chủ khi giao thực đơn.'
      if (isAppApiError(err)) {
        msg = err.message || 'Không thể giao thực đơn.'
      }
      toast.error(msg, { id: toastId })
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
        toast.error(err.message || 'Lỗi khi tải chi tiết các bữa ăn.')
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
              onClick={() => {
                handleResetBuilder()
                setActiveTab('builder')
              }}
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
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  handleResetBuilder()
                  setActiveTab('builder')
                }}
                className="gap-1.5 mt-2"
              >
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
      {/* TAB 2: MEAL PLAN BUILDER (HƯỚNG 1: TUẦN TỰ TỪ TRÊN XUỐNG DƯỚI)             */}
      {/* ========================================================================= */}
      {activeTab === 'builder' && (
        <div className="space-y-6">
          {/* STEP 1: General Information & Member Biometrics Selection Card */}
          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Utensils className="h-4 w-4 text-primary" />
                <span>1. Thông Tin Kế Hoạch & Học Viên Tiếp Nhận</span>
              </h2>
              {memberId && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  <span>Đã chọn học viên</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Primary Member Selector */}
              <div className="md:col-span-3">
                <Select
                  id="select-member-input"
                  label="Học viên nhận thực đơn (BẮT BUỘC ĐỂ MỞ KHÓA BƯỚC 2)"
                  required
                  value={memberId}
                  onChange={(e) => handleMemberSelect(e.target.value)}
                  options={[
                    { value: '', label: '-- Chọn học viên của bạn để bắt đầu --' },
                    ...members.map((m: any) => ({
                      value: m.id,
                      label: `${m.fullName || m.user?.fullName || 'Hội viên'} (${m.memberCode || 'HV'})`,
                    })),
                  ]}
                />
              </div>

              {/* Dynamic Member Biometrics & Nutrition Banner */}
              {isLoadingMemberStats && (
                <div className="md:col-span-3 p-4 rounded-xl border border-border-subtle bg-bg-surface-muted flex items-center gap-2 text-xs text-text-muted animate-pulse">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                  <span>Đang tải thông số thể trạng InBody và mục tiêu luyện tập của học viên...</span>
                </div>
              )}

              {memberId && !isLoadingMemberStats && biometricAnalysis && (
                <div className="md:col-span-3 rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-primary/10 pb-2">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold text-text-primary">
                        Thông Số Thể Trạng & Đề Xuất Calo Khoa Học
                      </span>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">
                      {biometricAnalysis.primaryGoal}
                    </span>
                  </div>

                  {/* 6 Biometric Indicators */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-bg-surface border border-border-subtle">
                      <span className="text-[10px] text-text-muted flex items-center justify-center gap-1">
                        <Scale className="h-3 w-3" /> Cân nặng
                      </span>
                      <strong className="text-text-primary">{biometricAnalysis.weightKg} kg</strong>
                    </div>

                    <div className="p-2 rounded-lg bg-bg-surface border border-border-subtle">
                      <span className="text-[10px] text-text-muted">Chiều cao</span>
                      <strong className="text-text-primary">{biometricAnalysis.heightCm || '--'} cm</strong>
                    </div>

                    <div className="p-2 rounded-lg bg-bg-surface border border-border-subtle">
                      <span className="text-[10px] text-text-muted">BMI</span>
                      <strong className="text-text-primary">{biometricAnalysis.bmi}</strong>
                    </div>

                    <div className="p-2 rounded-lg bg-bg-surface border border-border-subtle">
                      <span className="text-[10px] text-text-muted">% Mỡ cơ thể</span>
                      <strong className="text-text-primary">
                        {biometricAnalysis.bodyFatPercent ? `${biometricAnalysis.bodyFatPercent}%` : 'Chưa đo'}
                      </strong>
                    </div>

                    <div className="p-2 rounded-lg bg-bg-surface border border-border-subtle">
                      <span className="text-[10px] text-text-muted">BMR cơ bản</span>
                      <strong className="text-text-primary">{biometricAnalysis.bmr} kcal</strong>
                    </div>

                    <div className="p-2 rounded-lg bg-bg-surface border border-border-subtle">
                      <span className="text-[10px] text-text-muted">TDEE vận động</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                        {biometricAnalysis.tdee} kcal
                      </strong>
                    </div>
                  </div>

                  {/* Suggestion & Fast Apply Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
                    <p className="text-[11px] text-text-muted flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>
                        Gợi ý: <strong>{biometricAnalysis.suggestedCalories} kcal/ngày</strong> (Đạm: ~{biometricAnalysis.suggestedProtein}g | Tinh bột: ~{biometricAnalysis.suggestedCarbs}g | Béo: ~{biometricAnalysis.suggestedFat}g)
                      </span>
                    </p>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleApplyBiometricSuggestion}
                      className="text-xs h-7 gap-1 self-end sm:self-auto"
                    >
                      <span>Khôi phục Calo gợi ý</span>
                    </Button>
                  </div>
                </div>
              )}

              {memberId && !isLoadingMemberStats && !biometricAnalysis && (
                <div className="md:col-span-3 rounded-xl border border-dashed border-border-subtle bg-bg-surface-muted p-3.5 flex items-center gap-3 text-xs text-text-muted">
                  <Info className="h-4 w-4 text-text-muted shrink-0" />
                  <span>
                    Học viên chưa có dữ liệu đo InBody/Chỉ số thể trạng gần đây. Mức năng lượng mặc định 2000 kcal/ngày đang được áp dụng, bạn có thể chỉnh tay bên dưới.
                  </span>
                </div>
              )}

              {/* Title & Calories Input */}
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

              {/* Start & End Dates */}
              <div className="grid grid-cols-2 gap-2 md:col-span-1">
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

              {/* General Coach Notes */}
              <div className="md:col-span-2">
                <Input
                  label="Ghi chú tổng quát của HLV cho học viên"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ví dụ: Uống tối thiểu 2.5 - 3 lít nước mỗi ngày, ăn trước giờ tập 90 phút..."
                />
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* STEP 2: MEAL PLAN DETAILS BY DAY                                      */}
          {/* ===================================================================== */}

          {/* IF NO MEMBER SELECTED -> LOCKED / DISABLED EMPTY STATE */}
          {!memberId ? (
            <div className="rounded-2xl border-2 border-dashed border-border-subtle bg-bg-surface p-12 text-center space-y-4 shadow-sm">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                <Lock className="h-7 w-7 text-primary" />
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-base font-bold text-text-primary">
                  Vui lòng chọn học viên ở bước 1 để bắt đầu thiết lập thực đơn
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Hệ thống cần xác định học viên phụ trách để phân tích chỉ số thể trạng (Cân nặng, % Mỡ, TDEE, Mục tiêu tập luyện), đề xuất mức Calo chuẩn xác và mở khóa công cụ xếp bữa ăn.
                </p>
              </div>

              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  const el = document.getElementById('select-member-input')
                  el?.focus()
                }}
                className="gap-2"
              >
                <UserCheck className="h-4 w-4" />
                <span>Chọn học viên tại Bước 1</span>
              </Button>
            </div>
          ) : (
            /* IF MEMBER SELECTED -> UNLOCKED FULL BUILDER */
            <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-6 shadow-sm animate-in fade-in-50 duration-300">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border-subtle pb-4">
                <div>
                  <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-emerald-500" />
                    <span>2. Chi Tiết Thực Đơn Theo Ngày</span>
                  </h2>
                  <p className="text-xs text-text-muted mt-0.5">
                    Tùy chọn tải thực đơn mẫu, nhận gợi ý từ AI hoặc tự thiết lập từng món ăn cho học viên.
                  </p>
                </div>

                {/* Top Action Quick Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsPresetModalOpen(true)}
                    className="gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/5"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>Chọn từ thực đơn mẫu</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleGenerateAiMealPlan}
                    className="gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/5"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>AI gợi ý thực đơn</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsCopyPlanModalOpen(true)}
                    className="gap-1.5 text-xs"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Sao chép thực đơn cũ</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsDuplicateModalOpen(true)}
                    className="gap-1.5 text-xs"
                  >
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

              {/* Day Tabs Navigation */}
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

              {/* Live Macro Distribution Progress Bar */}
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

                  <span className="text-xs font-mono text-text-muted">
                    {dayMacroSummary.percentCal}% mục tiêu ngày
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-border-subtle h-2.5 rounded-full overflow-hidden">
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
                  <div className="rounded-xl border border-dashed border-border-subtle p-8 text-center space-y-4">
                    <div className="mx-auto w-10 h-10 rounded-full bg-bg-surface-muted flex items-center justify-center text-text-muted">
                      <Utensils className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-text-primary">Ngày {selectedDay} hiện chưa có món ăn nào</p>
                      <p className="text-[11px] text-text-muted">
                        Bạn có thể chọn nhanh từ thực đơn mẫu, nhận gợi ý từ AI hoặc thêm món thủ công:
                      </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsPresetModalOpen(true)}
                        className="gap-1.5 text-xs text-primary border-primary/30"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>Tải Thực Đơn Mẫu Chuẩn</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleGenerateAiMealPlan}
                        className="gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>AI Gợi Ý Thực Đơn</span>
                      </Button>

                      <Button size="sm" variant="primary" onClick={handleOpenAddMeal} className="gap-1 text-xs">
                        <Plus className="h-3.5 w-3.5" />
                        <span>Tự Thêm Món Ăn</span>
                      </Button>
                    </div>
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
                    disabled={isSubmitting || !memberId || meals.length === 0}
                    className="w-full sm:w-auto gap-1.5"
                  >
                    {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                    <span>Lưu Bản Nháp</span>
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => handleSubmitMealPlan(true)}
                    disabled={isSubmitting || !memberId || meals.length === 0}
                    className="w-full sm:w-auto gap-1.5"
                  >
                    {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    <span>Lưu & Giao Cho Học Viên</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
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
      {/* MODAL 3: MEAL PRESET TEMPLATES PICKER                                     */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        title="Ngân Hàng Thực Đơn Mẫu Chuẩn (Meal Presets)"
        description="Lựa chọn thực đơn chuẩn hóa theo mục tiêu tập luyện để tải nhanh vào kế hoạch của học viên."
        maxWidth="xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
            {MEAL_PRESETS.map((preset) => {
              const isSelected = selectedPreset?.id === preset.id
              return (
                <div
                  key={preset.id}
                  onClick={() => setSelectedPreset(preset)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all space-y-2.5 ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border-subtle bg-bg-surface-muted hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${preset.badgeColor}`}>
                      {preset.tag}
                    </span>
                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                      {preset.targetCalories} kcal
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-text-primary line-clamp-1">{preset.name}</h4>
                    <p className="text-[11px] text-text-muted line-clamp-2 mt-0.5">{preset.description}</p>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-text-muted border-t border-border-subtle pt-2">
                    <span>Đạm: <strong className="text-primary">{preset.targetProtein}g</strong></span>
                    <span>Carbs: <strong className="text-amber-600 dark:text-amber-400">{preset.targetCarbs}g</strong></span>
                    <span>Béo: <strong className="text-rose-600 dark:text-rose-400">{preset.targetFat}g</strong></span>
                    <span className="ml-auto font-medium">{preset.meals.length} bữa</span>
                  </div>
                </div>
              )
            })}
          </div>

          {selectedPreset && (
            <div className="p-3.5 rounded-xl border border-border-subtle bg-bg-surface space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-text-primary">Xem trước: {selectedPreset.name}</span>
                <span className="text-[11px] text-text-muted">{selectedPreset.meals.length} bữa ăn tiêu chuẩn</span>
              </div>
              <p className="text-[11px] text-text-muted italic">{selectedPreset.suitableFor}</p>

              <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1">
                {selectedPreset.meals.map((m, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[11px] p-1.5 rounded bg-bg-surface-muted">
                    <span className="font-medium text-text-primary line-clamp-1">{m.mealType}: {m.foodName}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">{m.estimatedCalories} kcal</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-3 border-t border-border-subtle">
            <Button variant="outline" onClick={() => setIsPresetModalOpen(false)}>
              Đóng
            </Button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                disabled={!selectedPreset}
                onClick={() => selectedPreset && handleApplyPreset(selectedPreset, true)}
                className="text-xs flex-1 sm:flex-none"
              >
                Áp dụng cả tuần (7 ngày)
              </Button>

              <Button
                variant="primary"
                disabled={!selectedPreset}
                onClick={() => selectedPreset && handleApplyPreset(selectedPreset, false)}
                className="text-xs flex-1 sm:flex-none gap-1"
              >
                <span>Nạp vào Ngày {selectedDay}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: COPY FROM EXISTING PLANS                                         */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCopyPlanModalOpen}
        onClose={() => setIsCopyPlanModalOpen(false)}
        title="Sao Chép Từ Thực Đơn Đã Có"
        description="Nạp nhanh các bữa ăn từ một thực đơn khác bạn từng tạo sang cho học viên này."
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-text-muted">
            Chọn thực đơn nguồn bạn muốn sao chép toàn bộ món ăn:
          </p>

          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
            {plans.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-6">Bạn chưa có thực đơn nào khác để sao chép.</p>
            ) : (
              plans.map((p) => {
                const isSelected = selectedPlanToCopyId === p.id
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlanToCopyId(p.id)}
                    className={`p-3 rounded-xl border cursor-pointer text-xs transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border-subtle bg-bg-surface-muted hover:border-primary/40'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <p className="font-bold text-text-primary line-clamp-1">{p.title}</p>
                      <p className="text-[11px] text-text-muted">
                        Áp dụng: {p.member?.fullName || p.member?.user?.fullName || getMemberDisplayName(p.memberId)}
                      </p>
                    </div>

                    <div className="text-right shrink-0 ml-3">
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 block">
                        {p.dailyCalorieTarget ? `${p.dailyCalorieTarget} kcal` : '--'}
                      </span>
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
            <Button variant="outline" onClick={() => setIsCopyPlanModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={handleCopyFromExistingPlan}
              disabled={!selectedPlanToCopyId || isCopyingPlan}
              className="gap-1.5"
            >
              {isCopyingPlan ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
              <span>Tiến Hành Sao Chép</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 5: VIEW PLAN DETAIL                                                 */}
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
