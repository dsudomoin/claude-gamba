// Regenerates the sound effects next to this file: node sounds/make.mjs
// Square waves with a decay, 22 kHz mono: small files, arcade sound.
import { writeFileSync } from 'node:fs'

const RATE = 22050

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2)
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2))
  const head = Buffer.alloc(44)
  head.write('RIFF', 0)
  head.writeUInt32LE(36 + data.length, 4)
  head.write('WAVEfmt ', 8)
  head.writeUInt32LE(16, 16)
  head.writeUInt16LE(1, 20) // PCM
  head.writeUInt16LE(1, 22) // mono
  head.writeUInt32LE(RATE, 24)
  head.writeUInt32LE(RATE * 2, 28)
  head.writeUInt16LE(2, 32)
  head.writeUInt16LE(16, 34)
  head.write('data', 36)
  head.writeUInt32LE(data.length, 40)
  return Buffer.concat([head, data])
}

// notes: [frequency in Hz, seconds]. Each note is a square wave fading out.
function tune(notes, volume = 0.22) {
  return notes.flatMap(([hz, seconds]) =>
    Array.from({ length: Math.round(seconds * RATE) }, (_, i) => {
      const t = i / RATE
      return Math.sign(Math.sin(2 * Math.PI * hz * t)) * volume * Math.exp((-3 * t) / seconds)
    }),
  )
}

// A reel stopping: a burst of noise over a low thump.
const stop = Array.from({ length: Math.round(0.07 * RATE) }, (_, i) => {
  const t = i / RATE
  return (Math.random() * 2 - 1) * 0.35 * Math.exp(-t * 90) + Math.sin(2 * Math.PI * 140 * t) * 0.5 * Math.exp(-t * 45)
})

const sounds = {
  stop,
  win: tune([[988, 0.07], [1319, 0.22]]), // the coin
  big: tune([[523, 0.08], [659, 0.08], [784, 0.08], [1047, 0.08], [784, 0.08], [1047, 0.08], [1319, 0.08], [1568, 0.45]]),
  broke: tune([[392, 0.2], [370, 0.2], [349, 0.2], [330, 0.55]], 0.18), // womp womp
}

for (const [name, samples] of Object.entries(sounds)) {
  writeFileSync(new URL(`${name}.wav`, import.meta.url), wav(samples))
}
