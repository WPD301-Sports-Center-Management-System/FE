// Regenerates src/features/landing/v4/landing-v4.css from the V4 prototype CSS: scoped to `.gc-landing`,
// only rules whose classes the landing components use, source order kept (cascade unchanged),
// keyframes renamed (gc-*) and asset urls moved under /landing/.
// Usage (from FE/): node scripts/scope-landing-css.mjs ../Docs/GYM_CENTER_UI_V4/gym-center/src .
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'

const [designSrc, feRoot] = process.argv.slice(2).map((p) => path.resolve(p))
const require = createRequire(path.join(feRoot, 'package.json'))
const postcss = require('postcss')

const SCOPE = '.gc-landing'
const read = (f) => fs.readFileSync(path.join(designSrc, f), 'utf8')
const css = read('styles.css').replace('@import "./fonts.css";', read('fonts.css')) + '\n' + read('landing-motion.css')

const v4Dir = path.join(feRoot, 'src/features/landing/v4')
const tokens = new Set()
for (const f of fs.readdirSync(v4Dir).filter((f) => /\.(tsx?|css)$/.test(f) && !f.startsWith('landing-v4.')))
  for (const m of fs.readFileSync(path.join(v4Dir, f), 'utf8').matchAll(/[a-zA-Z][\w-]*/g)) tokens.add(m[0])

const keep = (sel) => [...sel.matchAll(/\.([a-zA-Z_][\w-]*)/g)].every((m) => tokens.has(m[1]))
const scope = (sel) => {
  const s = sel.trim()
  if (/^(:root|html|body)$/.test(s)) return SCOPE
  if (s === '*') return `${SCOPE}, ${SCOPE} *`
  return `${SCOPE} ${s}`
}

const root = postcss.parse(css)
const renamed = new Map()
root.walkAtRules('keyframes', (at) => {
  renamed.set(at.params, `gc-${at.params}`)
  at.params = `gc-${at.params}`
})
let kept = 0
let dropped = 0
root.walkRules((rule) => {
  if (rule.parent?.type === 'atrule' && /keyframes$/.test(rule.parent.name)) return
  const sels = rule.selectors.filter(keep)
  if (!sels.length) {
    rule.remove()
    dropped++
    return
  }
  rule.selectors = sels.map(scope)
  kept++
})
root.walkDecls((d) => {
  if (/^animation(-name)?$/.test(d.prop)) for (const [from, to] of renamed) d.value = d.value.replace(new RegExp(`\\b${from}\\b`, 'g'), to)
  if (d.value.includes('url(')) d.value = d.value.replace(/url\((['"]?)\/(fonts\/|gym\.jpg)/g, 'url($1/landing/$2')
})
root.walkAtRules('media', (at) => {
  if (!at.nodes?.length) at.remove()
})
root.walkComments((c) => c.remove())

const header = `/* GENERATED from Docs/GYM_CENTER_UI_V4 (styles.css + fonts.css + landing-motion.css).
 * Scoped to ${SCOPE}; only rules used by the landing are kept, source order preserved.
 * Hand-written adjustments live in landing-v4-extra.css. */\n`
fs.writeFileSync(path.join(v4Dir, 'landing-v4.css'), header + root.toString())
console.log({ kept, dropped, keyframes: [...renamed.keys()] })
