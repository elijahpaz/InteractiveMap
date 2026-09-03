# Drayage Ops Map

An interactive dispatch map for port drayage around San Pedro Bay (Port of Los
Angeles / Port of Long Beach). One map, one canvas:

- **Fleet** — where every truck is, what it's doing, and the leg it's running
- **Terminals** — all 13 container terminals as their real footprints, shaded
  by gate congestion, with pick-up / drop-off estimates in a click
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

## The five numbers

You can't argue for a tool like this on features. The **Scorecard** panel tracks
the five measures the business case actually rests on, computed from live state
rather than stored, so there's nowhere to quietly fudge them:

| Metric | Why it's here |
| --- | --- |
| Avg turn time | Gate time across open terminals. Every minute is paid and earns nothing. |
| Driver utilisation | Share of on-duty time rolling rather than queued or held. |
| Deadhead miles | Miles with nothing on the chassis. Pure cost, no revenue. |
| Accessorials at risk | Demurrage, detention and idle equipment accruing or one day away. |
| Contribution / load | Average across loads in progress, before fixed fleet costs. |

They move together the way they should. Across one simulated day:

| Time | Turn time | Utilisation | Contribution/load |
| --- | --- | --- | --- |
| 08:42 | 106m | 89% | $336 |
| 11:30 | 95m | 60% | $332 |
| 14:17 | 104m | **67%** | **$263** |
| 17:06 | 76m | 86% | **$364** |
| 19:54 | 67m | 73% | $360 |

Congestion lengthens dwell, dwell drops utilisation, and contribution per load
falls with it — $101 of a $267 load contribution disappears into a three-hour
gate queue. That chain is the argument, and it is why gate time is weighted so
heavily in dispatch scoring.

**Every rate is a placeholder.** They're plausible for LA/Long Beach and they're
not yours — rates are negotiated per customer and lane, driver pay differs by
company vs owner-operator, accessorial schedules vary by terminal and line. They
sit in one `ASSUMPTIONS` object at the top of `lib/economics.js` for exactly that
reason. `margin` is gross contribution, not profit: tractor payments, insurance
and yard rent sit below it.

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

## Gate hours

Gate hours are a **weekly schedule**, not a string. `src/data/gateSchedules.js`
holds per-terminal windows indexed by weekday, and the structure is the part
that's real:

- several windows per day, so a midday break is expressible
- a window may run past midnight (`close > 1440`) for a night gate
- a day with no windows is closed

The hours themselves are placeholders — POLB republishes real ones continuously
at [polb.com/port-info/gate-hours/](https://polb.com/port-info/gate-hours/) — but
a real feed drops straight into this shape. What the schedule buys you:

- Terminals go **dashed and grey when the gate is shut**, with the next opening.
  At Tuesday 12:31 lunch, 10 of 13 gates close and the KPI reads 3/13 — only
  Everport (no break), APM (05:00-03:00) and LBCT (night gate) stay open.
- The estimate is **checked against the close**. If a truck leaving now can't get
  through before the gate shuts, the popup says so and names the next window —
  and it distinguishes *missing a window* from *missing the day*: Tue 08:54 at
  Pier T reopens Tue 13:00, but Fri 16:50 reopens **Mon 07:00**, skipping the
  weekend.

That check is the reason the schedule matters. "Est. pick up 3h 40m" is worthless
on its own if the gate shuts in twenty minutes, and a single `'07:00 - 17:00'`
string cannot express a lunch closure, a Saturday gate, or a night gate — so any
estimate built on one is wrong the moment a terminal does anything else.

## Gate congestion

Terminals shade green → yellow → orange → red by gate congestion, and clicking
one opens a popup with **estimated pick-up and drop-off time** and the current
queue. The same figures appear in the detail panel, and the KPI strip counts how
many gates are backed up.

**This is a model, not a live feed — and that matters.** There is no free public
API for real-time congestion at San Pedro Bay. POLB publishes gate hours "powered
by BlueCargo" and POLA runs Port Optimizer; both are commercial products behind
authentication with no open endpoint, and real turn times are surveyed by the
Harbor Trucking Association, also not public.

So `src/lib/congestion.js` models the *shape* real congestion takes — a morning
peak after the gates open, an afternoon peak before they close, a quiet night,
and a per-terminal baseline reflecting how that terminal normally performs. It's
steady and repeatable rather than random, so the map behaves the way a dispatcher
would expect. The numbers are still invented, and every surface that shows them
says so.

To make it real, replace `congestionFor` with a lookup against live data. Every
consumer reads the same object, so nothing else changes:

```js
{ index, level, queueTrucks, waitMin, turnMin, pickupMin, dropoffMin }
```

Candidate feeds: BlueCargo, Port Optimizer Control Tower, terminal appointment
systems (eModal / Voyage Control) — or your own drivers' dwell times, which you
already have.

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
    gateSchedules.js  weekly gate windows per terminal
    corridors.js   hand-traced freeway polylines through the LA basin
    fleet.js       truck roster; each unit declares its yard/terminal/client
    equipment.js   containers and chassis
  lib/
    congestion.js  the congestion model, and the seam to a real feed
    dispatch.js    scoring for what to do next, and where to send a truck instead
    economics.js   cost, revenue and the five numbers — all rates in one place
    exceptions.js  the rules that decide what's worth flagging
    gates.js       gate open/closed state, and whether a truck makes the window
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
| Gate congestion | `lib/congestion.js` → `congestionFor` | Return live figures in the same shape |
| Gate hours | `data/gateSchedules.js` | Replace the windows; the structure already fits |
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
| | Gate hours, turn times, appointment flags |
| | **All congestion figures and time estimates** |
| | **All gate hours** (the schedule *structure* is real) |
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
