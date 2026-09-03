import { CHASSIS } from '../data/equipment.js'
import { TRUCK_STATUS } from './status.js'

/**
 * What a move costs, what it earns, and the five numbers that decide whether
 * any of this was worth building.
 *
 * ⚠️  EVERY RATE BELOW IS A PLACEHOLDER.
 *
 * They are plausible for LA/Long Beach drayage and they are not yours. Rates
 * are negotiated per customer and per lane; driver pay varies by company vs
 * owner-operator; accessorial schedules differ by terminal and steamship line.
 * The numbers this file produces are only as good as the block below, which is
 * why it is one object at the top rather than constants scattered through the
 * logic — replace it with your rate sheet and everything downstream is real.
 *
 * The structure, unlike the numbers, is meant to be right: revenue by distance
 * band plus fuel surcharge and accessorials, cost as driver time plus running
 * miles plus fixed overhead, and exposure tracked separately from realised cost
 * because a demurrage charge you avoided is the whole argument for the tool.
 */
export const ASSUMPTIONS = {
  // ── Revenue ──
  lineHaulByMiles: [
    { maxMiles: 30, rate: 350 },
    { maxMiles: 60, rate: 475 },
    { maxMiles: 100, rate: 650 },
    { maxMiles: Infinity, rate: 900 },
  ],
  fuelSurchargePct: 0.25,

  // ── Cost ──
  // Fully burdened company-driver hour: wage plus payroll tax, benefits and
  // workers' comp. An owner-operator model instead pays a percentage of line
  // haul (typically 65-72%) and would replace this term entirely.
  driverCostPerHour: 38,
  truckCostPerMile: 0.85, // fuel, tyres, maintenance, insurance
  overheadPerLoad: 110, // dispatch, billing, admin

  // ── Accessorials: what goes wrong, and what it costs ──
  demurragePerDayUsd: 185, // terminal storage past last free day
  detentionPerHourUsd: 75, // driver held on site past free time
  detentionFreeHours: 2,
  perDiemPerDayUsd: 50, // chassis / container held past free days
  chassisPerDayUsd: 35,
}

const money = (n) => Math.round(n)

/** Line haul for a distance, from the band table. */
function lineHaul(miles) {
  return ASSUMPTIONS.lineHaulByMiles.find((b) => miles <= b.maxMiles).rate
}

/**
 * Revenue, cost and gross contribution for a single move.
 *
 * Two things this gets right that a naive version does not:
 *
 * 1. A dray load is a ROUND TRIP. The truck has to come back, and the customer
 *    pays once. Costing only the outbound leg roughly halves the true cost and
 *    makes every move look profitable.
 * 2. `gateMin` is the killer. A driver sitting three hours at a gate is paid
 *    for three hours that earn nothing extra, which is why queue time is pure
 *    cost here and why it is weighted so heavily in dispatch scoring.
 *
 * What comes out is GROSS CONTRIBUTION — before tractor payments, insurance,
 * yard rent and the rest of the fixed base. Do not read `margin` as profit.
 */
export function moveEconomics({ miles, driveMin, gateMin = 0, dwellMin = 0 }) {
  const base = lineHaul(miles)
  const fuel = base * ASSUMPTIONS.fuelSurchargePct
  const revenue = base + fuel

  // Out and back: the return leg is cost the customer does not pay twice for.
  const roundTripMiles = miles * 2
  const roundTripDriveMin = driveMin * 2

  const hours = (roundTripDriveMin + gateMin + dwellMin) / 60
  const driverCost = hours * ASSUMPTIONS.driverCostPerHour
  const mileageCost = roundTripMiles * ASSUMPTIONS.truckCostPerMile
  const cost = driverCost + mileageCost + ASSUMPTIONS.overheadPerLoad

  return {
    revenue: money(revenue),
    lineHaul: money(base),
    fuelSurcharge: money(fuel),
    driverCost: money(driverCost),
    mileageCost: money(mileageCost),
    overhead: ASSUMPTIONS.overheadPerLoad,
    cost: money(cost),
    roundTripMiles: money(roundTripMiles),
    /** Gross contribution, not profit — fixed fleet costs sit below this. */
    margin: money(revenue - cost),
    marginPct: revenue > 0 ? (revenue - cost) / revenue : 0,
    hours,
  }
}

