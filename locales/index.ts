// Phrases live in one file per language. To add a language: copy en.ts,
// rewrite it natively (do not translate), and list it in LOCALES below.
// To retire a stale phrase: delete its line.

import en from './en'
import ru from './ru'

export type Phrases = {
  spin: string[] // the reels start
  miss: string[]
  small: string[] // a pair
  big: string[] // three of a kind
  broke: string[] // out of chips
  dep: string[] // chips granted: {chips}, {tokens}
  agentStart: string[]
  agentDone: string[]
  streak: string[] // 5+ misses in a row: {n}
  limit: string[] // weekly limit warning: {pct}
  first: string[] // first launch
  offer: string[] // above the prompt, while the agent works: open the slot?
}

export type Locale = Phrases & {
  // Prompts with three or more matches switch the language to this one.
  detect?: RegExp
  // Which of a `{n:one|few|many}` placeholder's forms goes with `n`.
  plural: (n: number) => number
  title: string // the sign over the reels, in letters the big font has
  group: string // thousands separator
  decimal: string
  labels: {
    spin: string
    copy: string
    lang: string
    close: string
    sound: string
    on: string
    off: string
    yes: string // the offer's four answers
    no: string
    always: string
    never: string
    offer: string // the pane's button for the same setting, and its three values
    offers: { ask: string; always: string; never: string }
    balance: string
    bet: string
    pair: string // the paytable's row for two alike
    week: string
    waited: string
    hours: string
    spins: string
    tokens: string
    maxWin: string
    streak: string
    payout: string
    rank: string
    copied: string
    copyFailed: string
  }
  share: string // the line for chat: {hours}, {spins}, {tokens}, {rank}
  ranks: [string, string, string, string, string] // ascending
}

export const LOCALES: Record<string, Locale> = { en, ru }
export const FALLBACK = 'en'

export function detect(text: string): string | undefined {
  return Object.keys(LOCALES).find(code => {
    const pattern = LOCALES[code]!.detect
    return pattern !== undefined && (text.match(pattern)?.length ?? 0) >= 3
  })
}

const last: Record<string, string> = {}

// A random phrase of the list, never the one `key` got last time.
export function pick(list: string[], key: string, rng: () => number = Math.random): string {
  const pool = list.length > 1 ? list.filter(phrase => phrase !== last[key]) : list
  return (last[key] = pool[Math.floor(rng() * pool.length)]!)
}

// `{name}` becomes the value; `{name:chip|chips}` adds the right plural form.
export function fill(locale: Locale, template: string, vars: Record<string, number | string>): string {
  return template.replace(/\{(\w+)(?::([^}]+))?\}/g, (_, name: string, forms?: string) => {
    const value = vars[name]
    if (typeof value !== 'number') return String(value ?? '')
    const text = String(value).replace(/\B(?=(\d{3})+$)/g, locale.group)
    return forms ? `${text} ${forms.split('|')[locale.plural(value)]}` : text
  })
}
