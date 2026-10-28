import { useEffect } from 'react'
import { FAQ, LANDING_DESCRIPTION, LANDING_TITLE } from './content'

const SITE = (import.meta.env.VITE_PUBLIC_SITE_URL || '').replace(/\/$/, '')
/** Indexing is opt-in: needs a real HTTPS domain and VITE_INDEX_PUBLIC=true. Preview/staging stay noindex. */
const PUBLISH_INDEX = import.meta.env.VITE_INDEX_PUBLIC === 'true' && SITE.startsWith('https://')

function setMeta(key: string, value: string, property = false) {
  const attr = property ? 'property' : 'name'
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = value
}

/** Landing metadata. On leave it restores noindex so dashboards/auth are never indexed after client navigation. */
export function LandingSeo() {
  useEffect(() => {
    const previousTitle = document.title
    document.title = LANDING_TITLE
    setMeta('description', LANDING_DESCRIPTION)
    setMeta('robots', PUBLISH_INDEX ? 'index, follow, max-image-preview:large' : 'noindex, nofollow')
    setMeta('og:title', LANDING_TITLE, true)
    setMeta('og:description', LANDING_DESCRIPTION, true)
    setMeta('og:type', 'website', true)
    setMeta('og:locale', 'vi_VN', true)
    setMeta('og:site_name', 'ApexFIT', true)
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', LANDING_TITLE)
    setMeta('twitter:description', LANDING_DESCRIPTION)

    const added: Element[] = []
    if (PUBLISH_INDEX && !document.querySelector('link[rel="canonical"]')) {
      const canonical = document.createElement('link')
      canonical.rel = 'canonical'
      canonical.href = `${SITE}/`
      document.head.appendChild(canonical)
      added.push(canonical)
      setMeta('og:url', `${SITE}/`, true)
      setMeta('og:image', `${SITE}/landing/gym.jpg`, true)
      setMeta('twitter:image', `${SITE}/landing/gym.jpg`)
    }
    if (PUBLISH_INDEX && !document.getElementById('landing-structured-data')) {
      // Only facts we can stand behind: no address, phone, rating or review schema.
      const script = document.createElement('script')
      script.id = 'landing-structured-data'
      script.type = 'application/ld+json'
      script.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'WebSite', '@id': `${SITE}/#website`, url: `${SITE}/`, name: 'ApexFIT', inLanguage: 'vi-VN' },
          { '@type': 'WebPage', '@id': `${SITE}/#webpage`, url: `${SITE}/`, name: LANDING_TITLE, description: LANDING_DESCRIPTION, inLanguage: 'vi-VN', isPartOf: { '@id': `${SITE}/#website` } },
          { '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
        ],
      })
      document.head.appendChild(script)
      added.push(script)
    }

    return () => {
      document.title = previousTitle
      setMeta('robots', 'noindex, nofollow')
      added.forEach((el) => el.remove())
      document.querySelector('link[rel="canonical"]')?.remove()
      document.getElementById('landing-structured-data')?.remove()
      for (const key of ['og:url', 'og:image']) document.querySelector(`meta[property="${key}"]`)?.remove()
      document.querySelector('meta[name="twitter:image"]')?.remove()
    }
  }, [])
  return null
}
