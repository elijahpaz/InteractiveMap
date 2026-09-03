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
import { terminalAccess } from '../lib/gates.js'
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

/**
 * Pans to a selection *only when something asked it to*.
 *
 * Keyed on `focusKey`, which the sidebar bumps and the map does not. Watching
 * the target itself meant every click on the canvas recentred the map under the
 * cursor, which is disorienting and makes the thing you just clicked jump away.
 */
function SelectionFocus({ target, focusKey }) {
  const map = useMap()

  useEffect(() => {
    // focusKey starts at 0 and only increments when a list asks to fly, so a
    // falsy key means "nothing has asked yet" and the initial mount stays put.
    // (An earlier version guarded with a ref, which re-initialised to the
    // current key on remount and so never fired at all.)
    if (!focusKey || !target) return
    // Non-animated on purpose. Leaflet's zoom animation is unreliable here —
    // animated setZoom/flyTo silently no-op while the non-animated paths work —
    // and for "jump to the thing I picked in the list" an instant move is
    // clearer than a fly anyway.
    map.setView(target, Math.max(map.getZoom(), 12), { animate: false })
  }, [focusKey, target, map])

  return null
}

/** Frames both ports when the harbour button is pressed. */
function HarborFocus({ requestKey }) {
  const map = useMap()

  useEffect(() => {
    if (!requestKey) return
    map.fitBounds(HARBOR_BOUNDS, { padding: [40, 40], animate: false })
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
  focusKey,
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
      <SelectionFocus target={focusTarget} focusKey={focusKey} />
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
          // One reading per terminal, from whatever its own port publishes.
          const access = terminalAccess(terminal.id, dateISO)
          const fill = access.color

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
                fillOpacity: showShapes ? (active ? 0.9 : access.level === 'unknown' ? 0.28 : 0.66) : 0,
                dashArray: access.level === 'unknown' || access.level === 'shut' ? '4 4' : null,
              }}
              eventHandlers={{ click: () => onSelect({ type: 'terminal', id: terminal.id }) }}
            >
              <Popup>
                <div className="gatePopup">
                  <p className="gatePopup__port">{terminal.port}</p>
                  <h4 className="gatePopup__name">{terminal.name}</h4>
                  <p className="gatePopup__berths">{terminal.berth}</p>

                  <div
                    className="gatePopup__level"
                    style={{ '--load': access.color }}
                  >
                    <span className="gatePopup__dot" />
                    {access.label}
                  </div>

                  {access.detail && <p className="gatePopup__detail">{access.detail}</p>}

                  {access.shifts && (
                    <ul className="gatePopup__shifts">
                      {Object.entries(access.shifts)
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
                  )}

                  <p className="gatePopup__note">
                    {access.basis === 'none'
                      ? access.detail
                      : `${access.source}, ${access.asOf}.`}
                    {access.basis === 'turnTime' &&
                      ' Measured by the port, not estimated.'}
                    {access.basis === 'shifts' && ' From the published gate calendar.'}
                    {access.basis === 'appointments' &&
                      ` Complex-wide ${access.allTerminals}%. Los Angeles publishes no gate hours.`}
                  </p>
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
                const a = terminalAccess(terminal.id, dateISO)
                return a.detail ? `${a.label} — ${a.detail}` : a.label
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
