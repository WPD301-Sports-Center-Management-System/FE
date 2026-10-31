import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle2, Activity, Dumbbell, AlertTriangle, RefreshCw, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input, Textarea } from '@/shared/components/ui/input'
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

export function TrainingResultPage({ bookingId }: { bookingId?: string } = {}) {
  const [searchParams] = useSearchParams()
  const targetBookingId = bookingId ?? searchParams.get('bookingId')

  const [completedBookings, setCompletedBookings] = useState<Booking[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedBookingId, setSelectedBookingId] = useState('')
  const [selectedExerciseId, setSelectedExerciseId] = useState('')
  const [setsData, setSetsData] = useState<SetItem[]>([
    { reps: 10, weight: 0, rpe: 7 },
  ])
  const [coachComment, setCoachComment] = useState('')
  const [progressScore, setProgressScore] = useState<number | ''>('')

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  // What the last save did; drafts stay editable (saving again overwrites the same draft on the server).
  const [isSaved, setIsSaved] = useState<'draft' | 'published' | false>(false)
  const [publishOnSave, setPublishOnSave] = useState(true)
  const formRef = useRef<HTMLFormElement>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      // This page is Coach-only: GET /pt-bookings is staff-only (403 for a Coach), so read the Coach's own sessions.
      let allBookings: Booking[] = []
      try {
        const bookingsRes = await ptBookingsService.getMyCoachBookings({ limit: 100 })
        allBookings =
          (bookingsRes as any)?.data ||
          (bookingsRes as any)?.items ||
          (Array.isArray(bookingsRes) ? bookingsRes : [])
      } catch {
        // ignore: the page shows its empty state
      }

      let exList: Exercise[] = []
      try {
        const exercisesRes = await coursesExercisesService.getExercises({ limit: 100 })
        exList =
          (exercisesRes as any)?.data ||
          (exercisesRes as any)?.items ||
          (Array.isArray(exercisesRes) ? exercisesRes : [])
      } catch {
        exList = []
      }

      // ONLY allow bookings that are COMPLETED
      const finished = allBookings.filter((b: Booking) => b.status === 'COMPLETED')

      setCompletedBookings(finished)
      setExercises(exList)

      if (finished.length > 0) {
        if (targetBookingId && finished.some((b: Booking) => b.id === targetBookingId)) {
          setSelectedBookingId(targetBookingId)
        } else if (!selectedBookingId || !finished.some((b: Booking) => b.id === selectedBookingId)) {
          setSelectedBookingId(finished[0].id)
        }
      } else {
        setSelectedBookingId('')
      }

      if (exList.length > 0 && (!selectedExerciseId || !exList.some((e: Exercise) => e.id === selectedExerciseId))) {
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
  }, [selectedBookingId, selectedExerciseId, targetBookingId])

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

  // `publish` is passed in (not read from state) so the button that was clicked decides, in the same event.
  const saveResult = async (publish: boolean) => {
    if (formRef.current && !formRef.current.reportValidity()) return
    setPublishOnSave(publish)
    if (!selectedBookingId) {
      setErrorMessage('Vui lòng chọn buổi tập cần ghi nhận kết quả.')
      return
    }

    if (!selectedExerciseId) {
      setErrorMessage('Vui lòng chọn bài tập thực hiện.')
      return
    }

    if (setsData.some((s) => !Number.isInteger(s.reps) || s.reps < 1 || s.reps > 999)) {
      setErrorMessage('Số reps phải là số nguyên từ 1 đến 999.')
      return
    }
    if (setsData.some((s) => !Number.isFinite(s.weight) || s.weight < 0)) {
      setErrorMessage('Khối lượng phải lớn hơn hoặc bằng 0 kg.')
      return
    }
    if (setsData.some((s) => !Number.isFinite(s.rpe) || s.rpe < 1 || s.rpe > 10)) {
      setErrorMessage('RPE phải nằm trong khoảng từ 1 đến 10.')
      return
    }
    if (progressScore !== '' && (!Number.isInteger(progressScore) || progressScore < 0 || progressScore > 100)) {
      setErrorMessage('Điểm tiến độ phải là số nguyên từ 0 đến 100.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)


    const payload: CreateTrainingResultPayload = {
      performedAt: new Date().toISOString(),
      result: [
        {
          exerciseId: selectedExerciseId,
          sets: setsData.map((s) => ({
            reps: Number(s.reps),
            weight: Number(s.weight),
            rpe: Number(s.rpe),
          })),
          completed: true,
        },
      ],
      coachComment,
      progressScore: progressScore === '' ? undefined : Number(progressScore),
    }

    try {
      const res = await ptBookingsService.createTrainingResult(selectedBookingId, payload)
      const resId = res?.id || res?.data?.id
      if (publish && resId) {
        try {
          await ptBookingsService.publishTrainingResult(resId)
        } catch (publishErr) {
          setIsSaved('draft')
          setErrorMessage(`Đã lưu nháp nhưng chưa công bố: ${isAppApiError(publishErr) ? publishErr.message : 'lỗi kết nối'}. Bấm "Lưu & công bố kết quả" lần nữa để thử lại.`)
          return
        }
      }
      setIsSaved(publish ? 'published' : 'draft')
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
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Ghi Nhận Kết Quả Buổi Tập</h1>
          <p className="text-xs text-text-muted mt-1">
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
        <div className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-xs text-danger flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-danger" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isSaved && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>{isSaved === 'published' ? 'Đã công bố kết quả buổi tập. Học viên đã xem được.' : 'Đã lưu nháp. Bạn có thể sửa và lưu lại; học viên chỉ thấy khi bạn công bố.'}</span>
        </div>
      )}

      <form ref={formRef} onSubmit={(e) => { e.preventDefault(); void saveResult(true) }} className="space-y-6">
        <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span>Thông Tin Buổi Dạy</span>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-text-muted mb-1.5 block">Chọn Buổi Tập PT</label>
              {completedBookings.length === 0 ? (
                <div className="text-xs text-amber-600 dark:text-amber-400 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  Chưa có buổi tập nào đã hoàn thành (COMPLETED) để ghi nhận kết quả.
                </div>
              ) : (
                <select
                  value={selectedBookingId}
                  onChange={(e) => setSelectedBookingId(e.target.value)}
                  className="w-full bg-bg-input border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {completedBookings.map((b) => (
                    <option key={b.id} value={b.id} className="bg-bg-surface text-text-primary">
                      {b.memberName || 'Hội viên'} – {b.courseName || 'Khóa PT'} (Đã hoàn thành) – {formatDateTime(b.startsAt)}
                    </option>
                  ))}
                </select>
              )}
              {(() => {
                const booking = completedBookings.find((b) => b.id === selectedBookingId)
                return booking ? (
                  <p className="mt-2 text-xs text-text-muted">
                    Trạng thái: Buổi đã hoàn thành · {formatDateTime(booking.startsAt)}
                  </p>
                ) : null
              })()}
            </div>

            <div>
              <label className="text-xs font-semibold text-text-muted mb-1.5 block">Bài Tập Trong Thư Viện</label>
              {exercises.length === 0 ? (
                <div className="text-xs text-text-muted p-2.5 rounded-xl bg-bg-surface-muted">
                  Đang tải thư viện bài tập...
                </div>
              ) : (
                <select
                  value={selectedExerciseId}
                  onChange={(e) => setSelectedExerciseId(e.target.value)}
                  className="w-full bg-bg-input border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {exercises.map((ex) => (
                    <option key={ex.id} value={ex.id} className="bg-bg-surface text-text-primary">
                      {ex.name} {ex.difficultyLevel ? `(${ex.difficultyLevel})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Sets logging */}
        <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-primary" />
              <span>Chi Tiết Hiệp Tập & Mức Gắng Sức (RPE 1-10)</span>
            </h2>
            <p className="text-xs text-text-muted sm:max-w-xs sm:text-right">RPE: 1–3 nhẹ · 4–6 vừa · 7–8 nặng · 9–10 tối đa</p>
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
                className="grid grid-cols-1 sm:grid-cols-5 gap-3 rounded-xl border border-border-subtle bg-bg-surface-muted p-4 items-center text-xs"
              >
                <span className="font-bold text-text-primary sm:col-span-1">Hiệp {idx + 1}</span>
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
                    className="text-text-muted hover:text-danger cursor-pointer"
                    title={`Xóa hiệp ${idx + 1}`}
                    aria-label={`Xóa hiệp ${idx + 1}`}
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
                placeholder="Nhập đánh giá và nhận xét của HLV cho buổi tập..."
              />
            </div>
            <div>
              <Input
                label="Điểm tiến độ (0-100)"
                type="number"
                min={0}
                max={100}
                value={progressScore}
                onChange={(e) => setProgressScore(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0–100"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => void saveResult(false)}
              isLoading={isSubmitting && !publishOnSave}
              disabled={isSubmitting || completedBookings.length === 0 || exercises.length === 0}
            >
              Lưu nháp
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="px-8"
              isLoading={isSubmitting && publishOnSave}
              disabled={isSubmitting || completedBookings.length === 0 || exercises.length === 0}
            >
              Lưu & công bố kết quả
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
