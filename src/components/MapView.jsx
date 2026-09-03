import { useEffect, useMemo, useState } from 'react'
import {
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import { CLIENTS, NODES, TERMINALS, YARDS } from '../data/network.js'
import { HARBOR_BOUNDS, PORTS, TERMINAL_BY_ID } from '../data/terminals.js'
import {
  GATE_CAPTURED_AT,
  POLA_SUCCESS_DATE,
  gateStatusFor,
  gateSuccessFor,
  shiftSummary,
} from '../lib/gates.js'
import { spreadPosition } from '../lib/geo.js'
import {
  chassisIcon,
  clientIcon,
  containerIcon,
  pierLabelIcon,
  terminalIcon,
  truckIcon,
  yardIcon,
} from '../lib/icons.js'
import { CHASSIS_STATUS, CONTAINER_STATUS, TRUCK_STATUS } from '../lib/status.js'

const PORT_CENTER = [33.85, -117.95]

// Esri's Canvas basemaps are key-free and deliberately desaturated, which is
// what an ops map wants: the roads recede and the status colours carry meaning.
// Labels ship as a separate reference layer so they draw on top of our routes.
const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas'
const ESRI_ATTRIBUTION =
  'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors'

const BASEMAPS = {
  dark: {
    base: `${ESRI}/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`,
    reference: `${ESRI}/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`,
    attribution: ESRI_ATTRIBUTION,
  },
  light: {
    base: `${ESRI}/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`,
    reference: `${ESRI}/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}`,
    attribution: ESRI_ATTRIBUTION,
  },
}

/** Pans to whatever the dispatcher just selected, without changing zoom out from under them. */
function SelectionFocus({ target }) {
  const map = useMap()

  useEffect(() => {
    if (!target) return
    map.flyTo(target, Math.max(map.getZoom(), 11), { duration: 0.7 })
  }, [target, map])

  return null
}

/** Frames both ports when the harbour button is pressed. */
function HarborFocus({ requestKey }) {
  const map = useMap()

  useEffect(() => {
    if (!requestKey) return
    map.flyToBounds(HARBOR_BOUNDS, { padding: [40, 40], duration: 0.8 })
  }, [requestKey, map])

  return null
}

/**
 * Terminal footprints are real polygons, but at basin zoom they're a few pixels
 * across. Below the threshold the map shows a marker per terminal; above it,
 * the actual shape. Reports zoom changes up so both can't draw at once.
 */
function ZoomWatch({ onZoom }) {
  const map = useMapEvents({ zoomend: () => onZoom(map.getZoom()) })
  useEffect(() => onZoom(map.getZoom()), [map, onZoom])
  return null
}

/**
 * Group items that share a location so `spreadPosition` can fan them out.
 * Returns a Map of itemId -> {index, total} for its location bucket.
 */
function bucketByLocation(items, keyFor) {
  const buckets = new Map()
  for (const item of items) {
    const key = keyFor(item)
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key).push(item.id)
  }

  const placement = new Map()
  for (const ids of buckets.values()) {
    ids.forEach((id, index) => placement.set(id, { index, total: ids.length }))
  }
  return placement
}

const POLYGON_ZOOM = 12

