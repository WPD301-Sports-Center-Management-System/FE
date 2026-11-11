import { useSearchParams } from 'react-router-dom'
import { centerDate } from '@/shared/utils/date'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
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
  Search,
  ListFilter,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { coachesService } from '@/features/coaches/services/coaches.service'
import { foodLine, mealPlansService, type CalorieSuggestion, type FoodItem, type MealTemplate, type MealDayRequest } from '../services/meal-plans.service'
import { Button } from '@/shared/components/ui/button'
import { Input, Select } from '@/shared/components/ui/input'
import { Modal } from '@/shared/components/ui/modal'
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog'
import { Badge } from '@/features/workspace/ui'
import { isAppApiError } from '@/shared/api/api-error'
import { formatDate } from '@/shared/utils/date'
import type { MemberSummary, MealPlan, MealPlanItem } from '@/shared/types/api'

interface MealFormItem {
  id?: string
  dayNumber: number
  mealType: string
  foodName: string
  /** Library food: the server recomputes nutrition from the library × servings. */
  foodItemId?: string
  servings?: number
  quantity: string
  estimatedCalories: number
  proteinGrams: number
  carbsGrams: number
  fatGrams: number
  note?: string
  sortOrder: number
  /** Saved item edited locally since the last sync. */
  dirty?: boolean
}

// Same names as the center templates, so a plan from a template and a hand-built one read alike.
export const MEAL_TYPES = ['Bữa sáng', 'Bữa phụ sáng', 'Bữa trưa', 'Bữa phụ chiều', 'Bữa tối', 'Bữa phụ tối']
function MealStatus({ status }: { status: string }) {
  return <Badge tone={status === 'ACTIVE' ? 'success' : status === 'DRAFT' ? 'warning' : 'neutral'}>{status === 'ACTIVE' ? 'Đang áp dụng' : status === 'DRAFT' ? 'Bản nháp' : 'Đã lưu trữ'}</Badge>
}
const mealTypeOptions = (current?: string) =>
  [...MEAL_TYPES, ...(current && !MEAL_TYPES.includes(current) ? [current] : [])].map(v => ({ value: v, label: v }))