/** Demurrage already accrued, and what one more day would add. */
export function demurrageExposure(container) {
  const daysOver = container.lfdOffsetDays < 0 ? Math.abs(container.lfdOffsetDays) : 0
  return {
    daysOver,
    accrued: money(daysOver * ASSUMPTIONS.demurragePerDayUsd),
    perDay: ASSUMPTIONS.demurragePerDayUsd,
    atRisk: container.lfdOffsetDays <= 0,
  }
}

/** Detention on a truck sitting past the free window at a client. */
export function detentionExposure(truck) {
  if (truck.status !== 'at_client') return { hoursOver: 0, accrued: 0 }
  const freeMin = ASSUMPTIONS.detentionFreeHours * 60
  const over = Math.max(0, (truck.dwellMin ?? 0) - freeMin) / 60
  return { hoursOver: over, accrued: money(over * ASSUMPTIONS.detentionPerHourUsd) }
}

/**
 * The five numbers.
 *
 * These are the argument for the whole system, so they are computed from live
 * state rather than stored — there is nowhere to quietly fudge them.
 *
 * Turn time used to be one of them and has been removed: it was averaged from
 * an invented congestion model. There is no free public measurement of gate
 * turn time at San Pedro Bay, so the honest count here is four, not five, and
 * the fifth returns when you can measure it from your own drivers' dwell.
 *
 * *   utilisationPct    share of driver time that is productive, not queued or held
 *   deadheadMiles     miles run without a box on the chassis
 *   exposureUsd       accessorial charges currently accruing or one day away
 *   marginPerLoadUsd  average gross contribution across loads in progress
 */
export function scorecard({ trucks, containers }) {

  // Productive = rolling, full stop. An earlier version counted dwell as
  // productive as long as it stayed within that stop's norm, which made the
  // figure structurally incapable of dropping below 100% — the simulation
  // departs a truck the moment it hits the norm, so "over the norm" was never
  // reachable. Worse, it encoded the wrong idea: a normal 90-minute gate queue
  // is still 90 minutes nobody is paid for. Normal waste is the waste this
  // tool exists to attack, so it counts against utilisation like any other.
  let productiveMin = 0
  let unproductiveMin = 0
  let deadheadMiles = 0
  const margins = []

  for (const truck of trucks) {
    const meta = TRUCK_STATUS[truck.status]
    if (!meta || truck.status === 'idle') continue

    const legMin = truck.legMinutes ?? 60
    if (meta.moving) {
      productiveMin += legMin * truck.progress
      // A truck moving without a container is repositioning — pure cost.
      if (!truck.containerId) {
        deadheadMiles += (legMin / 60) * 38 * truck.progress
      }
    } else {
      unproductiveMin += truck.dwellMin ?? 0
    }

    if (truck.containerId) {
      // Gate time is not included: it is real cost, but we have no measurement
      // of it, so contribution here is an upper bound and is labelled as one.
      margins.push(
        moveEconomics({
          miles: (legMin / 60) * 38,
          driveMin: legMin,
          dwellMin: truck.dwellMin ?? 0,
        }).margin
      )
    }
  }

  const totalMin = productiveMin + unproductiveMin
  const utilisationPct = totalMin > 0 ? productiveMin / totalMin : 0

  const demurrage = containers.reduce((s, c) => s + demurrageExposure(c).accrued, 0)
  const nextDay = containers.filter((c) => c.lfdOffsetDays === 0).length *
    ASSUMPTIONS.demurragePerDayUsd
  const detention = trucks.reduce((s, t) => s + detentionExposure(t).accrued, 0)
  const oosChassis = CHASSIS.filter((c) => c.status === 'repair').length *
    ASSUMPTIONS.chassisPerDayUsd

  return {
    utilisationPct,
    deadheadMiles: Math.round(deadheadMiles),
    exposureUsd: money(demurrage + nextDay + detention + oosChassis),
    exposureBreakdown: {
      demurrage: money(demurrage),
      demurrageTomorrow: money(nextDay),
      detention: money(detention),
      idleChassis: money(oosChassis),
    },
    marginPerLoadUsd: margins.length
      ? money(margins.reduce((a, b) => a + b, 0) / margins.length)
      : 0,
    loadsCounted: margins.length,
  }
}

export function usd(n) {
  return `$${Math.round(n).toLocaleString()}`
}
