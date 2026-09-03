import { useCallback, useMemo, useState } from 'react'
import DetailPanel from './components/DetailPanel.jsx'
import KpiBar from './components/KpiBar.jsx'
import LayerControl from './components/LayerControl.jsx'
import MapView from './components/MapView.jsx'
import Scorecard from './components/Scorecard.jsx'
import Sidebar from './components/Sidebar.jsx'
import { CHASSIS, CONTAINERS } from './data/equipment.js'
import { NODES } from './data/network.js'
import { useSimulation } from './hooks/useSimulation.js'
import { isLiveContainer } from './lib/status.js'
import { exceptionCounts, findExceptions } from './lib/exceptions.js'
import { CONTAINER_TERMINALS } from './data/terminals.js'
import {
  COVERAGE_END,
  COVERAGE_START,
  GATE_CAPTURED_AT,
  POLA_SUCCESS_DATE,
} from './lib/gates.js'

const DEFAULT_LAYERS = {
  fleet: true,
  routes: true,
  terminals: true,
  clients: true,
  yards: true,
  containers: true,
  chassis: false,
}

const SPEEDS = [1, 4, 12]

function formatClock(totalMinutes) {
  const h = Math.floor(totalMinutes / 60) % 24
  const m = Math.floor(totalMinutes % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export default function App() {
  const { trucks, playing, setPlaying, speed, setSpeed, clockMin, reset } = useSimulation()

  const [harborFocusKey, setHarborFocusKey] = useState(0)
  const [focusKey, setFocusKey] = useState(0)
  // The port data is real and the fleet is scaffolding, so the app opens on the
  // real thing and everything simulated sits behind one switch.
  const [showFleet, setShowFleet] = useState(false)
  const [demoNoticeOpen, setDemoNoticeOpen] = useState(true)
  const [scorecardOpen, setScorecardOpen] = useState(false)
  const [layers, setLayers] = useState(DEFAULT_LAYERS)
  const [theme, setTheme] = useState('dark')
  const [showCompleted, setShowCompleted] = useState(false)
  const [selected, setSelected] = useState(null)

  // "Not completed" is the default view — a finished move is no longer the
  // dispatcher's problem and just adds noise to the map.
  const containers = useMemo(
    () => (showCompleted ? CONTAINERS : CONTAINERS.filter(isLiveContainer)),
    [showCompleted]
  )

  // The published gate calendar is dated, so the app works in real dates. It
  // starts at the first date the capture covers rather than "today", so the
  // gate data on screen is always data we actually hold.
  const dateISO = useMemo(() => COVERAGE_START, [])

  const exceptions = useMemo(
    () => findExceptions({ trucks, containers, dateISO }),
    [trucks, containers, dateISO]
  )
  const alertCounts = useMemo(() => exceptionCounts(exceptions), [exceptions])

  // With the demo off, only the terminal layer is live. MapView reads clients
  // and yards from the network module directly, so hiding them means clearing
  // the flags rather than emptying a prop.
  const effectiveLayers = useMemo(
    () => (showFleet ? layers : { terminals: layers.terminals }),
    [showFleet, layers]
  )

  const toggleLayer = useCallback(
    (id) => setLayers((l) => ({ ...l, [id]: !l[id] })),
    []
  )

  /**
   * `focus` is what separates "I clicked a row in the list, take me there" from
   * "I clicked the thing on the map" — the second must not move the map, or
   * every click on the canvas makes it lurch under the cursor.
   */
  const select = useCallback((next, { focus = false } = {}) => {
    setSelected((current) => {
      const same = current && current.type === next.type && current.id === next.id
      return same ? null : next
    })
    if (focus) setFocusKey((k) => k + 1)
  }, [])

  /** Selecting from the map itself: change the selection, leave the view alone. */
  const selectOnMap = useCallback((next) => select(next, { focus: false }), [select])
  /** Selecting from a list: fly to it, because it may be off screen. */
  const selectFromList = useCallback((next) => select(next, { focus: true }), [select])

  // Where the map should fly when the selection changes.
  const focusTarget = useMemo(() => {
    if (!selected) return null
    const { type, id } = selected

    if (type === 'truck') return trucks.find((t) => t.id === id)?.position ?? null

    if (type === 'container' || type === 'chassis') {
      const source = type === 'container' ? containers : CHASSIS
      const item = source.find((x) => x.id === id)
      if (!item) return null
      if (item.truckId) return trucks.find((t) => t.id === item.truckId)?.position ?? null
      return NODES[item.locationId]?.position ?? null
    }

    return NODES[id]?.position ?? null
    // Recentring on every simulation tick would fight the user's panning, so
    // this deliberately keys off the selection only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, containers])

  return (
    <div className={`app app--${theme} ${demoNoticeOpen ? 'app--notice' : ''}`}>
      <header className="topbar">
        <div className="topbar__brand">
          <span className="topbar__mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path
                d="M3 7h11v6h3l4 4v3h-2a2.5 2.5 0 0 1-5 0H10a2.5 2.5 0 0 1-5 0H3Z"
                fill="currentColor"
              />
            </svg>
          </span>
          <div>
            <h1>Drayage Ops</h1>
            <p>San Pedro Bay · live port conditions</p>
          </div>
        </div>

        <div className="topbar__clock">
          <span className="topbar__day">{dateISO}</span>
          {showFleet && <span className="topbar__time">{formatClock(clockMin)}</span>}
          {showFleet && <span className="topbar__tz">PT</span>}
        </div>

        <div className="topbar__controls">
          <button
            type="button"
            className="ctrl"
            onClick={() => setHarborFocusKey((k) => k + 1)}
          >
            Harbor
          </button>

          {/* Everything simulated sits behind one switch, so the default view is
              only what the ports actually publish. */}
          <button
            type="button"
            className={`ctrl ${showFleet ? 'is-on' : ''}`}
            onClick={() => setShowFleet((v) => !v)}
          >
            Fleet demo
          </button>

          {showFleet && (
            <>
              <button
                type="button"
                className={`ctrl ${scorecardOpen ? 'is-on' : ''}`}
                onClick={() => setScorecardOpen((v) => !v)}
              >
                Scorecard
              </button>
              <button
                type="button"
                className={`ctrl ${playing ? 'is-on' : ''}`}
                onClick={() => setPlaying((p) => !p)}
              >
                {playing ? 'Pause' : 'Play'}
              </button>
              <div className="speeds" role="group" aria-label="Simulation speed">
                {SPEEDS.map((sp) => (
                  <button
                    key={sp}
                    type="button"
                    className={`speeds__btn ${speed === sp ? 'is-on' : ''}`}
                    onClick={() => setSpeed(sp)}
                  >
                    {sp}×
                  </button>
                ))}
              </div>
              <button type="button" className="ctrl" onClick={reset}>
                Reset
              </button>
            </>
          )}

          <button
            type="button"
            className="ctrl"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          >
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </header>

      {/* This looks enough like a real operations tool that the distinction has
          to be on screen, not only in the README. */}
      {demoNoticeOpen && (
        <div className="demoNotice">
          <span className="demoNotice__tag">Demo data</span>
          <p>
            <strong>Real:</strong> the 13 terminals and their boundaries; Long
            Beach gate turn times, truck moves and dwell, live from CargoNav; Long
            Beach gate calendar (captured {GATE_CAPTURED_AT.slice(0, 10)}); and Los
            Angeles appointment fulfilment ({POLA_SUCCESS_DATE}).{' '}
            <strong>Simulated:</strong> everything behind the “Fleet demo” switch —
            trucks, drivers, containers, chassis and clients are placeholders for
            your own records, not real operations.
          </p>
          <button
            type="button"
            className="demoNotice__close"
            onClick={() => setDemoNoticeOpen(false)}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      <KpiBar
        trucks={trucks}
        containers={containers}
        chassis={CHASSIS}
        dateISO={dateISO}
        alertCounts={alertCounts}
      />

      <main className="layout">
        <Sidebar
          trucks={trucks}
          containers={containers}
          chassis={CHASSIS}
          exceptions={exceptions}
          selected={selected}
          onSelect={selectFromList}
        />

        <div className="stage">
          <MapView
            trucks={trucks}
            containers={containers}
            chassis={CHASSIS}
            layers={effectiveLayers}
            theme={theme}
            selected={selected}
            onSelect={selectOnMap}
            focusTarget={focusTarget}
            focusKey={focusKey}
            dateISO={dateISO}
            harborFocusKey={harborFocusKey}
          />

          {scorecardOpen && (
            <Scorecard
              trucks={trucks}
              containers={containers}
                  onClose={() => setScorecardOpen(false)}
            />
          )}

          <LayerControl
            layers={layers}
            onToggle={toggleLayer}
            showCompleted={showCompleted}
            onToggleCompleted={() => setShowCompleted((v) => !v)}
          />
        </div>

        <DetailPanel
          selected={selected}
          trucks={trucks}
          containers={containers}
          chassis={CHASSIS}
          dateISO={dateISO}
          onSelect={selectFromList}
          onClose={() => setSelected(null)}
        />
      </main>
    </div>
  )
}
