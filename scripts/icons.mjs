// Génère les icônes PNG à partir de public/icon.svg avec Chromium (Playwright)
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
const svg = readFileSync('public/icon.svg', 'utf8')
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH })
const jobs = [['icon-192.png', 192, false], ['icon-512.png', 512, false], ['icon-maskable-512.png', 512, true]]
for (const [name, size, mask] of jobs) {
  const p = await b.newPage({ viewport: { width: size, height: size } })
  const inner = mask ? `<div style="width:${size}px;height:${size}px;background:#ff7eb6;display:grid;place-items:center"><div style="width:${size * 0.7}px;height:${size * 0.7}px">${svg}</div></div>` : `<div style="width:${size}px;height:${size}px">${svg}</div>`
  await p.setContent(`<body style="margin:0">${inner}<style>svg{width:100%;height:100%}</style></body>`)
  await p.screenshot({ path: `public/${name}`, omitBackground: true })
}
await b.close()
