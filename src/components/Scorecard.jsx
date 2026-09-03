import { useMemo, useState } from 'react'
import { scorecard, usd } from '../lib/economics.js'

/**
 * The five numbers the business case rests on.
 *
 * Kept deliberately separate from the operational KPI strip: those say what is
 * happening right now, these say whether any of it is working. Each carries a
 * line on why it matters, because a number nobody can interpret gets ignored.
 *
 * Turn time shows an em dash rather than a figure. It used to show an average
 * over a congestion model that was invented end to end. An unknown that admits
 * it is more useful than a number that cannot be checked.
 */
export default function Scorecard({ trucks, containers, onClose }) {
  const [showBreakdown, setShowBreakdown] = useState(false)

  const s = useMemo(
    () => scorecard({ trucks, containers }),
    [trucks, containers]
  )

  const metrics = [
    {
      label: 'Avg turn time',
      value: '—',
      note: 'No free public measurement exists for San Pedro Bay. Comes back when you measure it from your own drivers\u2019 gate dwell.',
      tone: 'unknown',
    },
    {
      label: 'Driver utilisation',
      value: `${Math.round(s.utilisationPct * 100)}%`,
      note: 'Share of on-duty time rolling rather than queued or held on site.',
      tone: s.utilisationPct > 0.8 ? 'good' : s.utilisationPct > 0.65 ? 'warn' : 'bad',
    },
    {
      label: 'Deadhead miles',
      value: `${s.deadheadMiles}`,
      note: 'Miles run with nothing on the chassis. Pure cost, no revenue.',
      tone: s.deadheadMiles > 120 ? 'bad' : s.deadheadMiles > 60 ? 'warn' : 'good',
    },
    {
      label: 'Accessorials at risk',
      value: usd(s.exposureUsd),
      note: 'Demurrage, detention and idle equipment accruing or one day away.',
      tone: s.exposureUsd > 1500 ? 'bad' : s.exposureUsd > 500 ? 'warn' : 'good',
      expandable: true,
    },
    {
      label: 'Contribution / load',
      value: usd(s.marginPerLoadUsd),
      note: `Average across ${s.loadsCounted} loads in progress, before fixed fleet costs.`,
      tone: s.marginPerLoadUsd > 250 ? 'good' : s.marginPerLoadUsd > 120 ? 'warn' : 'bad',
    },
  ]

  return (
    <div className="panel scorecard">
      <div className="panel__head">
        <h3>Scorecard</h3>
        <button type="button" className="ghostBtn" onClick={onClose}>
          Hide
        </button>
      </div>

      {metrics.map((m) => (
        <div key={m.label} className={`metric metric--${m.tone}`}>
          <div className="metric__row">
            <span className="metric__label">{m.label}</span>
            <span className="metric__value">{m.value}</span>
          </div>
          <p className="metric__note">{m.note}</p>

          {m.expandable && (
            <>
              <button
                type="button"
                className="metric__toggle"
                onClick={() => setShowBreakdown((v) => !v)}
              >
                {showBreakdown ? 'Hide breakdown' : 'Breakdown'}
              </button>
              {showBreakdown && (
                <ul className="metric__breakdown">
                  <li>
                    <span>Demurrage accrued</span>
                    <span>{usd(s.exposureBreakdown.demurrage)}</span>
                  </li>
                  <li>
                    <span>Starts tomorrow</span>
                    <span>{usd(s.exposureBreakdown.demurrageTomorrow)}</span>
                  </li>
                  <li>
                    <span>Detention</span>
                    <span>{usd(s.exposureBreakdown.detention)}</span>
                  </li>
                  <li>
                    <span>Idle chassis</span>
                    <span>{usd(s.exposureBreakdown.idleChassis)}</span>
                  </li>
                </ul>
              )}
            </>
          )}
        </div>
      ))}

      <p className="scorecard__note">
        These are computed from the <em>simulated</em> fleet against placeholder
        rates in <code>ASSUMPTIONS</code>. They show the shape of the measurement,
        not your numbers. Gate time is excluded from contribution because it is
        not measured, which makes contribution an upper bound.
      </p>
    </div>
  )
}
