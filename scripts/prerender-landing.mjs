// Static prerender of the public landing + robots/sitemap. Run via `npm run build:seo`
// (after `vite build` and `vite build --ssr src/entry-prerender.tsx --outDir dist-ssr`).
//
// - dist/index.html : landing HTML present before JS runs (client then renders over it, no hydration)
// - dist/app.html   : untouched SPA shell; point the host's SPA fallback here if possible
// - robots.txt / sitemap.xml : index only when VITE_INDEX_PUBLIC=true and VITE_PUBLIC_SITE_URL is https
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { loadEnv } from 'vite'

const root = process.cwd()
const dist = path.resolve(root, process.env.OUT_DIR || 'dist')
const env = loadEnv(process.env.MODE || 'production', root, 'VITE_')
const site = (env.VITE_PUBLIC_SITE_URL || '').replace(/\/$/, '')
const publish = env.VITE_INDEX_PUBLIC === 'true' && site.startsWith('https://')

const { render, FAQ, LANDING_TITLE, LANDING_DESCRIPTION } = await import(pathToFileURL(path.join(root, 'dist-ssr', 'entry-prerender.js')).href)

const shell = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
fs.writeFileSync(path.join(dist, 'app.html'), shell)

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
let head = ''
if (publish) {
  head += `\n    <link rel="canonical" href="${site}/" />`
  head += `\n    <meta property="og:url" content="${site}/" />`
  head += `\n    <meta property="og:image" content="${site}/landing/gym.jpg" />`
  head += `\n    <meta name="twitter:card" content="summary_large_image" />`
  head += `\n    <meta name="twitter:image" content="${site}/landing/gym.jpg" />`
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': `${site}/#website`, url: `${site}/`, name: 'ApexFIT', inLanguage: 'vi-VN' },
      { '@type': 'WebPage', '@id': `${site}/#webpage`, url: `${site}/`, name: LANDING_TITLE, description: LANDING_DESCRIPTION, inLanguage: 'vi-VN', isPartOf: { '@id': `${site}/#website` } },
      { '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    ],
  }
  head += `\n    <script type="application/ld+json" id="landing-structured-data">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`
}

let html = shell
  .replace('<meta name="robots" content="noindex, nofollow" />', `<meta name="robots" content="${publish ? 'index, follow, max-image-preview:large' : 'noindex, nofollow'}" />`)
  .replace('<title>', `${head ? head.trimStart() + '\n    ' : ''}<title>`)
  .replace(/<title>[^<]*<\/title>/, `<title>${esc(LANDING_TITLE)}</title>`)

// If a host serves this file for every route (SPA fallback), drop the landing markup before first paint
// on non-landing routes so dashboards/auth never flash the landing.
const guard = `<script>if(location.pathname!=='/'){var r=document.getElementById('root');if(r)r.innerHTML='';}</script>`
html = html.replace('<div id="root"></div>', `<div id="root">${render()}</div>\n    ${guard}`)
if (!html.includes('class="gc-landing"')) throw new Error('Prerender failed: landing markup missing')
fs.writeFileSync(path.join(dist, 'index.html'), html)

// Dashboards/auth stay crawlable-but-noindex (the shell carries a noindex meta) and are never in the sitemap.
fs.writeFileSync(path.join(dist, 'robots.txt'), publish ? `User-agent: *\nAllow: /\nSitemap: ${site}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n')
const sitemap = path.join(dist, 'sitemap.xml')
if (publish) fs.writeFileSync(sitemap, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${site}/</loc></url>\n</urlset>\n`)
else if (fs.existsSync(sitemap)) fs.rmSync(sitemap)
fs.rmSync(path.join(root, 'dist-ssr'), { recursive: true, force: true })

console.log(`[prerender] landing written (${publish ? `INDEX ${site}` : 'noindex preview'}), app.html shell kept`)
