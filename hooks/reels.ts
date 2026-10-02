// How a spin looks: the strip the reels scroll and the frames of one spin.
// Show only: the result is drawn and saved before any of this runs.

import type { Reels } from './game'

// The strip every reel scrolls, as indexes into SYMBOLS: each symbol as often
// as its weight, so what slides past is what the reels really hold.
export const STRIP = [4, 5, 3, 2, 5, 4, 1, 3, 5, 4, 2, 5, 3, 4, 0, 5, 3, 2, 4, 1]

export const TICK_MS = 50
const FAST = [6, 11, 16] // steps each reel makes at full speed, one a tick
const BRAKE = [2, 3, 4] // ticks between its last steps
// The first two reels match: the third takes its time.
const TEASE = [2, 2, 3, 3, 4, 4]

// The symbols a reel at strip position `at` shows: above the line, on it, below.
export function faces(at: number): [number, number, number] {
  const wrap = (n: number) => STRIP[((n % STRIP.length) + STRIP.length) % STRIP.length]!
  return [wrap(at - 1), wrap(at), wrap(at + 1)]
}

// One frame a tick: the strip position of each reel. Reels only ever move
// down one symbol at a time, stop left to right, and rest on `result`.
export function plan(result: Reels, rng: () => number = Math.random): number[][] {
  const reels = result.map((symbol, i) => {
    const spots = STRIP.flatMap((face, at) => (face === symbol ? [at] : []))
    const isTease = i === 2 && result[0] === result[1]
    let tick = 0
    return {
      rest: spots[Math.floor(rng() * spots.length)]!,
      steps: [...Array<number>(FAST[i]!).fill(1), ...(isTease ? TEASE : []), ...BRAKE].map(gap => (tick += gap)),
    }
  })
  const length = Math.max(...reels.map(reel => reel.steps.at(-1)!)) + 1
  return Array.from({ length }, (_, tick) =>
    reels.map(reel => reel.rest + reel.steps.filter(at => at > tick).length),
  )
}
