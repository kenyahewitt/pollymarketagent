import { useCallback, useEffect, useState } from 'react';
import {
  computeFairValue,
  fetchGammaMarkets,
  fetchOrderBook,
  prepareTicket,
} from '../lib/polymarket';
import { formatUsd } from '../lib/signals';
import type {
  FairValueResult,
  OrderBook,
  PolymarketMarket,
  PreparedTicket,
} from '../types';

export function PolymarketPanel() {
  const [markets, setMarkets] = useState<PolymarketMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PolymarketMarket | null>(null);
  const [book, setBook] = useState<OrderBook | null>(null);
  const [fair, setFair] = useState<FairValueResult | null>(null);
  const [ticket, setTicket] = useState<PreparedTicket | null>(null);
  const [sizeUsd, setSizeUsd] = useState(25);
  const [bookLoading, setBookLoading] = useState(false);

  const loadMarkets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchGammaMarkets(30);
      setMarkets(list);
      if (list[0]) setSelected(list[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load markets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMarkets();
  }, [loadMarkets]);

  useEffect(() => {
    if (!selected) {
      setBook(null);
      setFair(null);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setBookLoading(true);
      setTicket(null);
      try {
        const tokenId = selected.clobTokenIds?.[0];
        let ob: OrderBook | null = null;
        if (tokenId) {
          try {
            ob = await fetchOrderBook(tokenId);
          } catch {
            ob = null;
          }
        }
        if (cancelled) return;
        setBook(ob);
        setFair(computeFairValue(selected, ob));
      } finally {
        if (!cancelled) setBookLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const onPrepare = (side: 'YES' | 'NO') => {
    if (!selected || !fair) return;
    setTicket(prepareTicket(selected, side, sizeUsd, fair));
  };

  return (
    <div className="stack" style={{ gap: '1rem' }}>
      <section className="panel panel-pad stack">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <div className="label">Mode 2 · Polymarket</div>
            <h2 style={{ margin: '0.2rem 0 0', fontSize: '1.15rem' }}>
              Gamma + CLOB read-only research
            </h2>
          </div>
          <button type="button" className="btn" onClick={() => void loadMarkets()} disabled={loading}>
            Refresh
          </button>
        </div>
        <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
          Public reads from gamma-api.polymarket.com and clob.polymarket.com. Prepare-ticket never
          signs — review manually if you trade elsewhere.
        </p>
        {error && <div className="alert alert-danger">{error}</div>}
      </section>

      <div className="grid-2">
        <section className="panel panel-pad stack">
          <div className="label">Live markets</div>
          {loading ? (
            <p className="muted">Loading Gamma markets…</p>
          ) : (
            <div className="table-wrap" style={{ maxHeight: 420 }}>
              <table className="data">
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>YES</th>
                    <th>Vol</th>
                  </tr>
                </thead>
                <tbody>
                  {markets.map((m) => (
                    <tr
                      key={m.id}
                      onClick={() => setSelected(m)}
                      style={{
                        cursor: 'pointer',
                        background:
                          selected?.id === m.id ? 'rgba(34,211,238,0.08)' : undefined,
                      }}
                    >
                      <td style={{ whiteSpace: 'normal', maxWidth: 280 }}>{m.question}</td>
                      <td className="mono">
                        {m.outcomePrices?.[0] !== undefined
                          ? m.outcomePrices[0].toFixed(3)
                          : '—'}
                      </td>
                      <td>
                        {m.volume !== undefined ? formatUsd(m.volume, 0) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel panel-pad stack">
          <div className="label">Order book & fair value</div>
          {!selected ? (
            <p className="muted">Select a market.</p>
          ) : (
            <>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>{selected.question}</h3>
              {bookLoading && <p className="dim">Fetching CLOB book…</p>}
              {book && (
                <div className="grid-2">
                  <div>
                    <div className="label">Bids</div>
                    <div className="table-wrap">
                      <table className="data">
                        <thead>
                          <tr>
                            <th>Price</th>
                            <th>Size</th>
                          </tr>
                        </thead>
                        <tbody>
                          {book.bids.slice(0, 8).map((l, i) => (
                            <tr key={`b-${i}`}>
                              <td className="mono" style={{ color: 'var(--buy)' }}>
                                {l.price}
                              </td>
                              <td className="mono">{l.size}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div>
                    <div className="label">Asks</div>
                    <div className="table-wrap">
                      <table className="data">
                        <thead>
                          <tr>
                            <th>Price</th>
                            <th>Size</th>
                          </tr>
                        </thead>
                        <tbody>
                          {book.asks.slice(0, 8).map((l, i) => (
                            <tr key={`a-${i}`}>
                              <td className="mono" style={{ color: 'var(--sell)' }}>
                                {l.price}
                              </td>
                              <td className="mono">{l.size}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              {!book && !bookLoading && (
                <div className="alert alert-warn">
                  No CLOB book for this market (missing token id or empty book). Fair value uses
                  Gamma outcome prices only.
                </div>
              )}

              {fair && (
                <div className="alert alert-info">
                  <strong>Fair YES {fair.fairYes.toFixed(3)}</strong> / NO {fair.fairNo.toFixed(3)}
                  <div style={{ marginTop: 6 }}>{fair.explanation}</div>
                </div>
              )}

              <div className="row">
                <label className="stack" style={{ minWidth: 120 }}>
                  <span className="label">Ticket size ($)</span>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    value={sizeUsd}
                    onChange={(e) => setSizeUsd(Number(e.target.value))}
                  />
                </label>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => onPrepare('YES')}
                  disabled={!fair}
                >
                  Prepare YES ticket
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => onPrepare('NO')}
                  disabled={!fair}
                >
                  Prepare NO ticket
                </button>
              </div>

              {ticket && (
                <div className="panel panel-pad" style={{ background: 'var(--bg-elevated)' }}>
                  <div className="label">Prepared ticket (no signing)</div>
                  <pre
                    className="mono"
                    style={{
                      margin: '0.5rem 0 0',
                      whiteSpace: 'pre-wrap',
                      fontSize: '0.8rem',
                    }}
                  >
                    {JSON.stringify(ticket, null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