export function CoachMealPlanPage() {
  const [searchParams] = useSearchParams()
  const initialMemberId = searchParams.get('memberId') || ''
  // Navigation & View mode
  const [activeTab, setActiveTab] = useState<'list' | 'builder'>(initialMemberId || searchParams.get('templateId') || searchParams.get('planId') ? 'builder' : 'list')

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
  const [memberId, setMemberId] = useState(initialMemberId)
  const [title, setTitle] = useState('')
  const [targetCalories, setTargetCalories] = useState('2000')
  const [startDate, setStartDate] = useState(centerDate())
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')
  const [meals, setMeals] = useState<MealFormItem[]>([])
  // The server-side draft this builder writes to. Set as soon as the plan exists, so a failed save
  // can be retried without creating a second plan, and so existing drafts can be reopened.
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [removedItemIds, setRemovedItemIds] = useState<string[]>([])
  const [pendingDelete, setPendingDelete] = useState<number | null>(null)
  const [pendingArchive, setPendingArchive] = useState<MealPlan | null>(null)
  const [selectedDay, setSelectedDay] = useState<number>(1)
  const [repeatWeekly, setRepeatWeekly] = useState(false)
  const [daySettings, setDaySettings] = useState<Record<number, { calories: number; mealCount: number }>>({})
  const [aiScope, setAiScope] = useState('week')
  const [pendingAiDays, setPendingAiDays] = useState<MealDayRequest[] | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const suggestionVersion = useRef(0)
  const mealsRef = useRef(meals)
  mealsRef.current = meals

  const generateDays = useCallback(async (days: MealDayRequest[]) => {
    if (!memberId) { setErrorMessage('Chọn học viên trước khi tạo gợi ý AI.'); return }
    const version = ++suggestionVersion.current
    const snapshot = mealsRef.current
    setIsGenerating(true)
    setErrorMessage(null)
    try {
      const generated = await mealPlansService.suggestDays({ memberId, context: notes.trim() || undefined, days })
      if (version !== suggestionVersion.current) return
      const dayNumbers = new Set(days.length === 7 ? [...snapshot.map(m => m.dayNumber), ...days.map(d => d.dayNumber)] : days.map(d => d.dayNumber))
      const original = snapshot.filter(m => dayNumbers.has(m.dayNumber))
      const current = mealsRef.current.filter(m => dayNumbers.has(m.dayNumber))
      if (original.length !== current.length || original.some((m, i) => m !== current[i])) {
        setErrorMessage('Bạn vừa sửa nội dung trong lúc AI đang tạo. Nội dung sửa được giữ lại; bấm tạo lại khi sẵn sàng.')
        return
      }
      setRemovedItemIds(prev => [...new Set([...prev, ...original.flatMap(m => m.id ? [m.id] : [])])])
      setTitle(current => current.trim() ? current : days.length === 7 ? 'Thực đơn 7 ngày' : 'Thực đơn dinh dưỡng')
      if (days.length === 7) setRepeatWeekly(true)
      setMeals(prev => [...prev.filter(m => !dayNumbers.has(m.dayNumber)), ...generated.flatMap(d => d.meals.map(m => ({
        dayNumber: d.dayNumber, mealType: m.mealType, foodName: m.foodName || m.mealType, foodItemId: m.foodItemId, servings: m.servings,
        quantity: m.quantity || '', note: m.note || '', estimatedCalories: m.estimatedCalories || 0,
        proteinGrams: m.proteinGrams || 0, carbsGrams: m.carbsGrams || 0, fatGrams: m.fatGrams || 0, sortOrder: m.sortOrder || 0,
      })))])
      setSuccessMessage('AI đã điền món ăn và khẩu phần. Coach kiểm tra, sửa trực tiếp rồi lưu hoặc giao cho học viên.')
    } catch (err) {
      if (version === suggestionVersion.current) setErrorMessage(isAppApiError(err) ? err.message : 'Không tạo được gợi ý AI. Nội dung hiện tại được giữ lại; bạn có thể thử lại hoặc nhập tay.')
    } finally {
      if (version === suggestionVersion.current) setIsGenerating(false)
    }
  }, [memberId, notes])

  useEffect(() => {
    ++suggestionVersion.current
    setIsGenerating(false)
    setPendingAiDays(null)
    return () => { ++suggestionVersion.current }
  }, [memberId, notes])

  // Modal states: Add/Edit Meal Item
  const [isMealModalOpen, setIsMealModalOpen] = useState(false)
  const [editingMealIndex, setEditingMealIndex] = useState<number | null>(null)
  const [mealFormType, setMealFormType] = useState(MEAL_TYPES[0]!)
  const [mealFormFoodId, setMealFormFoodId] = useState('')
  const [mealFormServings, setMealFormServings] = useState('1')
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

  // Center food library and templates (center + this Coach's own)
  const [foods, setFoods] = useState<FoodItem[]>([])
  const [templates, setTemplates] = useState<MealTemplate[]>([])
  const [templateId, setTemplateId] = useState(searchParams.get('templateId') ?? '')
  const [suggestion, setSuggestion] = useState<CalorieSuggestion | null>(null)
  const [saveTemplateFor, setSaveTemplateFor] = useState<MealPlan | null>(null)
  const [templateTitle, setTemplateTitle] = useState('')
  const foodById = useMemo(() => new Map(foods.map(f => [f.id, f])), [foods])

  // Load members and meal plans from Real Backend
  const loadData = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const [membersRes, plansRes, foodsRes, templatesRes] = await Promise.allSettled([
        coachesService.getMyMembers(),
        mealPlansService.getMealPlans(),
        mealPlansService.getFoodItems(),
        mealPlansService.getTemplates(),
      ])
      if (foodsRes.status === 'fulfilled') setFoods(foodsRes.value)
      if (templatesRes.status === 'fulfilled') setTemplates(templatesRes.value)

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

  // Starting kcal for the chosen Member, from their latest measurements.
  useEffect(() => {
    if (!memberId) return
    let alive = true
    mealPlansService.getCalorieSuggestion(memberId).then(s => { if (alive) setSuggestion(s) }).catch(() => { if (alive) setSuggestion(null) })
    return () => { alive = false; setSuggestion(null) }
  }, [memberId])

  // Get distinct day numbers in current builder meals
  const builderDays = useMemo(() => {
    if (repeatWeekly) return [1, 2, 3, 4, 5, 6, 7]
    const days = Array.from(new Set([...meals.map((m) => m.dayNumber), selectedDay])).sort((a, b) => a - b)
    return days.length > 0 ? days : [1]
  }, [meals, repeatWeekly, selectedDay])

  // Current day meals in builder
  const currentDayMeals = useMemo(() => {
    return meals.filter((m) => m.dayNumber === selectedDay)
  }, [meals, selectedDay])

  const settingsForDay = (day: number) => daySettings[day] || {
    calories: Number(targetCalories) || 2000,
    mealCount: new Set(meals.filter(m => m.dayNumber === day).map(m => m.mealType)).size || 3,
  }

  const changeDaySettings = (field: 'calories' | 'mealCount', value: number) => {
    const next = { ...settingsForDay(selectedDay), [field]: value }
    setDaySettings(prev => ({ ...prev, [selectedDay]: next }))
    ++suggestionVersion.current
    setIsGenerating(false)
  }

  const requestAiMeals = () => {
    const days = (aiScope === 'week' ? [1,2,3,4,5,6,7] : [selectedDay]).map(dayNumber => ({ dayNumber, ...settingsForDay(dayNumber) }))
    if (days.some(d => !Number.isInteger(d.calories) || d.calories < 800 || d.calories > 6000)) { setErrorMessage('Năng lượng mục tiêu cần từ 800 đến 6.000 kcal/ngày.'); return }
    if (meals.some(m => days.some(d => d.dayNumber === m.dayNumber) || aiScope === 'week')) setPendingAiDays(days)
    else void generateDays(days)
  }

  // Live macro calculation for selected day
  const dayMacroSummary = useMemo(() => {
    const totalCal = currentDayMeals.reduce((acc, m) => acc + (Number(m.estimatedCalories) || 0), 0)
    const totalP = currentDayMeals.reduce((acc, m) => acc + (Number(m.proteinGrams) || 0), 0)
    const totalC = currentDayMeals.reduce((acc, m) => acc + (Number(m.carbsGrams) || 0), 0)
    const totalF = currentDayMeals.reduce((acc, m) => acc + (Number(m.fatGrams) || 0), 0)

    const target = daySettings[selectedDay]?.calories || Number(targetCalories) || 2000
    const percentCal = Math.min(Math.round((totalCal / target) * 100), 100)

    return { totalCal, totalP, totalC, totalF, target, percentCal }
  }, [currentDayMeals, targetCalories, daySettings, selectedDay])

  // Open modal to add meal
  const handleOpenAddMeal = () => {
    setEditingMealIndex(null)
    setMealFormType(MEAL_TYPES[0]!)
    setMealFormFoodId('')
    setMealFormServings('1')
    setMealFormFood('')
    setMealFormQuantity('')
    setMealFormCalories('')
    setMealFormProtein('')
    setMealFormCarbs('')
    setMealFormFat('')
    setMealFormNote('')
    setIsMealModalOpen(true)
  }

  // Picking a library food (or changing its servings) fills name, portion and nutrition from the library.
  const fillFromFood = (foodId: string, servingsText: string) => {
    setMealFormFoodId(foodId)
    setMealFormServings(servingsText)
    const food = foodById.get(foodId)
    if (!food) return
    const servings = Number(servingsText) || 1
    const n = foodLine(food, servings)
    setMealFormFood(food.name)
    setMealFormQuantity(servings === 1 ? food.servingLabel : `${String(servings).replace('.', ',')} × ${food.servingLabel}`)
    setMealFormCalories(String(n.estimatedCalories))
    setMealFormProtein(String(n.proteinGrams))
    setMealFormCarbs(String(n.carbsGrams))
    setMealFormFat(String(n.fatGrams))
  }

  const applyTemplate = async () => {
    const template = templates.find(t => t.id === templateId)
    if (!template) return
    if (!memberId) { setErrorMessage('Chọn học viên trước khi áp dụng mẫu.'); return }
    if (editingPlanId || meals.length) { setErrorMessage('Mẫu tạo một bản nháp mới. Hãy lưu hoặc bỏ bản đang soạn trước.'); return }
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      const plan = await mealPlansService.createFromTemplate({
        templateId: template.id, memberId, startDate: startDate || centerDate(), endDate: endDate || undefined,
        dailyCalorieTarget: Number(targetCalories) || template.dailyCalorieTarget, title: title.trim() || undefined,
      })
      setTemplateId('')
      await loadData()
      await openDraftForEdit(plan)
      setSuccessMessage(`Đã tạo bản nháp từ mẫu “${template.title}”, khẩu phần đã co giãn theo ${plan.dailyCalorieTarget} kcal/ngày. Chỉnh rồi giao cho học viên.`)
    } catch (err) {
      setErrorMessage(isAppApiError(err) ? err.message : 'Không tạo được thực đơn từ mẫu.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveAsTemplate = async () => {
    if (!saveTemplateFor || !templateTitle.trim()) return
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      await mealPlansService.saveAsTemplate(saveTemplateFor.id, { title: templateTitle.trim() })
      setTemplates(await mealPlansService.getTemplates())
      setSuccessMessage(`Đã lưu “${templateTitle.trim()}” vào mẫu của bạn.`)
      setSaveTemplateFor(null)
    } catch (err) {
      setErrorMessage(isAppApiError(err) ? err.message : 'Không lưu được mẫu.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Open modal to edit meal
  const handleOpenEditMeal = (indexInAllMeals: number) => {
    const item = meals[indexInAllMeals]
    if (!item) return
    setEditingMealIndex(indexInAllMeals)
    setMealFormType(item.mealType)
    setMealFormFoodId(item.foodItemId ?? '')
    setMealFormServings(String(item.servings ?? 1))
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
      foodItemId: mealFormFoodId || undefined,
      servings: mealFormFoodId ? Number(mealFormServings) || 1 : undefined,
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
        const old = prev[editingMealIndex]
        next[editingMealIndex] = { ...newItem, id: old.id, dayNumber: old.dayNumber, sortOrder: old.sortOrder, dirty: !!old.id }
        return next
      })
    } else {
      setMeals((prev) => [...prev, newItem])
    }

    setIsMealModalOpen(false)
  }

  // Remove meal
  const handleDeleteMeal = (indexInAllMeals: number) => {
    const removed = meals[indexInAllMeals]
    if (removed?.id) setRemovedItemIds((prev) => [...prev, removed.id!])
    setMeals((prev) => prev.filter((_, idx) => idx !== indexInAllMeals))
    setPendingDelete(null)
  }

  const resetBuilder = () => {
    ++suggestionVersion.current
    setIsGenerating(false)
    setPendingAiDays(null)
    setDaySettings({})
    setRepeatWeekly(false)
    setEditingPlanId(null)
    setRemovedItemIds([])
    setTitle('')
    setMemberId('')
    setTargetCalories('2000')
    setStartDate(centerDate())
    setEndDate('')
    setNotes('')
    setMeals([])
    setSelectedDay(1)
  }

  const startNewPlan = () => {
    resetBuilder()
    setErrorMessage(null)
    setActiveTab('builder')
  }

  // Reopen a saved DRAFT in the builder; every change is written back to the same plan.
  const openDraftForEdit = async (plan: MealPlan, loaded?: MealPlan) => {
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      const full = loaded ?? await mealPlansService.getMealPlanById(plan.id)
      const items = (full.mealPlanItemsMealPlanId || full.items || []) as MealPlanItem[]
      ++suggestionVersion.current
      setIsGenerating(false)
      setPendingAiDays(null)
      setDaySettings({})
      setRepeatWeekly(full.repeatWeekly ?? false)
      setDaySettings(full.daySettings ?? {})
      setEditingPlanId(full.id)
      setRemovedItemIds([])
      setMemberId(full.memberId)
      setTitle(full.title)
      setTargetCalories(String(full.dailyCalorieTarget ?? 2000))
      setStartDate(String(full.startDate ?? centerDate()).slice(0, 10))
      setEndDate(full.endDate ? String(full.endDate).slice(0, 10) : '')
      setNotes(full.description ?? '')
      setMeals(items.map((i) => ({
        id: i.id,
        dayNumber: i.dayNumber,
        mealType: i.mealType,
        foodName: i.foodName,
        foodItemId: i.foodItemId ?? undefined,
        servings: i.servings === null || i.servings === undefined ? undefined : Number(i.servings),
        quantity: i.quantity ?? '',
        estimatedCalories: Number(i.estimatedCalories ?? 0),
        proteinGrams: Number(i.proteinGrams ?? 0),
        carbsGrams: Number(i.carbsGrams ?? 0),
        fatGrams: Number(i.fatGrams ?? 0),
        note: i.note ?? '',
        sortOrder: i.sortOrder ?? 0,
      })))
      setSelectedDay(items.length ? Math.min(...items.map((i) => i.dayNumber)) : 1)
      setViewingPlan(null)
      setActiveTab('builder')
    } catch (err) {
      setErrorMessage(isAppApiError(err) ? err.message : 'Không tải được bản nháp để sửa.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDuplicatePlan = async (plan: MealPlan) => {
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      const copy = await mealPlansService.duplicateMealPlan(plan.id)
      setSuccessMessage(`Đã nhân bản "${plan.title}" thành bản nháp mới.`)
      await loadData()
      await openDraftForEdit(copy)
      setStartDate(centerDate())
      setEndDate('')
    } catch (err) {
      setErrorMessage(isAppApiError(err) ? err.message : 'Không nhân bản được thực đơn.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleArchivePlan = async (plan: MealPlan) => {
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      await mealPlansService.archiveMealPlan(plan.id)
      setPendingArchive(null)
      setViewingPlan(null)
      setSuccessMessage(`Đã lưu trữ "${plan.title}".`)
      await loadData()
    } catch (err) {
      setErrorMessage(isAppApiError(err) ? err.message : 'Không lưu trữ được thực đơn.')
    } finally {
      setIsSubmitting(false)
    }
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
      id: undefined,
      dirty: false,
      dayNumber: targetDuplicateDay,
    }))
    const replacedIds = meals.filter((m) => m.dayNumber === targetDuplicateDay && m.id).map((m) => m.id!)
    if (replacedIds.length) setRemovedItemIds((prev) => [...prev, ...replacedIds])

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
    if (repeatWeekly && assignImmediately && ![1,2,3,4,5,6,7].every(d => meals.some(m => m.dayNumber === d))) {
      setErrorMessage('Hãy lên đủ bữa ăn cho 7 ngày trước khi giao lịch tuần.'); return
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

      const header = {
        repeatWeekly,
        daySettings,
        title: title.trim(),
        dailyCalorieTarget: Number(targetCalories) || 2000,
        startDate: startDate || centerDate(),
        endDate: endDate || null,
        description: notes.trim(),
      }
      // Step 1: the draft itself. Remembered right away so a retry continues on the same plan.
      let planId = editingPlanId
      if (planId) {
        await mealPlansService.updateMealPlan(planId, header)
      } else {
        planId = (await mealPlansService.createMealPlan({ memberId, ...header, medicalDisclaimer: disclaimer })).id
        setEditingPlanId(planId)
      }

      // Step 2: items, one request each. Every success is recorded in state immediately, so if the
      // connection drops halfway, saving again only sends what is still missing.
      for (const removedId of removedItemIds) {
        await mealPlansService.deleteMealItem(planId, removedId)
        setRemovedItemIds((prev) => prev.filter((x) => x !== removedId))
      }
      for (const [index, m] of meals.entries()) {
        const body = {
          dayNumber: m.dayNumber,
          mealType: m.mealType,
          foodItemId: m.foodItemId,
          servings: m.servings,
          foodName: m.foodName,
          quantity: m.quantity,
          estimatedCalories: m.estimatedCalories,
          proteinGrams: m.proteinGrams,
          carbsGrams: m.carbsGrams,
          fatGrams: m.fatGrams,
          note: m.note,
          sortOrder: m.sortOrder || index + 1,
        }
        if (!m.id) {
          const created = await mealPlansService.addMealItem(planId, body)
          setMeals((prev) => prev.map((x) => (x === m ? { ...x, id: created?.id } : x)))
        } else if (m.dirty) {
          await mealPlansService.updateMealItem(planId, m.id, body)
          setMeals((prev) => prev.map((x) => (x === m ? { ...x, dirty: false } : x)))
        }
      }

      // Step 3: If assign immediately, call POST /meal-plans/:id/assign
      if (assignImmediately) {
        await mealPlansService.assignMealPlan(planId)
        setSuccessMessage('Đã lưu và giao thực đơn cho học viên.')
      } else {
        setSuccessMessage('Đã lưu bản nháp thực đơn.')
      }

      // Reload real plans list
      await loadData()
      setActiveTab('list')

      resetBuilder()
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(`${err.message || 'Lỗi khi lưu thực đơn.'} Các món đã lưu được giữ lại; bấm lưu lần nữa để tiếp tục.`)
      } else {
        setErrorMessage('Mất kết nối khi đang lưu. Các món đã lưu được giữ lại; bấm lưu lần nữa để tiếp tục.')
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

  const requestedPlanId = searchParams.get('planId')
  const requestedTemplateId = searchParams.get('templateId')
  const openedTemplate = useRef('')
  useEffect(() => {
    if (!requestedTemplateId) { openedTemplate.current = ''; return }
    if (openedTemplate.current === requestedTemplateId) return
    openedTemplate.current = requestedTemplateId
    setActiveTab('builder')
    if (!mealsRef.current.length && !editingPlanId) setTemplateId(requestedTemplateId)
    else setErrorMessage('Bạn đang soạn một thực đơn. Hãy lưu nháp trước khi dùng mẫu khác.')
  }, [requestedTemplateId, editingPlanId])
  const openedPlan = useRef('')
  useEffect(() => {
    if (!requestedPlanId || openedPlan.current === requestedPlanId) return
    openedPlan.current = requestedPlanId
    void mealPlansService.getMealPlanById(requestedPlanId).then(plan => plan.status === 'DRAFT' ? openDraftForEdit(plan, plan) : handleViewPlanDetail(plan)).catch(() => setErrorMessage('Không tải được thực đơn đã chọn. Vui lòng tải lại trang.'))
  }, [requestedPlanId])

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Action bar: the page is the "Thực đơn học viên" tab of Thực đơn. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-text-muted">
          {activeTab === 'list'
            ? `${plans.length} thực đơn · ${plans.filter((p) => p.status === 'DRAFT').length} bản nháp chưa giao`
            : editingPlanId ? 'Đang soạn thực đơn. Bạn có thể lưu nháp hoặc lưu và giao ngay.' : 'Chọn học viên, chọn mẫu hoặc thêm món, rồi lưu và giao.'}
        </p>
        <div className="flex items-center gap-2">
          {activeTab === 'list' ? (
            <Button size="sm" variant="primary" onClick={startNewPlan} className="gap-1.5">
              <Plus className="h-4 w-4" />
              <span>Soạn thực đơn mới</span>
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setActiveTab('list')} className="gap-1.5">
              <ListFilter className="h-4 w-4" />
              <span>Về danh sách</span>
            </Button>
          )}
        </div>
      </div>

      {/* Global Alerts */}
      {errorMessage && (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-xs text-danger flex items-center justify-between gap-2 animate-in fade-in">
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
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      <p className="flex items-start gap-1.5 text-xs text-text-muted">
        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        Thực đơn mang tính tham khảo cho tập luyện, không thay thế chỉ định của bác sĩ. Mỗi thực đơn giao đi đều kèm lưu ý này.
      </p>

      {/* ========================================================================= */}
      {/* TAB 1: LIST OF MEAL PLANS                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
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
                <option value="ACTIVE">Đang áp dụng</option>
                <option value="DRAFT">Bản nháp</option>
                <option value="ARCHIVED">Đã lưu trữ</option>
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
              <Button size="sm" variant="primary" onClick={startNewPlan} className="gap-1.5 mt-2">
                <Plus className="h-4 w-4" />
                <span>Soạn thực đơn đầu tiên</span>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="rounded-2xl border border-border-subtle bg-bg-surface p-5 space-y-4 hover:border-primary/40 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-text-primary text-sm line-clamp-1">{plan.title}</h3>
                      <MealStatus status={plan.status} />
                    </div>

                    <p className="text-xs text-text-muted flex items-center gap-1.5">
                      <span>Áp dụng cho:</span>
                      <strong className="text-text-primary font-medium">
                        {plan.member?.fullName || plan.member?.user?.fullName || getMemberDisplayName(plan.memberId)}
                      </strong>
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-subtle text-xs">
                      <div className="p-2 rounded-xl bg-bg-surface-muted space-y-0.5">
                        <span className="text-text-muted block text-xs">Năng lượng mục tiêu</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                          {plan.dailyCalorieTarget ? `${plan.dailyCalorieTarget} kcal/ngày` : 'Chưa đặt'}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-bg-surface-muted space-y-0.5">
                        <span className="text-text-muted block text-xs">Bắt đầu từ</span>
                        <span className="font-semibold text-text-primary">{formatDate(plan.startDate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3">
                    <Button size="sm" variant={plan.status === 'DRAFT' ? 'primary' : 'outline'} disabled={isSubmitting || isGenerating} onClick={() => plan.status === 'DRAFT' ? void openDraftForEdit(plan) : void handleViewPlanDetail(plan)}>{plan.status === 'DRAFT' ? 'Soạn tiếp' : 'Xem thực đơn'}</Button>
                    <details className="relative"><summary className="min-h-11 cursor-pointer py-2 text-sm text-text-muted">Thao tác khác</summary><div className="absolute right-0 z-10 mt-1 flex min-w-44 flex-col gap-1 rounded-lg border border-border-subtle bg-bg-surface p-2 shadow-sm">
                      <Button size="sm" variant="ghost" onClick={() => void handleDuplicatePlan(plan)} disabled={isSubmitting}>{plan.status === 'ACTIVE' ? 'Tạo bản điều chỉnh' : 'Sao chép thực đơn'}</Button>
                      {plan.status !== 'ARCHIVED' && <Button size="sm" variant="ghost" onClick={() => setPendingArchive(plan)} disabled={isSubmitting}>{plan.status === 'DRAFT' ? 'Lưu trữ bản nháp' : 'Ngừng áp dụng'}</Button>}
                    </div></details>
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
          <section className="rounded-xl border border-border-subtle bg-bg-surface p-5 space-y-4">
            <h2 className="text-base font-semibold text-text-primary">Thông tin thực đơn</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Học viên" disabled={!!editingPlanId || isSubmitting || isGenerating} value={memberId} onChange={e => setMemberId(e.target.value)} options={[{ value: '', label: 'Chọn học viên' }, ...members.map(m => ({ value: m.id, label: getMemberDisplayName(m.id) }))]} />
              <Input label="Tên thực đơn" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Ví dụ: Thực đơn tăng cơ tuần 1" />
              <div>
                <Input label="Năng lượng mục tiêu (kcal/ngày)" type="number" min={800} max={6000} required value={targetCalories} onChange={e => setTargetCalories(e.target.value)} />
                {memberId && suggestion?.suggestion && <details className="mt-2"><summary className="cursor-pointer text-sm text-text-muted">Gợi ý theo hồ sơ học viên</summary><div className="mt-2 flex flex-wrap gap-2">{([['Giảm mỡ', suggestion.suggestion.fatLoss], ['Duy trì', suggestion.suggestion.maintain], ['Tăng cơ', suggestion.suggestion.muscleGain]] as const).map(([label, kcal]) => <button key={label} type="button" onClick={() => setTargetCalories(String(kcal))} className="min-h-11 rounded-lg border border-border-subtle px-3 text-sm">{label} · {kcal.toLocaleString('vi-VN')} kcal</button>)}</div></details>}
              </div>
              <Input label="Ngày áp dụng" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <Input label="Sở thích và lưu ý ăn uống" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ví dụ: Không ăn tôm, tránh sữa, ăn trưa tại văn phòng" />
            <details><summary className="cursor-pointer text-sm text-text-muted">Thời gian áp dụng và cách lặp lại</summary><div className="mt-3 space-y-3"><Input label="Ngày kết thúc (không bắt buộc)" type="date" min={startDate} value={endDate} onChange={e => setEndDate(e.target.value)} /><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={repeatWeekly} onChange={e => setRepeatWeekly(e.target.checked)} />Lặp lại thực đơn 7 ngày hằng tuần</label><p className="text-xs text-text-muted">Ngày 1 tính từ ngày áp dụng. Thực đơn lặp hằng tuần cần có đủ 7 ngày trước khi giao.</p></div></details>
            {!editingPlanId && !meals.length && <details open={!!requestedTemplateId}><summary className="cursor-pointer text-sm font-medium">Dùng mẫu thực đơn có sẵn</summary><div className="mt-3 flex flex-wrap items-end gap-3"><div className="min-w-0 flex-1"><Select label="Mẫu thực đơn" value={templateId} onChange={e => setTemplateId(e.target.value)} options={[{ value: '', label: 'Chọn mẫu' }, ...templates.filter(t => t.isActive).map(t => ({ value: t.id, label: `${t.title} · ${t.dayCount} ngày` }))]} /></div><Button variant="outline" onClick={() => void applyTemplate()} disabled={!memberId || !templateId || isSubmitting}>Dùng mẫu này</Button></div><p className="mt-2 text-xs text-text-muted">Khẩu phần được điều chỉnh theo năng lượng mục tiêu của học viên.</p></details>}
          </section>

          <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-border-subtle p-4">
            <div><p className="text-sm font-semibold">Soạn món ăn và khẩu phần bằng AI</p><p className="mt-1 text-sm text-text-muted">Kiểm tra và điều chỉnh trước khi giao cho học viên.</p></div>
            <div className="flex flex-wrap items-end gap-3"><Select label="Phạm vi soạn" value={aiScope} onChange={e => setAiScope(e.target.value)} disabled={isGenerating || isSubmitting} options={[{ value: 'week', label: 'Cả tuần (7 ngày)' }, { value: 'day', label: `Ngày ${selectedDay}` }]} /><Button variant="primary" disabled={isGenerating || isSubmitting || !memberId} onClick={requestAiMeals}>{isGenerating ? 'AI đang soạn…' : 'Soạn bằng AI'}</Button></div>
          </div>

          {/* Day Navigation & Action Bar */}
          <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
              <div>
                <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-500" />
                  <span>Món ăn theo ngày</span>
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Chọn ngày để xem và điều chỉnh món ăn.
                </p>
              </div>

              <details><summary className="cursor-pointer text-sm text-text-muted">Tùy chọn ngày</summary><div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={!currentDayMeals.length || isGenerating} onClick={() => setIsDuplicateModalOpen(true)}>Sao chép ngày {selectedDay}</Button>
                {!repeatWeekly && <Button size="sm" variant="outline" onClick={handleAddNewDay}>Thêm ngày</Button>}
              </div></details>

            </div>

            {/* Day Tabs */}
            <div className="flex flex-wrap gap-2 pb-2">
              {builderDays.map((d) => {
                const count = meals.filter((m) => m.dayNumber === d).length
                const isSelected = selectedDay === d
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDay(d)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer border ${
                      isSelected
                        ? 'bg-primary text-white border-primary'
                        : 'bg-bg-surface-muted text-text-muted border-border-subtle hover:text-text-primary'
                    }`}
                  >
                    <span>Ngày {d}</span>
                    <span
                      className={`text-xs px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-border-subtle text-text-muted'
                      }`}
                    >
                      {count} món
                    </span>
                  </button>
                )
              })}
            </div>

            <details className="border-b border-border-subtle pb-4"><summary className="cursor-pointer text-sm text-text-muted">Điều chỉnh năng lượng và số bữa của ngày {selectedDay}</summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2"><Input label={`Năng lượng ngày ${selectedDay} (kcal)`} type="number" min={800} max={6000} step={1} value={settingsForDay(selectedDay).calories} onChange={e => changeDaySettings('calories', Number(e.target.value))} /><Select label="Số bữa trong ngày" value={String(settingsForDay(selectedDay).mealCount)} onChange={e => changeDaySettings('mealCount', Number(e.target.value))} options={[1,2,3,4,5,6].map(n => ({ value: String(n), label: `${n} bữa` }))} /></div>
              <p className="mt-2 text-xs text-text-muted">Thông số này dùng khi bạn bấm “Soạn bằng AI”. Món đang có được giữ nguyên khi đổi thông số.</p>
            </details>

            <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 rounded-lg bg-bg-surface-muted p-3 text-sm">
              <p className="font-medium">Ngày {selectedDay}: {dayMacroSummary.totalCal} / {dayMacroSummary.target} kcal</p>
              <p className="text-text-muted">Đạm {dayMacroSummary.totalP} g · Tinh bột {dayMacroSummary.totalC} g · Chất béo {dayMacroSummary.totalF} g</p>
            </div>

            {/* Meals in Selected Day */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-text-primary ">
                  Món ăn ngày {selectedDay} ({currentDayMeals.length})
                </h3>
                <Button size="sm" variant="primary" onClick={handleOpenAddMeal} className="gap-1 text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Thêm món cho ngày {selectedDay}</span>
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
                            <span className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary font-bold text-xs">
                              {meal.mealType}
                            </span>
                            <span className="font-bold text-text-primary text-xs">{meal.foodName}</span>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">
                              {meal.estimatedCalories} kcal
                            </span>
                            <button
                              aria-label={`Sửa món ${meal.foodName}`}
                              onClick={() => handleOpenEditMeal(indexInAll)}
                              className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-surface cursor-pointer"
                              title="Chỉnh sửa món"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setPendingDelete(indexInAll)}
                              className="p-1 rounded-md text-danger/80 hover:text-danger hover:bg-danger/10 cursor-pointer"
                              title="Xóa món"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {meal.note && <p className="whitespace-pre-wrap text-sm text-text-primary">{meal.note}</p>}
                        {meal.quantity && (
                          <p className="text-xs text-text-muted">
                            Định lượng: <span className="text-text-primary">{meal.quantity}</span>
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted border-t border-border-subtle pt-2">
                          <span>
                            Đạm: <strong className="text-primary">{meal.proteinGrams}g</strong>
                          </span>
                          <span>
                            Tinh bột: <strong className="text-amber-600 dark:text-amber-400">{meal.carbsGrams}g</strong>
                          </span>
                          <span>
                            Chất béo: <strong className="text-rose-600 dark:text-rose-400">{meal.fatGrams}g</strong>
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border-subtle">
              <p className="text-sm text-text-muted">Học viên chỉ nhận được thực đơn sau khi bạn giao.</p>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSubmitMealPlan(false)}
                  disabled={isSubmitting || isGenerating || !!pendingAiDays || !memberId || !meals.length}
                  className="w-full sm:w-auto gap-1.5"
                >
                  {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                  <span>Lưu nháp</span>
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  onClick={() => handleSubmitMealPlan(true)}
                  disabled={isSubmitting || isGenerating || !!pendingAiDays || !memberId || !meals.length}
                  className="w-full sm:w-auto gap-1.5"
                >
                  {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  <span>Lưu và giao thực đơn</span>
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
        title={editingMealIndex !== null ? 'Sửa món ăn' : `Thêm món ăn · ngày ${selectedDay}`}
        description="Chọn món trong thư viện để hệ thống tự tính dinh dưỡng theo khẩu phần, hoặc tự nhập món ngoài thư viện."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveMealItem} className="space-y-4">
          <Select
            label="Bữa ăn"
            value={mealFormType}
            onChange={(e) => setMealFormType(e.target.value)}
            options={mealTypeOptions(mealFormType)}
          />

          <div className="grid grid-cols-[1fr_7rem] gap-3">
            <Select
              label="Món trong thư viện"
              value={mealFormFoodId}
              onChange={(e) => e.target.value ? fillFromFood(e.target.value, mealFormServings) : setMealFormFoodId('')}
              options={[{ value: '', label: '— Món ngoài thư viện (tự nhập) —' }, ...foods.map((food) => ({ value: food.id, label: `${food.category ? `${food.category} · ` : ''}${food.name} · ${food.servingLabel} · ${food.calories} kcal` }))]}
            />
            <Input
              label="Số khẩu phần"
              type="number"
              min={0.25}
              step={0.25}
              value={mealFormServings}
              disabled={!mealFormFoodId}
              onChange={(e) => fillFromFood(mealFormFoodId, e.target.value)}
            />
          </div>

          {!mealFormFoodId ? <><Input
            label="Tên món và nguyên liệu"
            required
            value={mealFormFood}
            disabled={!!mealFormFoodId}
            onChange={(e) => setMealFormFood(e.target.value)}
            placeholder="Ví dụ: 200g Ức gà áp chảo + Cơm gạo lứt + Bông cải xanh"
          />

          <Input
            label="Khẩu phần"
            value={mealFormQuantity}
            disabled={!!mealFormFoodId}
            onChange={(e) => setMealFormQuantity(e.target.value)}
            placeholder="Ví dụ: 1 phần (400g), 1 muỗng 30g..."
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Input
              label="Calo (kcal)"
              type="number"
              required
              disabled={!!mealFormFoodId}
              value={mealFormCalories}
              onChange={(e) => setMealFormCalories(e.target.value)}
            />
            <Input
              label="Đạm (g)"
              type="number"
              min={0}
              step="any"
              disabled={!!mealFormFoodId}
              value={mealFormProtein}
              onChange={(e) => setMealFormProtein(e.target.value)}
            />
            <Input
              label="Tinh bột (g)"
              type="number"
              min={0}
              step="any"
              disabled={!!mealFormFoodId}
              value={mealFormCarbs}
              onChange={(e) => setMealFormCarbs(e.target.value)}
            />
            <Input
              label="Chất béo (g)"
              type="number"
              min={0}
              step="any"
              disabled={!!mealFormFoodId}
              value={mealFormFat}
              onChange={(e) => setMealFormFat(e.target.value)}
            />
          </div>
          </> : <div className="space-y-2 rounded-lg bg-bg-surface-muted p-3 text-sm"><p className="font-medium">{mealFormFood} · {mealFormQuantity}</p><p>{mealFormCalories} kcal · Đạm {mealFormProtein} g · Tinh bột {mealFormCarbs} g · Chất béo {mealFormFat} g</p><p className="text-xs text-text-muted">Dinh dưỡng được tính theo món ăn và số khẩu phần đã chọn.</p></div>}

          <label className="block text-sm font-medium">Ghi chú món ăn<textarea className="mt-2 w-full rounded-lg border border-border-subtle bg-bg-surface p-3 text-sm" rows={3} maxLength={5000} value={mealFormNote} onChange={e => setMealFormNote(e.target.value)} placeholder="Khẩu phần, cách chế biến hoặc lưu ý cho học viên" /></label>

          <div className="flex justify-end gap-2 pt-4 border-t border-border-subtle">
            <Button type="button" variant="outline" onClick={() => setIsMealModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" disabled={!mealFormFood.trim()}>
              {editingMealIndex !== null ? 'Lưu món ăn' : 'Thêm món ăn'}
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
        title={`Sao chép thực đơn ngày ${selectedDay}`}
        description="Sao chép món ăn và khẩu phần sang ngày khác."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-text-muted">
            Chọn số thứ tự ngày bạn muốn sao chép đến. Nếu ngày đích đã có món ăn, nội dung sẽ được ghi đè bằng các món
            từ Ngày {selectedDay}.
          </p>

          <Input
            label="Sao chép sang ngày"
            type="number"
            min={1}
            max={repeatWeekly ? 7 : 365}
            value={targetDuplicateDay}
            onChange={(e) => setTargetDuplicateDay(Math.min(repeatWeekly ? 7 : 365, Math.max(1, Number(e.target.value) || 1)))}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
            <Button variant="outline" onClick={() => setIsDuplicateModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleDuplicateDay} disabled={targetDuplicateDay === selectedDay}>
              Sao chép
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
        title={viewingPlan?.title || 'Chi tiết thực đơn'}
        description={`Học viên: ${viewingPlan?.member?.fullName || viewingPlan?.member?.user?.fullName || (viewingPlan ? getMemberDisplayName(viewingPlan.memberId) : '')}`}
        maxWidth="xl"
      >
        {viewingPlan && (
          <div className="space-y-5">
            {/* Header info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-bg-surface-muted border border-border-subtle text-xs">
              <div>
                <span className="text-text-muted block text-xs">Trạng thái:</span>
                <MealStatus status={viewingPlan.status} />
              </div>
              <div>
                <span className="text-text-muted block text-xs">Mục tiêu calo:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {viewingPlan.dailyCalorieTarget ? `${viewingPlan.dailyCalorieTarget} kcal/ngày` : 'Chưa đặt'}
                </span>
              </div>
              <div>
                <span className="text-text-muted block text-xs">Áp dụng từ:</span>
                <span className="font-medium text-text-primary">{formatDate(viewingPlan.startDate)}</span>
              </div>
            </div>

            {/* Medical Disclaimer Reminder */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
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
                    <span className="text-xs text-text-muted block">Tổng Calo</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {viewingDayMacro.cal} kcal
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-text-muted block">Đạm</span>
                    <span className="font-bold text-primary">{viewingDayMacro.p}g</span>
                  </div>
                  <div>
                    <span className="text-xs text-text-muted block">Tinh bột</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">{viewingDayMacro.c}g</span>
                  </div>
                  <div>
                    <span className="text-xs text-text-muted block">Chất béo</span>
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
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                          {item.mealType}
                        </span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {item.estimatedCalories || 0} kcal
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-text-primary">{item.foodName}</p>
                      {item.quantity && (
                        <p className="text-xs text-text-muted">Định lượng: {item.quantity}</p>
                      )}
                      <div className="flex gap-4 text-xs text-text-muted border-t border-border-subtle pt-1">
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

              {viewingPlanItems.length > 0 && (
                <Button variant="outline" onClick={() => { setTemplateTitle(viewingPlan.title); setSaveTemplateFor(viewingPlan) }} disabled={isSubmitting} className="gap-1.5">
                  <Copy className="h-4 w-4" />
                  <span>Lưu thành mẫu</span>
                </Button>
              )}
              {viewingPlan.status === 'ACTIVE' && <Button variant="outline" onClick={() => void handleDuplicatePlan(viewingPlan)} disabled={isSubmitting || isGenerating}>Tạo bản điều chỉnh</Button>}
              {viewingPlan.status === 'DRAFT' && (
                <Button variant="outline" onClick={() => void openDraftForEdit(viewingPlan)} disabled={isSubmitting} className="gap-1.5">
                  <Edit3 className="h-4 w-4" />
                  <span>Sửa bản nháp</span>
                </Button>
              )}
              {viewingPlan.status === 'DRAFT' && (
                <Button
                  variant="primary"
                  onClick={() => handleAssignExistingPlan(viewingPlan.id)}
                  disabled={isSubmitting}
                  className="gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Giao thực đơn</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!saveTemplateFor}
        onClose={() => setSaveTemplateFor(null)}
        title="Lưu thành mẫu của tôi"
        description="Mẫu chỉ mình bạn thấy. Lần sau chọn mẫu này để tạo thực đơn cho học viên khác, khẩu phần tự co giãn theo kcal."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <Input label="Tên mẫu" required value={templateTitle} onChange={(e) => setTemplateTitle(e.target.value)} />
          <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
            <Button variant="outline" onClick={() => setSaveTemplateFor(null)}>Hủy</Button>
            <Button variant="primary" onClick={() => void handleSaveAsTemplate()} disabled={!templateTitle.trim() || isSubmitting}>Lưu mẫu</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!pendingAiDays} title="Soạn lại thực đơn bằng AI?" message={pendingAiDays?.length === 7 ? 'Toàn bộ món đang soạn sẽ được thay bằng thực đơn mới gồm 7 ngày, lặp lại hằng tuần.' : 'Món ăn của ngày đã chọn sẽ được thay bằng gợi ý mới. Các ngày khác được giữ nguyên.'} confirmLabel="Soạn lại" onCancel={() => setPendingAiDays(null)} onConfirm={() => { const days = pendingAiDays; setPendingAiDays(null); if (days) void generateDays(days) }} />
      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title="Xóa món này?"
        message={<>Bỏ “{pendingDelete !== null ? meals[pendingDelete]?.foodName : ''}” khỏi ngày {selectedDay}. {editingPlanId ? 'Thay đổi được ghi khi bạn bấm lưu.' : ''}</>}
        confirmLabel="Xóa món"
        tone="danger"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete !== null && handleDeleteMeal(pendingDelete)}
      />
      <ConfirmDialog
        isOpen={!!pendingArchive}
        title={pendingArchive?.status === 'DRAFT' ? 'Lưu trữ bản nháp?' : 'Ngừng áp dụng thực đơn?'}
        message={<>“{pendingArchive?.title}” {pendingArchive?.status === 'DRAFT' ? 'sẽ được chuyển vào danh sách đã lưu trữ.' : 'sẽ không còn là thực đơn hiện tại của học viên.'} Bạn vẫn có thể xem và sao chép sau này.</>}
        confirmLabel={pendingArchive?.status === 'DRAFT' ? 'Lưu trữ bản nháp' : 'Ngừng áp dụng'}
        isLoading={isSubmitting}
        onCancel={() => setPendingArchive(null)}
        onConfirm={() => pendingArchive && void handleArchivePlan(pendingArchive)}
      />
    </div>
  )
}
