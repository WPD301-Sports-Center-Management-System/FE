import { useState } from 'react'
import { FileText, Activity } from 'lucide-react'
import { Link } from 'react-router-dom'
import { db } from '@/mocks/mock-server'
import { Button } from '@/shared/components/ui/button'
import { Modal } from '@/shared/components/ui/modal'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import type { Purchase } from '@/shared/types/api'

export function CoachStudentsPage() {
  const coach = db.coaches[0]
  const [purchases] = useState<Purchase[]>(db.purchases.filter((p) => p.coachId === coach.id))
  const [selectedStudent, setSelectedStudent] = useState<Purchase | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Học Viên Của Tôi (WEB-COA-05, 06)</h1>
        <p className="text-xs text-slate-400 mt-1">
          Danh sách hội viên đang theo học các gói huấn luyện PT 1:1 do bạn trực tiếp giảng dạy
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {purchases.map((p) => (
          <div key={p.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">{p.memberName}</h3>
                <p className="text-[10px] font-mono text-orange-400">Mã: {p.memberCode}</p>
              </div>
              <StatusBadge status={p.status} />
            </div>

            <div className="rounded-xl bg-slate-800/40 p-3.5 text-xs text-slate-300 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Khóa tập:</span>
                <span className="font-semibold text-slate-200">{p.courseNameSnapshot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Số buổi còn lại:</span>
                <span className="font-bold text-emerald-400">{p.availableCredits} / {p.totalCredits} buổi</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Đã hoàn thành:</span>
                <span className="font-semibold text-slate-300">{p.consumedCredits} buổi</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs"
                onClick={() => setSelectedStudent(p)}
              >
                Hồ sơ chi tiết
              </Button>
              <Link to="/coach/training-plans" className="w-full">
                <Button size="sm" variant="primary" className="w-full text-xs">
                  Soạn giáo án
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Student Profile Modal (WEB-COA-06) */}
      <Modal
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        title={`Hồ Sơ Học Viên: ${selectedStudent?.memberName}`}
        maxWidth="lg"
      >
        {selectedStudent && (
          <div className="space-y-5 text-xs text-slate-300">
            <div className="rounded-xl bg-slate-800/50 p-4 space-y-2">
              <p className="text-sm font-bold text-white">Khóa học: {selectedStudent.courseNameSnapshot}</p>
              <p className="text-slate-400">
                Tiến độ: Đã tập <strong>{selectedStudent.consumedCredits}</strong> buổi • Còn lại:{' '}
                <strong className="text-emerald-400">{selectedStudent.availableCredits}</strong> buổi
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link to="/coach/assessments">
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 hover:border-orange-500/40 transition-colors">
                  <Activity className="h-5 w-5 text-orange-400 mb-2" />
                  <p className="font-bold text-white">Chỉ số InBody & Thể trạng</p>
                  <p className="text-[10px] text-slate-400 mt-1">Cân nặng, % Mỡ, Cơ nạc</p>
                </div>
              </Link>
              <Link to="/coach/training-plans">
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 hover:border-orange-500/40 transition-colors">
                  <FileText className="h-5 w-5 text-sky-400 mb-2" />
                  <p className="font-bold text-white">Giáo án Tập luyện</p>
                  <p className="text-[10px] text-slate-400 mt-1">Các bài tập & Hiệp tập</p>
                </div>
              </Link>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setSelectedStudent(null)}>Đóng</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
