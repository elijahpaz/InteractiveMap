import L from 'leaflet'
import { CHASSIS_STATUS, TRUCK_STATUS, demurrageRisk } from './status.js'

// Markers are divIcons rather than image sprites so status colour, rotation and
// selection state are all just CSS — no per-variant PNG to regenerate.

const cache = new Map()

/** divIcons are immutable once built, so identical ones can be shared. */
function memo(key, build) {
  if (!cache.has(key)) cache.set(key, build())
  return cache.get(key)
}

export function truckIcon(truck, { selected = false } = {}) {
  const meta = TRUCK_STATUS[truck.status] ?? TRUCK_STATUS.idle
  // Rotation is quantised so we don't build a fresh icon every animation frame.
  const heading = Math.round((truck.heading ?? 0) / 15) * 15
  const key = `truck:${truck.status}:${heading}:${selected}:${meta.moving}`

  return memo(key, () =>
    L.divIcon({
      className: 'marker marker--truck',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      html: `
        <div class="truck ${selected ? 'is-selected' : ''} ${meta.moving ? 'is-moving' : ''}"
             style="--status:${meta.color}">
          <span class="truck__pulse"></span>
          <span class="truck__body" style="transform:rotate(${heading}deg)">
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <path d="M12 3 L19 20 L12 16 L5 20 Z" fill="currentColor"/>
            </svg>
          </span>
        </div>`,
    })
  )
}

export function terminalIcon(selected = false) {
  return memo(`terminal:${selected}`, () =>
    L.divIcon({
      className: 'marker marker--node',
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      html: `
        <div class="node node--terminal ${selected ? 'is-selected' : ''}">
          <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
            <path d="M12 2a2.2 2.2 0 1 1 0 4.4A2.2 2.2 0 0 1 12 2Zm-1.2 6h2.4v11.2a6.6 6.6 0 0 0 5-5.4h-2l3.2-3.6L22.6 14h-2.1A8.8 8.8 0 0 1 12 22a8.8 8.8 0 0 1-8.5-8H1.4l3.2-3.8L7.8 14h-2a6.6 6.6 0 0 0 5 5.4Z" fill="currentColor"/>
          </svg>
        </div>`,
    })
  )
}

export function yardIcon(selected = false) {
  return memo(`yard:${selected}`, () =>
    L.divIcon({
      className: 'marker marker--node',
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      html: `
        <div class="node node--yard ${selected ? 'is-selected' : ''}">
          <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
            <path d="M3 10 12 4l9 6v10h-6v-6H9v6H3Z" fill="currentColor"/>
          </svg>
        </div>`,
    })
  )
}

export function clientIcon(selected = false) {
  return memo(`client:${selected}`, () =>
    L.divIcon({
      className: 'marker marker--node',
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      html: `
        <div class="node node--client ${selected ? 'is-selected' : ''}">
          <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
            <path d="M4 21V6l7-3 7 3v15h-5v-5h-4v5Z" fill="currentColor"/>
          </svg>
        </div>`,
    })
  )
}

export function containerIcon(container, selected = false) {
  const risk = demurrageRisk(container.lfdOffsetDays)
  const key = `container:${container.size}:${risk.level}:${selected}`

  return memo(key, () =>
    L.divIcon({
      className: 'marker marker--box',
      iconSize: [30, 18],
      iconAnchor: [15, 9],
      html: `
        <div class="box ${selected ? 'is-selected' : ''}" style="--risk:${risk.color}">
          <span class="box__ribs"></span>
          <span class="box__size">${container.size}</span>
        </div>`,
    })
  )
}

export function chassisIcon(chassis, selected = false) {
  const meta = CHASSIS_STATUS[chassis.status] ?? CHASSIS_STATUS.available
  const key = `chassis:${chassis.status}:${selected}`

  return memo(key, () =>
    L.divIcon({
      className: 'marker marker--chassis',
      iconSize: [24, 12],
      iconAnchor: [12, 6],
      html: `
        <div class="chassis ${selected ? 'is-selected' : ''}" style="--status:${meta.color}">
          <span class="chassis__rail"></span>
          <span class="chassis__wheel"></span>
          <span class="chassis__wheel"></span>
        </div>`,
    })
  )
}

/** Pier code sitting inside a terminal footprint, once it's big enough to read. */
export function pierLabelIcon(label) {
  return memo(`pier:${label}`, () =>
    L.divIcon({
      className: 'marker marker--pierLabel',
      iconSize: [46, 20],
      iconAnchor: [23, 10],
      html: `<span class="pierLabel">${label}</span>`,
    })
  )
}
