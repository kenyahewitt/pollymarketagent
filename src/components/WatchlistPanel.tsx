import { useState, type FormEvent } from 'react';
import { CHAIN_LABELS } from '../lib/constants';
import { formatPct, formatUsd, shortAddr } from '../lib/signals';
import type { ChainId, MarketSnapshot, TokenWatch } from '../types';

interface Props {
  watchlist: TokenWatch[];
  snapshots: MarketSnapshot[];
  onAdd: (address: string, chain: ChainId, symbol?: string) => { ok: boolean; error?: string };
  onRemove: (id: string) => void;
}

export function WatchlistPanel({ watchlist, snapshots, onAdd, onRemove }: Props) {
  const [address, setAddress] = useState('');
  const [symbol, setSymbol] = useState('');
  const [chain, setChain] = useState<ChainId>('solana');
  const [err, setErr] = useState<string | null>(null);

  const latestByToken = new Map<string, MarketSnapshot>();
  for (const s of snapshots) {
    if (!latestByToken.has(s.tokenId)) latestByToken.set(s.tokenId, s);
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const res = onAdd(address, chain, symbol || undefined);
    if (!res.ok) {
      setErr(res.error || 'Failed');
      return;
    }
    setAddress('');
    setSymbol('');
    setErr(null);
  };

  return (
    <section className="panel panel-pad stack">
      <div>
        <div className="label">Watchlist</div>
        <h2 style={{ margin: '0.2rem 0 0', fontSize: '1.1rem' }}>Pre-seeded + custom CAs</h2>
      </div>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Chain</th>
              <th>Address</th>
              <th>Price</th>
              <th>24h</th>
              <th>Signal</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {watchlist.map((t) => {
              const snap = latestByToken.get(t.id);
              return (
                <tr key={t.id}>
                  <td>
                    <strong>{t.symbol}</strong>
                    {t.seed && (
                      <span className="badge" style={{ marginLeft: 6 }}>
                        seed
                      </span>
                    )}
                  </td>
                  <td>{CHAIN_LABELS[t.chain]}</td>
                  <td className="mono" title={t.address}>
                    {shortAddr(t.address, 8, 6)}
                  </td>
                  <td>{snap ? formatUsd(snap.priceUsd) : '—'}</td>
                  <td>{formatPct(snap?.change24h)}</td>
                  <td>
                    {snap ? (
                      <span
                        className={`badge${snap.signal === 'buy' ? ' badge-buy' : ''}${snap.signal === 'sell' ? ' badge-sell' : ''}`}
                      >
                        {snap.signal}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    {!t.seed && (
                      <button type="button" className="btn copy-btn" onClick={() => onRemove(t.id)}>
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <form className="row" onSubmit={submit}>
        <label className="stack" style={{ flex: 2, minWidth: 180 }}>
          <span className="label">Contract address</span>
          <input
            className="input"
            placeholder="Paste CA…"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </label>
        <label className="stack" style={{ minWidth: 100 }}>
          <span className="label">Symbol</span>
          <input
            className="input"
            placeholder="TICKER"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          />
        </label>
        <label className="stack" style={{ minWidth: 140 }}>
          <span className="label">Chain</span>
          <select className="select" value={chain} onChange={(e) => setChain(e.target.value as ChainId)}>
            {(Object.keys(CHAIN_LABELS) as ChainId[]).map((c) => (
              <option key={c} value={c}>
                {CHAIN_LABELS[c]}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end' }}>
          Add token
        </button>
      </form>
      {err && <div className="alert alert-warn">{err}</div>}
    </section>
  );
}
