# Drayage Ops Map

An interactive dispatch map for port drayage around San Pedro Bay (Port of Los
Angeles / Port of Long Beach). It shows, on one canvas:

- **Fleet** — where every truck is, what it's doing, and the leg it's running
- **Terminals** — the nine container terminals, with gate hours and turn times
- **Clients** — delivery locations, receiving hours and detention history
- **Yards** — the home yard and overflow depot, with slot utilisation
- **Containers** — every box that isn't completed, coloured by demurrage risk
- **Chassis** — pool equipment, including units flagged out of service

Trucks run a repeating three-leg tour (yard → terminal → client → yard) on a
simulated clock, so the map behaves like a live board rather than a snapshot.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

```bash
npm run build    # production bundle into dist/
npm run preview  # serve that bundle locally
```

## How it's put together

```
src/
  data/
    network.js     terminals, yards, clients — the fixed nodes
    corridors.js   hand-traced freeway polylines through the LA basin
    fleet.js       truck roster; each unit declares its yard/terminal/client
    equipment.js   containers and chassis
  lib/
    routing.js     composes corridors into legs and three-leg tours
    geo.js         distance, interpolation along a route, marker fan-out
    status.js      every status label and colour, in one place
    icons.js       Leaflet divIcons built from status
  hooks/
    useSimulation.js  the clock: advances trucks, dwells at stops, redispatches
  components/
    MapView.jsx    the Leaflet map and all its layers
    Sidebar.jsx    searchable fleet / boxes / chassis / network lists
    DetailPanel.jsx per-entity detail, with links between related records
    LayerControl.jsx layer toggles, theme switch and legend
    KpiBar.jsx     the operational counters across the top
```

Two rules keep it coherent as it grows:

1. **`lib/status.js` owns every status colour and label.** The map, the sidebar,
   the legend and the KPI strip all read from it, so a colour can never mean two
   different things in two different places.
2. **Nothing below `hooks/` knows the data is simulated.** `useSimulation`
   emits `{id, position, heading, progress, status}` per truck; swapping it for
   a real telematics subscription touches that one file.

## Wiring it to real data

The seams are deliberate:

| Concern | Where | What to replace |
| --- | --- | --- |
| Truck positions | `hooks/useSimulation.js` | Emit the same per-truck shape from your ELD/GPS feed |
| Route geometry | `lib/routing.js` → `buildRoute` | Return provider geometry instead of composed corridors |
| Nodes and roster | `src/data/*.js` | Fetch from the TMS rather than importing constants |
| Demurrage clocks | `lib/status.js` → `demurrageRisk` | Feed real last-free-day dates in place of `lfdOffsetDays` |

Demo data uses `lfdOffsetDays` (days relative to today) rather than fixed dates
so the risk colours stay meaningful whenever you open it.

### Known gaps in the mock data

These are data-model simplifications, not bugs in the app — worth closing when
real data lands:

- A truck keeps the same container and chassis across its whole tour; there's no
  mount/dismount lifecycle, so a container's `locationId` goes stale once it's
  riding a truck.
- Containers don't change status as their truck completes legs.
- Routes are traced freeway polylines, not routed geometry — no traffic, no turn
  restrictions, and ETAs come from a flat 38 mph average.

## Basemap

Tiles come from Esri's key-free Canvas basemaps (dark and light), chosen because
they're deliberately desaturated — the roads recede so status colour carries the
meaning. No API key or account is needed.
