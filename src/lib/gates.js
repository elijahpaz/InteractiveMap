import { DAY_SHORT, GATE_SCHEDULES } from '../data/gateSchedules.js'

/**
 * Is the gate open, when does it shut, and can a truck actually get through
 * before it does?
 *
 * That last question is the point of this file. A pick-up estimate of "3h 40m"
 * is worthless on its own — if the gate closes in forty minutes, the honest
 * answer is that the driver is not getting in today. Everything here exists so
 * the map can say that instead of quietly showing a number that cannot happen.
 */

const MINUTES_PER_DAY = 1440

/** Warn this far ahead of a gate closing. */
export const CLOSING_SOON_MIN = 60

/**
 * Windows that apply at a given moment, expressed relative to `clockMin` on
 * the current day. Yesterday's overnight windows can still be running, so we
 * check the previous day shifted back a full day.
 */
function activeWindows(terminalId, day) {
  const schedule = GATE_SCHEDULES[terminalId]
  if (!schedule) return []

  const today = (schedule[day] ?? []).map(([open, close]) => [open, close])
  const yesterday = (schedule[(day + 6) % 7] ?? [])
    .filter(([, close]) => close > MINUTES_PER_DAY)
    .map(([open, close]) => [open - MINUTES_PER_DAY, close - MINUTES_PER_DAY])

  return [...yesterday, ...today].sort((a, b) => a[0] - b[0])
}

/**
 * Gate state for one terminal at a moment in the week.
 *
 *   state         'open' | 'closing' | 'closed'
 *   closesInMin   minutes until the current window ends (open/closing only)
 *   opensInMin    minutes until the next window starts (closed only)
 *   nextOpenLabel human-readable next opening, e.g. "Mon 08:00"
 */
/** The first gate window that starts strictly after `afterMin`, up to a week out. */
function nextWindowAfter(terminalId, afterMin, day) {
  let searchDay = day
  let offset = 0
  for (let i = 0; i < 8; i++) {
    const candidates = activeWindows(terminalId, searchDay)
      .filter(([open]) => open + offset > afterMin)
      .sort((a, b) => a[0] - b[0])

    if (candidates.length) {
      const [open] = candidates[0]
      return {
        inMin: Math.round(open + offset - afterMin),
        label: `${DAY_SHORT[searchDay]} ${formatMinutes(open % MINUTES_PER_DAY)}`,
        sameDay: i === 0,
      }
    }
    searchDay = (searchDay + 1) % 7
    offset += MINUTES_PER_DAY
  }
  return null
}

export function gateStatus(terminalId, clockMin, day) {
  const windows = activeWindows(terminalId, day)
  const current = windows.find(([open, close]) => clockMin >= open && clockMin < close)

  if (current) {
    const closesInMin = Math.round(current[1] - clockMin)
    // A truck that misses this window isn't necessarily done for the day — a
    // midday break reopens in an hour. Carry the next opening either way so
    // callers can say which it is.
    const reopen = nextWindowAfter(terminalId, current[1], day)
    return {
      state: closesInMin <= CLOSING_SOON_MIN ? 'closing' : 'open',
      open: true,
      closesInMin,
      closesAt: current[1] % MINUTES_PER_DAY,
      opensInMin: null,
      nextOpenLabel: null,
      reopensLabel: reopen?.label ?? null,
      reopensSameDay: reopen?.sameDay ?? false,
    }
  }

  const next = nextWindowAfter(terminalId, clockMin, day)
  return {
    state: 'closed',
    open: false,
    closesInMin: null,
    closesAt: null,
    opensInMin: next?.inMin ?? null,
    nextOpenLabel: next?.label ?? null,
    reopensLabel: next?.label ?? null,
    reopensSameDay: next?.sameDay ?? false,
  }
}

/**
 * Whether a truck arriving in `etaMin` can still be processed. A driver who
 * reaches the gate after it shuts has burned the trip, so this is what the map
 * warns on rather than the raw estimate.
 */
export function willMakeGate(status, etaMin) {
  if (!status.open) return false
  return etaMin <= status.closesInMin
}

/** Today's windows as text, e.g. "08:00-12:00, 13:00-17:00" or "Closed". */
export function scheduleLabel(terminalId, day) {
  // A missing day must not quietly render as "Closed" — that reads as a real
  // closure and is indistinguishable from one.
  if (day == null) return '—'
  const windows = GATE_SCHEDULES[terminalId]?.[day] ?? []
  if (windows.length === 0) return 'Closed'
  return windows
    .map(([open, close]) => `${formatMinutes(open)}-${formatMinutes(close % MINUTES_PER_DAY)}`)
    .join(', ')
}

export function formatMinutes(mins) {
  const h = Math.floor(mins / 60) % 24
  const m = Math.floor(mins % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
