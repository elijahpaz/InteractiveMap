// Small geo helpers for placing a truck partway along its route polyline.
// Everything works in [lat, lng] pairs to match Leaflet's convention.

const R_EARTH_M = 6371000
const toRad = (deg) => (deg * Math.PI) / 180
const toDeg = (rad) => (rad * 180) / Math.PI

/** Great-circle distance in metres between two [lat, lng] points. */
export function haversine(a, b) {
  const dLat = toRad(b[0] - a[0])
  const dLng = toRad(b[1] - a[1])
  const lat1 = toRad(a[0])
  const lat2 = toRad(b[0])
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R_EARTH_M * Math.asin(Math.sqrt(h))
}

/** Total length of a polyline in metres. */
export function pathLength(points) {
  let total = 0
  for (let i = 1; i < points.length; i++) total += haversine(points[i - 1], points[i])
  return total
}

/** Linear interpolation between two points — fine at dray distances. */
function lerp(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
}

/**
 * Point at fractional progress `t` (0..1) along a polyline, measured by
 * distance rather than by vertex count so evenly-timed ticks look even.
 */
export function pointAtProgress(points, t) {
  if (!points || points.length === 0) return null
  if (points.length === 1) return points[0]

  const clamped = Math.min(1, Math.max(0, t))
  const total = pathLength(points)
  if (total === 0) return points[0]

  let target = total * clamped
  for (let i = 1; i < points.length; i++) {
    const segment = haversine(points[i - 1], points[i])
    if (target <= segment || i === points.length - 1) {
      const ratio = segment === 0 ? 0 : target / segment
      return lerp(points[i - 1], points[i], Math.min(1, ratio))
    }
    target -= segment
  }
  return points[points.length - 1]
}

/** Compass bearing in degrees at progress `t`, used to rotate the truck icon. */
export function bearingAtProgress(points, t) {
  if (!points || points.length < 2) return 0

  const clamped = Math.min(1, Math.max(0, t))
  const total = pathLength(points)
  if (total === 0) return 0

  let target = total * clamped
  let a = points[0]
  let b = points[1]
  for (let i = 1; i < points.length; i++) {
    const segment = haversine(points[i - 1], points[i])
    if (target <= segment || i === points.length - 1) {
      a = points[i - 1]
      b = points[i]
      break
    }
    target -= segment
  }

  const lat1 = toRad(a[0])
  const lat2 = toRad(b[0])
  const dLng = toRad(b[1] - a[1])
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

/** Remaining distance in miles from progress `t` to the end of the route. */
export function remainingMiles(points, t) {
  const total = pathLength(points)
  return ((total * (1 - Math.min(1, Math.max(0, t)))) / 1609.34)
}

/**
 * Fan several markers out around a shared point so a yard holding twenty boxes
 * doesn't render as one marker with nineteen hidden underneath. Deterministic,
 * so a given item keeps its spot between renders.
 */
export function spreadPosition(base, index, total) {
  if (total <= 1 || index === 0) return base

  // Golden-angle spiral: even coverage without ever lining items up in a row.
  const GOLDEN_ANGLE = 2.399963
  const angle = index * GOLDEN_ANGLE
  const radiusDeg = 0.0022 * Math.sqrt(index)
  const latScale = Math.cos(toRadPublic(base[0])) || 1

  return [
    base[0] + radiusDeg * Math.sin(angle),
    base[1] + (radiusDeg * Math.cos(angle)) / latScale,
  ]
}

function toRadPublic(deg) {
  return (deg * Math.PI) / 180
}
