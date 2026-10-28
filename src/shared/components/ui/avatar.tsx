import { useState } from 'react'

export interface AvatarProps {
  src?: string | null
  name?: string | null
  /** Pixel size of the square avatar. */
  size?: number
  className?: string
}

/** Initials of the last two words of a Vietnamese name ("Nguyễn Văn An" → "VA"). */
export function initialsOf(name?: string | null) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  return parts.slice(-2).map((p) => p[0]!.toUpperCase()).join('') || '?'
}

/**
 * A person's photo, or their initials when there is none (or it fails to load).
 * Never shows a stock photo: staff identify members by face at the counter.
 */
export function Avatar({ src, name, size = 40, className = '' }: AvatarProps) {
  const [failed, setFailed] = useState(false)
  const style = { width: size, height: size, fontSize: Math.max(12, Math.round(size * 0.38)) }
  if (src && !failed) {
    return <img src={src} alt={name ?? 'Ảnh đại diện'} style={style} onError={() => setFailed(true)} className={`shrink-0 ${/rounded-/.test(className) ? '' : 'rounded-xl'} object-cover border border-border-subtle ${className}`} />
  }
  return (
    <span role="img" aria-label={name ? `Ảnh đại diện của ${name}` : 'Chưa có ảnh đại diện'} style={style}
      className={`inline-flex shrink-0 items-center justify-center ${/rounded-/.test(className) ? '' : 'rounded-xl'} border border-primary/20 bg-primary/10 font-bold text-primary ${className}`}>
      {initialsOf(name)}
    </span>
  )
}
