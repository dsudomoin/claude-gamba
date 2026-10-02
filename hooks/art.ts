// Text art for the pane: big letters, the bulb row, the reel window, and
// which layout a pane of a given size gets. Strings only, no engine calls.

import { SYMBOLS } from './game'
import { faces } from './reels'

// Five pixel rows per glyph; `big` packs them into three rows of half blocks.
export const FONT: Record<string, string[]> = {
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'],
  '7': ['111', '001', '001', '001', '001'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
  G: ['111', '100', '101', '101', '111'],
  A: ['111', '101', '111', '101', '101'],
  M: ['10001', '11011', '10101', '10001', '10001'],
  B: ['110', '101', '110', '101', '110'],
  Л: ['00100', '01010', '01010', '10001', '10001'],
  У: ['101', '101', '111', '001', '110'],
  Д: ['01110', '01010', '01010', '11111', '10001'],
  К: ['101', '101', '110', '101', '101'],
  А: ['111', '101', '111', '101', '101'],
}

// `text` three rows tall. Characters the font lacks are skipped.
export function big(text: string): [string, string, string] {
  const glyphs = [...text].flatMap(char => (FONT[char] ? [FONT[char]] : []))
  const row = (r: number) =>
    glyphs
      .map(glyph =>
        [...glyph[0]!]
          .map((_, x) => {
            const top = glyph[r * 2]?.[x] === '1'
            const bottom = glyph[r * 2 + 1]?.[x] === '1'
            return top && bottom ? '█' : top ? '▀' : bottom ? '▄' : ' '
          })
          .join(''),
      )
      .join(' ')
  return [row(0), row(1), row(2)]
}

// A row of bulbs `width` cells wide: every third one lit, the lit ones
// moving with `phase`. `blink` lights or darkens the whole row instead.
export function bulbs(width: number, phase: number, blink?: 'lit' | 'dark'): string {
  return Array.from({ length: Math.floor((width + 1) / 2) }, (_, i) =>
    blink === 'lit' || (blink === undefined && (i + phase) % 3 === 0) ? '●' : '○',
  ).join(' ')
}

// The reel window as lines of equal width: frame, three rows of the strip,
// frame. The middle row is the payline and carries the markers.
export function reelWindow(at: number[], isWide: boolean): string[] {
  const pad = ' '.repeat(isWide ? 3 : 2)
  const bar = (isWide ? '═' : '─').repeat(pad.length * 2 + 2)
  const [left, right, side, cross] = isWide ? ['► ', ' ◄', '║', '║'] : ['>', '<', '│', '│']
  const blank = ' '.repeat(left.length)
  const frame = (a: string, b: string, c: string) => `${blank}${a}${[bar, bar, bar].join(b)}${c}${blank}`
  const row = (r: 0 | 1 | 2) =>
    `${side}${at.map(spot => `${pad}${SYMBOLS[faces(spot)[r]]!.emoji}${pad}`).join(cross)}${side}`
  return [
    isWide ? frame('╔', '╦', '╗') : frame('╭', '┬', '╮'),
    `${blank}${row(0)}${blank}`,
    `${left}${row(1)}${right}`,
    `${blank}${row(2)}${blank}`,
    isWide ? frame('╚', '╩', '╝') : frame('╰', '┴', '╯'),
  ]
}

// The cabinet drawn in pixels is this many cells wide.
export const WIDTH = 56

// Which parts of the pixel cabinet a pane has room for.
export type Parts = {
  hasSign: boolean
  hasBank: boolean // the balance display under the reels
  sliver: number // pixels of the symbols above and below the line that show
}

// What a pane of a given size draws. Everything optional is dropped in turn
// as the room shrinks, and the balance moves beside the reels before it
// gives up its big digits.
export type Layout = {
  isWide: boolean // the double-framed reel window fits
  // Big digits under the reels or next to them, one line of text, or the cabinet's own display.
  bank: 'below' | 'beside' | 'line' | 'drawn'
  // A framed card; the records next to the reels and the week on a line; or two lines of text.
  stats: 'card' | 'split' | 'lines'
  hasLights: boolean
  hasTitle: boolean
  hasPays: boolean
  gap: 0 | 1 // blank rows between the sections
  cabinet?: Parts // the reels in pixels, in place of the text window, the sign and the lights
}

// `canPaint`: the surface draws pixels, so the cabinet goes wherever it fits.
export function layout(placement: 'dock' | 'inline', columns: number, rows: number, canPaint = false): Layout {
  const isWide = columns >= 34
  const isBroad = columns >= 52 // the big balance fits beside the reels
  const plain = { isWide, hasLights: false, hasTitle: false, hasPays: false, gap: 0 } as const
  if (!isWide) return { ...plain, bank: 'line', stats: 'lines' }
  if (canPaint && columns >= WIDTH) {
    const reels = { hasSign: false, hasBank: false, sliver: 1 }
    // Above the prompt: the reels, and everything else in a column beside
    // them, which takes 45 cells to stay as short as the reels are.
    if (placement === 'inline' && columns >= WIDTH + 48) {
      return { ...plain, bank: 'beside', stats: 'lines', cabinet: reels }
    }
    // The sidebar, by the rows the cabinet and the nine rows of words under it
    // add up to: 35 with the sign, 26 without. What is spare goes to blank
    // rows between the sections, then to the stats card, then to the paytable.
    if (placement === 'dock' && rows >= 35) {
      const hasSign = rows >= 44
      const spare = rows - (hasSign ? 44 : 35)
      return {
        ...plain,
        bank: 'drawn',
        stats: spare >= 13 ? 'card' : 'lines',
        hasPays: spare >= 20,
        gap: spare >= 5 ? 1 : 0,
        cabinet: { hasSign, hasBank: true, sliver: 7 },
      }
    }
    if (placement === 'dock' && rows >= 22) {
      return { ...plain, bank: 'line', stats: 'lines', gap: rows >= 28 ? 1 : 0, cabinet: reels }
    }
  }
  // Above the prompt the height is short and the width is what there is to use.
  if (placement === 'inline') {
    if (columns >= 73) return { ...plain, bank: 'beside', stats: 'split' }
    return { ...plain, bank: isBroad ? 'beside' : 'line', stats: 'lines' }
  }
  // The sidebar, by the rows each set of parts adds up to.
  const lit = { ...plain, hasLights: true }
  if (rows >= 31) {
    return { ...lit, bank: 'below', stats: 'card', gap: 1, hasTitle: rows >= 35, hasPays: rows >= 41 && columns >= 45 }
  }
  if (rows >= 26) return { ...lit, bank: 'below', stats: 'card' }
  if (rows >= 22 && isBroad) return { ...lit, bank: 'beside', stats: 'card' }
  if (rows >= 18) return { ...lit, bank: isBroad ? 'beside' : 'below', stats: 'lines' }
  return { ...plain, hasLights: rows >= 14, bank: isBroad ? 'beside' : 'line', stats: 'lines' }
}
