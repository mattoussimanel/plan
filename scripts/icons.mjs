// Génère les icônes PNG (PWA) à partir de public/icon.svg – lancé avant le build
import sharp from 'sharp'
import { readFileSync } from 'node:fs'

const svg = readFileSync('public/icon.svg')
const plain = (size) => sharp(svg, { density: 384 }).resize(size, size).png().toFile(`public/icon-${size}.png`)
const maskable = async () => {
  const inner = await sharp(svg, { density: 384 }).resize(360, 360).png().toBuffer()
  await sharp({ create: { width: 512, height: 512, channels: 4, background: '#ff7eb6' } })
    .composite([{ input: inner, gravity: 'center' }]).png().toFile('public/icon-maskable-512.png')
}
await Promise.all([plain(192), plain(512), maskable()])
