/**
 * Terminal gate schedules.
 *
 * ⚠️  THE STRUCTURE IS REAL. THE HOURS ARE PLACEHOLDERS.
 *
 * Gate hours are not a fact you look up once — they are a weekly schedule with
 * constant per-day exceptions: a terminal drops its second shift, adds a
 * Saturday gate for one week, closes early for a holiday, or opens a night gate
 * to clear a vessel. The Port of Long Beach republishes them continuously at
 * polb.com/port-info/gate-hours/ (data powered by BlueCargo).
 *
 * So the windows below are invented, but they are shaped the way real gate
 * hours are shaped, which is the part that matters for the code around them:
 *
 *   - several windows per day, so a midday break is expressible
 *   - a window may run past midnight (close > 1440) for a night gate
 *   - a day may have no windows at all, meaning closed
 *
 * A real feed drops straight into this shape. What must NOT happen is the
 * previous version of this file, where gate hours were one string like
 * '08:00 - 17:00' — that cannot express a lunch closure, a Saturday gate, or a
 * night gate, so any arrival estimate built on it is wrong the moment a
 * terminal does anything other than open once and close once.
 */

/** Minutes from local midnight. Values over 1440 run into the next day. */
const hm = (h, m = 0) => h * 60 + m

// Common shapes, named so the per-terminal table stays readable.
const STANDARD = [[hm(8), hm(12)], [hm(13), hm(17)]]        // 08:00-12:00, 13:00-17:00
const STRAIGHT = [[hm(8), hm(17)]]                           // no midday break
const EARLY = [[hm(7), hm(12)], [hm(13), hm(17)]]
const NIGHT_GATE = [[hm(6), hm(26)]]                         // 06:00 → 02:00 next day
const ROUND_THE_CLOCK = [[hm(5), hm(27)]]                    // 05:00 → 03:00 next day
const SATURDAY_GATE = [[hm(8), hm(16)]]
const CLOSED = []

/**
 * Weekly windows per terminal, indexed the way `Date.getDay()` is:
 * 0 Sunday … 6 Saturday.
 */
export const GATE_SCHEDULES = {
  // ── Port of Los Angeles ──
  'T-WBCT-CS':  { 0: CLOSED, 1: STANDARD, 2: STANDARD, 3: STANDARD, 4: STANDARD, 5: STANDARD, 6: CLOSED },
  'T-WBCT-TIL': { 0: CLOSED, 1: STANDARD, 2: STANDARD, 3: STANDARD, 4: STANDARD, 5: STANDARD, 6: SATURDAY_GATE },
  'T-TRP':      { 0: CLOSED, 1: STANDARD, 2: STANDARD, 3: STANDARD, 4: STANDARD, 5: STANDARD, 6: CLOSED },
  'T-YTI':      { 0: CLOSED, 1: STANDARD, 2: STANDARD, 3: STANDARD, 4: STANDARD, 5: STANDARD, 6: SATURDAY_GATE },
  'T-EVP':      { 0: CLOSED, 1: STRAIGHT, 2: STRAIGHT, 3: STRAIGHT, 4: STRAIGHT, 5: STRAIGHT, 6: CLOSED },
  'T-FMS':      { 0: CLOSED, 1: EARLY, 2: EARLY, 3: EARLY, 4: EARLY, 5: EARLY, 6: SATURDAY_GATE },
  'T-APM':      { 0: CLOSED, 1: ROUND_THE_CLOCK, 2: ROUND_THE_CLOCK, 3: ROUND_THE_CLOCK, 4: ROUND_THE_CLOCK, 5: ROUND_THE_CLOCK, 6: SATURDAY_GATE },

  // ── Port of Long Beach ──
  'T-SSA-A':    { 0: CLOSED, 1: STANDARD, 2: STANDARD, 3: STANDARD, 4: STANDARD, 5: STANDARD, 6: CLOSED },
  'T-SSA-C':    { 0: CLOSED, 1: [[hm(7), hm(12)], [hm(13), hm(16, 30)]], 2: [[hm(7), hm(12)], [hm(13), hm(16, 30)]], 3: [[hm(7), hm(12)], [hm(13), hm(16, 30)]], 4: [[hm(7), hm(12)], [hm(13), hm(16, 30)]], 5: [[hm(7), hm(12)], [hm(13), hm(16, 30)]], 6: CLOSED },
  'T-LBCT':     { 0: CLOSED, 1: NIGHT_GATE, 2: NIGHT_GATE, 3: NIGHT_GATE, 4: NIGHT_GATE, 5: NIGHT_GATE, 6: SATURDAY_GATE },
  'T-ITS':      { 0: CLOSED, 1: STANDARD, 2: STANDARD, 3: STANDARD, 4: STANDARD, 5: STANDARD, 6: SATURDAY_GATE },
  'T-TTI':      { 0: CLOSED, 1: EARLY, 2: EARLY, 3: EARLY, 4: EARLY, 5: EARLY, 6: CLOSED },
  'T-PCT':      { 0: CLOSED, 1: EARLY, 2: EARLY, 3: EARLY, 4: EARLY, 5: EARLY, 6: CLOSED },
}

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
