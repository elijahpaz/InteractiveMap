// Single source of truth for how every status is labelled and coloured.
// The map, the sidebar, the legend and the KPI strip all read from here so a
// colour never means two different things in two different places.

export const TRUCK_STATUS = {
  en_route_terminal: { label: 'To terminal', short: 'To term.', color: '#38bdf8', moving: true, group: 'active' },
  at_terminal: { label: 'At terminal', short: 'At term.', color: '#f59e0b', moving: false, group: 'active' },
  en_route_client: { label: 'To client', short: 'To client', color: '#4f9cf9', moving: true, group: 'active' },
  at_client: { label: 'At client', short: 'At client', color: '#a78bfa', moving: false, group: 'active' },
  returning_yard: { label: 'To yard', short: 'To yard', color: '#2dd4bf', moving: true, group: 'active' },
  at_yard: { label: 'At yard', short: 'At yard', color: '#22c55e', moving: false, group: 'available' },
  idle: { label: 'Idle / out of hours', short: 'Idle', color: '#64748b', moving: false, group: 'idle' },
}

export const CONTAINER_STATUS = {
  at_terminal: { label: 'At terminal', color: '#f59e0b' },
  on_chassis: { label: 'On chassis', color: '#38bdf8' },
  in_transit: { label: 'In transit', color: '#4f9cf9' },
  at_client: { label: 'At client', color: '#a78bfa' },
  empty_ready: { label: 'Empty — return due', color: '#2dd4bf' },
  completed: { label: 'Completed', color: '#64748b' },
}

export const CHASSIS_STATUS = {
  mounted: { label: 'Mounted', color: '#4f9cf9' },
  available: { label: 'Available', color: '#22c55e' },
  repair: { label: 'Out of service', color: '#ef4444' },
}

/** A container is "live" — still the dispatcher's problem — until it's completed. */
export function isLiveContainer(container) {
  return container.status !== 'completed'
}

/**
 * Demurrage risk from the last-free-day offset.
 * Negative offsets mean the LFD has already passed and charges are accruing.
 */
export function demurrageRisk(lfdOffsetDays) {
  if (lfdOffsetDays < 0) return { level: 'accruing', label: 'Demurrage accruing', color: '#ef4444' }
  if (lfdOffsetDays === 0) return { level: 'today', label: 'LFD today', color: '#f97316' }
  if (lfdOffsetDays <= 2) return { level: 'soon', label: `LFD in ${lfdOffsetDays}d`, color: '#f59e0b' }
  return { level: 'ok', label: `LFD in ${lfdOffsetDays}d`, color: '#22c55e' }
}

/** Turn the stored day offset into an actual date for display. */
export function lastFreeDayDate(lfdOffsetDays, now = new Date()) {
  const d = new Date(now)
  d.setDate(d.getDate() + lfdOffsetDays)
  return d
}

export function formatDate(date) {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** Minutes as "4h 12m" / "38m". */
export function formatDuration(minutes) {
  if (minutes == null) return '—'
  if (minutes <= 0) return '0m'
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export const ENTITY_META = {
  truck: { label: 'Fleet', plural: 'Trucks', accent: '#4f9cf9' },
  terminal: { label: 'Terminal', plural: 'Terminals', accent: '#f97316' },
  client: { label: 'Client', plural: 'Clients', accent: '#a855f7' },
  yard: { label: 'Yard', plural: 'Yards', accent: '#22c55e' },
  container: { label: 'Container', plural: 'Containers', accent: '#eab308' },
  chassis: { label: 'Chassis', plural: 'Chassis', accent: '#94a3b8' },
}
