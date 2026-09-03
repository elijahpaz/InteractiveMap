import { useMemo } from 'react'
import { TERMINALS } from '../data/network.js'
import { TRUCK_STATUS, demurrageRisk } from '../lib/status.js'
import { gateStatusFor, hasGateData } from '../lib/gates.js'

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

export default function KpiBar({ trucks, containers, chassis, dateISO, alertCounts }) {
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

  return (
    <div className="kpis">
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
      <Kpi
        label="In detention"
        value={stats.detained}
        sub={`over ${DETENTION_THRESHOLD_MIN / 60}h on site`}
        tone={stats.detained > 0 ? 'warn' : 'good'}
      />
      <Kpi
        label="Chassis free"
        value={stats.availableChassis}
        sub={`${stats.oosChassis} out of service`}
        tone={stats.availableChassis < 3 ? 'warn' : 'good'}
      />
      <Kpi
        label="Gates open (LB)"
        value={`${stats.openToday}/${stats.published}`}
        sub={`${stats.unpublished} LA terminals publish nothing`}
        tone={stats.openToday === 0 ? 'warn' : stats.openToday < stats.published / 2 ? 'warn' : 'good'}
      />
      <Kpi label="Live boxes" value={containers.length} sub="not yet completed" tone="neutral" />
    </div>
  )
}
