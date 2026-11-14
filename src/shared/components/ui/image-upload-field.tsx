import { useId, useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { apiClient } from '@/shared/api/client'
import { isAppApiError } from '@/shared/api/api-error'
import type { ApiSuccess } from '@/shared/types/api'

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

const toBase64 = (file: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

const MAX_SIDE = 1600
const SKIP_UNDER_BYTES = 300 * 1024

/**
 * Phone/camera photos are several MB and the upload (base64, +33 %) is bound by the user's uplink, so a 4 MB photo takes ~30 s to
 * reach the server. Shrink to <=1600 px JPEG first (usually 150-400 KB). Falls back to the original when anything goes wrong or it
 * would not get smaller.
 */
export async function compressImage(file: File): Promise<Blob> {
  if (file.size <= SKIP_UNDER_BYTES) return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.fillStyle = '#fff' // JPEG has no alpha
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.82))
    return blob && blob.size < file.size ? blob : file
  } catch {
    return file
  }
}

/** Uploads an image to POST /uploads/images and returns its public URL. */
export async function uploadImage(original: File) {
  const file = await compressImage(original)
  const res = (await apiClient.post('/uploads/images', { contentType: file.type, data: await toBase64(file) }, { timeout: 90_000 })) as ApiSuccess<{ url: string }>
  return res.data.url
}

export interface ImageUploadFieldProps {
  label: string
  value: string
  onChange: (url: string) => void
  disabled?: boolean
}

/** Pick an image from the computer (uploaded to the center's server) or paste a link; shows a preview. */
export function ImageUploadField({ label, value, onChange, disabled }: ImageUploadFieldProps) {
  const inputId = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pick = async (file?: File) => {
    if (!file) return
    setError(null)
    if (!ACCEPTED.includes(file.type)) return setError('Chỉ nhận ảnh JPG, PNG hoặc WebP.')
    if (file.size > MAX_BYTES) return setError('Ảnh tối đa 5 MB.')
    setUploading(true)
    try {
      onChange(await uploadImage(file))
    } catch (err) {
      setError(isAppApiError(err) ? err.message : 'Không tải được ảnh lên. Vui lòng thử lại.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium text-text-primary">{label}</label>
      <div className="flex items-start gap-3">
        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-border-subtle bg-bg-surface-muted">
          {value ? (
            <>
              <img src={value} alt="Xem trước" className="h-full w-full object-cover" />
              <button type="button" onClick={() => onChange('')} disabled={disabled || uploading} aria-label="Bỏ ảnh"
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80">
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-text-muted"><ImagePlus className="h-6 w-6" /></div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={disabled || uploading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-bg-surface px-3 py-2 text-sm font-semibold text-text-primary hover:bg-bg-surface-muted disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {uploading ? 'Đang tải lên…' : value ? 'Đổi ảnh' : 'Chọn ảnh từ máy'}
          </button>
          <input ref={fileRef} type="file" accept={ACCEPTED.join(',')} className="hidden" onChange={(e) => void pick(e.target.files?.[0])} />
          <input
            id={inputId}
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled || uploading}
            placeholder="hoặc dán link ảnh https://…"
            className="w-full rounded-xl border border-border-subtle bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
          />
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  )
}
