// How a spin looks: the strip the reels scroll and where each reel is at any
// moment of one spin. Show only: the result is drawn and saved before any of
// this runs.

import type { Reels } from './game'

// The strip every reel scrolls, as indexes into SYMBOLS: each symbol as often
// as its weight, so what slides past is what the reels really hold.
export const STRIP = [4, 5, 3, 2, 5, 4, 1, 3, 5, 4, 2, 5, 3, 4, 0, 5, 3, 2, 4, 1, 6]

export const FRAME_MS = 33
const SPEED = 20 // symbols a second, at full speed
const CRAWL = 4 // and as a reel reaches its stop
const STOPS = [700, 1100, 1500] // when each reel stops, ms into the spin
const BRAKE_MS = 450 // how long a reel slows down for
const TEASE_MS = 1200 // the first two reels match: the third takes this much longer
export const BOUNCE_MS = 180 // a stopped reel runs past its symbol and springs back
const BOUNCE = 0.16 // by this much of a symbol

// The symbols a reel at strip position `at` shows: above the line, on it, below.
export function faces(at: number): [number, number, number] {
  const wrap = (n: number) => STRIP[((n % STRIP.length) + STRIP.length) % STRIP.length]!
  return [wrap(at - 1), wrap(at), wrap(at + 1)]
}

export type Plan = {
  rest: number[] // the strip position each reel ends on
  stops: number[] // when each reel gets there, ms into the spin
  brakes: number[] // how long before that it starts to slow down
}

// Reels stop left to right and rest on `result`.
export function plan(result: Reels, rng: () => number = Math.random): Plan {
  const tease = result[0] === result[1] ? TEASE_MS : 0
  return {
    rest: result.map(symbol => {
      const spots = STRIP.flatMap((face, at) => (face === symbol ? [at] : []))
      return spots[Math.floor(rng() * spots.length)]!
    }),
    stops: STOPS.map((stop, i) => stop + (i === 2 ? tease : 0)),
    brakes: STOPS.map((_, i) => BRAKE_MS + (i === 2 ? tease : 0)),
  }
}

// The strip position of each reel `ms` into the spin, a fraction while the
// reel moves. Reels only ever run down the strip towards their rest.
export function where({ rest, stops, brakes }: Plan, ms: number): number[] {
  return rest.map((spot, i) => {
    const left = stops[i]! - ms
    if (left <= -BOUNCE_MS) return spot
    if (left <= 0) return spot - BOUNCE * Math.sin((Math.PI * -left) / BOUNCE_MS)
    // Full speed, then a steady slowdown to a crawl over the last `brakes[i]`.
    const slowing = Math.min(left, brakes[i]!)
    const slowed = CRAWL * slowing + ((SPEED - CRAWL) * slowing * slowing) / (2 * brakes[i]!)
    return spot + (slowed + SPEED * (left - slowing)) / 1000
  })
}
