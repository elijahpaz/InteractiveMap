# Drayage Ops Map

An interactive dispatch map for port drayage around San Pedro Bay (Port of Los
Angeles / Port of Long Beach). One map, one canvas:

- **Fleet** — where every truck is, what it's doing, and the leg it's running
- **Terminals** — all 13 container terminals as their real footprints, with
  published Long Beach gate status per shift, and an explicit unknown for LA
- **Clients** — delivery locations, receiving hours and detention history
- **Yards** — the home yard and overflow depot, with slot utilisation
- **Containers** — every box that isn't completed, coloured by demurrage risk
- **Chassis** — pool equipment, including units flagged out of service

Trucks run a repeating three-leg tour (yard → terminal → client → yard) on a
simulated clock, so the map behaves like a live board rather than a snapshot.
Hit **Harbor** in the top bar to frame both ports.

## Terminals

The 13 container terminals of San Pedro Bay — 7 at POLA, 6 at POLB. Container
terminals only; the dry bulk, liquid bulk, break-bulk and RoRo tenants are
excluded.

Below zoom 12 each terminal is a marker; above it, the real polygon with its
pier code. **Every footprint is real geometry**, from two sources:

| Terminals | Source |
| --- | --- |
| 6 POLB | Official Port of Long Beach pier boundaries, ArcGIS `Piers` FeatureServer |
| 7 POLA | OpenStreetMap polygons (© OpenStreetMap contributors, ODbL) |

Both are simplified with Douglas-Peucker for payload size. OSM still files three
POLA terminals under legacy tenant names — *China Shipping* and *Yang Ming* for
the two WBCT terminals, *Evergreen* for Everport.

## What this app knows, and what it refuses to say

The hard rule: **published data, your own data, or an explicit unknown. Never a
plausible-looking number.**

An earlier version of this project violated that. It carried a congestion model
that produced things like *"Severe · 51 trucks queued · pick up 3h 40m"* for a
real, named terminal. Every one of those figures came out of a sine wave and a
hash of the terminal's own ID string. It was labelled as simulated, but it
rendered in exactly the same type as the sourced fields beside it, and it drove
routing recommendations. That code is deleted, not relabelled.

### Real, and sourced

