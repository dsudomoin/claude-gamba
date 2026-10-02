// The slot and the chip economy: plain functions, no engine calls.

export type Sym = { emoji: string; weight: number; pay: number }

// One strip, used by all three reels. `pay` is what three of a kind returns
// on a 1-chip bet. Emoji are Unicode 6 with default emoji presentation and no
// variation selector, so every terminal draws them two cells wide.
export const SYMBOLS: readonly Sym[] = [
  { emoji: '🚀', weight: 1, pay: 200 }, // shipped
  { emoji: '✅', weight: 2, pay: 50 }, // tests green
  { emoji: '🍕', weight: 3, pay: 25 }, // pizza night
  { emoji: '🐛', weight: 4, pay: 10 }, // bug
  { emoji: '🔥', weight: 5, pay: 6 }, // prod is on fire
  { emoji: '💀', weight: 5, pay: 6 }, // segfault
]

// Two matching symbols from the left.
export const PAIR_PAY = 2

const TOTAL_WEIGHT = SYMBOLS.reduce((sum, s) => sum + s.weight, 0)

export type Reels = [number, number, number]

function reel(rng: () => number): number {
  let roll = rng() * TOTAL_WEIGHT
  return SYMBOLS.findIndex(s => (roll -= s.weight) < 0)
}

export function spin(rng: () => number = Math.random): Reels {
  return [reel(rng), reel(rng), reel(rng)]
}

export function payout([a, b, c]: Reels): number {
  if (a !== b) return 0
  return b === c ? SYMBOLS[a]!.pay : PAIR_PAY
}

// Expected return per chip bet, exact: every combination times its chance.
export function rtp(): number {
  let total = 0
  SYMBOLS.forEach((x, a) =>
    SYMBOLS.forEach((y, b) =>
      SYMBOLS.forEach((z, c) => {
        total += (x.weight * y.weight * z.weight * payout([a, b, c])) / TOTAL_WEIGHT ** 3
      }),
    ),
  )
  return total
}

// When the agent starts working: offer the slot above the prompt, open it
// without asking, or stay out of the way.
export type Offer = 'ask' | 'always' | 'never'
export const OFFERS: readonly Offer[] = ['ask', 'always', 'never']

// The stakes on offer, in chips.
export const BETS = [1, 2, 3, 5, 10, 15, 20, 25]

export type Save = {
  chips: number
  dust: number // burned tokens not yet turned into a chip
  lang: string // 'auto' or a locale code
  detected: string // locale the prompts were written in
  seen: boolean // the first-launch line was shown
  offer: Offer
  sound: boolean
  rest: number[] // where on the strip the reels stopped last
  week: { id: number; waitedMs: number; spins: number; tokens: number }
  bet: number // chips a spin stakes, one of BETS
  spins: number
  wagered: number
  won: number
  maxWin: number
  missStreak: number
  maxMissStreak: number
  warnedUntil: number // no limit warning before this time
  // The settings, changed with /gamba rate, cap and warn.
  rate: number // burned tokens one chip costs
  cap: number // chips one agent turn deposits at most
  warn: number // percent of the weekly limit that sets off the warning
}

export function fresh(): Save {
  return {
    chips: 0,
    dust: 0,
    lang: 'auto',
    detected: 'en',
    seen: false,
    offer: 'ask',
    sound: true,
    rest: [0, 2, 5],
    week: { id: 0, waitedMs: 0, spins: 0, tokens: 0 },
    bet: 1,
    spins: 0,
    wagered: 0,
    won: 0,
    maxWin: 0,
    missStreak: 0,
    maxMissStreak: 0,
    warnedUntil: 0,
    rate: 2000,
    cap: 20,
    warn: 80,
  }
}

const DAY_MS = 86_400_000
export const WEEK_MS = 7 * DAY_MS

// ponytail: weeks turn over on Monday 00:00 UTC, not local time. Take an
// offset from the locale if anyone minds.
export function rollWeek(s: Save, now: number): void {
  const id = Math.floor((now / DAY_MS + 3) / 7) // 1970-01-01 was a Thursday
  if (s.week.id !== id) s.week = { id, waitedMs: 0, spins: 0, tokens: 0 }
}

type Usage = {
  input_tokens: number
  output_tokens: number
  cache_creation_input_tokens: number
}

// Tokens one request burned. Cache reads are left out: every request of a
// turn re-reads the same context, so they would count it once per tool call.
export function burned(u: Usage): number {
  return u.input_tokens + u.output_tokens + u.cache_creation_input_tokens
}

// Turns burned tokens into chips, at most `room` of them; what does not make
// a whole chip waits in `dust` for the next deposit. Returns the chips added.
export function deposit(s: Save, tokens: number, tokensPerChip: number, room: number): number {
  s.week.tokens += tokens
  s.dust += tokens
  const chips = Math.max(0, Math.min(room, Math.floor(s.dust / tokensPerChip)))
  s.dust %= tokensPerChip
  s.chips += chips
  return chips
}

// One spin with the reels already drawn. The stake is the chosen bet, or all
// the chips there are when that is less; the win is the payout times it.
export function applySpin(s: Save, reels: Reels): number {
  const stake = Math.min(s.bet, s.chips)
  const win = payout(reels) * stake
  s.chips += win - stake
  s.spins += 1
  s.week.spins += 1
  s.wagered += stake
  s.won += win
  s.maxWin = Math.max(s.maxWin, win)
  s.missStreak = win > 0 ? 0 : s.missStreak + 1
  s.maxMissStreak = Math.max(s.maxMissStreak, s.missStreak)
  return win
}

// All-time spins needed for each rank, lowest first; names live in locales.
const RANK_AT = [0, 10, 100, 500, 2000]

export function rank(spins: number): number {
  return RANK_AT.findLastIndex(at => spins >= at)
}
