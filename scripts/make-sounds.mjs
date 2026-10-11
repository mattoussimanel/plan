// Génère les sons de notification (WAV 16 bits mono) : carillon et cloche
// Usage : node scripts/make-sounds.mjs  → android/app/src/main/res/raw/*.wav et public/sounds/*.wav (aperçu)
import { mkdirSync, writeFileSync } from 'node:fs'

const RATE = 44100

/** Cloche : somme de partiels, chacun avec sa propre décroissance exponentielle */
function bell(buf, start, freq, { partials, decay, gain = 1 }) {
  const first = Math.floor(start * RATE)
  for (let i = first; i < buf.length; i++) {
    const t = (i - first) / RATE
    let v = 0
    for (const [ratio, amp, d = 1] of partials) v += amp * Math.sin(2 * Math.PI * freq * ratio * t) * Math.exp(-decay * d * t)
    buf[i] += gain * v * Math.min(1, t / 0.004) // attaque de 4 ms (évite le « clic »)
  }
}

function wav(samples) {
  const peak = samples.reduce((m, x) => Math.max(m, Math.abs(x)), 0) || 1
  const data = Buffer.alloc(samples.length * 2)
  samples.forEach((x, i) => data.writeInt16LE(Math.round((x / peak) * 0.85 * 32767), i * 2))
  const h = Buffer.alloc(44)
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVEfmt ', 8)
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(RATE, 24)
  h.writeUInt32LE(RATE * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40)
  return Buffer.concat([h, data])
}

// Carillon : arpège ascendant do-mi-sol-do, doux et court (≈ 1,9 s)
const carillon = new Float32Array(Math.floor(RATE * 1.9))
;[[1046.5, 0], [1318.5, 0.16], [1568, 0.32], [2093, 0.48]].forEach(([f, t]) =>
  bell(carillon, t, f, { partials: [[1, 1], [2, 0.25, 1.6], [3, 0.08, 2.4]], decay: 3.2, gain: 0.8 }))

// Cloche : une note grave et brillante qui résonne (≈ 2,6 s)
const cloche = new Float32Array(Math.floor(RATE * 2.6))
bell(cloche, 0, 523.25, { partials: [[1, 1], [2, 0.6, 1.2], [2.76, 0.45, 1.5], [5.4, 0.25, 2.2], [8.93, 0.12, 3]], decay: 1.7 })
bell(cloche, 0.45, 523.25 * 1.5, { partials: [[1, 1], [2, 0.4, 1.3]], decay: 2.2, gain: 0.5 })

for (const dir of ['android/app/src/main/res/raw', 'public/sounds']) {
  mkdirSync(dir, { recursive: true })
  writeFileSync(`${dir}/carillon.wav`, wav(carillon))
  writeFileSync(`${dir}/cloche.wav`, wav(cloche))
}
console.log('ok')
