import { POLB_GATE_CALENDAR as calendar } from '../data/polbGateCalendar.js'

/**
 * Gate status, from published data only.
 *
 * This file replaced a hand-written weekly schedule of invented opening hours.
 * That schedule was shaped correctly but every hour in it was made up, which
 * made it worse than useless: it rendered identically to fact.
 *
 * What we actually have:
 *
 *   Port of Long Beach — a real 14-day forward gate calendar, per terminal,
 *   per ILWU shift, published at polb.com/port-info/gate-hours/ and captured
 *   into data/polbGateCalendar.json. Values are exactly as published: Open,
 *   Closed, or TBD. TBD means the terminal has not committed yet — it is a
 *   real state, not missing data, and is reported as itself.
 *
 *   Port of Los Angeles — nothing. POLA publishes gate hours as a rendered
 *   document this project could not reach programmatically, and has no open
 *   feed. Its seven terminals therefore report UNKNOWN. They are not filled in
 *   by analogy with Long Beach, and not guessed from a "typical" schedule.
 *
 * What we deliberately do NOT have, and do not invent:
 *
 *   Clock times. The source gives shift-level open/closed, not hours. So this
 *   module cannot answer "does the gate shut in 20 minutes", and nothing that
 *   depends on that question survives. An earlier version answered it with
 *   fabricated windows and drove routing decisions off the result.
 */

export const GATE_SOURCE = calendar.source
export const GATE_PUBLISHER = calendar.publisher
export const GATE_CAPTURED_AT = calendar.capturedAt

export const SHIFT_STATUS = {
  Open: { label: 'Open', color: '#22c55e' },
  Closed: { label: 'Closed', color: '#ef4444' },
  TBD: { label: 'Not yet posted', color: '#94a3b8' },
}

/** The dates the captured calendar actually covers. */
export const COVERED_DATES = Object.keys(
  calendar.terminals[Object.keys(calendar.terminals)[0]] ?? {}
).sort()

export const COVERAGE_START = COVERED_DATES[0]
export const COVERAGE_END = COVERED_DATES[COVERED_DATES.length - 1]

/** Is this terminal covered by a published feed at all? */
export function hasGateData(terminalId) {
  return Boolean(calendar.terminals[terminalId])
}

export function toISODate(date) {
  return date.toISOString().slice(0, 10)
}

/**
 * Published gate status for one terminal on one date.
 *
 * Returns `{ known: false, reason }` rather than a plausible default whenever
 * the terminal is not covered, or the date falls outside what was captured.
 * Callers must render the unknown case as unknown.
 */
export function gateStatusFor(terminalId, dateISO) {
  const perTerminal = calendar.terminals[terminalId]
  if (!perTerminal) {
    return {
      known: false,
      reason: 'No published gate feed for this port',
      shifts: null,
    }
  }

  const shifts = perTerminal[dateISO]
  if (!shifts) {
    return {
      known: false,
      reason: `Outside the captured window (${COVERAGE_START} to ${COVERAGE_END})`,
      shifts: null,
    }
  }

  const values = Object.values(shifts)
  return {
    known: true,
    shifts,
    anyOpen: values.includes('Open'),
    allClosed: values.every((v) => v === 'Closed'),
    unposted: values.every((v) => v === 'TBD'),
  }
}

/** "Shift 1 open · Shift 2 closed · Shift 3 not yet posted" */
export function shiftSummary(shifts) {
  if (!shifts) return 'Not published'
  return Object.entries(shifts)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([n, v]) => `Shift ${n} ${(SHIFT_STATUS[v]?.label ?? v).toLowerCase()}`)
    .join(' · ')
}

/** How stale the captured calendar is, in days, relative to `now`. */
export function calendarAgeDays(now = new Date()) {
  const captured = new Date(GATE_CAPTURED_AT)
  return Math.floor((now - captured) / 86400000)
}
