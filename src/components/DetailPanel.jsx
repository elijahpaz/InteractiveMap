import { NODES } from '../data/network.js'
import { remainingMiles } from '../lib/geo.js'
import {
  CHASSIS_STATUS,
  CONTAINER_STATUS,
  TRUCK_STATUS,
  demurrageRisk,
  formatDate,
  formatDuration,
  lastFreeDayDate,
} from '../lib/status.js'

const nodeName = (id) => NODES[id]?.name ?? id

function Field({ label, value, accent }) {
  return (
    <div className="field">
      <span className="field__label">{label}</span>
      <span className="field__value" style={accent ? { color: accent } : undefined}>
        {value}
      </span>
    </div>
  )
}

function Header({ eyebrow, title, badge, badgeColor, onClose }) {
  return (
    <header className="detail__header">
      <div>
        <p className="detail__eyebrow">{eyebrow}</p>
        <h2 className="detail__title">{title}</h2>
      </div>
      <div className="detail__headerRight">
        {badge && (
          <span className="badge" style={{ '--badge': badgeColor }}>
            {badge}
          </span>
        )}
        <button type="button" className="detail__close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>
    </header>
  )
}

function TruckDetail({ truck, container, chassis, onSelect, onClose }) {
  const meta = TRUCK_STATUS[truck.status]
  const milesLeft = remainingMiles(truck.route.geometry, truck.progress)
  const minutesLeft = truck.legMinutes * (1 - truck.progress)

  return (
    <>
      <Header
        eyebrow={`Unit ${truck.unit} · ${truck.plate}`}
        title={truck.driver}
        badge={meta.label}
        badgeColor={meta.color}
        onClose={onClose}
      />

      <div className="detail__leg">
        <span className="detail__legNode">{nodeName(truck.route.from)}</span>
        <span className="detail__legTrack">
          <span className="detail__legFill" style={{ width: `${truck.progress * 100}%`, background: meta.color }} />
          <span className="detail__legDot" style={{ left: `${truck.progress * 100}%`, background: meta.color }} />
        </span>
        <span className="detail__legNode">{nodeName(truck.route.to)}</span>
      </div>

      <div className="fields">
        {meta.moving ? (
          <>
            <Field label="ETA" value={formatDuration(minutesLeft)} />
            <Field label="Distance left" value={`${milesLeft.toFixed(1)} mi`} />
          </>
        ) : (
          <>
            <Field
              label={truck.status === 'at_client' ? 'Detention clock' : 'Dwell'}
              value={`${formatDuration(truck.dwellMin)} / ${formatDuration(truck.dwellTargetMin)}`}
              accent={truck.dwellMin > truck.dwellTargetMin ? '#ef4444' : undefined}
            />
            <Field label="Location" value={nodeName(truck.route.to)} />
          </>
        )}
        <Field
          label="HOS remaining"
          value={formatDuration(truck.hosRemainingMin)}
          accent={truck.hosRemainingMin < 120 ? '#f59e0b' : undefined}
        />
        <Field label="Progress" value={`${Math.round(truck.progress * 100)}%`} />
      </div>

      <div className="detail__links">
        {container ? (
          <button
            type="button"
            className="linkCard"
            onClick={() => onSelect({ type: 'container', id: container.id })}
          >
            <span className="linkCard__label">Container</span>
            <span className="linkCard__value">{container.id}</span>
            <span className="linkCard__meta">
              {container.size}' {container.type} · {container.ssl}
            </span>
          </button>
        ) : (
          <div className="linkCard linkCard--empty">
            <span className="linkCard__label">Container</span>
            <span className="linkCard__value">Bobtail</span>
          </div>
        )}

        {chassis ? (
          <button
            type="button"
            className="linkCard"
            onClick={() => onSelect({ type: 'chassis', id: chassis.id })}
          >
            <span className="linkCard__label">Chassis</span>
            <span className="linkCard__value">{chassis.id}</span>
            <span className="linkCard__meta">
              {chassis.pool} · {chassis.size}'
            </span>
          </button>
        ) : (
          <div className="linkCard linkCard--empty">
            <span className="linkCard__label">Chassis</span>
            <span className="linkCard__value">None</span>
          </div>
        )}
      </div>
    </>
  )
}

