import { POLB_GATE_CALENDAR as calendar } from '../data/polbGateCalendar.js'
import { POLA_GATE_SUCCESS as polaSuccess } from '../data/polaGateSuccess.js'
import { CARGONAV } from '../data/cargonav.js'

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
 *   Port of Los Angeles — no gate calendar, but something better for the
 *   congestion question: a daily per-terminal gate SUCCESS RATE, the share of
 *   booked appointments actually fulfilled. Published free, no registration,
 *   each weekday. It does not say when a terminal is open, so POLA terminals
 *   still report unknown gate hours — but they are no longer silent about how
 *   the terminal is coping.
 *
 *   The two ports publish different things. Neither is filled in for the other.
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


/* ── Port of Los Angeles: daily gate success rate ───────────────────────────
 *
 * The share of booked truck appointments a terminal actually fulfilled. This
 * is the one real, free, per-terminal congestion signal available for San Pedro
 * Bay. It is not a queue length and not a turn time; do not label it as either.
 */

export const POLA_SUCCESS_SOURCE = polaSuccess.source
export const POLA_SUCCESS_DATE = polaSuccess.dataDate
export const POLA_SUCCESS_ALL = polaSuccess.allTerminals

/** Bands for reading a success rate, from the metric's own meaning. */
export function successBand(pct) {
  if (pct == null) return { key: 'unknown', label: 'Unknown', color: '#94a3b8' }
  if (pct >= 95) return { key: 'strong', label: 'Keeping up', color: '#22c55e' }
  if (pct >= 75) return { key: 'ok', label: 'Mostly keeping up', color: '#eab308' }
  if (pct >= 50) return { key: 'strained', label: 'Falling behind', color: '#f97316' }
  return { key: 'severe', label: 'Badly behind', color: '#ef4444' }
}

/**
 * Published gate success for a terminal, or an explicit unknown for Long Beach,
 * which publishes no equivalent figure.
 */
export function gateSuccessFor(terminalId) {
  const pct = polaSuccess.byTerminal[terminalId]
  if (pct == null) {
    return {
      known: false,
      reason: 'The Port of Long Beach publishes no appointment fulfilment figure',
    }
  }
  return {
    known: true,
    pct,
    band: successBand(pct),
    dataDate: polaSuccess.dataDate,
    allTerminals: polaSuccess.allTerminals,
    meaning: polaSuccess.meaning,
  }
}

/* ── One colour, whatever the port publishes ────────────────────────────────
 *
 * The two ports measure different things, but a dispatcher looking at the map
 * is asking one question: how easily can I get into this terminal today? This
 * collapses whatever each port actually publishes into a single five-level
 * scale so the map reads at a glance, and always reports which measure it used
 * so nobody mistakes one port's signal for the other's.
 *
 * Long Beach publishes shifts worked. More shifts is more capacity, which is
 * the closest honest reading of "how congested" from a gate calendar — it is
 * capacity offered, not queue length, and is labelled that way.
 *
 * Los Angeles publishes appointment fulfilment, which is a direct measure of a
 * terminal failing to take the trucks booked for it.
 */

export const ACCESS_LEVELS = {
  good: { label: 'Running well', color: '#22c55e', rank: 0 },
  fair: { label: 'Some pressure', color: '#eab308', rank: 1 },
  poor: { label: 'Struggling', color: '#f97316', rank: 2 },
  shut: { label: 'No gate today', color: '#ef4444', rank: 3 },
  unknown: { label: 'Not published', color: '#64748b', rank: 4 },
}

export function terminalAccess(terminalId, dateISO) {
  const gate = gateStatusFor(terminalId, dateISO)

  // A gate with no open shift is shut regardless of how fast it turns trucks
  // when it is open, so the calendar is checked first.
  if (gate.known && !gate.anyOpen) {
    return {
      ...ACCESS_LEVELS[gate.unposted ? 'unknown' : 'shut'],
      level: gate.unposted ? 'unknown' : 'shut',
      basis: 'shifts',
      detail: gate.unposted ? 'Shifts not yet posted' : 'No shift open today',
      shifts: gate.shifts,
      source: 'Port of Long Beach gate calendar',
      asOf: dateISO,
    }
  }

  // Long Beach: the port measures and publishes actual gate turn time.
  const turn = CARGONAV.turnTime.byTerminal[terminalId]
  if (turn) {
    const worst = Math.max(turn.dayMinutes, turn.nightMinutes)
    const level = worst <= 30 ? 'good' : worst <= 50 ? 'fair' : 'poor'
    return {
      ...ACCESS_LEVELS[level],
      level,
      basis: 'turnTime',
      detail: `${turn.dayMinutes}m day · ${turn.nightMinutes}m night inside the gate`,
      turn,
      shifts: gate.known ? gate.shifts : null,
      source: 'Port of Long Beach, CargoNav measured gate turn time',
      asOf: CARGONAV.turnTime.asOf.slice(0, 10),
    }
  }

  // Los Angeles: how much of what was booked actually got through.
  const success = gateSuccessFor(terminalId)
  if (success.known) {
    const level =
      success.pct >= 95 ? 'good' : success.pct >= 70 ? 'fair' : 'poor'
    return {
      ...ACCESS_LEVELS[level],
      level,
      basis: 'appointments',
      detail: `${success.pct}% of booked appointments fulfilled`,
      pct: success.pct,
      allTerminals: success.allTerminals,
      source: 'Port of Los Angeles appointment fulfilment',
      asOf: success.dataDate,
    }
  }

  return { ...ACCESS_LEVELS.unknown, level: 'unknown', basis: 'none', detail: gate.reason }
}

/** Days between the Long Beach capture and now, for an honest staleness note. */
export function captureAgeDays(now = new Date()) {
  return Math.max(0, Math.floor((now - new Date(GATE_CAPTURED_AT)) / 86400000))
}
