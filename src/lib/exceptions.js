import { CHASSIS } from '../data/equipment.js'
import { NODES } from '../data/network.js'
import { DAY_SHORT, GATE_SCHEDULES } from '../data/gateSchedules.js'
import { TERMINAL_BY_ID } from '../data/terminals.js'
import { nearestOpenTerminal } from './dispatch.js'
import { remainingMiles } from './geo.js'
import { formatDuration } from './status.js'

/**
 * The exception layer: what a dispatcher would want flagged before it costs
 * money, rather than after.
 *
 * Everything here is derived from state the app already holds — container free
 * time, terminal gate windows, truck position and hours, chassis condition. No
 * rule needs data we don't have, which is the point: these are the checks a
 * person makes by eye and stops making at 4pm on a Friday.
 *
 * Rules are ordered by what they cost if missed, not by how clever they are.
 * Demurrage and a wasted trip to a shut gate are real money; a stale chassis
 * inspection is a note.
 */

export const SEVERITY = {
  critical: { label: 'Critical', color: '#ef4444', rank: 0 },
  warning: { label: 'Warning', color: '#f59e0b', rank: 1 },
  info: { label: 'Note', color: '#38bdf8', rank: 2 },
}

const nodeName = (id) => NODES[id]?.name ?? id
const isTerminal = (id) => Boolean(TERMINAL_BY_ID[id])

/** Does this terminal have any gate window on the given weekday? */
function hasGateOn(terminalId, day) {
  return (GATE_SCHEDULES[terminalId]?.[day] ?? []).length > 0
}

/**
 * Walk forward from `fromDay` to the first weekday the terminal opens.
 * Returns null if it never does.
 */
function nextOpenDay(terminalId, fromDay) {
  for (let i = 0; i < 7; i++) {
    const d = (fromDay + i) % 7
    if (hasGateOn(terminalId, d)) return d
  }
  return null
}

/**
 * Every open exception, most expensive first.
 *
 * @param trucks      live trucks from the simulation
 * @param containers  containers currently in play (completed ones excluded)
 * @param congestion  per-terminal conditions, keyed by terminal id
 * @param day         weekday, 0 = Sunday
 */