function ContainerDetail({ container, onSelect, onClose }) {
  const status = CONTAINER_STATUS[container.status]
  const risk = demurrageRisk(container.lfdOffsetDays)

  return (
    <>
      <Header
        eyebrow={`${container.size}' ${container.type} · ${container.ssl}`}
        title={container.id}
        badge={status.label}
        badgeColor={status.color}
        onClose={onClose}
      />

      <div className={`alert alert--${risk.level}`} style={{ '--risk': risk.color }}>
        <strong>{risk.label}</strong>
        <span>Last free day {formatDate(lastFreeDayDate(container.lfdOffsetDays))}</span>
      </div>

      <div className="fields">
        <Field label="Currently" value={nodeName(container.locationId)} />
        <Field label="Destination" value={nodeName(container.destinationId)} />
        <Field label="Gross weight" value={`${container.weightLbs.toLocaleString()} lb`} />
        <Field label="BOL" value={container.bol} />
        {container.reeferSetPointF != null && (
          <Field label="Reefer set point" value={`${container.reeferSetPointF}°F`} accent="#38bdf8" />
        )}
      </div>

      <div className="detail__links">
        {container.truckId && (
          <button
            type="button"
            className="linkCard"
            onClick={() => onSelect({ type: 'truck', id: container.truckId })}
          >
            <span className="linkCard__label">On truck</span>
            <span className="linkCard__value">{container.truckId}</span>
          </button>
        )}
        {container.chassisId && (
          <button
            type="button"
            className="linkCard"
            onClick={() => onSelect({ type: 'chassis', id: container.chassisId })}
          >
            <span className="linkCard__label">Chassis</span>
            <span className="linkCard__value">{container.chassisId}</span>
          </button>
        )}
      </div>
    </>
  )
}

function ChassisDetail({ chassis, onSelect, onClose }) {
  const status = CHASSIS_STATUS[chassis.status]

  return (
    <>
      <Header
        eyebrow={`${chassis.pool} pool`}
        title={chassis.id}
        badge={status.label}
        badgeColor={status.color}
        onClose={onClose}
      />

      {chassis.repairNote && (
        <div className="alert alert--accruing" style={{ '--risk': '#ef4444' }}>
          <strong>Out of service</strong>
          <span>{chassis.repairNote}</span>
        </div>
      )}

      <div className="fields">
        <Field label="Size" value={`${chassis.size}'`} />
        <Field label="Axle" value={chassis.axle} />
        <Field label="Location" value={nodeName(chassis.locationId)} />
        <Field
          label="Last inspection"
          value={`${chassis.lastInspectionDays}d ago`}
          accent={chassis.lastInspectionDays > 30 ? '#f59e0b' : undefined}
        />
      </div>

      {chassis.truckId && (
        <div className="detail__links">
          <button
            type="button"
            className="linkCard"
            onClick={() => onSelect({ type: 'truck', id: chassis.truckId })}
          >
            <span className="linkCard__label">Under truck</span>
            <span className="linkCard__value">{chassis.truckId}</span>
          </button>
        </div>
      )}
    </>
  )
}

function TerminalDetail({ terminal, inbound, load, onClose }) {
  return (
    <>
      <Header
        eyebrow={terminal.port}
        title={terminal.name}
        badge={`${terminal.turnTimeMin}m turn`}
        badgeColor={terminal.turnTimeMin > 80 ? '#ef4444' : terminal.turnTimeMin > 60 ? '#f59e0b' : '#22c55e'}
        onClose={onClose}
      />

      {load && (
        <>
          <div className="loadBar" style={{ '--load': load.level.color }}>
            <span className="loadBar__fill" style={{ width: `${load.index}%` }} />
          </div>
          <div className="fields">
            <Field label="Gate congestion" value={load.level.label} accent={load.level.color} />
            <Field label="Trucks queued" value={load.queueTrucks} />
            <Field label="Est. pick up" value={formatDuration(load.pickupMin)} accent={load.pickupMin > 150 ? '#ef4444' : undefined} />
            <Field label="Est. drop off" value={formatDuration(load.dropoffMin)} />
          </div>
        </>
      )}

      <div className="fields">
        <Field label="Operator" value={terminal.operator} />
        <Field label="Berths" value={terminal.berth} />
        <Field label="Gate hours" value={terminal.gateHours} />
        <Field
          label="Appointments"
          value={terminal.appointmentRequired ? 'Required' : 'Not required'}
          accent={terminal.appointmentRequired ? '#f59e0b' : '#22c55e'}
        />
        <Field
          label="Dual transaction"
          value={terminal.dualTransaction ? 'Allowed' : 'Not allowed'}
          accent={terminal.dualTransaction ? '#22c55e' : '#f59e0b'}
        />
        <Field label="Trucks inbound" value={inbound} />
      </div>
    </>
  )
}

