import { CHAIN_LABELS } from '../lib/constants';
import { formatUsd } from '../lib/signals';
import type { Position, Trade } from '../types';

interface Props {
  trades: Trade[];
  positions: Position[];
}

export function TradeLog({ trades, positions }: Props) {
  return (
    <div className="grid-2">
      <section className="panel panel-pad stack">
        <div>
          <div className="label">Open positions</div>
          <h2 style={{ margin: '0.2rem 0 0', fontSize: '1.05rem' }}>Paper inventory</h2>
        </div>
        {positions.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            No open positions.
          </p>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Qty</th>
                  <th>Avg entry</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => (
                  <tr key={p.tokenId}>
                    <td>
                      {p.symbol}{' '}
                      <span className="dim">({CHAIN_LABELS[p.chain]})</span>
                    </td>
                    <td className="mono">{p.qty.toPrecision(4)}</td>
                    <td>{formatUsd(p.avgEntryUsd)}</td>
                    <td>${p.costBasisUsd.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel panel-pad stack">
        <div>
          <div className="label">Trade log</div>
          <h2 style={{ margin: '0.2rem 0 0', fontSize: '1.05rem' }}>Persisted to localStorage</h2>
        </div>
        {trades.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            No trades yet — activate the sniper to simulate fills.
          </p>
        ) : (
          <div className="table-wrap" style={{ maxHeight: 320 }}>
            <table className="data">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Side</th>
                  <th>Symbol</th>
                  <th>Size</th>
                  <th>Price</th>
                  <th>P&amp;L</th>
                </tr>
              </thead>
              <tbody>
                {trades.slice(0, 80).map((t) => (
                  <tr key={t.id}>
                    <td className="mono">
                      {new Date(t.timestamp).toLocaleTimeString()}
                    </td>
                    <td>
                      <span className={`badge badge-${t.side}`}>{t.side}</span>
                    </td>
                    <td>{t.symbol}</td>
                    <td>${t.sizeUsd.toFixed(2)}</td>
                    <td>{formatUsd(t.priceUsd)}</td>
                    <td
                      style={{
                        color:
                          t.pnlUsd === undefined
                            ? undefined
                            : t.pnlUsd >= 0
                              ? 'var(--success)'
                              : 'var(--danger)',
                      }}
                    >
                      {t.pnlUsd === undefined ? '—' : `$${t.pnlUsd.toFixed(2)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
