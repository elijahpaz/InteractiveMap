import { TERMINAL_BY_ID } from '../data/terminals.js'

/**
 * Terminal congestion, and what it costs a truck.
 *
 * ⚠️  THIS IS A MODEL, NOT A LIVE FEED.
 *
 * There is no free public API for real-time gate congestion at San Pedro Bay.
 * The Port of Long Beach publishes gate hours at polb.com/port-info/gate-hours/
 * "powered by BlueCargo", and the Port of LA runs Port Optimizer — both are
 * commercial products behind authentication, with no open endpoint. Real turn
 * times are surveyed by the Harbor Trucking Association, also not public.
 *
 * So this file *models* congestion from the shape real congestion takes: a
 * morning peak after the gates open, an afternoon peak before they close, a
 * quiet night, and a per-terminal baseline that reflects how that terminal
 * normally performs. It is steady and repeatable, not random noise, so the map
 * behaves the way a dispatcher would expect — but the numbers are invented.
 *
 * ── To make it real ──────────────────────────────────────────────────────────
 * Replace `congestionFor` with a lookup against live data. Everything that
 * consumes congestion — the map fill, the popup, the detail panel, the KPI
 * strip — reads the object this returns, so nothing else has to change:
 *
 *   { index, level, queueTrucks, waitMin, turnMin, pickupMin, dropoffMin }
 *
 * Candidate feeds: BlueCargo (POLB gate + terminal data), Port Optimizer
 * Control Tower (POLA), terminal appointment systems (eModal / Voyage Control),
 * or your own drivers' dwell times, which you already have.
 * ────────────────────────────────────────────────────────────────────────────
 */

export const CONGESTION_LEVELS = {
  clear: { label: 'Clear', color: '#22c55e', min: 0 },
  moderate: { label: 'Moderate', color: '#eab308', min: 35 },
  heavy: { label: 'Heavy', color: '#f97316', min: 60 },
  severe: { label: 'Severe', color: '#ef4444', min: 82 },
}

const LEVEL_ORDER = ['severe', 'heavy', 'moderate', 'clear']

export function levelFor(index) {
  for (const key of LEVEL_ORDER) {
    if (index >= CONGESTION_LEVELS[key].min) return { key, ...CONGESTION_LEVELS[key] }
  }
  return { key: 'clear', ...CONGESTION_LEVELS.clear }
}

/** Stable per-terminal offset so each one has its own character, not noise. */
function seedOf(id) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997
  return h / 997
}

/**
 * Demand through the day. Two peaks — the rush after the gates open and the
 * push to get in before they close — with a trough over the lunch break and
 * almost nothing overnight.
 */
function demandCurve(hour) {
  const morning = Math.exp(-((hour - 9.5) ** 2) / 4.5)
  const afternoon = Math.exp(-((hour - 14.5) ** 2) / 5.0)
  const night = hour < 5 || hour > 21 ? 0.12 : 1
  return Math.min(1, (morning * 0.95 + afternoon * 0.75)) * night
}

/**
 * Congestion for one terminal at a given minute of the simulated day.
 * `clockMin` is minutes past midnight, matching the ops clock.
 */
export function congestionFor(terminalId, clockMin) {
  const terminal = TERMINAL_BY_ID[terminalId]
  if (!terminal) return null

  const hour = (clockMin / 60) % 24
  const seed = seedOf(terminalId)

  // Baseline from the terminal's own turn time: a 92-minute terminal starts
  // congested in a way a 44-minute one does not.
  const baseTurn = terminal.demo.turnTimeMin
  const baseline = Math.min(1, (baseTurn - 40) / 60)

  // A slow drift so the map doesn't look frozen between peaks.
  const drift = Math.sin((clockMin / 137) + seed * 6.28) * 0.08

  const raw = demandCurve(hour) * (0.45 + baseline * 0.42) + baseline * 0.2 + drift
  const index = Math.max(0, Math.min(100, Math.round(raw * 100)))
  const level = levelFor(index)

  // Queue and wait scale off the index; turn time inflates as the yard backs up.
  const queueTrucks = Math.round(index * 0.55 + seed * 6)
  const waitMin = Math.round((index / 100) ** 1.6 * 95)
  const turnMin = Math.round(baseTurn * (1 + (index / 100) * 0.85))

  return {
    index,
    level,
    queueTrucks,
    waitMin,
    turnMin,
    // An import pickup means queueing in, finding the box, and getting out.
    pickupMin: waitMin + turnMin,
    // A dropoff is usually quicker — no container to locate in the stack.
    dropoffMin: waitMin + Math.round(turnMin * 0.62),
  }
}

/** Congestion for every terminal at once, keyed by id. */
export function congestionSnapshot(terminalIds, clockMin) {
  return Object.fromEntries(
    terminalIds.map((id) => [id, congestionFor(id, clockMin)])
  )
}
