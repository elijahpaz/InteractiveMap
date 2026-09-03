import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TRUCKS } from '../data/fleet.js'
import { NODES } from '../data/network.js'
import { bearingAtProgress, pathLength, pointAtProgress } from '../lib/geo.js'
import { TRUCK_STATUS } from '../lib/status.js'

// Stands in for a live telematics feed. Trucks roll along their tour geometry
// on a clock, dwell at each stop for as long as that stop usually takes, then
// depart on the next leg. When the real GPS feed lands, replace this hook with
// a subscription that pushes {id, position, heading, progress, status} — every
// component downstream already reads exactly that shape.

const AVG_SPEED_MPH = 38
const SIM_MINUTES_PER_REAL_SECOND = 2
const TICK_MS = 250
const YARD_DWELL_MIN = 40
/** Placeholder only — see dwellTargetMin. Not a measured turn time. */
const TERMINAL_DWELL_MIN = 75

/** Nominal minutes to drive a leg end to end, from its length. */
function legMinutes(geometry) {
  const miles = pathLength(geometry) / 1609.34
  return Math.max(1, (miles / AVG_SPEED_MPH) * 60)
}

/**
 * How long a simulated unit sits at a stop.
 *
 * This is a property of the SIMULATED FLEET, not a claim about any real
 * terminal. A previous version drove it from a congestion model whose numbers
 * were invented; that model is gone, and no replacement exists because there is
 * no free public source for real gate queue times. Terminal dwell is now a flat
 * placeholder, and the app no longer reports turn time as if it knew it.
 */
function dwellTargetMin(nodeId) {
  const node = NODES[nodeId]
  if (!node) return YARD_DWELL_MIN
  if (node.avgDetentionMin != null) return node.avgDetentionMin
  return TERMINAL_DWELL_MIN
}

function initialState() {
  return TRUCKS.map((truck) => ({
    id: truck.id,
    leg: truck.startLeg,
    status: truck.startStatus,
    progress: truck.startProgress,
    dwellMin: truck.startDwellMin,
  }))
}

export function useSimulation() {
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [clockMin, setClockMin] = useState(8 * 60 + 20) // 08:20 local
  const [motion, setMotion] = useState(initialState)
  const lastTickRef = useRef(null)
  // The tick runs inside a closure, so the clock is mirrored in a ref to keep
  // the dwell lookup from reading a stale value.
  const clockRef = useRef(8 * 60 + 20)

  // Leg durations depend only on static geometry, so compute them once.
  const legMinutesByTruck = useMemo(
    () =>
      Object.fromEntries(
        TRUCKS.map((t) => [t.id, t.tour.map((leg) => legMinutes(leg.geometry))])
      ),
    []
  )

  const reset = useCallback(() => {
    setMotion(initialState())
    setClockMin(8 * 60 + 20)
    clockRef.current = 8 * 60 + 20
    lastTickRef.current = null
  }, [])

  useEffect(() => {
    if (!playing) {
      lastTickRef.current = null
      return undefined
    }

    const interval = setInterval(() => {
      const now = performance.now()
      const prev = lastTickRef.current ?? now
      lastTickRef.current = now

      // Wall-clock delta keeps motion smooth even if a tick lands late.
      const realSeconds = (now - prev) / 1000
      const simMinutes = realSeconds * SIM_MINUTES_PER_REAL_SECOND * speed
      if (simMinutes <= 0) return

      setClockMin((c) => {
        clockRef.current = (c + simMinutes) % (24 * 60)
        return clockRef.current
      })
      setMotion((current) =>
        current.map((m) => {
          const truck = TRUCKS.find((t) => t.id === m.id)
          if (!truck || m.status === 'idle') return m

          const legs = truck.tour
          const meta = TRUCK_STATUS[m.status] ?? TRUCK_STATUS.idle

          if (meta.moving) {
            const total = legMinutesByTruck[m.id]?.[m.leg] ?? 60
            const next = m.progress + simMinutes / total
            if (next < 1) return { ...m, progress: next }
            // Arrived — start the dwell clock at this stop.
            return { ...m, progress: 1, status: legs[m.leg].arrive, dwellMin: 0 }
          }

          // Parked: accrue dwell, and depart once the stop's normal time is up.
          const dwellMin = m.dwellMin + simMinutes
          const stopId = legs[m.leg].to
          if (dwellMin < dwellTargetMin(stopId)) return { ...m, dwellMin }

          const nextLeg = (m.leg + 1) % legs.length
          return {
            ...m,
            leg: nextLeg,
            status: legs[nextLeg].status,
            progress: 0,
            dwellMin: 0,
          }
        })
      )
    }, TICK_MS)

    return () => clearInterval(interval)
  }, [playing, speed, legMinutesByTruck])

  // Merge each truck's static record with its current motion state.
  const trucks = useMemo(
    () =>
      TRUCKS.map((truck) => {
        const m =
          motion.find((x) => x.id === truck.id) ?? {
            leg: truck.startLeg,
            status: truck.startStatus,
            progress: truck.startProgress,
            dwellMin: truck.startDwellMin,
          }
        const route = truck.tour[m.leg]
        const position =
          pointAtProgress(route.geometry, m.progress) ??
          route.geometry[route.geometry.length - 1]

        return {
          ...truck,
          route,
          status: m.status,
          progress: m.progress,
          dwellMin: m.dwellMin,
          dwellTargetMin: dwellTargetMin(route.to),
          position,
          heading: bearingAtProgress(route.geometry, m.progress),
          legMinutes: legMinutesByTruck[truck.id]?.[m.leg] ?? 60,
        }
      }),
    [motion, legMinutesByTruck, clockMin]
  )

  return { trucks, playing, setPlaying, speed, setSpeed, clockMin, reset }
}
