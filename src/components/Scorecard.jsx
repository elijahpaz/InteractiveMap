import { useMemo, useState } from 'react'
import { scorecard, usd } from '../lib/economics.js'

/**
 * The five numbers the business case rests on.
 *
 * Kept deliberately separate from the operational KPI strip: those say what is
 * happening right now, these say whether any of it is working. Each carries a
 * line on why it matters, because a number nobody can interpret gets ignored.
 */
export default function Scorecard({ trucks, containers, congestion, onClose }) {
  const [showBreakdown, setShowBreakdown] = useState(false)

  const s = useMemo(
    () => scorecard({ trucks, containers, congestion }),
    [trucks, containers, congestion]
  )

  const metrics = [
    {
      label: 'Avg turn time',
      value: `${s.turnTimeMin}m`,
      note: 'Gate time across open terminals. Every minute is paid and earns nothing.',
      tone: s.turnTimeMin > 90 ? 'bad' : s.turnTimeMin > 60 ? 'warn' : 'good',
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
        Every rate is a placeholder — see <code>ASSUMPTIONS</code> in
        <code>lib/economics.js</code>. Replace it with your rate sheet and these
        become real.
      </p>
    </div>
  )
}
