import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, Activity, Dumbbell, AlertTriangle, RefreshCw, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input, Textarea, Select } from '@/shared/components/ui/input'
import { ptBookingsService } from '@/features/pt-bookings-schedule/services/pt-bookings.service'
import { coursesExercisesService } from '@/features/courses-exercises/services/courses-exercises.service'
import { isAppApiError } from '@/shared/api/api-error'
import { formatDateTime } from '@/shared/utils/date'
import type { Booking, Exercise } from '@/shared/types/api'
import type { CreateTrainingResultPayload } from '@/features/pt-bookings-schedule/types/pt-bookings.types'

interface SetItem {
  reps: number
  weight: number
  rpe: number
}

export function TrainingResultPage() {
  const [completedBookings, setCompletedBookings] = useState<Booking[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedBookingId, setSelectedBookingId] = useState('')
  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const [setsData, setSetsData] = useState<SetItem[]>([
    { reps: 10, weight: 50, rpe: 7 },
    { reps: 10, weight: 55, rpe: 8 },
    { reps: 8, weight: 60, rpe: 9 },
  ])
  const [coachComment, setCoachComment] = useState('Hội viên đẩy tốt, cơ ngực căng tối đa, hoàn thành đúng form.')
  const [progressScore, setProgressScore] = useState(90)

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const [bookingsRes, exercisesRes] = await Promise.all([
        ptBookingsService.getBookings({ limit: 100 }).catch(() => ({ data: [] })),
        coursesExercisesService.getExercises({ limit: 100 }).catch(() => ({ data: [] })),
      ])

      const allBookings = (bookingsRes as any)?.data || (Array.isArray(bookingsRes) ? bookingsRes : [])
      const exList = (exercisesRes as any)?.data || (Array.isArray(exercisesRes) ? exercisesRes : [])

      // Filter bookings that are COMPLETED (or allow CONFIRMED for testing ease if none completed)
      const finished = allBookings.filter((b: Booking) => b.status === 'COMPLETED')
      const targetBookings = finished.length > 0 ? finished : allBookings

      setCompletedBookings(targetBookings)
      setExercises(exList)

      if (targetBookings.length > 0 && !selectedBookingId) {
        setSelectedBookingId(targetBookings[0].id)
      }
      if (exList.length > 0 && !selectedExerciseId) {
        setSelectedExerciseId(exList[0].id)
      }
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Lỗi tải dữ liệu buổi tập')
      } else {
        setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [selectedBookingId, selectedExerciseId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAddSet = () => {
    const lastSet = setsData[setsData.length - 1] || { reps: 10, weight: 50, rpe: 8 }
    setSetsData([...setsData, { reps: lastSet.reps, weight: lastSet.weight, rpe: lastSet.rpe }])
  }

  const handleRemoveSet = (index: number) => {
    if (setsData.length <= 1) return
    setSetsData(setsData.filter((_, i) => i !== index))
  }

  const handleSaveResult = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBookingId) {
      setErrorMessage('Vui lòng chọn buổi tập cần ghi nhận kết quả.')
      return
    }

    if (!selectedExerciseId) {
      setErrorMessage('Vui lòng chọn bài tập thực hiện.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    const selectedExercise = exercises.find((ex) => ex.id === selectedExerciseId)

    const payload: CreateTrainingResultPayload = {
      performedAt: new Date().toISOString(),
      result: [
        {
          exerciseId: selectedExerciseId,
          exerciseName: selectedExercise?.name || 'Bài tập chính',
          sets: setsData.map((s) => ({
            reps: Number(s.reps),
            weight: Number(s.weight),
            rpe: Number(s.rpe),
          })),
          completed: true,
          note: 'Hoàn thành đúng kỹ thuật & nhịp thở',
        },
      ],
      coachComment,
      progressScore: Number(progressScore),
    }

    try {
      await ptBookingsService.createTrainingResult(selectedBookingId, payload)
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 4000)
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Không thể lưu kết quả buổi tập')
      } else {
        setErrorMessage('Lỗi hệ thống khi ghi nhận kết quả buổi tập')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Ghi Nhận Kết Quả Buổi Tập (WEB-COA-08)</h1>
          <p className="text-xs text-slate-400 mt-1">
            Ghi log số hiệp thực tế, tải trọng tạ, chỉ số gắng sức (RPE 1-10) và nhận xét của HLV cho buổi tập đã hoàn thành
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={loadData}
          disabled={isLoading}
          className="flex items-center gap-1.5"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-xs text-red-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isSaved && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>Đã ghi nhận và xuất bản kết quả buổi tập lên hệ thống thành công!</span>
        </div>
      )}

      <form onSubmit={handleSaveResult} className="space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="h-4 w-4 text-orange-400" />
            <span>Thông Tin Buổi Dạy</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Chọn Buổi Tập PT</label>
              {completedBookings.length === 0 ? (
                <div className="text-xs text-amber-400 p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/40">
                  Chưa có buổi tập nào trên hệ thống.
                </div>
              ) : (
                <select
                  value={selectedBookingId}
                  onChange={(e) => setSelectedBookingId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {completedBookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.memberName || 'Hội viên'} – {b.courseName || 'Khóa PT'} (
                      {b.status === 'COMPLETED' ? 'Đã hoàn thành' : b.status}) – {formatDateTime(b.startsAt)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Bài Tập Trong Thư Viện</label>
              {exercises.length === 0 ? (
                <div className="text-xs text-slate-400 p-2.5 rounded-xl bg-slate-800/40">
                  Đang tải thư viện bài tập...
                </div>
              ) : (
                <select
                  value={selectedExerciseId}
                  onChange={(e) => setSelectedExerciseId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {exercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name} ({ex.category || 'Tập lực'})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Sets logging */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-cyan-400" />
              <span>Chi Tiết Hiệp Tập & Mức Gắng Sức (RPE 1-10)</span>
            </h2>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAddSet}
              className="text-xs flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              Thêm hiệp
            </Button>
          </div>

          <div className="space-y-3">
            {setsData.map((s, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-5 gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 items-center text-xs"
              >
                <span className="font-bold text-white sm:col-span-1">Hiệp {idx + 1}</span>
                <Input
                  label="Số Reps"
                  type="number"
                  min={1}
                  value={s.reps}
                  onChange={(e) => {
                    const copy = [...setsData]
                    copy[idx].reps = Number(e.target.value)
                    setSetsData(copy)
                  }}
                />
                <Input
                  label="Khối lượng (Kg)"
                  type="number"
                  min={0}
                  step={0.5}
                  value={s.weight}
                  onChange={(e) => {
                    const copy = [...setsData]
                    copy[idx].weight = Number(e.target.value)
                    setSetsData(copy)
                  }}
                />
                <Input
                  label="RPE (Thang 1-10)"
                  type="number"
                  max={10}
                  min={1}
                  value={s.rpe}
                  onChange={(e) => {
                    const copy = [...setsData]
                    copy[idx].rpe = Number(e.target.value)
                    setSetsData(copy)
                  }}
                />
                <div className="flex justify-end pt-5">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveSet(idx)}
                    disabled={setsData.length <= 1}
                    className="text-slate-500 hover:text-red-400"
                    title="Xóa hiệp"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
            <div className="md:col-span-3">
              <Textarea
                label="Đánh giá & Góp ý của HLV"
                required
                value={coachComment}
                onChange={(e) => setCoachComment(e.target.value)}
              />
            </div>
            <div>
              <Input
                label="Điểm tiến độ (0-100)"
                type="number"
                min={0}
                max={100}
                value={progressScore}
                onChange={(e) => setProgressScore(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              variant="primary"
              className="px-8"
              disabled={isSubmitting || completedBookings.length === 0 || exercises.length === 0}
            >
              {isSubmitting ? 'Đang lưu...' : 'Xuất Bản Kết Quả (Publish)'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
