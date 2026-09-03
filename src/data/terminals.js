/**
 * The 13 container terminals of San Pedro Bay — 7 at the Port of Los Angeles,
 * 6 at the Port of Long Beach. Container terminals only; the dry bulk, liquid
 * bulk, break-bulk and RoRo tenants at both ports are deliberately excluded.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PROVENANCE — check before trusting a field.
 *
 *   SOURCED  `name`, `operator`, `port`, `pier`, `berths`
 *       From the port authorities:
 *       POLA  portoflosangeles.org/business/terminals/container
 *       POLB  polb.com/cargo-nav/port-facilities  (Containerized Tenants)
 *
 *   SOURCED  `boundary` — every terminal, real geometry, no approximations
 *       boundarySource 'polb-gis' (6)  Official Port of Long Beach pier
 *           boundaries, ArcGIS FeatureServer "Piers" published by POLB.
 *       boundarySource 'osm' (7)  OpenStreetMap polygons (© OpenStreetMap
 *           contributors, ODbL). OSM still files three under legacy tenant
 *           names — China Shipping and Yang Ming for the two WBCT terminals,
 *           Evergreen for Everport.
 *       Both sets are simplified with Douglas-Peucker for payload size; the
 *       shapes are the real footprints, not boxes drawn around a point.
 *
 *   SIMULATED  everything under `demo`
 *       Invented placeholders. Real gate hours are published per terminal and
 *       change constantly (polb.com/port-info/gate-hours/, data powered by
 *       BlueCargo — a commercial feed with no public API). Real turn times come
 *       from a feed such as the Harbor Trucking Association survey. Never quote
 *       anything under `demo` as fact.
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
    boundarySource: 'polb-gis',
    position: [33.76992, -118.23632],
    boundary: [
      [33.77007, -118.22691], [33.76745, -118.23819], [33.76771, -118.23828],
      [33.76702, -118.23969], [33.76709, -118.24022], [33.76685, -118.24019],
      [33.76708, -118.24031], [33.76681, -118.24112], [33.76701, -118.24132],
      [33.76779, -118.24029], [33.78106, -118.24163], [33.78206, -118.22727],
      [33.77056, -118.2261], [33.77028, -118.22698], [33.77007, -118.22691],
    ],
    demo: { turnTimeMin: 69, gateHours: '08:00 - 17:00', appointmentRequired: true, dualTransaction: true },
  },
  {
    id: 'T-SSA-C',
    name: 'SSA Terminals — Pier C',
    operator: 'SSA Terminals LLC (Matson)',
    port: 'POLB',
    pier: 'Pier C',
    berths: 'C60-C62',
    label: 'C',
    boundarySource: 'polb-gis',
    position: [33.77231, -118.21311],
    boundary: [
      [33.7773, -118.2067], [33.77278, -118.20672], [33.77225, -118.20805],
      [33.77313, -118.20853], [33.77312, -118.20931], [33.77189, -118.21242],
      [33.77158, -118.21243], [33.7719, -118.21156], [33.77102, -118.21372],
      [33.77144, -118.21355], [33.77113, -118.21386], [33.77128, -118.21444],
      [33.77103, -118.21431], [33.76891, -118.21967], [33.76933, -118.22065],
      [33.77094, -118.22067], [33.77261, -118.21796], [33.77279, -118.21806],
      [33.77566, -118.21003], [33.7762, -118.2096], [33.7773, -118.2067],
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
    boundarySource: 'polb-gis',
    position: [33.75582, -118.21155],
    boundary: [
      [33.76068, -118.20648], [33.75422, -118.20648], [33.75347, -118.20674],
      [33.75199, -118.20867], [33.74926, -118.21384], [33.74771, -118.21442],
      [33.74785, -118.2152], [33.74886, -118.21492], [33.74909, -118.21546],
      [33.74918, -118.21525], [33.75096, -118.21525], [33.75095, -118.21387],
      [33.7628, -118.21385], [33.76281, -118.21508], [33.7664, -118.21509],
      [33.76712, -118.20781], [33.76301, -118.20713], [33.76258, -118.20726],
      [33.76173, -118.20667], [33.76068, -118.20648],
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
    boundarySource: 'polb-gis',
    position: [33.74879, -118.19869],
    boundary: [
      [33.74832, -118.19873], [33.74815, -118.19894], [33.7438, -118.19894],
      [33.7438, -118.20368], [33.74459, -118.20375], [33.74463, -118.20624],
      [33.74503, -118.20649], [33.75027, -118.20648], [33.75101, -118.20708],
      [33.75163, -118.20609], [33.75599, -118.20613], [33.75599, -118.20538],
      [33.76003, -118.20539], [33.76149, -118.20598], [33.76301, -118.20708],
      [33.76301, -118.20624], [33.75964, -118.20413], [33.75734, -118.20139],
      [33.75574, -118.20015], [33.75313, -118.1953], [33.74837, -118.18971],
      [33.74221, -118.18748], [33.74209, -118.18797], [33.74248, -118.18855],
      [33.74237, -118.19018], [33.74197, -118.1899], [33.74159, -118.19114],
      [33.74199, -118.19175], [33.74313, -118.1919], [33.74313, -118.19239],
      [33.7438, -118.19238], [33.7438, -118.19745], [33.74477, -118.19699],
      [33.74503, -118.19699], [33.74503, -118.19729], [33.74815, -118.19728],
      [33.74832, -118.19873],
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
    boundarySource: 'polb-gis',
    position: [33.75113, -118.22999],
    boundary: [
      [33.75526, -118.24871], [33.75731, -118.24287], [33.76133, -118.22916],
      [33.76422, -118.22181], [33.75932, -118.21947], [33.75835, -118.22016],
      [33.75542, -118.21889], [33.75536, -118.21858], [33.75371, -118.21857],
      [33.75242, -118.22298], [33.75687, -118.22484], [33.75592, -118.22895],
      [33.75557, -118.22881], [33.75087, -118.24477], [33.74359, -118.24172],
      [33.74196, -118.23139], [33.74534, -118.21969], [33.74445, -118.2175],
      [33.74045, -118.2312], [33.74037, -118.23201], [33.74197, -118.24125],
      [33.743, -118.24296], [33.74286, -118.24351], [33.75526, -118.24871],
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
    boundarySource: 'polb-gis',
    position: [33.73882, -118.1947],
    boundary: [
      [33.73298, -118.1877], [33.73297, -118.19575], [33.73348, -118.19632],
      [33.73569, -118.19635], [33.73627, -118.19697], [33.7364, -118.20239],
      [33.73854, -118.20411], [33.73882, -118.20452], [33.73858, -118.20495],
      [33.73926, -118.20415], [33.73995, -118.2025], [33.74043, -118.2024],
      [33.74046, -118.2027], [33.74062, -118.2024], [33.74067, -118.19538],
      [33.74313, -118.19239], [33.74313, -118.1919], [33.74199, -118.19175],
      [33.7416, -118.19121], [33.74197, -118.1899], [33.74237, -118.19018],
      [33.74248, -118.18855], [33.74209, -118.18797], [33.74221, -118.18748],
      [33.73858, -118.1862], [33.73859, -118.19389], [33.73789, -118.1946],
      [33.73658, -118.19458], [33.73657, -118.18567], [33.73604, -118.18536],
      [33.73301, -118.18539], [33.73298, -118.1877],
    ],
    demo: { turnTimeMin: 67, gateHours: '07:00 - 17:00', appointmentRequired: false, dualTransaction: false },
  },]

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
  [33.7830, -118.1800],
]
