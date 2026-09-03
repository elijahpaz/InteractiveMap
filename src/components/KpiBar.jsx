import { useMemo } from 'react'
import { TERMINALS } from '../data/network.js'
import { TRUCK_STATUS, demurrageRisk } from '../lib/status.js'
import { gateStatusFor, hasGateData } from '../lib/gates.js'
import { CARGONAV } from '../data/cargonav.js'

/** Detention generally starts biting around the two-hour mark. */
const DETENTION_THRESHOLD_MIN = 120

function Kpi({ label, value, sub, tone = 'neutral', subTone, onClick }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag type={onClick ? 'button' : undefined} className={`kpi kpi--${tone}`} onClick={onClick}>
      <span className="kpi__value">{value}</span>
      <span className="kpi__label">{label}</span>
      {sub && <span className={`kpi__sub ${subTone ? `kpi__sub--${subTone}` : ''}`}>{sub}</span>}
    </Tag>
  )
}

export default function KpiBar({ trucks, containers, chassis, dateISO, alertCounts, showFleet }) {
  const stats = useMemo(() => {
    const active = trucks.filter((t) => TRUCK_STATUS[t.status]?.group === 'active').length
    const idle = trucks.filter((t) => t.status === 'idle').length

    const atRisk = containers.filter((c) => {
      const level = demurrageRisk(c.lfdOffsetDays).level
      return level === 'accruing' || level === 'today'
    }).length

    const availableChassis = chassis.filter((c) => c.status === 'available').length
    const oosChassis = chassis.filter((c) => c.status === 'repair').length

    const detained = trucks.filter(
      (t) => t.status === 'at_client' && t.dwellMin > DETENTION_THRESHOLD_MIN
    ).length

    // Only terminals whose port actually publishes a calendar are counted.
    const published = TERMINALS.filter((t) => hasGateData(t.id))
    const openToday = published.filter(
      (t) => gateStatusFor(t.id, dateISO).anyOpen
    ).length
    const unpublished = TERMINALS.length - published.length

    return { active, idle, atRisk, availableChassis, oosChassis, detained, openToday, published: published.length, unpublished }
  }, [trucks, containers, chassis, dateISO])

  // ── Real, published, Long Beach ──
  const turns = Object.values(CARGONAV.turnTime.byTerminal)
  const avgTurn = turns.length
    ? Math.round(turns.reduce((a, t) => a + (t.dayMinutes + t.nightMinutes) / 2, 0) / turns.length)
    : null
  const slowest = turns.length ? Math.max(...turns.map((t) => Math.max(t.dayMinutes, t.nightMinutes))) : null

  const busyDays = (CARGONAV.truckFlow?.days ?? []).filter((d) => d.total > 2000)
  const trucksPerDay = busyDays.length
    ? Math.round(busyDays.reduce((a, d) => a + d.total, 0) / busyDays.length)
    : null

  const dw = CARGONAV.importDwell
  const dwellTotal = dw ? dw.d0to3 + dw.d4to8 + dw.d9to12 + dw.d13plus : 0
  const dwellAged = dw && dwellTotal ? Math.round(((dw.d9to12 + dw.d13plus) / dwellTotal) * 100) : null

  return (
    <div className={`kpis ${showFleet ? '' : 'kpis--port'}`}>
      <Kpi
        label="Avg gate turn (LB)"
        value={avgTurn == null ? '—' : `${avgTurn}m`}
        sub={slowest ? `slowest ${slowest}m · measured` : 'measured by the port'}
        tone={avgTurn > 55 ? 'danger' : avgTurn > 40 ? 'warn' : 'good'}
      />
      <Kpi
        label="Truck moves / day"
        value={trucksPerDay == null ? '—' : trucksPerDay.toLocaleString()}
        sub="Long Beach gates, weekday avg"
        tone="info"
      />
      <Kpi
        label="Gates open (LB)"
        value={`${stats.openToday}/${stats.published}`}
        sub={`${stats.unpublished} LA terminals publish nothing`}
        tone={stats.openToday === 0 ? 'warn' : 'good'}
      />
      <Kpi
        label="Imports sitting 9d+"
        value={dwellAged == null ? '—' : `${dwellAged}%`}
        sub={dwellTotal ? `of ${dwellTotal.toLocaleString()} boxes on terminal` : ''}
        tone={dwellAged > 15 ? 'danger' : dwellAged > 8 ? 'warn' : 'good'}
      />
      {showFleet && (
        <>
          <Kpi
            label="Trucks active"
            value={stats.active}
            sub={`${stats.idle} idle · ${trucks.length} total`}
            tone="info"
          />
          <Kpi
            label="Open exceptions"
            value={(alertCounts?.critical ?? 0) + (alertCounts?.warning ?? 0)}
            sub={`${alertCounts?.critical ?? 0} critical · ${stats.atRisk} boxes at risk`}
            tone={alertCounts?.critical > 0 ? 'danger' : alertCounts?.warning > 0 ? 'warn' : 'good'}
          />
        </>
      )}
    </div>
  )
}
