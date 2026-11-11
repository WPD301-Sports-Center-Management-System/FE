import { useState } from 'react'
import { hybridGet, hybridSend } from '../hybrid-api'
import { useLoad, useSubmit } from '../hooks'
import { Btn, Card, ErrorBox, Field, InlineError, Skeleton, textareaCls } from '@/features/workspace/ui'

interface Review { id: string; rating: number; comment?: string | null; editableUntil: string }

export function MemberCoachReview({ purchaseId, coachName }: { purchaseId: string; coachName: string }) {
  const state = useLoad(() => hybridGet<Review | null>(`/pt-package-purchases/${purchaseId}/review`), [purchaseId])
  const [editing, setEditing] = useState(false)
  const [openedAt] = useState(() => Date.now())
  if (state.loading) return <Skeleton rows={2} />
  if (state.error) return <ErrorBox message={state.error} onRetry={() => void state.reload()} />
  const review = state.data
  return <Card title={`Đánh giá Coach ${coachName}`} subtitle="Chia sẻ trải nghiệm sau khi hoàn tất khóa tập.">
    {review && !editing ? <div className="space-y-3"><p role="status" className="font-medium">Đã gửi đánh giá · {review.rating}/5 sao</p>{review.comment && <p className="whitespace-pre-wrap text-sm">{review.comment}</p>}
      {Date.parse(review.editableUntil) > openedAt && <Btn variant="ghost" onClick={() => setEditing(true)}>Sửa đánh giá</Btn>}
    </div> : <ReviewForm key={review?.id ?? 'new'} purchaseId={purchaseId} review={review} onCancel={review ? () => setEditing(false) : undefined} onSaved={async () => { setEditing(false); await state.reload() }} />}
  </Card>
}

function ReviewForm({ purchaseId, review, onCancel, onSaved }: { purchaseId: string; review: Review | null; onCancel?: () => void; onSaved: () => Promise<void> }) {
  const [rating, setRating] = useState(review?.rating ?? 0)
  const [comment, setComment] = useState(review?.comment ?? '')
  const submit = useSubmit()
  return <form className="space-y-4" onSubmit={e => { e.preventDefault(); if (!rating) return; void submit.run(async () => {
    if (review) await hybridSend('patch', `/coach-reviews/${review.id}`, { rating, comment: comment.trim() || null })
    else await hybridSend('post', `/pt-package-purchases/${purchaseId}/review`, { rating, comment: comment.trim() || undefined })
    await onSaved()
  }) }}>
    <fieldset disabled={submit.busy}><legend className="mb-2 text-sm font-medium">Mức độ hài lòng *</legend><div className="flex flex-wrap gap-2">{[1, 2, 3, 4, 5].map(n => <Btn key={n} aria-label={`${n} sao`} aria-pressed={rating === n} variant={rating === n ? 'soft' : 'outline'} onClick={() => setRating(n)}>{n} ★</Btn>)}</div></fieldset>
    <Field label="Nhận xét (không bắt buộc)"><textarea className={textareaCls} rows={3} maxLength={5000} disabled={submit.busy} value={comment} onChange={e => setComment(e.target.value)} placeholder="Coach đã hỗ trợ bạn như thế nào?" /></Field>
    <InlineError message={submit.error} /><div className="flex justify-end gap-2">{onCancel && <Btn disabled={submit.busy} onClick={onCancel}>Hủy</Btn>}<Btn type="submit" variant="primary" busy={submit.busy} disabled={!rating}>{review ? 'Lưu đánh giá' : 'Gửi đánh giá Coach'}</Btn></div>
  </form>
}
