import { useState, useEffect, useCallback } from 'react'
import { Sparkles, Check, RefreshCw, AlertTriangle, XCircle, Edit3 } from 'lucide-react'
import { toast } from 'sonner'
import { coachesService } from '@/features/coaches/services/coaches.service'
import { aiRecommendationsService, type AiRecommendation } from '../services/ai-recommendations.service'
import { Button } from '@/shared/components/ui/button'
import { Input, Select, Textarea } from '@/shared/components/ui/input'
import { Modal } from '@/shared/components/ui/modal'
import { isAppApiError } from '@/shared/api/api-error'
import type { MemberSummary } from '@/shared/types/api'

export function CoachAiRecommendationPage() {
  const [members, setMembers] = useState<MemberSummary[]>([])
  const [memberId, setMemberId] = useState('')
  const [targetFocus, setTargetFocus] = useState('')
  const [fitnessLevel, setFitnessLevel] = useState('')

  const [isLoadingMembers, setIsLoadingMembers] = useState(true)
  const [generationState, setGenerationState] = useState<'idle' | 'generating' | 'success' | 'error'>('idle')
  const [currentRec, setCurrentRec] = useState<AiRecommendation | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Edit draft modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editableTitle, setEditableTitle] = useState('')
  const [editableNotes, setEditableNotes] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  // Reject modal state
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isRejecting, setIsRejecting] = useState(false)
  const [isApproving, setIsApproving] = useState(false)

  const loadMembers = useCallback(async () => {
    setIsLoadingMembers(true)
    setErrorMessage(null)
    try {
      const res = await coachesService.getMyMembers()
      const list = (res?.data || (Array.isArray(res) ? res : [])) as MemberSummary[]
      setMembers(list)
    } catch (err) {
      if (isAppApiError(err)) {
        setErrorMessage(err.message || 'Lỗi khi tải danh sách học viên.')
      } else {
        setErrorMessage('Không thể tải danh sách học viên từ máy chủ.')
      }
    } finally {
      setIsLoadingMembers(false)
    }
  }, [])

  useEffect(() => {
    loadMembers()
  }, [loadMembers])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!memberId) {
      setErrorMessage('Vui lòng chọn học viên.')
      toast.warning('Vui lòng chọn học viên.')
      return
    }

    setGenerationState('generating')
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const rec = await aiRecommendationsService.createRecommendation({
        memberId,
        goal: targetFocus,
        context: `Trình độ thể lực: ${fitnessLevel}. Mục tiêu tập trung: ${targetFocus}`,
      })

      setCurrentRec(rec)
      setGenerationState('success')
      const content = rec.editedContent || rec.generatedContent || {}
      setEditableTitle(content.title || `AI Plan: ${targetFocus}`)
      setEditableNotes(content.notes || content.rationale || '')
      toast.success('Hệ thống AI đã khởi tạo gợi ý giáo án thành công!')
    } catch (err) {
      setGenerationState('error')
      const msg = isAppApiError(err) ? (err.message || 'Hệ thống AI không thể tạo gợi ý.') : 'Lỗi kết nối máy chủ AI hoặc dịch vụ AI chưa được cấu hình.'
      setErrorMessage(msg)
      toast.error(msg)
    }
  }

  const handleSaveEdit = async () => {
    if (!currentRec) return
    setIsUpdating(true)
    setErrorMessage(null)
    try {
      const existingContent = currentRec.editedContent || currentRec.generatedContent || {}
      const updated = await aiRecommendationsService.updateRecommendation(currentRec.id, {
        editedContent: {
          ...existingContent,
          title: editableTitle,
          notes: editableNotes,
        },
      })
      setCurrentRec(updated)
      setIsEditModalOpen(false)
      const msg = 'Đã cập nhật bản nháp gợi ý AI thành công!'
      setSuccessMessage(msg)
      toast.success(msg)
    } catch (err) {
      const msg = isAppApiError(err) ? (err.message || 'Không thể lưu chỉnh sửa gợi ý.') : 'Lỗi khi cập nhật bản nháp gợi ý.'
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleApprove = async () => {
    if (!currentRec) return
    setIsApproving(true)
    setErrorMessage(null)
    try {
      await aiRecommendationsService.approveRecommendation(currentRec.id, {
        title: editableTitle || undefined,
      })
      setCurrentRec({ ...currentRec, status: 'APPROVED' })
      const msg = 'Giáo án AI đã được duyệt và chuyển thành Giáo Án Chính Thức thành công!'
      setSuccessMessage(msg)
      toast.success(msg)
    } catch (err) {
      const msg = isAppApiError(err) ? (err.message || 'Không thể duyệt gợi ý AI.') : 'Lỗi hệ thống khi duyệt gợi ý AI.'
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    if (!currentRec) return
    if (!rejectionReason.trim()) {
      setErrorMessage('Vui lòng nhập lý do từ chối gợi ý.')
      toast.warning('Vui lòng nhập lý do từ chối gợi ý.')
      return
    }

    setIsRejecting(true)
    setErrorMessage(null)
    try {
      const updated = await aiRecommendationsService.rejectRecommendation(currentRec.id, rejectionReason)
      setCurrentRec(updated)
      setIsRejectModalOpen(false)
      const msg = 'Đã từ chối gợi ý AI thành công.'
      setSuccessMessage(msg)
      toast.success(msg)
    } catch (err) {
      const msg = isAppApiError(err) ? (err.message || 'Không thể từ chối gợi ý AI.') : 'Lỗi hệ thống khi từ chối gợi ý AI.'
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setIsRejecting(false)
    }
  }

  const content = currentRec ? currentRec.editedContent || currentRec.generatedContent || {} : null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Gợi ý bài tập từ AI</h1>
          <p className="text-xs text-text-muted mt-1">
            Ứng dụng mô hình AI kết hợp dữ liệu InBody và mục tiêu của học viên để phác thảo giáo án thông minh
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={loadMembers}
          disabled={isLoadingMembers || generationState === 'generating'}
          className="gap-1.5"
        >
          <RefreshCw className={`h-4 w-4 ${isLoadingMembers ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </Button>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-xs text-danger flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-danger" />
            <span>{errorMessage}</span>
          </div>
          {generationState === 'error' && (
            <Button size="sm" variant="outline" onClick={handleGenerate} className="h-7 text-xs border-danger/40 text-danger">
              Thử lại (Retry)
            </Button>
          )}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Input parameters form */}
      <form onSubmit={handleGenerate} className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
        <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>Thông Số Đầu Vào AI Phân Tích</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Chọn Học viên"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            options={[
              { value: '', label: '-- Chọn học viên --' },
              ...members.map((m: any) => ({
                value: m.id,
                label: `${m.fullName || m.user?.fullName || 'Học viên'} (${m.memberCode || 'HV'})`,
              })),
            ]}
          />
          <Input
            label="Trình độ thể lực & Thói quen vận động"
            value={fitnessLevel}
            onChange={(e) => setFitnessLevel(e.target.value)}
            placeholder="Ví dụ: Mới bắt đầu, Trung bình (đã tập 6 tháng)..."
          />
        </div>

        <Input
          label="Mục tiêu tập luyện trọng tâm (Prompt Focus)"
          required
          value={targetFocus}
          onChange={(e) => setTargetFocus(e.target.value)}
          placeholder="Ví dụ: Phát triển nhóm cơ Ngực & Vai, giảm mỡ vòng eo..."
        />

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            disabled={generationState === 'generating' || members.length === 0}
            className="gap-2 px-6"
          >
            <Sparkles className={`h-4 w-4 ${generationState === 'generating' ? 'animate-spin' : ''}`} />
            <span>{generationState === 'generating' ? 'AI Đang Tạo Gợi Ý...' : 'Khởi Tạo Gợi Ý Bằng AI'}</span>
          </Button>
        </div>
      </form>

      {/* Generated Result Display */}
      {currentRec && content && (
        <div className="rounded-2xl border border-border-subtle bg-bg-surface p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-text-primary">{content.title || 'Bản Phác Thảo Giáo Án AI'}</h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    currentRec.status === 'APPROVED'
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : currentRec.status === 'REJECTED'
                      ? 'bg-danger/20 text-danger border border-danger/30'
                      : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {currentRec.status === 'APPROVED' ? 'ĐÃ DUYỆT' : currentRec.status === 'REJECTED' ? 'ĐÃ TỪ CHỐI' : 'BẢN NHÁP (DRAFT)'}
                </span>
              </div>
              <p className="text-xs text-text-muted mt-1">{content.notes || content.rationale || 'Gợi ý từ AI'}</p>
            </div>

            {currentRec.status === 'DRAFT' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditModalOpen(true)}
                className="gap-1.5 text-xs"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Chỉnh sửa Draft</span>
              </Button>
            )}
          </div>

          {/* Action buttons */}
          {currentRec.status === 'DRAFT' && (
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
              <Button
                variant="ghost"
                onClick={() => {
                  setRejectionReason('')
                  setIsRejectModalOpen(true)
                }}
                disabled={isApproving || isRejecting}
                className="text-danger hover:bg-danger/10 text-xs gap-1.5 cursor-pointer"
              >
                <XCircle className="h-4 w-4" />
                <span>Từ chối (Reject)</span>
              </Button>
              <Button
                variant="primary"
                onClick={handleApprove}
                disabled={isApproving || isRejecting}
                className="text-xs gap-1.5 px-6"
              >
                <Check className="h-4 w-4" />
                <span>{isApproving ? 'Đang tạo giáo án...' : 'Duyệt & Tạo Giáo Án (Approve)'}</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Chỉnh Sửa Bản Nháp Gợi Ý AI"
      >
        <div className="space-y-4 p-2">
          <Input
            label="Tên giáo án"
            value={editableTitle}
            onChange={(e) => setEditableTitle(e.target.value)}
          />
          <Textarea
            label="Ghi chú & Định hướng"
            value={editableNotes}
            onChange={(e) => setEditableNotes(e.target.value)}
            rows={4}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" disabled={isUpdating} onClick={handleSaveEdit}>
              {isUpdating ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Từ Chối Gợi Ý AI"
      >
        <div className="space-y-4 p-2">
          <Textarea
            label="Lý do từ chối (Bắt buộc)"
            required
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Nhập lý do không áp dụng gợi ý này..."
            rows={3}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsRejectModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="danger"
              disabled={isRejecting || !rejectionReason.trim()}
              onClick={handleReject}
            >
              {isRejecting ? 'Đang xử lý...' : 'Xác Nhận Từ Chối'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
