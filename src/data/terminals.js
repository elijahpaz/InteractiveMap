/**
 * The 13 container terminals of San Pedro Bay — 7 at the Port of Los Angeles,
 * 6 at the Port of Long Beach. Container terminals only; the dry bulk, liquid
 * bulk, break-bulk and RoRo tenants at both ports are deliberately excluded.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PROVENANCE — every field is one of three kinds. Check before trusting one.
 *
 *   SOURCED  `name`, `operator`, `port`, `pier`, `berths`
 *       From the port authorities themselves:
 *       POLA  portoflosangeles.org/business/terminals/container
 *       POLB  polb.com/cargo-nav/port-facilities  (Containerized Tenants)
 *
 *   SOURCED  `boundary` for the 7 POLA terminals
 *       Real polygons from OpenStreetMap (© OpenStreetMap contributors, ODbL),
 *       simplified with Douglas-Peucker to ~12-19 points each. OSM still files
 *       three of them under legacy tenant names — China Shipping and Yang Ming
 *       for the two WBCT terminals, Evergreen for Everport.
 *
 *   DERIVED  `boundary` for the 6 POLB terminals
 *       Not polygonised in OSM. Each is a rectangle anchored on the measured
 *       extent of that pier's own named streets and rail leads (Pier G Avenue,
 *       Pier J Avenue, Pier T Avenue, and so on). Right position and rough
 *       size; NOT a survey boundary, lease line, or legal parcel.
 *
 *   SIMULATED  everything under `demo`
 *       Invented placeholders so the ops views have something to render. Real
 *       gate hours are published per terminal and change constantly; real turn
 *       times come from a feed such as the Harbor Trucking Association survey
 *       or BlueCargo. Never quote anything under `demo` as fact.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const PORTS = {
  POLA: { id: 'POLA', name: 'Port of Los Angeles', short: 'LA', color: '#4f8fd6' },
  POLB: { id: 'POLB', name: 'Port of Long Beach', short: 'LB', color: '#3fa89a' },
}

export const CONTAINER_TERMINALS = [
  {
    id: 'T-WBCT-CS',
    name: 'WBCT — China Shipping',
    operator: 'West Basin Container Terminal',
    port: 'POLA',
    pier: 'West Basin',
    berths: '100-103',
    label: '100',
    boundarySource: 'osm',
    position: [33.75293, -118.28226],
    boundary: [
      [33.75462, -118.28904], [33.75424, -118.28812], [33.75538, -118.28361],
      [33.75421, -118.28148], [33.75469, -118.27892], [33.75639, -118.27726],
      [33.75044, -118.27319], [33.74995, -118.27391], [33.75043, -118.27721],
      [33.74984, -118.28036], [33.75049, -118.28039], [33.75259, -118.28238],
      [33.75291, -118.28387], [33.75216, -118.28732], [33.75362, -118.28933],
      [33.75489, -118.28984], [33.75462, -118.28904],
    ],
    demo: { turnTimeMin: 62, gateHours: '08:00 - 17:00', appointmentRequired: true, dualTransaction: false },
  },
  {
    id: 'T-WBCT-TIL',
    name: 'WBCT — LA TiL Terminal',
    operator: 'West Basin Container Terminal',
    port: 'POLA',
    pier: 'West Basin',
    berths: '121-127',
    label: '121',
    boundarySource: 'osm',
    position: [33.76026, -118.282],
    boundary: [
      [33.76921, -118.28003], [33.7608, -118.27559], [33.7587, -118.27749],
      [33.75837, -118.27895], [33.7592, -118.27985], [33.75889, -118.28064],
      [33.75809, -118.28102], [33.75615, -118.2838], [33.75514, -118.28801],
      [33.75556, -118.28953], [33.75835, -118.28753], [33.7596, -118.28464],
      [33.76219, -118.282], [33.76565, -118.28041], [33.76798, -118.28056],
      [33.76921, -118.28003],
    ],
    demo: { turnTimeMin: 71, gateHours: '08:00 - 17:00', appointmentRequired: true, dualTransaction: true },
  },
  {
    id: 'T-TRP',
    name: 'TraPac',
    operator: 'TraPac LLC',
    port: 'POLA',
    pier: 'Terminal Island',
    berths: '136-147',
    label: '136',
    boundarySource: 'osm',
    position: [33.76557, -118.27373],
    boundary: [
      [33.76921, -118.28003], [33.76832, -118.27993], [33.76906, -118.27861],
      [33.76624, -118.27734], [33.76704, -118.27065], [33.75823, -118.27403],
      [33.75743, -118.27401], [33.757, -118.27215], [33.76585, -118.26428],
      [33.76787, -118.26532], [33.77049, -118.26986], [33.77012, -118.27852],
      [33.76921, -118.28003],
    ],
    demo: { turnTimeMin: 92, gateHours: '08:00 - 17:00', appointmentRequired: true, dualTransaction: false },
  },
  {
    id: 'T-YTI',
    name: 'Yusen Terminals',
    operator: 'Yusen Terminals LLC',
    port: 'POLA',
    pier: 'Terminal Island',
    berths: '212-225',
    label: '212',
    boundarySource: 'osm',
    position: [33.75288, -118.26236],
    boundary: [
      [33.76045, -118.25438], [33.75954, -118.2578], [33.75569, -118.2614],
      [33.74964, -118.26859], [33.74892, -118.26782], [33.74978, -118.26644],
      [33.74897, -118.2653], [33.74932, -118.26555], [33.75063, -118.26433],
      [33.7559, -118.25197], [33.76045, -118.25438],
    ],
    demo: { turnTimeMin: 71, gateHours: '08:00 - 17:00', appointmentRequired: true, dualTransaction: true },
  },
  {
    id: 'T-EVP',
    name: 'Everport Terminal Services',
    operator: 'Everport Terminal Services Inc.',
    port: 'POLA',
    pier: 'Terminal Island',
    berths: '226-236',
    label: '226',
    boundarySource: 'osm',
    position: [33.7427, -118.27027],
    boundary: [
      [33.74964, -118.26859], [33.7486, -118.26999], [33.74068, -118.27475],
      [33.73596, -118.27447], [33.73598, -118.27369], [33.73711, -118.27373],
      [33.73711, -118.27179], [33.7384, -118.27223], [33.73935, -118.27167],
      [33.74183, -118.26585], [33.74539, -118.26711], [33.74906, -118.26568],
      [33.74978, -118.26644], [33.74892, -118.26782], [33.74964, -118.26859],
    ],
    demo: { turnTimeMin: 58, gateHours: '08:00 - 17:00', appointmentRequired: false, dualTransaction: false },
  },
  {
    id: 'T-FMS',
    name: 'Fenix Marine Services',
    operator: 'Fenix Marine Services',
    port: 'POLA',
    pier: 'Pier 300',
    berths: '302-305',
    label: '300',
    boundarySource: 'osm',
    position: [33.73832, -118.25657],
    boundary: [
      [33.73121, -118.26044], [33.73484, -118.24795], [33.73643, -118.24412],
      [33.73884, -118.2452], [33.73738, -118.25096], [33.74214, -118.25313],
      [33.74179, -118.25418], [33.74307, -118.25562], [33.74268, -118.25595],
      [33.74304, -118.25695], [33.74268, -118.2588], [33.7435, -118.26017],
      [33.74205, -118.2639], [33.73786, -118.26147], [33.73421, -118.26147],
      [33.73425, -118.26305], [33.73155, -118.26354], [33.73215, -118.26131],
      [33.73121, -118.26044],
    ],
    demo: { turnTimeMin: 64, gateHours: '07:00 - 17:00', appointmentRequired: true, dualTransaction: true },
  },
  {
    id: 'T-APM',
    name: 'APM Terminals Pacific',
    operator: 'APM Terminals',
    port: 'POLA',
    pier: 'Pier 400',
    berths: '401-406',
    label: '400',
    boundarySource: 'osm',
    position: [33.72572, -118.24774],
    boundary: [
      [33.71661, -118.2539], [33.71842, -118.24751], [33.72361, -118.25111],
      [33.72776, -118.23724], [33.7299, -118.23818], [33.72968, -118.23877],
      [33.73324, -118.24027], [33.73372, -118.24173], [33.72892, -118.25822],
      [33.7241, -118.26046], [33.71691, -118.25773], [33.71661, -118.2539],
    ],
    demo: { turnTimeMin: 78, gateHours: '05:00 - 03:00', appointmentRequired: true, dualTransaction: true },
  },
  {
    id: 'T-SSA-A',
    name: 'SSA Terminals — Pier A',
    operator: 'SSA Terminals LLC',
    port: 'POLB',
    pier: 'Pier A',
    berths: 'A88-A96',
    label: 'A',
    boundarySource: 'derived',
    position: [33.7726, -118.2335],
    boundary: [
      [33.769, -118.2402], [33.7762, -118.2402], [33.7762, -118.2268],
      [33.769, -118.2268], [33.769, -118.2402],
    ],
    demo: { turnTimeMin: 69, gateHours: '08:00 - 17:00', appointmentRequired: true, dualTransaction: true },
  },
  {
    id: 'T-SSA-C',
    name: 'SSA Terminals — Pier C',
    operator: 'SSA Terminals LLC',
    port: 'POLB',
    pier: 'Pier C',
    berths: 'C60-C62',
    label: 'C',
    boundarySource: 'derived',
    position: [33.7728, -118.211],
    boundary: [
      [33.77, -118.2152], [33.7756, -118.2152], [33.7756, -118.2068],
      [33.77, -118.2068], [33.77, -118.2152],
    ],
    demo: { turnTimeMin: 54, gateHours: '07:00 - 16:30', appointmentRequired: false, dualTransaction: false },
  },
  {
    id: 'T-LBCT',
    name: 'Long Beach Container Terminal',
    operator: 'LBCT LLC',
    port: 'POLB',
    pier: 'Pier E (Middle Harbor)',
    berths: 'E24-E26',
    label: 'E',
    boundarySource: 'derived',
    position: [33.759, -118.211],
    boundary: [
      [33.7528, -118.2172], [33.7652, -118.2172], [33.7652, -118.2048],
      [33.7528, -118.2048], [33.7528, -118.2172],
    ],
    demo: { turnTimeMin: 44, gateHours: '06:00 - 02:00', appointmentRequired: true, dualTransaction: true },
  },
  {
    id: 'T-ITS',
    name: 'International Transportation Service',
    operator: 'ITS',
    port: 'POLB',
    pier: 'Pier G',
    berths: 'G226-G236',
    label: 'G',
    boundarySource: 'derived',
    position: [33.7505, -118.205],
    boundary: [
      [33.7448, -118.2112], [33.7562, -118.2112], [33.7562, -118.1988],
      [33.7448, -118.1988], [33.7448, -118.2112],
    ],
    demo: { turnTimeMin: 75, gateHours: '08:00 - 17:00', appointmentRequired: true, dualTransaction: true },
  },
  {
    id: 'T-TTI',
    name: 'Total Terminals International',
    operator: 'TTI',
    port: 'POLB',
    pier: 'Pier T',
    berths: 'T132-T140',
    label: 'T',
    boundarySource: 'derived',
    position: [33.7553, -118.226],
    boundary: [
      [33.7478, -118.2332], [33.7628, -118.2332], [33.7628, -118.2188],
      [33.7478, -118.2188], [33.7478, -118.2332],
    ],
    demo: { turnTimeMin: 83, gateHours: '07:00 - 17:00', appointmentRequired: true, dualTransaction: true },
  },
  {
    id: 'T-PCT',
    name: 'Pacific Container Terminal',
    operator: 'SSA Terminals',
    port: 'POLB',
    pier: 'Pier J',
    berths: 'J245-J270',
    label: 'J',
    boundarySource: 'derived',
    position: [33.7425, -118.189],
    boundary: [
      [33.7352, -118.1958], [33.7498, -118.1958], [33.7498, -118.1822],
      [33.7352, -118.1822], [33.7352, -118.1958],
    ],
    demo: { turnTimeMin: 67, gateHours: '07:00 - 17:00', appointmentRequired: false, dualTransaction: false },
  },]

/** Terminals grouped by port, for the two-section panel list. */
export const TERMINALS_BY_PORT = {
  POLA: CONTAINER_TERMINALS.filter((t) => t.port === 'POLA'),
  POLB: CONTAINER_TERMINALS.filter((t) => t.port === 'POLB'),
}

export const TERMINAL_BY_ID = Object.fromEntries(
  CONTAINER_TERMINALS.map((t) => [t.id, t])
)

/** Centre of the San Pedro Bay complex, and the bounds that frame both ports. */
export const HARBOR_CENTER = [33.7480, -118.2260]
export const HARBOR_BOUNDS = [
  [33.7180, -118.2900],
  [33.7800, -118.1750],
]