export function findExceptions({ trucks, containers, congestion, day }) {
  const out = []
  const add = (e) => out.push(e)

  // ── Containers: free time against the gate calendar ───────────────────────
  for (const box of containers) {
    const atTerminal = isTerminal(box.locationId) && box.status === 'at_terminal'
    const load = congestion?.[box.locationId]

    // Charges already running.
    if (atTerminal && box.lfdOffsetDays < 0) {
      add({
        id: `dem-${box.id}`,
        severity: 'critical',
        kind: 'Demurrage accruing',
        title: box.id,
        detail: `${Math.abs(box.lfdOffsetDays)}d past last free day at ${nodeName(box.locationId)}. Charges are running.`,
        subject: { type: 'container', id: box.id },
      })
      continue
    }

    // Due today, but the gate won't get it out.
    if (atTerminal && box.lfdOffsetDays === 0 && load) {
      const stuck = load.closed
        ? !load.gate.reopensSameDay
        : !load.makesGate && !load.gate.reopensSameDay

      if (stuck) {
        add({
          id: `lfd-today-${box.id}`,
          severity: 'critical',
          kind: 'Last free day unreachable',
          title: box.id,
          detail: load.closed
            ? `LFD is today and ${nodeName(box.locationId)} is closed until ${load.gate.nextOpenLabel}. Demurrage starts tomorrow.`
            : `LFD is today; ${formatDuration(load.pickupMin)} to clear the gate but it shuts in ${formatDuration(load.gate.closesInMin)}. Demurrage starts tomorrow.`,
          subject: { type: 'container', id: box.id },
        })
        continue
      }
    }

    // The last free day itself falls on a day the terminal never opens.
    if (atTerminal && box.lfdOffsetDays > 0 && box.lfdOffsetDays <= 6) {
      const lfdDay = (day + box.lfdOffsetDays) % 7
      if (!hasGateOn(box.locationId, lfdDay)) {
        const reopen = nextOpenDay(box.locationId, lfdDay)
        add({
          id: `lfd-closed-${box.id}`,
          severity: 'warning',
          kind: 'Free time expires on a closed day',
          title: box.id,
          detail: `Last free day is ${DAY_SHORT[lfdDay]}, when ${nodeName(box.locationId)} has no gate${
            reopen != null ? ` — next gate ${DAY_SHORT[reopen]}` : ''
          }. Pull it before then or the charge is automatic.`,
          subject: { type: 'container', id: box.id },
        })
      }
    }

    // An empty with nowhere to go back to right now.
    if (box.status === 'empty_ready' && isTerminal(box.destinationId)) {
      const dest = congestion?.[box.destinationId]
      if (dest?.closed) {
        add({
          id: `empty-${box.id}`,
          severity: 'warning',
          kind: 'Empty return closed',
          title: box.id,
          detail: `Empty is due back at ${nodeName(box.destinationId)}, gate closed until ${dest.gate.nextOpenLabel}. Per diem keeps running.`,
          subject: { type: 'container', id: box.id },
        })
      }
    }
  }

  // ── Trucks: wasted trips, hours, detention ────────────────────────────────
  for (const truck of trucks) {
    const etaMin = truck.legMinutes * (1 - truck.progress)

    // Driving to a gate that will be shut on arrival.
    if (truck.status === 'en_route_terminal') {
      const load = congestion?.[truck.route.to]
      if (load) {
        const arrivesAfterClose = load.closed || etaMin > load.gate.closesInMin
        if (arrivesAfterClose) {
          // Saying "reroute" without saying where is only half an answer.
          const alt = nearestOpenTerminal(truck.position, congestion, truck.route.to)
          add({
            id: `gate-${truck.id}`,
            severity: 'critical',
            kind: 'Driving to a shut gate',
            title: `Unit ${truck.unit}`,
            detail: `${truck.driver} is ${remainingMiles(truck.route.geometry, truck.progress).toFixed(
              1
            )} mi out from ${nodeName(truck.route.to)}, ETA ${formatDuration(etaMin)}. ${
              load.closed
                ? `Gate closed until ${load.gate.nextOpenLabel}.`
                : `Gate shuts in ${formatDuration(load.gate.closesInMin)}.`
            }`,
            fix: alt
              ? `Try ${alt.terminal.name} instead — ${alt.miles.toFixed(1)} mi direct, ${
                  alt.load.level.label.toLowerCase()
                } gate, about ${formatDuration(alt.totalMin)} to drive and clear against ${formatDuration(
                  alt.load.gate.closesInMin
                )} of gate left.`
              : 'No terminal in the complex can still be driven to and cleared before close — hold the driver or re-plan for the next gate.',
            subject: { type: 'truck', id: truck.id },
          })
        }
      }
    }

    // Driver runs out of hours before finishing the leg and its stop.
    if (truck.status !== 'idle' && truck.hosRemainingMin > 0) {
      const needed = etaMin + (truck.dwellTargetMin ?? 0)
      if (truck.hosRemainingMin < needed) {
        add({
          id: `hos-${truck.id}`,
          severity: 'warning',
          kind: 'Driver hours short',
          title: `Unit ${truck.unit}`,
          detail: `${truck.driver} has ${formatDuration(
            truck.hosRemainingMin
          )} left; this leg and stop need about ${formatDuration(needed)}.`,
          subject: { type: 'truck', id: truck.id },
        })
      }
    }

    // On site past the point where detention starts.
    if (truck.status === 'at_client' && truck.dwellMin > (truck.dwellTargetMin ?? 120)) {
      add({
        id: `det-${truck.id}`,
        severity: 'warning',
        kind: 'Detention accruing',
        title: `Unit ${truck.unit}`,
        detail: `${formatDuration(truck.dwellMin)} at ${nodeName(
          truck.route.to
        )}, past the ${formatDuration(truck.dwellTargetMin)} norm.`,
        subject: { type: 'truck', id: truck.id },
      })
    }

    // Out-of-service equipment still under a truck.
    const chassis = CHASSIS.find((c) => c.id === truck.chassisId)
    if (chassis?.status === 'repair') {
      add({
        id: `oos-${truck.id}`,
        severity: 'critical',
        kind: 'Out-of-service chassis in use',
        title: `Unit ${truck.unit}`,
        detail: `${chassis.id} is flagged out of service — ${chassis.repairNote ?? 'no note'} — and is under this truck.`,
        subject: { type: 'chassis', id: chassis.id },
      })
    }
  }

  // ── Equipment pool ────────────────────────────────────────────────────────
  const available = CHASSIS.filter((c) => c.status === 'available').length
  const waiting = containers.filter(
    (c) => c.status === 'at_terminal' && !c.chassisId
  ).length
  if (waiting > available) {
    add({
      id: 'chassis-pool',
      severity: 'warning',
      kind: 'Chassis shortfall',
      title: 'Equipment pool',
      detail: `${waiting} boxes waiting on a chassis, ${available} bare chassis available across all locations.`,
      subject: null,
    })
  }

  for (const c of CHASSIS) {
    if (c.status !== 'repair' && c.lastInspectionDays > 45) {
      add({
        id: `insp-${c.id}`,
        severity: 'info',
        kind: 'Inspection overdue',
        title: c.id,
        detail: `Last roadability inspection ${c.lastInspectionDays}d ago at ${nodeName(c.locationId)}.`,
        subject: { type: 'chassis', id: c.id },
      })
    }
  }

  return out.sort((a, b) => SEVERITY[a.severity].rank - SEVERITY[b.severity].rank)
}

/** Counts by severity, for badges and the KPI strip. */
export function exceptionCounts(exceptions) {
  return exceptions.reduce(
    (acc, e) => ({ ...acc, [e.severity]: (acc[e.severity] ?? 0) + 1 }),
    { critical: 0, warning: 0, info: 0 }
  )
}
