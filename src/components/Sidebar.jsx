import { useMemo, useState } from 'react'
import { CLIENTS, NODES, TERMINALS, YARDS } from '../data/network.js'
import { SEVERITY } from '../lib/exceptions.js'
import {
  CHASSIS_STATUS,
  CONTAINER_STATUS,
  TRUCK_STATUS,
  demurrageRisk,
  formatDuration,
} from '../lib/status.js'

const TABS = [
  { id: 'alerts', label: 'Alerts' },
  { id: 'fleet', label: 'Fleet' },
  { id: 'containers', label: 'Boxes' },
  { id: 'chassis', label: 'Chassis' },
  { id: 'network', label: 'Network' },
]

function nodeName(id) {
  return NODES[id]?.name ?? id
}

function Row({ active, onClick, accent, title, subtitle, meta, tag, tagColor }) {
  return (
    <button
      type="button"
      className={`row ${active ? 'is-active' : ''}`}
      onClick={onClick}
      style={{ '--accent': accent }}
    >
      <span className="row__bar" />
      <span className="row__main">
        <span className="row__title">{title}</span>
        <span className="row__subtitle">{subtitle}</span>
      </span>
      <span className="row__right">
        {tag && (
          <span className="row__tag" style={{ '--tag': tagColor }}>
            {tag}
          </span>
        )}
        {meta && <span className="row__meta">{meta}</span>}
      </span>
    </button>
  )
}