export default function MapView({
  trucks,
  containers,
  chassis,
  layers,
  theme,
  selected,
  onSelect,
  focusTarget,
  dateISO,
  harborFocusKey,
}) {
  const [zoom, setZoom] = useState(10)
  const showShapes = zoom >= POLYGON_ZOOM
  const basemap = BASEMAPS[theme] ?? BASEMAPS.dark

  const isSelected = (type, id) => selected?.type === type && selected?.id === id

  // Containers riding a truck follow that truck; the rest sit at their node.
  const truckById = useMemo(
    () => Object.fromEntries(trucks.map((t) => [t.id, t])),
    [trucks]
  )

  const containerPlacement = useMemo(
    () => bucketByLocation(containers, (c) => (c.truckId ? `truck:${c.truckId}` : c.locationId)),
    [containers]
  )
  const chassisPlacement = useMemo(
    () => bucketByLocation(chassis, (c) => (c.truckId ? `truck:${c.truckId}` : c.locationId)),
    [chassis]
  )

  function anchorFor(item) {
    if (item.truckId && truckById[item.truckId]) return truckById[item.truckId].position
    return NODES[item.locationId]?.position ?? PORT_CENTER
  }

  return (
    <MapContainer
      center={PORT_CENTER}
      zoom={10}
      minZoom={8}
      maxZoom={16}
      zoomControl={false}
      className="map"
    >
      <TileLayer url={basemap.base} attribution={basemap.attribution} maxNativeZoom={16} />
      <TileLayer url={basemap.reference} maxNativeZoom={16} zIndex={400} />
      <SelectionFocus target={focusTarget} />
      <HarborFocus requestKey={harborFocusKey} />
      <ZoomWatch onZoom={setZoom} />

      {layers.routes &&
        trucks
          .filter((t) => TRUCK_STATUS[t.status]?.moving)
          .map((truck) => {
            const active = isSelected('truck', truck.id)
            return (
              <Polyline
                key={`route-${truck.id}`}
                positions={truck.route.geometry}
                pathOptions={{
                  color: TRUCK_STATUS[truck.status]?.color ?? '#4f9cf9',
                  weight: active ? 4 : 2,
                  opacity: active ? 0.95 : 0.4,
                  dashArray: active ? null : '6 8',
                }}
              />
            )
          })}

      {layers.terminals &&
        TERMINALS.map((terminal) => {
          const active = isSelected('terminal', terminal.id)
          // Published gate state, or nothing. Terminals with no feed are drawn
          // in their port colour and say so — never shaded as if we knew.
          const gate = gateStatusFor(terminal.id, dateISO)
          const success = gateSuccessFor(terminal.id)
          const portColor = PORTS[TERMINAL_BY_ID[terminal.id]?.port]?.color ?? '#f97316'
          // Long Beach publishes whether the gate is open; Los Angeles publishes
          // how well it is coping. Each terminal is shaded by whichever its own
          // port actually reports, and by port colour when neither applies.
          const fill = gate.known && !gate.anyOpen
            ? '#64748b'
            : success.known
              ? success.band.color
              : portColor

          return (
            <Polygon
              key={`shape-${terminal.id}`}
              positions={terminal.boundary}
              pathOptions={{
                color: '#ffffff',
                weight: active ? 2.5 : 1,
                opacity: showShapes ? 0.85 : 0,
                fillColor: fill,
                // A shut gate is drawn back and dashed — it should not read as
                // somewhere a truck can be sent right now.
                fillOpacity: showShapes ? (active ? 0.9 : gate.known && !gate.anyOpen ? 0.3 : 0.6) : 0,
                dashArray: gate.known && !gate.anyOpen ? '4 4' : null,
              }}
              eventHandlers={{ click: () => onSelect({ type: 'terminal', id: terminal.id }) }}
            >
              <Popup>
                <div className="gatePopup">
                  <p className="gatePopup__port">{terminal.port}</p>
                  <h4 className="gatePopup__name">{terminal.name}</h4>
                  <p className="gatePopup__berths">{terminal.berth}</p>

                  {gate.known ? (
                    <>
                      <div
                        className={`gatePopup__level ${
                          gate.anyOpen ? '' : 'gatePopup__level--shut'
                        }`}
                        style={{ '--load': gate.anyOpen ? '#22c55e' : '#ef4444' }}
                      >
                        <span className="gatePopup__dot" />
                        {gate.anyOpen ? 'Gate open today' : 'No open shift today'}
                      </div>
                      <ul className="gatePopup__shifts">
                        {Object.entries(gate.shifts)
                          .sort(([a], [b]) => Number(a) - Number(b))
                          .map(([n, v]) => (
                            <li key={n}>
                              <span>Shift {n}</span>
                              <strong className={`shift shift--${v.toLowerCase()}`}>
                                {v === 'TBD' ? 'Not posted' : v}
                              </strong>
                            </li>
                          ))}
                      </ul>
                      <p className="gatePopup__note">
                        Published by the Port of Long Beach for {dateISO}, captured{' '}
                        {GATE_CAPTURED_AT.slice(0, 10)}. No queue or wait time is shown
                        because none is published.
                      </p>
                    </>
                  ) : success.known ? (
                    <>
                      <div
                        className="gatePopup__level"
                        style={{ '--load': success.band.color }}
                      >
                        <span className="gatePopup__dot" />
                        {success.pct}% of appointments fulfilled — {success.band.label}
                      </div>
                      <p className="gatePopup__note">
                        Port of LA, {POLA_SUCCESS_DATE} (complex-wide{' '}
                        {success.allTerminals}%). This is appointment fulfilment, not
                        a queue length or turn time — neither is published. Gate hours
                        are not published either, so no open/closed is shown.
                      </p>
                    </>
                  ) : (
                    <p className="gatePopup__note gatePopup__note--unknown">
                      Nothing published for this terminal — {gate.reason}.
                    </p>
                  )}
                </div>
              </Popup>
            </Polygon>
          )
        })}

      {/* Zoomed out, a shape this small is invisible — show a marker instead. */}
      {layers.terminals &&
        !showShapes &&
        TERMINALS.map((terminal) => (
          <Marker
            key={terminal.id}
            position={terminal.position}
            icon={terminalIcon(isSelected('terminal', terminal.id))}
            eventHandlers={{ click: () => onSelect({ type: 'terminal', id: terminal.id }) }}
          >
            <Tooltip direction="top" offset={[0, -14]}>
              <strong>{terminal.name}</strong>
              <br />
              {terminal.berth}
              <br />
              {(() => {
                const g = gateStatusFor(terminal.id, dateISO)
                return g.known ? shiftSummary(g.shifts) : 'Gate status not published'
              })()}
            </Tooltip>
          </Marker>
        ))}

      {/* Pier codes, once the shapes are big enough to hold them. */}
      {layers.terminals &&
        showShapes &&
        TERMINALS.map((terminal) => (
          <Marker
            key={`label-${terminal.id}`}
            position={terminal.position}
            interactive={false}
            icon={pierLabelIcon(TERMINAL_BY_ID[terminal.id]?.label ?? '')}
          />
        ))}

      {layers.yards &&
        YARDS.map((yard) => (
          <Marker
            key={yard.id}
            position={yard.position}
            icon={yardIcon(isSelected('yard', yard.id))}
            eventHandlers={{ click: () => onSelect({ type: 'yard', id: yard.id }) }}
          >
            <Tooltip direction="top" offset={[0, -14]}>
              <strong>{yard.name}</strong>
              <br />
              {yard.occupied}/{yard.capacity} slots used
            </Tooltip>
          </Marker>
        ))}

      {layers.clients &&
        CLIENTS.map((client) => (
          <Marker
            key={client.id}
            position={client.position}
            icon={clientIcon(isSelected('client', client.id))}
            eventHandlers={{ click: () => onSelect({ type: 'client', id: client.id }) }}
          >
            <Tooltip direction="top" offset={[0, -14]}>
              <strong>{client.name}</strong>
              <br />
              {client.openOrders} open orders
            </Tooltip>
          </Marker>
        ))}

      {layers.chassis &&
        chassis.map((unit) => {
          const place = chassisPlacement.get(unit.id) ?? { index: 0, total: 1 }
          const position = spreadPosition(anchorFor(unit), place.index + 1, place.total + 1)
          return (
            <Marker
              key={unit.id}
              position={position}
              icon={chassisIcon(unit, isSelected('chassis', unit.id))}
              eventHandlers={{ click: () => onSelect({ type: 'chassis', id: unit.id }) }}
            >
              <Tooltip direction="top" offset={[0, -8]}>
                <strong>{unit.id}</strong>
                <br />
                {CHASSIS_STATUS[unit.status]?.label}
              </Tooltip>
            </Marker>
          )
        })}

      {layers.containers &&
        containers.map((box) => {
          const place = containerPlacement.get(box.id) ?? { index: 0, total: 1 }
          const position = spreadPosition(anchorFor(box), place.index + 1, place.total + 1)
          return (
            <Marker
              key={box.id}
              position={position}
              icon={containerIcon(box, isSelected('container', box.id))}
              eventHandlers={{ click: () => onSelect({ type: 'container', id: box.id }) }}
            >
              <Tooltip direction="top" offset={[0, -10]}>
                <strong>{box.id}</strong>
                <br />
                {box.size}' {box.type} — {CONTAINER_STATUS[box.status]?.label}
              </Tooltip>
            </Marker>
          )
        })}

      {layers.fleet &&
        trucks.map((truck) => (
          <Marker
            key={truck.id}
            position={truck.position}
            icon={truckIcon(truck, { selected: isSelected('truck', truck.id) })}
            zIndexOffset={500}
            eventHandlers={{ click: () => onSelect({ type: 'truck', id: truck.id }) }}
          >
            <Tooltip direction="top" offset={[0, -16]}>
              <strong>Unit {truck.unit}</strong> — {truck.driver}
              <br />
              {TRUCK_STATUS[truck.status]?.label}
            </Tooltip>
          </Marker>
        ))}
    </MapContainer>
  )
}
