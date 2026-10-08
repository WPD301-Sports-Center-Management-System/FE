import { useState } from 'react'
import { CheckCircle2, Activity, Dumbbell } from 'lucide-react'
import { db } from '@/mocks/mock-server'
import { Button } from '@/shared/components/ui/button'
import { Input, Textarea, Select } from '@/shared/components/ui/input'
import type { TrainingResult } from '@/shared/types/api'

export function TrainingResultPage() {
  const coach = db.coaches[0]
  const [selectedBookingId, setSelectedBookingId] = useState(db.bookings[0]?.id || 'bkg-01')
  const [exerciseName, setExerciseName] = useState('Barbell Bench Press')
  const [setsData, setSetsData] = useState([
    { reps: 10, weight: '55.00', rpe: 7 },
    { reps: 10, weight: '60.00', rpe: 8 },
    { reps: 8, weight: '60.00', rpe: 9 },
  ])
  const [coachComment, setCoachComment] = useState('Hội viên đẩy tốt, cơ ngực căng tối đa, hiệp 3 hơi mỏi cơ tay sau.')
  const [progressScore, setProgressScore] = useState(92)
  const [isSaved, setIsSaved] = useState(false)

  const handleSaveResult = (e: React.FormEvent) => {
    e.preventDefault()
    const targetBooking = db.bookings.find((b) => b.id === selectedBookingId)

    const newResult: TrainingResult = {
      id: 'tr-' + Date.now(),
      ptBookingId: selectedBookingId,
      memberId: targetBooking?.memberId || db.members[0].id,
      coachId: coach.id,
      performedAt: new Date().toISOString(),
      result: [
        {
          exerciseId: 'ex-01',
          exerciseName,
          sets: setsData,
          completed: true,
          note: 'Hoàn thành đúng kỹ thuật',
        },
      ],
      coachComment,
      progressScore: Number(progressScore),
      status: 'PUBLISHED',
      publishedAt: new Date().toISOString(),
    }

    db.trainingResults.unshift(newResult)
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Ghi Nhận Kết Quả Buổi Tập (WEB-COA-08)</h1>
        <p className="text-xs text-slate-400 mt-1">
          Ghi log số hiệp thực tế, tải trọng tạ, chỉ số gắng sức (RPE 1-10) và nhận xét của HLV
        </p>
      </div>

      {isSaved && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>Đã ghi nhận và xuất bản kết quả buổi tập thành công!</span>
        </div>
      )}

      <form onSubmit={handleSaveResult} className="space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="h-4 w-4 text-orange-400" />
            <span>Thông Tin Buổi Dạy</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Buổi tập PT"
              value={selectedBookingId}
              onChange={(e) => setSelectedBookingId(e.target.value)}
              options={db.bookings.map((b) => ({
                value: b.id,
                label: `${b.memberName} - ${b.courseName}`,
              }))}
            />
            <Input
              label="Tên bài tập chính"
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
            />
          </div>
        </div>

        {/* Sets logging */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-cyan-400" />
            <span>Chi Tiết Hiệp Tập & Mức Gắng Sức (RPE)</span>
          </h2>

          <div className="space-y-3">
            {setsData.map((s, idx) => (
              <div
                key={idx}
                className="grid grid-cols-4 gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 items-center text-xs"
              >
                <span className="font-bold text-white">Hiệp {idx + 1}</span>
                <Input
                  label="Số Reps"
                  type="number"
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
                  value={s.weight}
                  onChange={(e) => {
                    const copy = [...setsData]
                    copy[idx].weight = e.target.value
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
                value={progressScore}
                onChange={(e) => setProgressScore(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" variant="primary" className="px-8">
              Xuất Bản Kết Quả (Publish)
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
