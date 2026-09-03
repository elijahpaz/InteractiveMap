import { CHASSIS_STATUS, TRUCK_STATUS } from '../lib/status.js'

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
        <p className="legend__title">Truck status</p>
        <ul>
          {Object.entries(TRUCK_STATUS).map(([key, meta]) => (
            <li key={key}>
              <span className="legend__dot" style={{ background: meta.color }} />
              {meta.label}
            </li>
          ))}
        </ul>

        <p className="legend__title">Chassis</p>
        <ul>
          {Object.entries(CHASSIS_STATUS).map(([key, meta]) => (
            <li key={key}>
              <span className="legend__dot" style={{ background: meta.color }} />
              {meta.label}
            </li>
          ))}
        </ul>

        <p className="legend__title">Container box colour</p>
        <ul>
          <li>
            <span className="legend__dot" style={{ background: '#ef4444' }} />
            Demurrage accruing
          </li>
          <li>
            <span className="legend__dot" style={{ background: '#f97316' }} />
            Last free day today
          </li>
          <li>
            <span className="legend__dot" style={{ background: '#f59e0b' }} />
            LFD within 2 days
          </li>
          <li>
            <span className="legend__dot" style={{ background: '#22c55e' }} />
            Clear
          </li>
        </ul>
      </div>
    </div>
  )
}
