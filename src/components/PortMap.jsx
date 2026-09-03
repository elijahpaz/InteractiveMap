import { useMemo, useState } from 'react'
import { MapContainer, Marker, Polygon, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import {
  CONTAINER_TERMINALS,
  HARBOR_BOUNDS,
  HARBOR_CENTER,
  PORTS,
  TERMINALS_BY_PORT,
} from '../data/terminals.js'

// A deliberately quiet map of the container terminals in San Pedro Bay,
// modelled on the Port of Long Beach's own port map: a desaturated basemap,
// flat pier shapes, and a short label sitting in the middle of each one.
// Nothing moves here — this is the fixed landside picture the ops views sit on.

const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas'
const ATTRIBUTION =
  'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; terminal outlines &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors (ODbL)'

/** Short code that sits inside each pier shape, the way POLB labels theirs. */
function labelIcon(terminal, { active, dimmed }) {
  return L.divIcon({
    className: 'marker marker--pierLabel',
    iconSize: [46, 22],
    iconAnchor: [23, 11],
    html: `<span class="pierLabel ${active ? 'is-active' : ''} ${
      dimmed ? 'is-dimmed' : ''
    }">${terminal.label}</span>`,
  })
}

/** Frames both ports on first paint, and refocuses when a terminal is picked. */
function Framing({ selected }) {
  const map = useMap()

  useMemo(() => {
    if (!selected) {
      map.fitBounds(HARBOR_BOUNDS, { padding: [24, 24] })
      return
    }
    map.flyToBounds(selected.boundary, { padding: [90, 90], duration: 0.6, maxZoom: 14 })
  }, [selected, map])

  return null
}

function Detail({ terminal, onClose }) {
  const port = PORTS[terminal.port]

  return (
    <div className="pierDetail">
      <button type="button" className="pierDetail__close" onClick={onClose} aria-label="Close">
        ✕
      </button>
      <p className="pierDetail__port" style={{ color: port.color }}>
        {port.name}
      </p>
      <h3 className="pierDetail__name">{terminal.name}</h3>
      <dl className="pierDetail__facts">
        <div>
          <dt>Operator</dt>
          <dd>{terminal.operator}</dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>{terminal.pier}</dd>
        </div>
        <div>
          <dt>Berths</dt>
          <dd>{terminal.berths}</dd>
        </div>
      </dl>
      <p className="pierDetail__note">
        Name, operator and berths from {port.name}.{' '}
        {terminal.boundarySource === 'osm'
          ? 'Outline from OpenStreetMap, simplified.'
          : 'Outline is an approximate footprint derived from the pier’s street extent — not a survey boundary.'}
      </p>
    </div>
  )
}

export default function PortMap({ theme }) {
  const [selectedId, setSelectedId] = useState(null)
  const [hoveredId, setHoveredId] = useState(null)
  const [portFilter, setPortFilter] = useState('ALL')

  const visible = useMemo(
    () =>
      portFilter === 'ALL'
        ? CONTAINER_TERMINALS
        : CONTAINER_TERMINALS.filter((t) => t.port === portFilter),
    [portFilter]
  )

  const selected = visible.find((t) => t.id === selectedId) ?? null
  const basemap = theme === 'light' ? 'World_Light_Gray' : 'World_Dark_Gray'

  return (
    <div className="portView">
      <aside className="portPanel">
        <div className="portPanel__head">
          <h2>Container terminals</h2>
          <p>San Pedro Bay · {CONTAINER_TERMINALS.length} terminals</p>
        </div>

        <div className="portPanel__filter" role="group" aria-label="Filter by port">
          {[
            { id: 'ALL', label: 'Both ports' },
            { id: 'POLA', label: PORTS.POLA.short },
            { id: 'POLB', label: PORTS.POLB.short },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`portPanel__filterBtn ${portFilter === opt.id ? 'is-on' : ''}`}
              onClick={() => setPortFilter(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="portPanel__list">
          {['POLA', 'POLB'].map((portId) => {
            const group = TERMINALS_BY_PORT[portId].filter((t) =>
              portFilter === 'ALL' ? true : t.port === portFilter
            )
            if (group.length === 0) return null

            return (
              <section key={portId}>
                <h3 className="portPanel__group" style={{ '--port': PORTS[portId].color }}>
                  {PORTS[portId].name}
                  <span>{group.length}</span>
                </h3>
                {group.map((terminal) => (
                  <button
                    key={terminal.id}
                    type="button"
                    className={`pierRow ${selectedId === terminal.id ? 'is-active' : ''}`}
                    style={{ '--port': PORTS[terminal.port].color }}
                    onClick={() =>
                      setSelectedId((id) => (id === terminal.id ? null : terminal.id))
                    }
                    onMouseEnter={() => setHoveredId(terminal.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <span className="pierRow__code">{terminal.label}</span>
                    <span className="pierRow__text">
                      <span className="pierRow__name">{terminal.name}</span>
                      <span className="pierRow__berths">Berths {terminal.berths}</span>
                    </span>
                  </button>
                ))}
              </section>
            )
          })}
        </div>

        <p className="portPanel__source">
          Names, operators and berths from the Port of Los Angeles and Port of Long
          Beach. Solid outlines are OpenStreetMap polygons; dashed outlines are
          approximate footprints.
        </p>
      </aside>

      <div className="portStage">
        <MapContainer
          center={HARBOR_CENTER}
          zoom={12}
          minZoom={10}
          maxZoom={16}
          zoomControl={false}
          className="map"
        >
          <TileLayer
            url={`${ESRI}/${basemap}_Base/MapServer/tile/{z}/{y}/{x}`}
            attribution={ATTRIBUTION}
            maxNativeZoom={16}
          />
          <TileLayer
            url={`${ESRI}/${basemap}_Reference/MapServer/tile/{z}/{y}/{x}`}
            maxNativeZoom={16}
            zIndex={400}
          />
          <Framing selected={selected} />

          {visible.map((terminal) => {
            const port = PORTS[terminal.port]
            const active = selectedId === terminal.id || hoveredId === terminal.id
            const dimmed = selectedId != null && selectedId !== terminal.id

            return (
              <Polygon
                key={terminal.id}
                positions={terminal.boundary}
                pathOptions={{
                  color: '#ffffff',
                  weight: active ? 2.5 : 1,
                  opacity: dimmed ? 0.25 : 0.85,
                  // Approximated footprints are dashed so they don't read as
                  // surveyed outlines the way the OSM polygons do.
                  dashArray: terminal.boundarySource === 'derived' ? '5 4' : null,
                  fillColor: port.color,
                  fillOpacity: dimmed ? 0.18 : active ? 0.92 : 0.62,
                }}
                eventHandlers={{
                  click: () =>
                    setSelectedId((id) => (id === terminal.id ? null : terminal.id)),
                  mouseover: () => setHoveredId(terminal.id),
                  mouseout: () => setHoveredId(null),
                }}
              />
            )
          })}

          {visible.map((terminal) => (
            <Marker
              key={`label-${terminal.id}`}
              position={terminal.position}
              interactive={false}
              icon={labelIcon(terminal, {
                active: selectedId === terminal.id || hoveredId === terminal.id,
                dimmed: selectedId != null && selectedId !== terminal.id,
              })}
            />
          ))}
        </MapContainer>

        {selected && <Detail terminal={selected} onClose={() => setSelectedId(null)} />}
      </div>
    </div>
  )
}
