import { useCallback, useMemo, useState } from 'react'
import DetailPanel from './components/DetailPanel.jsx'
import KpiBar from './components/KpiBar.jsx'
import LayerControl from './components/LayerControl.jsx'
import MapView from './components/MapView.jsx'
import PortMap from './components/PortMap.jsx'
import Sidebar from './components/Sidebar.jsx'
import { CHASSIS, CONTAINERS } from './data/equipment.js'
import { NODES } from './data/network.js'
import { useSimulation } from './hooks/useSimulation.js'
import { isLiveContainer } from './lib/status.js'

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

  const [view, setView] = useState('ops')
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

  const toggleLayer = useCallback(
    (id) => setLayers((l) => ({ ...l, [id]: !l[id] })),
    []
  )

  const select = useCallback((next) => {
    setSelected((current) =>
      current && current.type === next.type && current.id === next.id ? null : next
    )
  }, [])

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
    <div className={`app app--${theme} ${view === 'port' ? 'app--port' : ''}`}>
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
            <p>San Pedro Bay · Fleet &amp; equipment</p>
          </div>
        </div>

        {view === 'ops' && (
          <div className="topbar__clock">
            <span className="topbar__time">{formatClock(clockMin)}</span>
            <span className="topbar__tz">PT</span>
          </div>
        )}

        <div className="topbar__controls">
          <div className="viewTabs" role="group" aria-label="View">
            {[
              { id: 'ops', label: 'Operations' },
              { id: 'port', label: 'Port' },
            ].map((v) => (
              <button
                key={v.id}
                type="button"
                className={`viewTabs__btn ${view === v.id ? 'is-on' : ''}`}
                onClick={() => setView(v.id)}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* The clock only drives the operations view, so hide it on the port map. */}
          {view === 'ops' && (
            <>
              <button
                type="button"
                className={`ctrl ${playing ? 'is-on' : ''}`}
                onClick={() => setPlaying((p) => !p)}
              >
                {playing ? 'Pause' : 'Play'}
              </button>
              <div className="speeds" role="group" aria-label="Simulation speed">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`speeds__btn ${speed === s ? 'is-on' : ''}`}
                    onClick={() => setSpeed(s)}
                  >
                    {s}×
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

      {view === 'port' ? (
        <PortMap theme={theme} />
      ) : (
        <>
          <KpiBar trucks={trucks} containers={containers} chassis={CHASSIS} />

          <main className="layout">
            <Sidebar
              trucks={trucks}
              containers={containers}
              chassis={CHASSIS}
              selected={selected}
              onSelect={select}
            />

            <div className="stage">
              <MapView
                trucks={trucks}
                containers={containers}
                chassis={CHASSIS}
                layers={layers}
                theme={theme}
                selected={selected}
                onSelect={select}
                focusTarget={focusTarget}
              />

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
              onSelect={select}
              onClose={() => setSelected(null)}
            />
          </main>
        </>
      )}

    </div>
  )
}
