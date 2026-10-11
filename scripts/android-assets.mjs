// Génère icônes, icône de notification et écrans de démarrage Android depuis public/icon.svg
// Usage : node scripts/android-assets.mjs   (les fichiers produits sont commités dans android/)
import sharp from 'sharp'
import { readFileSync, readdirSync, statSync, mkdirSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

const RES = 'android/app/src/main/res'
const svg = readFileSync('public/icon.svg')
const HEART = 'M256 392 C140 310 112 240 148 196 C182 156 236 170 256 210 C276 170 330 156 364 196 C400 240 372 310 256 392Z'
const heartSvg = (fill, extra = '') => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${extra}<path d="${HEART}" fill="${fill}"/><circle cx="256" cy="120" r="28" fill="${fill}" opacity=".85"/></svg>`)
const png = (input, size) => sharp(input, { density: 384 }).resize(size, size)

const DPI = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 }
const circle = (s) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><circle cx="${s / 2}" cy="${s / 2}" r="${s / 2}"/></svg>`)

for (const [d, k] of Object.entries(DPI)) {
  const launcher = Math.round(48 * k), adaptive = Math.round(108 * k), notif = Math.round(24 * k)
  const dir = join(RES, `mipmap-${d}`)
  await png(svg, launcher).toFile(join(dir, 'ic_launcher.png'))
  await png(svg, launcher).composite([{ input: circle(launcher), blend: 'dest-in' }]).toFile(join(dir, 'ic_launcher_round.png'))
  // premier plan adaptatif : cœur blanc dans la zone sûre (66 %) sur transparent
  const inner = await png(heartSvg('#ffffff'), Math.round(adaptive * 0.66)).png().toBuffer()
  await sharp({ create: { width: adaptive, height: adaptive, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: inner, gravity: 'center' }]).png().toFile(join(dir, 'ic_launcher_foreground.png'))
  // petite icône de notification : silhouette blanche
  const ndir = join(RES, `drawable-${d}`)
  mkdirSync(ndir, { recursive: true })
  await png(heartSvg('#ffffff'), notif).toFile(join(ndir, 'ic_stat_icon.png'))
}

// écrans de démarrage : fond rose + cœur centré, mêmes dimensions que les fichiers existants
for (const dir of readdirSync(RES).filter((n) => n.startsWith('drawable') && statSync(join(RES, n)).isDirectory())) {
  const file = join(RES, dir, 'splash.png')
  try { statSync(file) } catch { continue }
  const { width, height } = await sharp(file).metadata()
  const size = Math.round(Math.min(width, height) * 0.4)
  const icon = await png(svg, size).png().toBuffer()
  await sharp({ create: { width, height, channels: 3, background: '#fff0f6' } }).composite([{ input: icon, gravity: 'center' }]).png().toFile(file + '.tmp')
  await sharp(file + '.tmp').toFile(file)
  unlinkSync(file + '.tmp')
}
console.log('ok')