export default function Sidebar({ trucks, containers, chassis, exceptions, selected, onSelect }) {
  const [tab, setTab] = useState('alerts')
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const match = (...fields) => !q || fields.some((f) => String(f ?? '').toLowerCase().includes(q))

  const filtered = useMemo(() => {
    return {
      fleet: trucks.filter((t) => match(t.unit, t.driver, t.plate, t.containerId, t.id)),
      containers: containers.filter((c) => match(c.id, c.ssl, c.bol, nodeName(c.destinationId))),
      chassis: chassis.filter((c) => match(c.id, c.pool, nodeName(c.locationId))),
      terminals: TERMINALS.filter((t) => match(t.name, t.berth, t.port)),
      clients: CLIENTS.filter((c) => match(c.name, c.address)),
      yards: YARDS.filter((y) => match(y.name, y.address)),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trucks, containers, chassis, q])

  const filteredExceptions = useMemo(
    () => (exceptions ?? []).filter((e) => match(e.title, e.kind, e.detail)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exceptions, q]
  )

  const counts = {
    alerts: filteredExceptions.length,
    fleet: filtered.fleet.length,
    containers: filtered.containers.length,
    chassis: filtered.chassis.length,
    network: filtered.terminals.length + filtered.clients.length + filtered.yards.length,
  }

  const isActive = (type, id) => selected?.type === type && selected?.id === id

  return (
    <aside className="sidebar">
      <div className="sidebar__search">
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
          <path
            d="M10 2a8 8 0 1 0 4.9 14.3l5.4 5.4 1.4-1.4-5.4-5.4A8 8 0 0 0 10 2Zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z"
            fill="currentColor"
          />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Unit, driver, container, client…"
          aria-label="Search fleet and equipment"
        />
        {query && (
          <button type="button" className="sidebar__clear" onClick={() => setQuery('')}>
            ✕
          </button>
        )}
      </div>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`tabs__tab ${tab === t.id ? 'is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            <span className="tabs__count">{counts[t.id]}</span>
          </button>
        ))}
      </div>

      <div className="sidebar__list">
        {tab === 'alerts' &&
          filteredExceptions.map((e) => {
            const meta = SEVERITY[e.severity]
            const active =
              e.subject && selected?.type === e.subject.type && selected?.id === e.subject.id
            return (
              <button
                key={e.id}
                type="button"
                className={`alertRow ${active ? 'is-active' : ''} ${
                  e.subject ? '' : 'is-static'
                }`}
                style={{ '--sev': meta.color }}
                onClick={() => e.subject && onSelect(e.subject)}
                disabled={!e.subject}
              >
                <span className="alertRow__bar" />
                <span className="alertRow__head">
                  <span className="alertRow__kind">{e.kind}</span>
                  <span className="alertRow__title">{e.title}</span>
                </span>
                <span className="alertRow__detail">{e.detail}</span>
                {e.fix && <span className="alertRow__fix">{e.fix}</span>}
              </button>
            )
          })}

        {tab === 'fleet' &&
          filtered.fleet.map((truck) => {
            const meta = TRUCK_STATUS[truck.status]
            return (
              <Row
                key={truck.id}
                active={isActive('truck', truck.id)}
                onClick={() => onSelect({ type: 'truck', id: truck.id })}
                accent={meta.color}
                title={`Unit ${truck.unit}`}
                subtitle={`${truck.driver} · ${truck.containerId ?? 'bobtail'}`}
                tag={meta.short}
                tagColor={meta.color}
                meta={
                  meta.moving
                    ? `${Math.round(truck.progress * 100)}%`
                    : formatDuration(truck.dwellMin)
                }
              />
            )
          })}

        {tab === 'containers' &&
          filtered.containers.map((box) => {
            const risk = demurrageRisk(box.lfdOffsetDays)
            return (
              <Row
                key={box.id}
                active={isActive('container', box.id)}
                onClick={() => onSelect({ type: 'container', id: box.id })}
                accent={CONTAINER_STATUS[box.status].color}
                title={box.id}
                subtitle={`${box.size}' ${box.type} · ${box.ssl} → ${nodeName(box.destinationId)}`}
                tag={risk.level === 'accruing' ? 'DEM' : risk.level === 'today' ? 'LFD' : null}
                tagColor={risk.color}
                meta={CONTAINER_STATUS[box.status].label}
              />
            )
          })}

        {tab === 'chassis' &&
          filtered.chassis.map((unit) => (
            <Row
              key={unit.id}
              active={isActive('chassis', unit.id)}
              onClick={() => onSelect({ type: 'chassis', id: unit.id })}
              accent={CHASSIS_STATUS[unit.status].color}
              title={unit.id}
              subtitle={`${unit.pool} · ${unit.size}' ${unit.axle}`}
              tag={unit.status === 'repair' ? 'OOS' : null}
              tagColor={CHASSIS_STATUS[unit.status].color}
              meta={nodeName(unit.locationId)}
            />
          ))}

        {tab === 'network' && (
          <>
            <div className="sidebar__group">Terminals</div>
            {filtered.terminals.map((t) => (
              <Row
                key={t.id}
                active={isActive('terminal', t.id)}
                onClick={() => onSelect({ type: 'terminal', id: t.id })}
                accent="#f97316"
                title={t.name}
                subtitle={t.berth}
                meta={`${t.turnTimeMin}m turn`}
              />
            ))}

            <div className="sidebar__group">Yards</div>
            {filtered.yards.map((y) => (
              <Row
                key={y.id}
                active={isActive('yard', y.id)}
                onClick={() => onSelect({ type: 'yard', id: y.id })}
                accent="#22c55e"
                title={y.name}
                subtitle={y.address}
                meta={`${Math.round((y.occupied / y.capacity) * 100)}% full`}
              />
            ))}

            <div className="sidebar__group">Clients</div>
            {filtered.clients.map((c) => (
              <Row
                key={c.id}
                active={isActive('client', c.id)}
                onClick={() => onSelect({ type: 'client', id: c.id })}
                accent="#a855f7"
                title={c.name}
                subtitle={c.address}
                meta={`${c.openOrders} orders`}
              />
            ))}
          </>
        )}

        {counts[tab] === 0 && (
          <p className="sidebar__empty">
            {tab === 'alerts' && !q
              ? 'No open exceptions. Everything that can move, can move.'
              : `Nothing matches “${query}”.`}
          </p>
        )}
      </div>
    </aside>
  )
}
