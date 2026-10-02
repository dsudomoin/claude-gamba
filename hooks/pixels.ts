// The cabinet in pixels, for a surface that draws a Raster: two pixels to a
// cell, one above the other. Colours and numbers only, no engine calls.

import { FONT, WIDTH } from './art'
import type { Parts } from './art'
import { faces } from './reels'

const CELL = 16 // a symbol is this many pixels square
const PITCH = 18 // from one symbol on a reel to the next
const SIGN = 18 // how tall the sign is, and the balance display
const BANK = 14
const CLEAR = -1 // the terminal's own background

// The letters the art below is drawn in.
const INK: Record<string, number> = {
  k: 0x1c1917, // outline
  w: 0xffffff,
  l: 0xd6d3d1,
  g: 0x78716c,
  r: 0xef4444,
  R: 0x991b1b,
  o: 0xfb923c,
  y: 0xfacc15,
  Y: 0xca8a04,
  G: 0x22c55e,
  D: 0x15803d,
  b: 0x2563eb,
  s: 0x93c5fd,
  c: 0xe7b97a,
  n: 0xa16207,
  e: 0xfef08a,
}

// One per symbol, in the order of SYMBOLS.
export const SPRITES = [
  [
    '.......kk.......',
    '......krrk......',
    '.....krrrrk.....',
    '.....krrrrk.....',
    '....kwwwwwlk....',
    '....kwwbbwlk....',
    '....kwbssblk....',
    '....kwbssblk....',
    '....kwwbbwlk....',
    '....kwwwwwlk....',
    '..kkkwwwwwlkkk..',
    '.krrkwwwwwlkrRk.',
    '.krrkkkkkkkkrRk.',
    '.kkk.koyyok.kkk.',
    '.....koyyok.....',
    '......kook......',
  ],
  [
    '................',
    '...kkkkkkkkkk...',
    '..kGGGGGGGGGGk..',
    '.kGGGGGGGGGGwGk.',
    '.kGGGGGGGGGwwGk.',
    '.kGGGGGGGGwwwGk.',
    '.kGGGGGGGwwwGGk.',
    '.kGwGGGGwwwGGGk.',
    '.kGwwGGwwwGGGGk.',
    '.kGwwwwwwGGGGGk.',
    '.kGGwwwwGGGGGGk.',
    '.kGGGwwGGGGGGGk.',
    '.kDDDDDDDDDDDDk.',
    '..kDDDDDDDDDDk..',
    '...kkkkkkkkkk...',
    '................',
  ],
  [
    '................',
    '.kkkkkkkkkkkkkk.',
    '.kcccccccccccck.',
    '.knnnnnnnnnnnnk.',
    '..kyyyyyyyyyyk..',
    '..kyrryyyyyyok..',
    '...krryyyyyok...',
    '...kyyyyrryok...',
    '....kyyyrrok....',
    '....kyyyyyok....',
    '.....kyrrok.....',
    '.....kyrrok.....',
    '......kyok......',
    '......kyok......',
    '.......kk.......',
    '................',
  ],
  [
    '....k......k....',
    '.....k....k.....',
    '.....kkkkkk.....',
    '....kkwkkwkk....',
    '....kkkkkkkk....',
    '.k.kGGGkkGGGk.k.',
    '..kkGGGkkGGDkk..',
    '...kGDGkkGGDk...',
    'kkkkGGGkkGGDkkkk',
    '...kGGGkkGDDk...',
    '...kGDGkkGGDk...',
    '..kkGGGkkGGDkk..',
    '.k.kGGGkkGDDk.k.',
    '....kGGkkGDk....',
    '.....kkkkkk.....',
    '................',
  ],
  [
    '.......k........',
    '......krk.......',
    '......krrk......',
    '.....krrrk..k...',
    '.....krorrkkrk..',
    '....krroorkrrk..',
    '...krrooorrrrk..',
    '..krroooyoorrrk.',
    '..kroooyyooorrk.',
    '.krrooyyyyoorrk.',
    '.krooyyyyyyoork.',
    '.krooyyeeyyoork.',
    '.krrooyeeyoorrk.',
    '..krrooyyoorrk..',
    '...kkrrrrrrkk...',
    '.....kkkkkk.....',
  ],
  [
    '................',
    '....kkkkkkkk....',
    '..kkwwwwwwwwkk..',
    '.kwwwwwwwwwwwlk.',
    '.kwwwwwwwwwwwlk.',
    '.kwkkkwwwwkkklk.',
    '.kwkkkkwwkkkklk.',
    '.kwkkkkwwkkkklk.',
    '.kwwkkwwwwkkwlk.',
    '.kwwwwwkkwwwwlk.',
    '..kwwwkkkkwwlk..',
    '...kkwwwwwwkk...',
    '....kwkwwkwk....',
    '....kwwwwwlk....',
    '.....kkkkkk.....',
    '................',
  ],
  [
    '................',
    '....kk....kk....',
    '...kcckkkkcck...',
    '....kcccccck....',
    '.....kYYYYk.....',
    '....kccccccnk...',
    '...kcccGGcccnk..',
    '..kcccGGGGcccnk.',
    '..kccGGccccccnk.',
    '..kcccGGGcccnnk.',
    '..kcccccGGccnnk.',
    '..kccGGGGcccnnk.',
    '..kcccGGcccnnnk.',
    '...kcccccnnnnk..',
    '....kkkkkkkkk...',
    '................',
  ],
]