function YardDetail({ yard, onClose }) {
  const pct = Math.round((yard.occupied / yard.capacity) * 100)

  return (
    <>
      <Header
        eyebrow={yard.isHome ? 'Home yard' : 'Overflow depot'}
        title={yard.name}
        badge={`${pct}% full`}
        badgeColor={pct > 85 ? '#ef4444' : pct > 65 ? '#f59e0b' : '#22c55e'}
        onClose={onClose}
      />

      <div className="meter">
        <span className="meter__fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="fields">
        <Field label="Address" value={yard.address} />
        <Field label="Capacity" value={`${yard.occupied} / ${yard.capacity} slots`} />
        <Field label="Services" value={yard.services.join(', ')} />
      </div>
    </>
  )
}

function ClientDetail({ client, onClose }) {
  return (
    <>
      <Header
        eyebrow={`${client.accountTier} account`}
        title={client.name}
        badge={`${client.openOrders} open`}
        badgeColor="#a855f7"
        onClose={onClose}
      />

      <div className="fields">
        <Field label="Address" value={client.address} />
        <Field label="Receiving hours" value={client.receivingHours} />
        <Field
          label="Appointments"
          value={client.appointmentRequired ? 'Required' : 'Not required'}
        />
        <Field
          label="Avg detention"
          value={formatDuration(client.avgDetentionMin)}
          accent={client.avgDetentionMin > 60 ? '#ef4444' : '#22c55e'}
        />
      </div>
    </>
  )
}

export default function DetailPanel({
  selected,
  trucks,
  containers,
  chassis,
  congestion,
  onSelect,
  onClose,
}) {
  if (!selected) {
    return (
      <section className="detail detail--empty">
        <p className="detail__hint">
          Select a truck, container, chassis, terminal, yard or client to see its detail.
        </p>
      </section>
    )
  }

  const { type, id } = selected

  if (type === 'truck') {
    const truck = trucks.find((t) => t.id === id)
    if (!truck) return null
    return (
      <section className="detail">
        <TruckDetail
          truck={truck}
          container={containers.find((c) => c.id === truck.containerId)}
          chassis={chassis.find((c) => c.id === truck.chassisId)}
          onSelect={onSelect}
          onClose={onClose}
        />
      </section>
    )
  }

  if (type === 'container') {
    const container = containers.find((c) => c.id === id)
    if (!container) return null
    return (
      <section className="detail">
        <ContainerDetail container={container} onSelect={onSelect} onClose={onClose} />
      </section>
    )
  }

  if (type === 'chassis') {
    const unit = chassis.find((c) => c.id === id)
    if (!unit) return null
    return (
      <section className="detail">
        <ChassisDetail chassis={unit} onSelect={onSelect} onClose={onClose} />
      </section>
    )
  }

  const node = NODES[id]
  if (!node) return null

  if (type === 'terminal') {
    const inbound = trucks.filter(
      (t) => t.route.to === id && t.status === 'en_route_terminal'
    ).length
    return (
      <section className="detail">
        <TerminalDetail terminal={node} inbound={inbound} load={congestion?.[id]} onClose={onClose} />
      </section>
    )
  }

  if (type === 'yard') {
    return (
      <section className="detail">
        <YardDetail yard={node} onClose={onClose} />
      </section>
    )
  }

  return (
    <section className="detail">
      <ClientDetail client={node} onClose={onClose} />
    </section>
  )
}
