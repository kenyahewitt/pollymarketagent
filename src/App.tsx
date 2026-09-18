import { useMemo, useState } from 'react';
import { AgentFundPanel } from './components/AgentFundPanel';
import { FlowSteps } from './components/FlowSteps';
import { Header } from './components/Header';
import { PolymarketPanel } from './components/PolymarketPanel';
import { SniperControls } from './components/SniperControls';
import { TradeLog } from './components/TradeLog';
import { WatchlistPanel } from './components/WatchlistPanel';
import { useSniper } from './hooks/useSniper';
import { useWallet } from './hooks/useWallet';
import { useWatchlist } from './hooks/useWatchlist';
import { getOrCreateAgentWallet } from './lib/agentWallet';

export default function App() {
  const [mode, setMode] = useState<'sniper' | 'polymarket'>('sniper');
  const { wallet, connectEvm, connectSolana, disconnect } = useWallet();
  const { watchlist, addToken, removeToken } = useWatchlist();
  const sniper = useSniper(watchlist);
  const agent = useMemo(() => getOrCreateAgentWallet(), []);

  const connected = !!(wallet.evmAddress || wallet.solanaAddress);
  // Paper mode: allow activate after connect OR after funding demo balance interaction
  const funded = sniper.state.paperBalanceUsd > 0;
  const canActivate = connected && funded && !sniper.state.killed;

  return (
    <div className="app-shell">
      <Header
        wallet={wallet}
        onConnectEvm={() => void connectEvm()}
        onConnectSolana={() => void connectSolana()}
        onDisconnect={() => void disconnect()}
        mode={mode}
        onMode={setMode}
      />

      {mode === 'sniper' ? (
        <div className="stack" style={{ gap: '1rem' }}>
          <FlowSteps connected={connected} funded={funded} active={sniper.state.active} />

          <div className="grid-2">
            <section className="panel panel-pad stack">
              <div className="label">Step 1 · Connect wallet</div>
              <h2 style={{ margin: '0.2rem 0 0', fontSize: '1.1rem' }}>EVM + Solana</h2>
              <p className="muted" style={{ margin: 0 }}>
                Lightweight EIP-1193 for EVM; optional Phantom / <code className="mono">window.solana</code>{' '}
                for Solana. No seed phrases. No private keys in the UI.
              </p>
              <div className="row">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void connectEvm()}
                  disabled={wallet.connecting || !!wallet.evmAddress}
                >
                  {wallet.evmAddress ? 'EVM connected' : 'Connect EVM wallet'}
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => void connectSolana()}
                  disabled={wallet.connecting || !!wallet.solanaAddress}
                >
                  {wallet.solanaAddress ? 'Solana connected' : 'Connect Phantom'}
                </button>
              </div>
            </section>
            <AgentFundPanel
              agent={agent}
              paperBalance={sniper.state.paperBalanceUsd}
              onFundPaper={sniper.fundPaper}
            />
          </div>

          <SniperControls
            state={sniper.state}
            config={sniper.config}
            onActivate={sniper.activate}
            onDeactivate={sniper.deactivate}
            onKill={() => sniper.kill()}
            onReset={sniper.resetSession}
            onConfig={sniper.updateConfig}
            canActivate={canActivate}
          />

          {!connected && (
            <div className="alert alert-warn">
              Connect an EVM or Solana wallet to unlock Activate. Paper trading still uses public
              price APIs after you fund the demo agent balance.
            </div>
          )}

          <WatchlistPanel
            watchlist={watchlist}
            snapshots={sniper.state.snapshots}
            onAdd={addToken}
            onRemove={removeToken}
          />

          <TradeLog trades={sniper.state.trades} positions={sniper.state.positions} />

          {sniper.state.lastTickAt && (
            <p className="dim" style={{ fontSize: '0.8rem', textAlign: 'right' }}>
              Last tick: {new Date(sniper.state.lastTickAt).toLocaleTimeString()} · snapshots stored:{' '}
              {sniper.state.snapshots.length}
            </p>
          )}
        </div>
      ) : (
        <PolymarketPanel />
      )}

      <footer
        className="dim"
        style={{ marginTop: '2rem', fontSize: '0.8rem', textAlign: 'center' }}
      >
        PollyMarketAgent · paper/simulate by default · not financial advice ·{' '}
        pollymarketagent.store
      </footer>
    </div>
  );
}
