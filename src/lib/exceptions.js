import { CHASSIS } from '../data/equipment.js'
import { NODES } from '../data/network.js'
import { gateStatusFor, hasGateData, shiftSummary } from './gates.js'
import { TERMINAL_BY_ID } from '../data/terminals.js'
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
 *
 * Every rule is backed by data that actually exists: your own container and
 * fleet records, and the Port of Long Beach's published gate calendar. Rules
 * that once depended on a fabricated congestion model — arrival-versus-close
 * countdowns, queue-length warnings — are gone rather than re-guessed, and
 * gate-based rules stay silent for POLA, which publishes no reachable feed.
 */

export const SEVERITY = {
  critical: { label: 'Critical', color: '#ef4444', rank: 0 },
  warning: { label: 'Warning', color: '#f59e0b', rank: 1 },
  info: { label: 'Note', color: '#38bdf8', rank: 2 },
}

const nodeName = (id) => NODES[id]?.name ?? id
const isTerminal = (id) => Boolean(TERMINAL_BY_ID[id])

/** Date `offset` days from `dateISO`, as an ISO date. */
function addDays(dateISO, offset) {
  const d = new Date(`${dateISO}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + offset)
  return d.toISOString().slice(0, 10)
}

/**
 * Every open exception, most expensive first.
 *
 * @param trucks      live trucks from the simulation
 * @param containers  containers currently in play (completed ones excluded)
 * @param dateISO     the date to check published gate status against
 * @param day         weekday, 0 = Sunday
 */
export function findExceptions({ trucks, containers, dateISO }) {
  const out = []
  const add = (e) => out.push(e)

  // ── Containers ────────────────────────────────────────────────────────────
  for (const box of containers) {
    const atTerminal = isTerminal(box.locationId) && box.status === 'at_terminal'

    // Free time already gone. Depends only on your own container data.
    if (atTerminal && box.lfdOffsetDays < 0) {
      add({
        id: `dem-${box.id}`,
        severity: 'critical',
        kind: 'Demurrage accruing',
        title: box.id,
        detail: `${Math.abs(box.lfdOffsetDays)}d past last free day at ${nodeName(box.locationId)}.`,
        subject: { type: 'container', id: box.id },
      })
      continue
    }

    // Free time expiring on a day the terminal has published no open shift.
    // This is the one rule that combines your data with the port's, and it is
    // only raised where the port actually publishes — never inferred for POLA.
    if (atTerminal && box.lfdOffsetDays >= 0 && hasGateData(box.locationId) && dateISO) {
      const lfdDate = addDays(dateISO, box.lfdOffsetDays)
      const gate = gateStatusFor(box.locationId, lfdDate)
      if (gate.known && !gate.anyOpen) {
        add({
          id: `lfd-gate-${box.id}`,
          severity: gate.unposted ? 'warning' : 'critical',
          kind: gate.unposted ? 'Free time ends on an unposted day' : 'Free time ends on a closed day',
          title: box.id,
          detail: `Last free day is ${lfdDate} at ${nodeName(box.locationId)}, which has published: ${shiftSummary(
            gate.shifts
          )}.`,
          fix: gate.unposted
            ? 'The terminal has not committed to that day yet — watch the gate calendar or pull the box earlier.'
            : 'Pull it before then or the charge is automatic.',
          subject: { type: 'container', id: box.id },
        })
      }
    }

    // An empty due back somewhere with no open shift published.
    if (box.status === 'empty_ready' && hasGateData(box.destinationId) && dateISO) {
      const gate = gateStatusFor(box.destinationId, dateISO)
      if (gate.known && !gate.anyOpen) {
        add({
          id: `empty-${box.id}`,
          severity: 'warning',
          kind: 'Empty return closed today',
          title: box.id,
          detail: `Due back at ${nodeName(box.destinationId)} — ${shiftSummary(gate.shifts)}. Per diem keeps running.`,
          subject: { type: 'container', id: box.id },
        })
      }
    }
  }

  // ── Trucks ────────────────────────────────────────────────────────────────
  for (const truck of trucks) {
    const etaMin = truck.legMinutes * (1 - truck.progress)

    // Heading for a terminal with no open shift published today.
    if (truck.status === 'en_route_terminal' && hasGateData(truck.route.to) && dateISO) {
      const gate = gateStatusFor(truck.route.to, dateISO)
      if (gate.known && !gate.anyOpen) {
        add({
          id: `gate-${truck.id}`,
          severity: 'critical',
          kind: 'Driving to a closed terminal',
          title: `Unit ${truck.unit}`,
          detail: `${truck.driver} is ${remainingMiles(truck.route.geometry, truck.progress).toFixed(
            1
          )} mi out from ${nodeName(truck.route.to)}. Published today: ${shiftSummary(gate.shifts)}.`,
          subject: { type: 'truck', id: truck.id },
        })
      }
    }

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

    if (truck.status === 'at_client' && truck.dwellMin > (truck.dwellTargetMin ?? 120)) {
      add({
        id: `det-${truck.id}`,
        severity: 'warning',
        kind: 'Detention accruing',
        title: `Unit ${truck.unit}`,
        detail: `${formatDuration(truck.dwellMin)} at ${nodeName(truck.route.to)}.`,
        subject: { type: 'truck', id: truck.id },
      })
    }

    const chassis = CHASSIS.find((c) => c.id === truck.chassisId)
    if (chassis?.status === 'repair') {
      add({
        id: `oos-${truck.id}`,
        severity: 'critical',
        kind: 'Out-of-service chassis in use',
        title: `Unit ${truck.unit}`,
        detail: `${chassis.id} is flagged out of service — ${chassis.repairNote ?? 'no note'}.`,
        subject: { type: 'chassis', id: chassis.id },
      })
    }
  }

  // ── Equipment pool ────────────────────────────────────────────────────────
  const available = CHASSIS.filter((c) => c.status === 'available').length
  const waiting = containers.filter((c) => c.status === 'at_terminal' && !c.chassisId).length
  if (waiting > available) {
    add({
      id: 'chassis-pool',
      severity: 'warning',
      kind: 'Chassis shortfall',
      title: 'Equipment pool',
      detail: `${waiting} boxes waiting on a chassis, ${available} bare chassis available.`,
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
        detail: `Last roadability inspection ${c.lastInspectionDays}d ago.`,
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
