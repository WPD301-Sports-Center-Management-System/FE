import { useEffect, useRef } from 'react'

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Full-bleed hero film: local video + poster, pauses off-screen / in background tabs / on reduced motion. */
export function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    let inView = true
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      if (inView && !document.hidden && !media.matches) video.play().catch(() => undefined)
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
      <video
        ref={ref}
        src="/landing/training.mp4"
        poster="/landing/gym.jpg"
        autoPlay={!reducedMotion()}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label="Video stock minh họa tập luyện trong phòng gym"
      />
      <div className="film-shade" />
      <div className="film-top">
        <span>
          <i /> PERSONAL TRAINING
        </span>
        <span>ApexFIT / 01</span>
      </div>
    </div>
  )
}
