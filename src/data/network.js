// Fixed network nodes for the San Pedro Bay drayage network.
//
// TERMINALS are re-exported from terminals.js — real facilities, sourced from
// the two port authorities. YARDS and CLIENTS below are INVENTED demo data:
// the company names, addresses, capacities and order counts are placeholders,
// not real businesses. Replace them with the real network from the TMS.

import { CONTAINER_TERMINALS, PORTS } from './terminals.js'

/**
 * Terminals for the operations views. There is exactly one terminal list in
 * this project — `terminals.js` — and this flattens it into the shape the ops
 * components expect. Operating characteristics come from that file's `demo`
 * block and are simulated; the identity fields are sourced. See its header.
 */
export const TERMINALS = CONTAINER_TERMINALS.map((t) => ({
  id: t.id,
  name: t.name,
  operator: t.operator,
  berth: `${t.pier} · Berths ${t.berths}`,
  port: PORTS[t.port].name,
  position: t.position,
  boundary: t.boundary,
  boundarySource: t.boundarySource,
  // ── simulated ──
  turnTimeMin: t.demo.turnTimeMin,
  gateHours: t.demo.gateHours,
  appointmentRequired: t.demo.appointmentRequired,
  dualTransaction: t.demo.dualTransaction,
}))

export const YARDS = [
  {
    id: 'Y-CAR',
    name: 'Carson Main Yard',
    address: '18200 S Main St, Carson, CA',
    position: [33.83, -118.25],
    capacity: 420,
    occupied: 337,
    services: ['Container storage', 'Chassis pool', 'Light repair', 'Fuel'],
    isHome: true,
  },
  {
    id: 'Y-WIL',
    name: 'Wilmington Overflow Depot',
    address: '1420 E Anaheim St, Wilmington, CA',
    position: [33.79, -118.26],
    capacity: 180,
    occupied: 96,
    services: ['Container storage', 'Empty return staging'],
    isHome: false,
  },
]

export const CLIENTS = [
  {
    id: 'C-RIV',
    name: 'Riverbend Distribution',
    address: '11250 Jersey Blvd, Rancho Cucamonga, CA',
    position: [34.1064, -117.5931],
    accountTier: 'Key',
    receivingHours: '06:00 - 14:00',
    appointmentRequired: true,
    openOrders: 6,
    avgDetentionMin: 41,
  },
  {
    id: 'C-FON',
    name: 'Fontana Cold Storage',
    address: '15600 Slover Ave, Fontana, CA',
    position: [34.0922, -117.435],
    accountTier: 'Key',
    receivingHours: '24/7',
    appointmentRequired: true,
    openOrders: 4,
    avgDetentionMin: 88,
  },
  {
    id: 'C-ONT',
    name: 'Ontario Consolidators',
    address: '2200 S Vineyard Ave, Ontario, CA',
    position: [34.0633, -117.6509],
    accountTier: 'Standard',
    receivingHours: '07:00 - 16:00',
    appointmentRequired: false,
    openOrders: 3,
    avgDetentionMin: 55,
  },
  {
    id: 'C-MOV',
    name: 'Moreno Valley Fulfillment',
    address: '19850 Harley Knox Blvd, Perris, CA',
    position: [33.8425, -117.2297],
    accountTier: 'Key',
    receivingHours: '05:00 - 20:00',
    appointmentRequired: true,
    openOrders: 8,
    avgDetentionMin: 34,
  },
  {
    id: 'C-COM',
    name: 'Commerce Cross-Dock',
    address: '5900 Sheila St, Commerce, CA',
    position: [33.9961, -118.1553],
    accountTier: 'Standard',
    receivingHours: '08:00 - 17:00',
    appointmentRequired: false,
    openOrders: 2,
    avgDetentionMin: 62,
  },
  {
    id: 'C-VER',
    name: 'Vernon Apparel Group',
    address: '3200 E Vernon Ave, Vernon, CA',
    position: [34.0039, -118.2301],
    accountTier: 'Standard',
    receivingHours: '07:00 - 15:30',
    appointmentRequired: true,
    openOrders: 1,
    avgDetentionMin: 73,
  },
  {
    id: 'C-SFS',
    name: 'Santa Fe Springs Logistics',
    address: '13300 Excelsior Dr, Santa Fe Springs, CA',
    position: [33.9472, -118.0853],
    accountTier: 'Key',
    receivingHours: '06:00 - 18:00',
    appointmentRequired: false,
    openOrders: 5,
    avgDetentionMin: 29,
  },
  {
    id: 'C-PER',
    name: 'Perris Valley Warehousing',
    address: '3100 Rider St, Perris, CA',
    position: [33.7825, -117.2286],
    accountTier: 'Standard',
    receivingHours: '07:00 - 16:00',
    appointmentRequired: true,
    openOrders: 2,
    avgDetentionMin: 96,
  },
]

/** Every fixed node in one lookup, keyed by id. */
export const NODES = Object.fromEntries(
  [...TERMINALS, ...YARDS, ...CLIENTS].map((n) => [n.id, n])
)
