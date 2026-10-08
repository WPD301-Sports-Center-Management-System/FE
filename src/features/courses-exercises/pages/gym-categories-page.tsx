import { useState } from 'react'
import { Dumbbell, Plus } from 'lucide-react'
import { db } from '@/mocks/mock-server'
import { Button } from '@/shared/components/ui/button'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { Modal } from '@/shared/components/ui/modal'
import { Input, Select, Textarea } from '@/shared/components/ui/input'
import type { MuscleGroup, Exercise, TrainingCourse } from '@/shared/types/api'

export function GymCategoriesPage() {
  const [activeTab, setActiveTab] = useState<'muscle' | 'exercise' | 'course'>('course')
  const [muscleGroups] = useState<MuscleGroup[]>([...db.muscleGroups])
  const [exercises, setExercises] = useState<Exercise[]>([...db.exercises])
  const [courses] = useState<TrainingCourse[]>([...db.courses])

  // New Exercise Modal
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false)
  const [exerciseForm, setExerciseForm] = useState({
    name: '',
    muscleGroupId: 'mg-01',
    equipmentRequired: '',
    difficultyLevel: 'Trung bình',
    instructions: '',
  })

  const handleAddExercise = (e: React.FormEvent) => {
    e.preventDefault()
    const mg = muscleGroups.find((m) => m.id === exerciseForm.muscleGroupId)
    const newEx: Exercise = {
      id: 'ex-' + Date.now(),
      name: exerciseForm.name,
      equipmentRequired: exerciseForm.equipmentRequired,
      difficultyLevel: exerciseForm.difficultyLevel,
      instructions: exerciseForm.instructions,
      muscleGroups: [{ id: exerciseForm.muscleGroupId, name: mg?.name, isPrimary: true }],
    }
    db.exercises.push(newEx)
    setExercises([...db.exercises])
    setIsExerciseModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Danh Mục & Thư Viện Bài Tập (WEB-MAN-05)</h1>
          <p className="text-xs text-slate-400 mt-1">Quản lý nhóm cơ, bài tập mẫu và các khóa đào tạo PT 1:1</p>
        </div>
        {activeTab === 'exercise' && (
          <Button onClick={() => setIsExerciseModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Thêm bài tập mới</span>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('course')}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'course'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Khóa tập PT ({courses.length})
        </button>
        <button
          onClick={() => setActiveTab('exercise')}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'exercise'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Thư viện Bài tập ({exercises.length})
        </button>
        <button
          onClick={() => setActiveTab('muscle')}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'muscle'
              ? 'border-orange-500 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Nhóm cơ ({muscleGroups.length})
        </button>
      </div>

      {/* Tab: Courses */}
      {activeTab === 'course' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((c) => (
            <div key={c.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="rounded-full bg-orange-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-orange-400">
                    Độ khó: {c.difficultyLevel}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1.5">{c.name}</h3>
                </div>
                <StatusBadge status={c.isActive ? 'ACTIVE' : 'INACTIVE'} />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{c.description}</p>
              <div className="rounded-xl bg-slate-800/50 p-3 text-xs text-slate-300">
                <span className="font-semibold text-slate-200">Mục tiêu:</span> {c.objective}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Exercises */}
      {activeTab === 'exercise' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {exercises.map((ex) => (
            <div key={ex.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-orange-400">
                  <Dumbbell className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{ex.name}</h4>
                  <p className="text-[10px] text-slate-400">Thiết bị: {ex.equipmentRequired}</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 line-clamp-2">{ex.instructions}</p>
              <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-800 pt-2">
                <span>Nhóm cơ chính: {ex.muscleGroups[0]?.name || 'Toàn thân'}</span>
                <span className="font-semibold text-orange-400">{ex.difficultyLevel}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Muscle Groups */}
      {activeTab === 'muscle' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {muscleGroups.map((mg) => (
            <div key={mg.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-2">
              <h4 className="text-sm font-bold text-white">{mg.name}</h4>
              <p className="text-xs text-slate-400">{mg.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add Exercise */}
      <Modal
        isOpen={isExerciseModalOpen}
        onClose={() => setIsExerciseModalOpen(false)}
        title="Thêm Bài Tập Mới"
        description="Thêm động tác vào thư viện bài tập huấn luyện"
      >
        <form onSubmit={handleAddExercise} className="space-y-4">
          <Input
            label="Tên bài tập"
            required
            value={exerciseForm.name}
            onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })}
            placeholder="Ví dụ: Dumbbell Shoulder Press"
          />
          <Select
            label="Nhóm cơ chính"
            value={exerciseForm.muscleGroupId}
            onChange={(e) => setExerciseForm({ ...exerciseForm, muscleGroupId: e.target.value })}
            options={muscleGroups.map((m) => ({ value: m.id, label: m.name }))}
          />
          <Input
            label="Thiết bị yêu cầu"
            required
            value={exerciseForm.equipmentRequired}
            onChange={(e) => setExerciseForm({ ...exerciseForm, equipmentRequired: e.target.value })}
            placeholder="Ví dụ: Tạ đơn, Ghế dốc"
          />
          <Textarea
            label="Hướng dẫn thực hiện"
            value={exerciseForm.instructions}
            onChange={(e) => setExerciseForm({ ...exerciseForm, instructions: e.target.value })}
            placeholder="Mô tả chuyển động và lưu ý an toàn..."
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsExerciseModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" variant="primary">
              Lưu bài tập
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