const COIN = ['..yyyy..', '.ywwyyy.', 'ywyyyyYy', 'ywyyyyYy', 'yyyyyyYy', 'yyyyyYYy', '.yyYYYy.', '..yyyy..']

export type Canvas = { w: number; h: number; px: Int32Array }

function rect(c: Canvas, x: number, y: number, w: number, h: number, color: number): void {
  for (let row = Math.max(0, y); row < Math.min(c.h, y + h); row++) {
    c.px.fill(color, row * c.w + Math.max(0, x), row * c.w + Math.min(c.w, x + w))
  }
}

// Draws `art` with its top left at (x, y), each letter `scale` pixels square,
// on the canvas rows `from` to `to` only. `ink` colours a letter, or skips it.
function stamp(
  c: Canvas,
  art: string[],
  x: number,
  y: number,
  ink: (letter: string, row: number) => number | undefined,
  scale = 1,
  from = 0,
  to = c.h,
): void {
  art.forEach((line, r) =>
    [...line].forEach((letter, col) => {
      const color = ink(letter, r)
      if (color === undefined) return
      for (let row = y + r * scale; row < y + (r + 1) * scale; row++) {
        if (row >= from && row < to) rect(c, x + col * scale, row, scale, 1, color)
      }
    }),
  )
}

// `text` in the big font, `scale` pixels to its pixel, ending at `right`.
// Characters the font lacks are skipped.
function write(c: Canvas, text: string, right: number, y: number, scale: number, ink: (row: number) => number): void {
  const glyphs = [...text].flatMap(char => (FONT[char] ? [FONT[char]] : []))
  let x = right - span(text, scale)
  for (const glyph of glyphs) {
    stamp(c, glyph, x, y, (letter, row) => (letter === '1' ? ink(row) : undefined), scale)
    x += (glyph[0]!.length + 1) * scale
  }
}

function span(text: string, scale: number): number {
  return [...text].reduce((sum, char) => sum + (FONT[char] ? (FONT[char][0]!.length + 1) * scale : 0), -scale)
}

function dim(color: number, by: number): number {
  return [16, 8, 0].reduce((sum, shift) => sum | (Math.round(((color >> shift) & 255) * by) << shift), 0)
}

export type Look = {
  title: string
  at: number[] // strip position of each reel, a fraction while it moves
  phase: number // where the running lights are
  frame: number // frames drawn so far: what falls, falls by it
  glow: number // what the reels celebrate: 0 nothing, 1 a pair, 2 a big win
  isLit: boolean // the blink of the celebration
  hits: boolean[] // the reels that won
  balance: number
  isPaying: boolean // a win is being counted in
}

function pixels(parts: Parts): number {
  return (parts.hasSign ? SIGN : 0) + PITCH + 2 * parts.sliver + 4 + (parts.hasBank ? 2 + BANK : 0)
}

// How many rows of cells the cabinet takes.
export function rows(parts: Parts): number {
  return pixels(parts) / 2
}

