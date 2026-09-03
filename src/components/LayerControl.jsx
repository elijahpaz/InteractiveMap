import { ACCESS_LEVELS, GATE_CAPTURED_AT, captureAgeDays } from '../lib/gates.js'

const LAYERS = [
  { id: 'fleet', label: 'Fleet', swatch: '#4f9cf9' },
  { id: 'routes', label: 'Routes', swatch: '#4f9cf9', dashed: true },
  { id: 'terminals', label: 'Terminals', swatch: '#f97316' },
  { id: 'clients', label: 'Clients', swatch: '#a855f7' },
  { id: 'yards', label: 'Yards', swatch: '#22c55e' },
  { id: 'containers', label: 'Containers', swatch: '#eab308' },
  { id: 'chassis', label: 'Chassis', swatch: '#94a3b8' },
]

export default function LayerControl({ layers, onToggle, showCompleted, onToggleCompleted }) {
  return (
    <div className="panel layers">
      <div className="panel__head">
        <h3>Layers</h3>
      </div>

      <ul className="layers__list">
        {LAYERS.map((layer) => (
          <li key={layer.id}>
            <label className="check">
              <input
                type="checkbox"
                checked={layers[layer.id]}
                onChange={() => onToggle(layer.id)}
              />
              <span className="check__box" />
              <span
                className={`check__swatch ${layer.dashed ? 'is-dashed' : ''}`}
                style={{ '--swatch': layer.swatch }}
              />
              <span className="check__label">{layer.label}</span>
            </label>
          </li>
        ))}
      </ul>

      <label className="check check--muted">
        <input type="checkbox" checked={showCompleted} onChange={onToggleCompleted} />
        <span className="check__box" />
        <span className="check__label">Include completed moves</span>
      </label>

      <div className="legend">
        <p className="legend__title">Gate access today</p>
        <ul>
          {Object.entries(ACCESS_LEVELS)
            .sort(([, a], [, b]) => a.rank - b.rank)
            .map(([key, meta]) => (
              <li key={key}>
                <span className="legend__dot" style={{ background: meta.color }} />
                {meta.label}
              </li>
            ))}
        </ul>
        <p className="legend__foot">
          Long Beach publishes shifts worked; Los Angeles publishes appointment
          fulfilment. Each terminal is shaded by its own port's figure — click one
          to see which. Long Beach data captured {GATE_CAPTURED_AT.slice(0, 10)}
          {captureAgeDays() > 0 ? `, ${captureAgeDays()}d ago` : ' (today)'}.
        </p>
      </div>
    </div>
  )
}
