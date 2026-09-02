// Approximate freeway corridors through the LA basin, used to draw dray legs.
// These are hand-traced polylines, not routing-engine output — good enough to
// show the shape of a move on the map. Swap in real geometry from an ETA/routing
// provider later; everything downstream just consumes [lat, lng] arrays.

/** I-710 north from the harbor to the 91 interchange. */
export const I710_HARBOR_TO_91 = [
  [33.755, -118.208],
  [33.775, -118.204],
  [33.796, -118.198],
  [33.818, -118.192],
  [33.842, -118.187],
  [33.864, -118.183],
]

/** I-710 continuing north from the 91 up toward the 5. */
export const I710_91_TO_I5 = [
  [33.864, -118.183],
  [33.894, -118.177],
  [33.924, -118.172],
  [33.952, -118.168],
  [33.978, -118.162],
]

/** SR-91 east from the 710 interchange out to the 15. */
export const SR91_EAST = [
  [33.864, -118.183],
  [33.868, -118.12],
  [33.872, -118.04],
  [33.876, -117.96],
  [33.879, -117.88],
  [33.883, -117.79],
  [33.888, -117.7],
  [33.894, -117.61],
  [33.9, -117.53],
]

/** I-15 north from the 91 up through Fontana / Rancho Cucamonga. */
export const I15_NORTH = [
  [33.9, -117.53],
  [33.945, -117.51],
  [33.99, -117.495],
  [34.035, -117.48],
  [34.075, -117.465],
]

/** I-215 south-east from the 91 down to Perris. */
export const I215_SOUTH = [
  [33.894, -117.61],
  [33.92, -117.45],
  [33.93, -117.36],
  [33.9, -117.28],
  [33.86, -117.245],
  [33.82, -117.233],
]

/** I-5 north from the 710 through Commerce / Vernon. */
export const I5_COMMERCE = [
  [33.978, -118.162],
  [33.99, -118.155],
  [34.0, -118.17],
  [34.004, -118.2],
  [34.004, -118.225],
]

/** Surface route from the harbor up to the Carson yard. */
export const HARBOR_TO_CARSON = [
  [33.752, -118.215],
  [33.772, -118.228],
  [33.79, -118.24],
  [33.81, -118.246],
  [33.828, -118.25],
]

/** Chain corridor segments together, dropping the duplicated joint points. */
export function chain(...segments) {
  const out = []
  for (const seg of segments) {
    for (const pt of seg) {
      const last = out[out.length - 1]
      if (last && last[0] === pt[0] && last[1] === pt[1]) continue
      out.push(pt)
    }
  }
  return out
}