| Data | Source |
| --- | --- |
| 13 container terminals — names, operators, piers, berths | POLA and POLB |
| All 13 terminal boundaries | POLB `Piers` ArcGIS FeatureServer; OpenStreetMap (ODbL) |
| Long Beach gate status — 6 terminals × 14 days × 3 shifts | [POLB gate hours](https://polb.com/port-info/gate-hours/) |

Gate status is captured verbatim: `Open`, `Closed`, or `TBD`. **`TBD` is a real
published state** — the terminal hasn't committed to that shift yet — and is shown
as "not posted", never folded into open or closed. The capture is a snapshot with
a date on it, and the app refuses to answer for dates outside the window it holds
rather than extrapolating.

### Explicitly unknown

- **The seven Port of LA terminals have no gate status.** POLA publishes nothing
  this project can read. They say "Gate status unknown" and are never filled in
  by analogy with Long Beach.
- **Gate congestion, queue lengths, wait and turn times do not appear anywhere.**
  There is no free public measurement for San Pedro Bay. The Scorecard shows an
  em dash for turn time rather than a figure.
- **Clock times.** POLB publishes shift-level open/closed, not hours. So the app
  cannot say "the gate shuts in 20 minutes", and every feature that depended on
  that — arrival-versus-close countdowns, queue-aware routing — was removed
  rather than rebuilt on guesses.

### Simulated, and labelled

The fleet, drivers, containers, chassis, clients and yards are placeholders for
records **you** own and would replace from your TMS. That is a different thing
from inventing facts about the outside world: a placeholder for your data is
honest scaffolding; a fabricated queue length at a real terminal is a false
claim someone could act on.

### How to measure what's missing

For turn time and congestion, the best sensor a drayage company has is its own
trucks. Geofence each terminal, measure gate-in to gate-out from your ELD, and
you get ground truth for exactly the terminals you use — better than any
purchased feed and already yours.

## Recommendations

Diagnosing isn't enough — the app now says what to do instead.

**Per truck.** Select a unit and the detail panel ranks its next pulls, with the
reasoning shown rather than a bare score:

```
FCIU8830022    226 · 6.1 mi
[1d into demurrage] [Moderate gate, 114m to clear]
```

Ranked by free time remaining, then gate time, then deadhead. Those weights
encode a claim worth arguing with once real numbers exist: demurrage dominates
(a day of it outweighs the fuel on any deadhead in this basin), queue time is
the scarce resource (a driver stuck three hours isn't doing a second turn), and
distance matters least of the three — it's the cost dispatchers over-weight by
eye, because it's the one they can see.

Infeasible moves are **kept and marked**, not hidden. A recommendation that
silently drops the option you were about to take is worse than one that explains
why it's a bad idea.

**Per exception.** Findings that have a fix carry it:

> **Driving to a shut gate** — Unit 160
> L. Ibrahim is 11.6 mi out from Everport Terminal Services, ETA 18m. Gate shuts in 9m.
> → *Try Long Beach Container Terminal instead — 4.2 mi direct, moderate gate,
> about 1h 1m to drive and clear against 9h 9m of gate left.*

The bar for an alternative is that the truck can **arrive and get through**,
not merely arrive. A gate closing in nine minutes is no use to a driver nine
minutes away — they'd burn the trip twice. When nothing qualifies, the honest
answer is to hold the driver, and it says that.

## Exceptions

The **Alerts** tab is the point of the whole thing. Rather than showing
conditions and leaving you to spot the conflict, `src/lib/exceptions.js` scans
the current state and says what is about to cost money — each one clickable
straight to its subject on the map.

Rules, ordered by what they cost if missed:

| Rule | Fires when |
| --- | --- |
| Demurrage accruing | Box past its last free day, still in the stack |
| Last free day unreachable | LFD is today and the gate won't clear it — closed, or the estimate exceeds the time left |
| Free time expires on a closed day | LFD falls on a weekday that terminal has no gate at all |
| Driving to a shut gate | Truck's ETA lands after the gate closes |
| Empty return closed | Empty due back at a terminal whose gate is shut; per diem keeps running |
| Driver hours short | Remaining HOS won't cover this leg plus its stop |
| Detention accruing | On site past that client's own norm |
| Out-of-service chassis in use | A repair-flagged chassis is under a truck |
| Chassis shortfall | More boxes waiting on a chassis than bare chassis available |

The rules that pay for themselves are the ones combining two things the app
already knew separately. Free time is in the container; gate windows are in the
schedule; neither is interesting alone:

> **Free time expires on a closed day** — TRHU3320447
> Last free day is **Sun**, when Fenix Marine Services has no gate — next gate
> **Mon**. Pull it before then or the charge is automatic.

> **Driving to a shut gate** — Unit 127
> S. Nguyen is 3.0 mi out from Total Terminals International, ETA 27m. Gate
> shuts in 20m. Reroute or the trip is wasted.

Every rule reads state the app already holds — no rule needs data we don't have.

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
    terminals.js   the 13 container terminals — real geometry, provenance noted
    network.js     re-exports terminals; adds yards and clients (invented)
    polbGateCalendar.js  captured POLB gate calendar, verbatim
    corridors.js   hand-traced freeway polylines through the LA basin
    fleet.js       truck roster; each unit declares its yard/terminal/client
    equipment.js   containers and chassis
  lib/
    congestion.js  the congestion model, and the seam to a real feed
    dispatch.js    scoring for what to do next, and where to send a truck instead
    economics.js   cost, revenue and the five numbers — all rates in one place
    exceptions.js  the rules that decide what's worth flagging
    gates.js       published gate status, and an honest unknown where there is none
    routing.js     composes corridors into legs and three-leg tours
    geo.js         distance, interpolation along a route, marker fan-out
    status.js      every status label and colour, in one place
    icons.js       Leaflet divIcons built from status
  hooks/
    useSimulation.js  the clock: advances trucks, dwells at stops, redispatches
  components/
    MapView.jsx    the map — fleet, terminals, congestion, equipment, routes
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
| Dispatch weights | `lib/dispatch.js` → `WEIGHT` | Retune against your real cost per hour and per mile |
| Rates and costs | `lib/economics.js` → `ASSUMPTIONS` | Drop in your rate sheet; everything downstream follows |

Demo data uses `lfdOffsetDays` (days relative to today) rather than fixed dates
so the risk colours stay meaningful whenever you open it.

### What is real and what is not

This matters more than usual here, because plausible-looking operational data is
worse than obviously fake data — which is why the app carries a dismissible
**Demo data** notice at the top rather than burying the caveat here. The split:

| Real | Invented |
| --- | --- |
| All 13 terminal names, operators, piers, berths | Every truck, driver, plate |
| All 13 terminal footprints (POLB GIS + OSM) | Every container number, BOL, weight |
| Freeway corridors and warehouse cities | Every chassis ID and inspection date |
| Drayage terminology and mechanics | All 8 client companies and both yards |
| | |
| | **All rates, costs and dollar figures** |

Anything under a `demo` key, and everything in `YARDS` / `CLIENTS`, is a
placeholder. The client companies are invented names on real street names — they
are not businesses. Gate hours and turn times are invented numbers attached to
real terminal names; do not quote them.

Sources for the real parts:
[POLA container terminals](https://portoflosangeles.org/business/terminals/container),
[POLB containerized tenants](https://polb.com/cargo-nav/port-facilities),
[POLB gate hours](https://polb.com/port-info/gate-hours/),
POLB pier boundaries (ArcGIS `Piers` FeatureServer),
POLA outlines © OpenStreetMap contributors (ODbL).

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
