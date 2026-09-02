import { NODES } from '../data/network.js'
import {
  chain,
  HARBOR_TO_CARSON,
  I15_NORTH,
  I215_SOUTH,
  I5_COMMERCE,
  I710_91_TO_I5,
  I710_HARBOR_TO_91,
  SR91_EAST,
} from '../data/corridors.js'

// A dray move is a loop: pull from the yard, pick up at a terminal, deliver to
// the client, come back. Rather than hand-drawing every pair, we keep one
// corridor per client and compose the other legs out of it.
//
// This is deliberately geometry-only — no traffic, no turn restrictions. Swap
// `buildRoute` for a call to a real routing provider and nothing else changes.

/** Harbour-to-client corridor for each client, outbound direction. */
const CLIENT_CORRIDOR = {
  'C-RIV': chain(I710_HARBOR_TO_91, SR91_EAST, I15_NORTH),
  'C-FON': chain(I710_HARBOR_TO_91, SR91_EAST, I15_NORTH),
  'C-ONT': chain(I710_HARBOR_TO_91, SR91_EAST, I15_NORTH),
  'C-MOV': chain(I710_HARBOR_TO_91, SR91_EAST, I215_SOUTH),
  'C-PER': chain(I710_HARBOR_TO_91, SR91_EAST, I215_SOUTH),
  'C-COM': chain(I710_HARBOR_TO_91, I710_91_TO_I5),
  'C-VER': chain(I710_HARBOR_TO_91, I710_91_TO_I5, I5_COMMERCE),
  'C-SFS': chain(I710_HARBOR_TO_91, [
    [33.872, -118.15],
    [33.9, -118.115],
    [33.928, -118.095],
  ]),
}

const reverse = (points) => [...points].reverse()

function kindOf(id) {
  if (id.startsWith('T-')) return 'terminal'
  if (id.startsWith('Y-')) return 'yard'
  return 'client'
}

/**
 * Waypoints between two network nodes, excluding the endpoints themselves
 * (`leg` adds those). Falls back to a direct line for pairs we don't model.
 */
function waypoints(fromId, toId) {
  const from = kindOf(fromId)
  const to = kindOf(toId)

  if (from === 'terminal' && to === 'client') return CLIENT_CORRIDOR[toId] ?? []
  if (from === 'client' && to === 'terminal') return reverse(CLIENT_CORRIDOR[fromId] ?? [])

  // Client back to a yard: retrace the corridor to the harbour, then cut across.
  if (from === 'client' && to === 'yard') {
    return chain(reverse(CLIENT_CORRIDOR[fromId] ?? []), HARBOR_TO_CARSON)
  }
  if (from === 'yard' && to === 'client') {
    return chain(reverse(HARBOR_TO_CARSON), CLIENT_CORRIDOR[toId] ?? [])
  }

  // Yard <-> terminal is a short surface run through Wilmington / Carson.
  if (from === 'yard' && to === 'terminal') return reverse(HARBOR_TO_CARSON)
  if (from === 'terminal' && to === 'yard') return HARBOR_TO_CARSON

  return []
}

/** A full leg: endpoints plus the geometry between them. */
export function buildRoute(fromId, toId) {
  const from = NODES[fromId]
  const to = NODES[toId]
  if (!from || !to) throw new Error(`Unknown node in route ${fromId} -> ${toId}`)

  return {
    from: fromId,
    to: toId,
    geometry: [from.position, ...waypoints(fromId, toId), to.position],
  }
}

/**
 * The repeating three-leg tour a drayage unit runs. Statuses here are the
 * *moving* status for that leg; the arrival status is derived in the simulation.
 */
export function buildTour({ yardId, terminalId, clientId }) {
  return [
    { ...buildRoute(yardId, terminalId), status: 'en_route_terminal', arrive: 'at_terminal' },
    { ...buildRoute(terminalId, clientId), status: 'en_route_client', arrive: 'at_client' },
    { ...buildRoute(clientId, yardId), status: 'returning_yard', arrive: 'at_yard' },
  ]
}
