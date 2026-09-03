import { useMemo } from 'react'
import { TERMINALS } from '../data/network.js'
import { TRUCK_STATUS, demurrageRisk, formatDuration } from '../lib/status.js'

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

export default function KpiBar({ trucks, containers, chassis, congestion }) {
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

    const avgTurn = Math.round(
      TERMINALS.reduce((sum, t) => sum + t.turnTimeMin, 0) / TERMINALS.length
    )

    const loads = Object.values(congestion ?? {}).filter(Boolean)
    const open = loads.filter((l) => !l.closed)
    const congested = open.filter(
      (l) => l.level.key === 'heavy' || l.level.key === 'severe'
    ).length
    const unreachable = open.filter((l) => !l.makesGate).length
    const worstWait = open.length ? Math.max(...open.map((l) => l.pickupMin)) : 0

    return { active, idle, atRisk, availableChassis, oosChassis, detained, avgTurn, congested, worstWait, openGates: open.length, unreachable }
  }, [trucks, containers, chassis, congestion])

  return (
    <div className="kpis">
      <Kpi
        label="Trucks active"
        value={stats.active}
        sub={`${stats.idle} idle · ${trucks.length} total`}
        tone="info"
      />
      <Kpi
        label="Boxes at risk"
        value={stats.atRisk}
        sub="LFD today or passed"
        tone={stats.atRisk > 0 ? 'danger' : 'good'}
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
        label="Gates open"
        value={`${stats.openGates}/${TERMINALS.length}`}
        sub={
          stats.openGates === 0
            ? 'all closed'
            : `${stats.congested} backed up · worst ${formatDuration(stats.worstWait)}`
        }
        tone={
          stats.openGates === 0
            ? 'neutral'
            : stats.openGates < TERMINALS.length / 2
              ? 'warn'
              : 'good'
        }
        subTone={stats.congested > 6 ? 'danger' : stats.congested > 3 ? 'warn' : undefined}
      />
      <Kpi label="Live boxes" value={containers.length} sub="not yet completed" tone="neutral" />
    </div>
  )
}
