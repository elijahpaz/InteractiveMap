import { CHASSIS } from '../data/equipment.js'
import { NODES } from '../data/network.js'
import { CONTAINER_TERMINALS, TERMINAL_BY_ID } from '../data/terminals.js'
import { haversine } from './geo.js'

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
 *   - Time in a queue is the scarce resource. A driver stuck three hours at a
 *     gate is a driver not doing a second turn, so gate time is penalised
 *     harder than distance.
 *   - Distance still matters, but least of the three. Deadhead is a real cost
 *     and it is the one dispatchers over-weight by eye, because it is the one
 *     they can see.
 *
 * Anything infeasible — gate shut on arrival, driver out of hours — is not
 * scored down, it is marked infeasible and kept, with the reason attached. A
 * recommendation that silently drops the option you were about to take is
 * worse than one that explains why it is a bad idea.
 */

const WEIGHT = {
  urgency: 1.0,
  gateTime: 0.55,
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
export function scoreMove(truck, container, congestion, day) {
  const terminal = TERMINAL_BY_ID[container.locationId]
  if (!terminal) return null

  const load = congestion?.[terminal.id]
  const deadheadMi = milesBetween(truck.position, terminal.position)
  const driveMin = (deadheadMi / AVG_SPEED_MPH) * 60
  const gateMin = load?.closed ? null : load?.pickupMin ?? 0
  const urgency = urgencyScore(container.lfdOffsetDays)

  const reasons = []
  let feasible = true

  if (load?.closed) {
    feasible = false
    reasons.push({
      kind: 'blocker',
      text: `Gate closed until ${load.gate.nextOpenLabel ?? 'further notice'}`,
    })
  } else if (load && driveMin > load.gate.closesInMin) {
    feasible = false
    reasons.push({
      kind: 'blocker',
      text: `${Math.round(driveMin)}m drive, gate shuts in ${Math.round(load.gate.closesInMin)}m`,
    })
  }

  const totalMin = driveMin + (gateMin ?? 0)
  if (truck.hosRemainingMin != null && truck.hosRemainingMin < totalMin) {
    feasible = false
    reasons.push({
      kind: 'blocker',
      text: `Needs ${Math.round(totalMin)}m, driver has ${Math.round(truck.hosRemainingMin)}m`,
    })
  }

  if (container.lfdOffsetDays < 0) {
    reasons.push({ kind: 'urgent', text: `${Math.abs(container.lfdOffsetDays)}d into demurrage` })
  } else if (container.lfdOffsetDays === 0) {
    reasons.push({ kind: 'urgent', text: 'Last free day is today' })
  } else if (container.lfdOffsetDays <= 2) {
    reasons.push({ kind: 'watch', text: `Free time ends in ${container.lfdOffsetDays}d` })
  }

  if (load && !load.closed) {
    reasons.push({
      kind: load.level.key === 'clear' || load.level.key === 'moderate' ? 'good' : 'cost',
      text: `${load.level.label} gate, ${Math.round(load.pickupMin)}m to clear`,
    })
  }

  // A box with no chassis under it needs one — either the truck brings its own,
  // or there is a bare one waiting at that terminal.
  if (!container.chassisId && !truck.chassisId) {
    const spare = CHASSIS.filter(
      (c) => c.status === 'available' && c.locationId === terminal.id
    ).length
    if (spare === 0) {
      reasons.push({ kind: 'cost', text: 'No bare chassis at this terminal' })
    }
  }

  const score =
    urgency * WEIGHT.urgency -
    (gateMin ?? 240) * WEIGHT.gateTime -
    deadheadMi * WEIGHT.deadhead

  return {
    container,
    terminal,
    feasible,
    score,
    deadheadMi,
    driveMin,
    gateMin,
    totalMin: gateMin == null ? null : totalMin,
    reasons,
  }
}

/**
 * Ranked next pulls for one truck. Feasible moves first, then blocked ones with
 * their reason — a dispatcher needs to see the option they were considering
 * even when it doesn't work.
 */
export function candidateMoves(truck, containers, congestion, day, limit = 4) {
  const pullable = containers.filter(
    (c) => c.status === 'at_terminal' && !c.truckId && TERMINAL_BY_ID[c.locationId]
  )

  return pullable
    .map((c) => scoreMove(truck, c, congestion, day))
    .filter(Boolean)
    .sort((a, b) => {
      if (a.feasible !== b.feasible) return a.feasible ? -1 : 1
      return b.score - a.score
    })
    .slice(0, limit)
}

/**
 * For a truck committed to a terminal it cannot make, the best terminal it can
 * actually complete a transaction at.
 *
 * "Open" is not the bar. A gate that shuts in nine minutes is no use to a
 * driver nine minutes away — they arrive as it closes, having burned the trip
 * twice. The truck has to arrive *and* get through the queue before close, so
 * the filter is drive time plus gate time, and the ranking is by total time
 * rather than distance: a slightly farther terminal running clear beats a near
 * one three hours deep. When nothing qualifies, that is the real answer, and
 * the caller says so rather than offering a move that cannot work.
 */
export function nearestOpenTerminal(fromPosition, congestion, excludeId) {
  return CONTAINER_TERMINALS.filter((t) => t.id !== excludeId)
    .map((t) => {
      const load = congestion?.[t.id]
      if (!load || load.closed) return null
      const miles = milesBetween(fromPosition, t.position)
      const driveMin = (miles / AVG_SPEED_MPH) * 60
      const totalMin = driveMin + load.pickupMin
      if (totalMin > load.gate.closesInMin) return null
      return { terminal: t, miles, driveMin, totalMin, load }
    })
    .filter(Boolean)
    .sort((a, b) => a.totalMin - b.totalMin)[0] ?? null
}

export const nodeName = (id) => NODES[id]?.name ?? id
