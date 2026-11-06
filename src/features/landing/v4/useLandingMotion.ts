import { useEffect, type RefObject } from 'react'

const REVEAL_SELECTOR =
  '.section-head, .benefit-intro, .benefit, .course-card, .coach-card, .journey > div:first-child, .journey-step, .price-card, .price-aside, .review-card, .consult-copy, .lead-form, .faq > div'

/**
 * Scroll choreography from the V4 design: soft reveal + stagger, image zoom by scroll position and a
 * light hero parallax. Native scrolling only (no hijacking); everything is off under reduced motion.
 */
export function useLandingMotion(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const container = root.current
    if (!container) return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    let dispose = () => {}

    const setup = () => {
      dispose()
      if (media.matches) return
      const targets = new Set<HTMLElement>()
      let frame = 0
      let active = true
      const reveal = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const el = entry.target as HTMLElement
            if (entry.isIntersecting) el.classList.add('is-revealed')
            // Replay softly when returning from above; never hide content that holds focus.
            else if (entry.boundingClientRect.top > window.innerHeight && !el.contains(document.activeElement)) el.classList.remove('is-revealed')
          }
        },
        { threshold: 0.09, rootMargin: '0px 0px -35px 0px' },
      )

      const paint = () => {
        frame = 0
        if (!active || document.hidden) return
        const height = window.innerHeight
        container.querySelectorAll<HTMLElement>('.course-grid, .coach-grid').forEach((grid) => {
          const rect = grid.getBoundingClientRect()
          if (rect.bottom < 0 || rect.top > height) return
          const arrival = Math.min(1, Math.max(0, (height - rect.top) / (height * 0.8)))
          grid.style.setProperty('--scroll-image-scale', (1.14 - arrival * 0.12).toFixed(4))
        })
        const hero = container.querySelector<HTMLElement>('.hero')
        if (hero) {
          const rect = hero.getBoundingClientRect()
          const offset = Math.min(Math.max(-rect.top, 0), rect.height)
          hero.style.setProperty('--hero-shift', `${(offset * 0.12).toFixed(1)}px`)
          hero.style.setProperty('--hero-scale', (1.02 + (offset / rect.height) * 0.035).toFixed(4))
        }
        const progress = window.scrollY / Math.max(1, document.documentElement.scrollHeight - height)
        container.style.setProperty('--page-progress', String(Math.min(1, Math.max(0, progress))))
      }
      const requestUpdate = () => {
        if (!frame && active) frame = requestAnimationFrame(paint)
      }

      const register = () => {
        container.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach((el) => {
          if (targets.has(el)) return
          targets.add(el)
          el.classList.add('reveal-item')
          const siblings = el.parentElement ? Array.from(el.parentElement.children).filter((child) => child.matches(REVEAL_SELECTOR)) : []
          el.style.setProperty('--reveal-delay', `${Math.min(Math.max(siblings.indexOf(el), 0), 3) * 95}ms`)
          reveal.observe(el)
        })
        requestUpdate()
      }
      const onFocus = (event: FocusEvent) => (event.target as HTMLElement).closest('.reveal-item')?.classList.add('is-revealed')

      container.classList.add('landing-motion')
      // Sections fill in when API data arrives, so new cards are registered as they mount.
      const mutation = new MutationObserver(register)
      register()
      mutation.observe(container, { childList: true, subtree: true })
      window.addEventListener('scroll', requestUpdate, { passive: true })
      window.addEventListener('resize', requestUpdate, { passive: true })
      document.addEventListener('visibilitychange', requestUpdate)
      container.addEventListener('focusin', onFocus)

      dispose = () => {
        active = false
        if (frame) cancelAnimationFrame(frame)
        reveal.disconnect()
        mutation.disconnect()
        window.removeEventListener('scroll', requestUpdate)
        window.removeEventListener('resize', requestUpdate)
        document.removeEventListener('visibilitychange', requestUpdate)
        container.removeEventListener('focusin', onFocus)
        container.classList.remove('landing-motion')
        targets.forEach((el) => {
          el.classList.remove('reveal-item', 'is-revealed')
          el.style.removeProperty('--reveal-delay')
        })
      }
    }

    setup()
    media.addEventListener('change', setup)
    return () => {
      dispose()
      media.removeEventListener('change', setup)
    }
  }, [root])
}
