import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Full-bleed hero film: local video + poster, pauses off-screen / in background tabs / on reduced motion. */
export function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)
  const userPaused = useRef(false)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    let inView = true
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      if (inView && !document.hidden && !media.matches && !userPaused.current) video.play().catch(() => undefined)
      else video.pause()
    }
    const obs = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      update()
    })
    obs.observe(video)
    document.addEventListener('visibilitychange', update)
    media.addEventListener('change', update)
    return () => {
      obs.disconnect()
      document.removeEventListener('visibilitychange', update)
      media.removeEventListener('change', update)
    }
  }, [])

  return (
    <div className="hero-film">
      {failed ? <img src="/landing/gym.jpg" alt="" className="film-poster" /> : <video
        ref={ref}
        src="/landing/training.mp4"
        poster="/landing/gym.jpg"
        autoPlay={!reducedMotion()}
        muted
        loop
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setFailed(true)}
        aria-label="Video stock minh họa tập luyện trong phòng gym"
      />}
      <div className="film-shade" />
      {!failed && <button type="button" className="film-control" aria-label={playing ? 'Tạm dừng video' : 'Phát video'} onClick={() => { const video = ref.current; if (!video) return; if (video.paused) { userPaused.current = false; void video.play().catch(() => undefined) } else { userPaused.current = true; video.pause() } }}>{playing ? <Pause aria-hidden size={18} /> : <Play aria-hidden size={18} />}</button>}
    </div>
  )
}