export function scene(parts: Parts, look: Look): Canvas {
  const c: Canvas = { w: WIDTH, h: pixels(parts), px: new Int32Array(WIDTH * pixels(parts)).fill(CLEAR) }
  const isOn = look.glow > 0 && look.isLit
  let y = 0

  if (parts.hasSign) {
    rect(c, 1, 0, WIDTH - 2, SIGN, 0x7f1d1d)
    rect(c, 0, 1, WIDTH, SIGN - 1, 0x7f1d1d)
    // Every third bulb is lit and the lit ones run; a win blinks them all.
    for (let i = 0; i * 4 + 2 < WIDTH; i++) {
      const bulb = (shift: number) =>
        (look.glow > 0 ? isOn : (i + look.phase + shift) % 3 === 0) ? 0xfef08a : 0xa16207
      rect(c, i * 4 + 1, 1, 2, 2, bulb(0))
      rect(c, i * 4 + 1, SIGN - 3, 2, 2, bulb(1))
    }
    const right = Math.round((WIDTH + span(look.title, 2)) / 2)
    write(c, look.title, right + 1, 5, 2, () => 0x450a0a)
    write(c, look.title, right, 4, 2, row => [0xfef9c3, 0xfde047, 0xfacc15, 0xf59e0b, 0xd97706][row]!)
    y += SIGN
  }

  // The reels: a frame, three strips of paper, the symbols on them.
  const inner = PITCH + 2 * parts.sliver
  const top = y + 2
  const mid = top + inner / 2
  rect(c, 0, y, WIDTH, inner + 4, 0x92400e)
  rect(c, 1, y + 1, WIDTH - 2, inner + 2, isOn ? 0xfef9c3 : 0xfbbf24)
  rect(c, 2, top, WIDTH - 4, inner, 0x44260a)
  look.at.forEach((at, i) => {
    const x = 2 + i * (CELL + 2)
    rect(c, x, top, CELL, inner, 0xf5efe0)
    if (isOn && look.hits[i]) rect(c, x, mid - PITCH / 2, CELL, PITCH, look.glow === 2 ? 0xfde047 : 0xbbf7d0)
    for (let spot = Math.floor(at) - 2; spot <= Math.floor(at) + 3; spot++) {
      const above = Math.round(mid + (spot - at) * PITCH - CELL / 2)
      stamp(c, SPRITES[faces(spot)[1]]!, x, above, letter => INK[letter], 1, top, top + inner)
    }
  })
  // The reels are drums: what is off the line turns away from the light.
  for (let row = top; row < top + inner; row++) {
    const off = Math.abs(row + 0.5 - mid) - PITCH / 2
    if (off < 0) continue
    const by = 0.9 - (0.45 * off) / parts.sliver
    for (let x = 2; x < WIDTH - 2; x++) c.px[row * WIDTH + x] = dim(c.px[row * WIDTH + x]!, by)
  }
  // The line that counts, marked on the frame.
  rect(c, 0, mid - 2, 2, 4, 0xef4444)
  rect(c, WIDTH - 2, mid - 2, 2, 4, 0xef4444)
  y += inner + 4

  if (parts.hasBank) {
    y += 2
    rect(c, 1, y, WIDTH - 2, BANK, 0xa16207)
    rect(c, 0, y + 1, WIDTH, BANK - 2, 0xa16207)
    rect(c, 1, y + 1, WIDTH - 2, BANK - 2, 0x0c0a09)
    stamp(c, COIN, 4, y + 3, letter => INK[letter])
    const digits = String(look.balance)
    // Five big digits fit; a longer balance is written small.
    const scale = digits.length > 5 ? 1 : 2
    write(c, digits, WIDTH - 4, y + (scale === 2 ? 2 : 5), scale, () => (look.isPaying ? 0x4ade80 : 0xfacc15))
  }

  // A big win rains coins over all of it.
  if (look.glow === 2) {
    for (let i = 0; i < 12; i++) {
      const x = (i * 37 + 11) % (WIDTH - 2)
      const fall = (i * 53 + look.frame * (2 + (i % 3))) % c.h
      rect(c, x, fall, 2, 2, 0xfde047)
      rect(c, x, fall, 1, 1, 0xffffff)
    }
  }
  return c
}

const DEFAULT = 0x01000000 // the color word for "the terminal's own"
const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

// The canvas as a Raster's `cells`: the upper half block, its foreground the
// upper pixel and its background the lower one.
export function cells(c: Canvas): string {
  const words = new Uint32Array((c.w * c.h * 3) / 2)
  for (let i = 0; i < words.length / 3; i++) {
    const upper = c.px[Math.floor(i / c.w) * 2 * c.w + (i % c.w)]!
    const lower = c.px[(Math.floor(i / c.w) * 2 + 1) * c.w + (i % c.w)]!
    const cell =
      upper === lower
        ? [0x20, DEFAULT, upper === CLEAR ? DEFAULT : upper]
        : upper === CLEAR
          ? [0x2584, lower, DEFAULT]
          : [0x2580, upper, lower === CLEAR ? DEFAULT : lower]
    words.set(cell, i * 3)
  }
  // Twelve bytes a cell: always whole groups of three, so no padding.
  const bytes = new Uint8Array(words.buffer)
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const group = (bytes[i]! << 16) | (bytes[i + 1]! << 8) | bytes[i + 2]!
    out += BASE64[group >> 18]! + BASE64[(group >> 12) & 63]! + BASE64[(group >> 6) & 63]! + BASE64[group & 63]!
  }
  return out
}
