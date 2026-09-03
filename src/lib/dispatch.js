import { CHASSIS } from '../data/equipment.js'
import { NODES } from '../data/network.js'
import { CONTAINER_TERMINALS, TERMINAL_BY_ID } from '../data/terminals.js'
import { moveEconomics } from './economics.js'
import { haversine } from './geo.js'
import { gateStatusFor, shiftSummary } from './gates.js'

/**
 * Turning conditions into a recommendation.
 *
 * The exception layer says what is wrong. This says what to do instead — which
 * box a given truck should go get next, and where to send a driver whose gate
 * is about to shut. It is deliberately a scoring function rather than an
 * optimiser: a dispatcher needs to see *why* a move ranks where it does and
 * overrule it, which a black box makes impossible.
 *
 * The weights below encode a claim about what drayage actually costs, and they
 * are the first thing to argue with once real numbers exist:
 *
 *   - Demurrage dominates. A day of demurrage on one box outweighs the fuel on
 *     any realistic deadhead in this basin, so urgency carries the most weight.
 *   - Distance is the other term, and the only other one we can honestly
 *     compute. Deadhead is a real cost, and the one dispatchers over-weight by
 *     eye because it is the one they can see.
 *
 * Queue time is missing on purpose. It belongs in this ranking — a driver stuck
 * three hours at a gate is not doing a second turn — but no free public source
 * for real gate queue times exists, and an earlier version filled the gap with
 * a fabricated model that then drove routing. Better to rank on two real terms
 * than three where one is invented.
 *
 * Anything infeasible — gate shut on arrival, driver out of hours — is not
 * scored down, it is marked infeasible and kept, with the reason attached. A
 * recommendation that silently drops the option you were about to take is
 * worse than one that explains why it is a bad idea.
 */

const WEIGHT = {
  urgency: 1.0,
  deadhead: 0.30,
}

/** Average basin speed for a rough drive time, matching the simulation. */
const AVG_SPEED_MPH = 38

/** How much we want a box moved, from its remaining free time. */
function urgencyScore(lfdOffsetDays) {
  if (lfdOffsetDays < 0) return 100 // charges already running
  if (lfdOffsetDays === 0) return 85
  if (lfdOffsetDays === 1) return 60
  if (lfdOffsetDays === 2) return 40
  return 15
}

function milesBetween(a, b) {
  return haversine(a, b) / 1609.34
}

/**
 * Score one candidate pull: this truck, going to this terminal, for this box.
 * Returns the score plus the reasoning behind it, never just a number.
 */
export function scoreMove(truck, container, dateISO) {
  const terminal = TERMINAL_BY_ID[container.locationId]
  if (!terminal) return null

  const deadheadMi = milesBetween(truck.position, terminal.position)
  const driveMin = (deadheadMi / AVG_SPEED_MPH) * 60
  const urgency = urgencyScore(container.lfdOffsetDays)

  const reasons = []
  let feasible = true

  // Published gate state, where the port publishes one at all.
  const gate = dateISO ? gateStatusFor(terminal.id, dateISO) : { known: false }
  if (gate.known && !gate.anyOpen) {
    feasible = false
    reasons.push({ kind: 'blocker', text: `Closed today — ${shiftSummary(gate.shifts)}` })
  } else if (gate.known) {
    reasons.push({ kind: 'good', text: shiftSummary(gate.shifts) })
  } else {
    reasons.push({ kind: 'cost', text: 'Gate status not published' })
  }

  if (truck.hosRemainingMin != null && truck.hosRemainingMin < driveMin) {
    feasible = false
    reasons.push({
      kind: 'blocker',
      text: `Drive alone needs ${Math.round(driveMin)}m, driver has ${Math.round(truck.hosRemainingMin)}m`,
    })
  }

  if (container.lfdOffsetDays < 0) {
    reasons.push({ kind: 'urgent', text: `${Math.abs(container.lfdOffsetDays)}d into demurrage` })
  } else if (container.lfdOffsetDays === 0) {
    reasons.push({ kind: 'urgent', text: 'Last free day is today' })
  } else if (container.lfdOffsetDays <= 2) {
    reasons.push({ kind: 'watch', text: `Free time ends in ${container.lfdOffsetDays}d` })
  }

  if (!container.chassisId && !truck.chassisId) {
    const spare = CHASSIS.filter(
      (c) => c.status === 'available' && c.locationId === terminal.id
    ).length
    if (spare === 0) reasons.push({ kind: 'cost', text: 'No bare chassis at this terminal' })
  }

  // Gate time is unknown, so it is excluded from the cost rather than guessed.
  const economics = moveEconomics({ miles: deadheadMi, driveMin })
  const score = urgency * WEIGHT.urgency - deadheadMi * WEIGHT.deadhead

  return { container, terminal, feasible, score, deadheadMi, driveMin, gate, economics, reasons }
}

/**
 * Ranked next pulls for one truck. Feasible moves first, then blocked ones with
 * their reason — a dispatcher needs to see the option they were considering
 * even when it doesn't work.
 */
export function candidateMoves(truck, containers, dateISO, limit = 4) {
  const pullable = containers.filter(
    (c) => c.status === 'at_terminal' && !c.truckId && TERMINAL_BY_ID[c.locationId]
  )

  return pullable
    .map((c) => scoreMove(truck, c, dateISO))
    .filter(Boolean)
    .sort((a, b) => {
      if (a.feasible !== b.feasible) return a.feasible ? -1 : 1
      return b.score - a.score
    })
    .slice(0, limit)
}

/**
 * The nearest terminal with an open shift published for this date.
 *
 * An earlier version ranked alternatives by drive time plus queue time. Queue
 * time was invented, so this ranks by distance among terminals the port has
 * actually said are open, and returns nothing for ports that publish nothing
 * rather than assuming they are open.
 */
export function nearestOpenTerminal(fromPosition, dateISO, excludeId) {
  return CONTAINER_TERMINALS.filter((t) => t.id !== excludeId)
    .map((t) => {
      const gate = dateISO ? gateStatusFor(t.id, dateISO) : { known: false }
      if (!gate.known || !gate.anyOpen) return null
      return { terminal: t, miles: milesBetween(fromPosition, t.position), gate }
    })
    .filter(Boolean)
    .sort((a, b) => a.miles - b.miles)[0] ?? null
}

export const nodeName = (id) => NODES[id]?.name ?? id
