import type { SniperConfig, SniperState } from '../types';
import { rateLimitLabel, tradesRemaining } from '../lib/rateLimit';
import { MAX_TRADES } from '../lib/constants';

interface Props {
  state: SniperState;
  config: SniperConfig;
  onActivate: () => void;
  onDeactivate: () => void;
  onKill: () => void;
  onReset: () => void;
  onConfig: (patch: Partial<SniperConfig>) => void;
  canActivate: boolean;
}

export function SniperControls({
  state,
  config,
  onActivate,
  onDeactivate,
  onKill,
  onReset,
  onConfig,
  canActivate,
}: Props) {
  const remaining = tradesRemaining(state.tradeTimestamps);

  return (
    <section className="panel panel-pad stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <div className="label">Step 3 · Activate auto sniper</div>
          <h2 style={{ margin: '0.2rem 0 0', fontSize: '1.1rem' }}>Risk controls & engine</h2>
        </div>
        <div className="row">
          {state.active && <span className="badge badge-live">● Running</span>}
          {state.killed && <span className="badge badge-kill">Killed</span>}
          {!state.active && !state.killed && <span className="badge">Idle</span>}
        </div>
      </div>

      <div className="grid-2">
        <div className="row">
          <div className="stat">
            <span className="label">Session P&amp;L</span>
            <span
              className="value"
              style={{ color: state.sessionPnlUsd >= 0 ? 'var(--success)' : 'var(--danger)' }}
            >
              ${state.sessionPnlUsd.toFixed(2)}
            </span>
          </div>
          <div className="stat">
            <span className="label">Rate limit</span>
            <span className="value" style={{ fontSize: '1rem' }}>
              {rateLimitLabel(state.tradeTimestamps)}
            </span>
            <span className="dim" style={{ fontSize: '0.75rem' }}>
              {remaining} of {MAX_TRADES} remaining
            </span>
          </div>
        </div>
        <div className="row">
          {!state.active ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onActivate}
              disabled={!canActivate || state.killed}
            >
              Activate sniper
            </button>
          ) : (
            <button type="button" className="btn" onClick={onDeactivate}>
              Pause
            </button>
          )}
          <button type="button" className="btn btn-danger" onClick={onKill}>
            Kill switch
          </button>
          <button type="button" className="btn btn-ghost" onClick={onReset}>
            Reset session
          </button>
        </div>
      </div>

      {state.killReason && (
        <div className="alert alert-danger">Kill reason: {state.killReason}</div>
      )}
      {state.lastError && <div className="alert alert-warn">{state.lastError}</div>}

      <div className="grid-2">
        <label className="stack">
          <span className="label">Max order size (USD)</span>
          <input
            className="input"
            type="number"
            min={1}
            value={config.maxOrderUsd}
            onChange={(e) => onConfig({ maxOrderUsd: Number(e.target.value) })}
          />
        </label>
        <label className="stack">
          <span className="label">Max session loss (USD)</span>
          <input
            className="input"
            type="number"
            min={1}
            value={config.maxSessionLossUsd}
            onChange={(e) => onConfig({ maxSessionLossUsd: Number(e.target.value) })}
          />
        </label>
        <label className="stack">
          <span className="label">Buy threshold % (mean-reversion)</span>
          <input
            className="input"
            type="number"
            step={0.1}
            value={config.buyThresholdPct}
            onChange={(e) => onConfig({ buyThresholdPct: Number(e.target.value) })}
          />
        </label>
        <label className="stack">
          <span className="label">Sell threshold % (take-profit)</span>
          <input
            className="input"
            type="number"
            step={0.1}
            value={config.sellThresholdPct}
            onChange={(e) => onConfig({ sellThresholdPct: Number(e.target.value) })}
          />
        </label>
      </div>

      <p className="dim" style={{ margin: 0, fontSize: '0.8rem' }}>
        Hard-coded rate limit: max {MAX_TRADES} trades / 15 minutes. Paper fills use DexScreener /
        Jupiter public prices with synthetic fallback so the loop always runs.
      </p>
    </section>
  );
}
