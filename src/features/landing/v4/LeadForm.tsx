import { useId, useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ArrowUpRight, CheckCircle2, Loader2, RefreshCw } from 'lucide-react'
import { isAppApiError } from '@/shared/api/api-error'
import { landingApi, type TrialContext } from '../api'

const GOALS = ['Tăng cơ', 'Giảm mỡ', 'Cải thiện thể lực', 'Linh hoạt & cân bằng']
const TIMES = ['Buổi sáng', 'Buổi chiều', 'Buổi tối']

/**
 * "Đăng ký tư vấn" form, sent to the real lead inbox (POST /trial-requests, read by reception at
 * /receptionist/trial-requests). Success is only shown after the server confirms.
 */
export function LeadForm({ context }: { context?: TrialContext }) {
  const id = useId()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const submit = useMutation({ mutationFn: landingApi.submitTrial })

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submit.isPending) return
    const f = new FormData(e.currentTarget)
    const fullName = String(f.get('fullName') ?? '').trim()
    // Same normalisation as the backend: spaces, dots and dashes are allowed while typing.
    const phone = String(f.get('phone') ?? '').replace(/[\s.-]/g, '')
    const goal = String(f.get('goal') ?? '')
    const preferredTime = String(f.get('preferredTime') ?? '')
    const err: Record<string, string> = {}
    if (fullName.length < 2) err.fullName = 'Vui lòng nhập họ tên, ít nhất 2 ký tự.'
    if (!/^\+?\d{9,15}$/.test(phone)) err.phone = 'Nhập 9–15 chữ số, có thể bắt đầu bằng +.'
    setErrors(err)
    if (Object.keys(err).length) {
      e.currentTarget.querySelector<HTMLInputElement>(`[name="${Object.keys(err)[0]}"]`)?.focus()
      return
    }
    submit.mutate({
      fullName,
      phone,
      goal: goal || undefined,
      preferredTime: preferredTime || undefined,
      coachId: context?.coachId,
      interest: context?.interest,
    })
  }

  const serverError = submit.error
    ? isAppApiError(submit.error) ? submit.error.message : 'Không gửi được yêu cầu. Vui lòng kiểm tra kết nối và thử lại.'
    : null

  if (submit.isSuccess) {
    return (
      <div className="lead-form" role="status">
        <div className="success-panel">
          <CheckCircle2 size={42} />
          <h3>Đã nhận yêu cầu tư vấn.</h3>
          <p>Trung tâm đã tiếp nhận thông tin và sẽ liên hệ lại với bạn qua số điện thoại đã để lại.</p>
          <button type="button" className="btn outline" onClick={() => submit.reset()}>
            Gửi yêu cầu khác <RefreshCw size={15} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <form className="lead-form" onSubmit={onSubmit} noValidate aria-busy={submit.isPending}>
      <h3>Đăng ký tư vấn</h3>
      <p className="muted">Để lại thông tin để được tư vấn chương trình phù hợp.</p>
      <label>
        Họ và tên <span>*</span>
        <input
          name="fullName"
          placeholder="Tên của bạn"
          maxLength={180}
          autoComplete="name"
          aria-invalid={!!errors.fullName}
          aria-describedby={errors.fullName ? `${id}-name` : undefined}
        />
        {errors.fullName && <span className="field-error" id={`${id}-name`}>{errors.fullName}</span>}
      </label>
      <label>
        Số điện thoại <span>*</span>
        <input
          name="phone"
          placeholder="Nhập số điện thoại"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? `${id}-phone` : undefined}
        />
        {errors.phone && <span className="field-error" id={`${id}-phone`}>{errors.phone}</span>}
      </label>
      <div className="form-row">
        <label>
          Mục tiêu của bạn
          <select name="goal" defaultValue="">
            <option value="">Chọn mục tiêu</option>
            {GOALS.map((g) => <option key={g}>{g}</option>)}
          </select>
        </label>
        <label>
          Thời gian phù hợp
          <select name="preferredTime" defaultValue="">
            <option value="">Chọn thời gian</option>
            {TIMES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
      </div>
      {serverError && <p className="inline-message" role="alert">{serverError}</p>}
      <button type="submit" className="btn lime" disabled={submit.isPending}>
        {submit.isPending ? (
          <>
            <Loader2 className="spin" size={18} />
            Đang gửi…
          </>
        ) : (
          <>
            Đăng ký tư vấn <ArrowUpRight size={19} />
          </>
        )}
      </button>
      <p className="fine-print">Thông tin của bạn chỉ dùng để liên hệ tư vấn.</p>
    </form>
  )
}
