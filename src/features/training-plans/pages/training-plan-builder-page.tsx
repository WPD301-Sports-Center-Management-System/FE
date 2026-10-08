import { useState } from 'react'
import { Plus, Trash2, Dumbbell, Check, FileText } from 'lucide-react'
import { db } from '@/mocks/mock-server'
import { Button } from '@/shared/components/ui/button'
import { Input, Select } from '@/shared/components/ui/input'
import type { TrainingPlan } from '@/shared/types/api'

export function TrainingPlanBuilderPage() {
  const coach = db.coaches[0]
  const [title, setTitle] = useState('Giáo án Siết Cơ & Tăng Sức Mạnh Tuần 2')
  const [goal, setGoal] = useState('Tối ưu hóa phom tạ Barbell và kiểm soát nhịp hạ tạ 3 giây')
  const [memberId, setMemberId] = useState(db.members[0].id)
  const [exercises, setExercises] = useState([
    { exerciseId: 'ex-01', name: 'Barbell Bench Press', sets: 4, reps: 10, weight: '65.00', rest: 90 },
    { exerciseId: 'ex-03', name: 'Lat Pulldown', sets: 3, reps: 12, weight: '55.00', rest: 60 },
  ])
  const [isSaved, setIsSaved] = useState(false)

  const handleAddExerciseRow = () => {
    const ex = db.exercises[0]
    setExercises([
      ...exercises,
      { exerciseId: ex.id, name: ex.name, sets: 3, reps: 10, weight: '40.00', rest: 60 },
    ])
  }

  const handleRemoveExerciseRow = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index))
  }

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault()
    const student = db.members.find((m) => m.id === memberId)
    const newPlan: TrainingPlan = {
      id: 'tp-' + Date.now(),
      coachId: coach.id,
      memberId,
      ptPurchaseId: 'pur-01',
      title,
      goal,
      startDate: new Date().toISOString().split('T')[0],
      status: 'ASSIGNED',
      assignedAt: new Date().toISOString(),
      memberName: student?.fullName,
      exercises: exercises.map((item, idx) => ({
        id: 'pe-' + Date.now() + idx,
        exerciseId: item.exerciseId,
        exerciseName: item.name,
        sets: item.sets,
        reps: item.reps,
        targetWeight: item.weight,
        restSeconds: item.rest,
        sortOrder: idx + 1,
      })),
    }

    db.trainingPlans.unshift(newPlan)
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Trình Soạn Giáo Án Huấn Luyện (WEB-COA-07)</h1>
        <p className="text-xs text-slate-400 mt-1">
          Thiết kế bài tập, hiệp tập (sets), số lần (reps) và thời gian nghỉ cá nhân hóa cho học viên
        </p>
      </div>

      {isSaved && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-xs text-emerald-300 flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>Đã lưu và giao giáo án thành công cho học viên!</span>
        </div>
      )}

      <form onSubmit={handleSavePlan} className="space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="h-4 w-4 text-orange-400" />
            <span>Thông Tin Giáo Án</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Tên giáo án"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Select
              label="Giao cho Học viên"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              options={db.members.map((m) => ({ value: m.id, label: m.fullName }))}
            />
          </div>

          <Input
            label="Mục tiêu trọng tâm của buổi tập"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
        </div>

        {/* Exercises list */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-cyan-400" />
              <span>Danh Sách Động Tác & Hiệp Tập</span>
            </h2>
            <Button type="button" size="sm" variant="outline" onClick={handleAddExerciseRow} className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              <span>Thêm động tác</span>
            </Button>
          </div>

          <div className="space-y-3">
            {exercises.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col sm:flex-row items-center gap-3"
              >
                <div className="w-full sm:w-1/3">
                  <Select
                    label="Bài tập"
                    value={item.exerciseId}
                    onChange={(e) => {
                      const found = db.exercises.find((ex) => ex.id === e.target.value)
                      const copy = [...exercises]
                      copy[idx].exerciseId = e.target.value
                      copy[idx].name = found?.name || 'Bài tập'
                      setExercises(copy)
                    }}
                    options={db.exercises.map((ex) => ({ value: ex.id, label: ex.name }))}
                  />
                </div>

                <div className="w-full sm:w-1/6">
                  <Input
                    label="Số Sets"
                    type="number"
                    value={item.sets}
                    onChange={(e) => {
                      const copy = [...exercises]
                      copy[idx].sets = Number(e.target.value)
                      setExercises(copy)
                    }}
                  />
                </div>

                <div className="w-full sm:w-1/6">
                  <Input
                    label="Số Reps"
                    type="number"
                    value={item.reps}
                    onChange={(e) => {
                      const copy = [...exercises]
                      copy[idx].reps = Number(e.target.value)
                      setExercises(copy)
                    }}
                  />
                </div>

                <div className="w-full sm:w-1/6">
                  <Input
                    label="Tạ (Kg)"
                    type="number"
                    value={item.weight}
                    onChange={(e) => {
                      const copy = [...exercises]
                      copy[idx].weight = e.target.value
                      setExercises(copy)
                    }}
                  />
                </div>

                <div className="w-full sm:w-1/6 flex items-end gap-2 pt-5">
                  <button
                    type="button"
                    onClick={() => handleRemoveExerciseRow(idx)}
                    className="p-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-950/30 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" variant="primary" className="px-8">
              Lưu & Giao Giáo Án
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
