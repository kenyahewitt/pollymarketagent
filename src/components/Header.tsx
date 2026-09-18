import { APP_NAME, DOMAIN } from '../lib/constants';
import { shortAddr } from '../lib/signals';
import type { WalletState } from '../types';

interface Props {
  wallet: WalletState;
  onConnectEvm: () => void;
  onConnectSolana: () => void;
  onDisconnect: () => void;
  mode: 'sniper' | 'polymarket';
  onMode: (m: 'sniper' | 'polymarket') => void;
}

export function Header({
  wallet,
  onConnectEvm,
  onConnectSolana,
  onDisconnect,
  mode,
  onMode,
}: Props) {
  const connected = !!(wallet.evmAddress || wallet.solanaAddress);

  return (
    <header className="panel panel-pad" style={{ marginBottom: '1.25rem' }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="row" style={{ gap: '1rem' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.03em' }}>
              <span style={{ color: 'var(--accent)' }}>Polly</span>MarketAgent
            </div>
            <div className="dim" style={{ fontSize: '0.8rem' }}>
              {DOMAIN} · paper-first multi-mode terminal
            </div>
          </div>
          <div className="pill-tabs" role="tablist" aria-label="Mode">
            <button
              type="button"
              className={mode === 'sniper' ? 'active' : ''}
              onClick={() => onMode('sniper')}
            >
              Sniper
            </button>
            <button
              type="button"
              className={mode === 'polymarket' ? 'active' : ''}
              onClick={() => onMode('polymarket')}
            >
              Polymarket
            </button>
          </div>
        </div>

        <div className="row">
          {wallet.evmAddress ? (
            <span className="badge badge-live" title={wallet.evmAddress}>
              EVM {shortAddr(wallet.evmAddress)}
            </span>
          ) : (
            <button type="button" className="btn btn-primary" onClick={onConnectEvm} disabled={wallet.connecting}>
              Connect EVM
            </button>
          )}
          {wallet.solanaAddress ? (
            <span className="badge badge-live" title={wallet.solanaAddress}>
              SOL {shortAddr(wallet.solanaAddress)}
            </span>
          ) : (
            <button type="button" className="btn" onClick={onConnectSolana} disabled={wallet.connecting}>
              Connect Solana
            </button>
          )}
          {connected && (
            <button type="button" className="btn btn-ghost" onClick={onDisconnect}>
              Disconnect
            </button>
          )}
        </div>
      </div>
      {wallet.error && (
        <div className="alert alert-danger" style={{ marginTop: '0.75rem' }}>
          {wallet.error}
        </div>
      )}
      <p className="muted" style={{ margin: '0.85rem 0 0', fontSize: '0.85rem' }}>
        {APP_NAME} never asks for seed phrases or private keys. Agent deposits use a dedicated address;
        live signing stays server-side via <code className="mono">AGENT_PRIVATE_KEY</code>.
      </p>
    </header>
  );
}
