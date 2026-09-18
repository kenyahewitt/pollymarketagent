import { useState } from 'react';
import type { AgentWallet } from '../types';
import { shortAddr } from '../lib/signals';

interface Props {
  agent: AgentWallet;
  paperBalance: number;
  onFundPaper: (amount: number) => void;
}

export function AgentFundPanel({ agent, paperBalance, onFundPaper }: Props) {
  const [amount, setAmount] = useState(100);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <section className="panel panel-pad stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <div className="label">Step 2 · Fund agent wallet</div>
          <h2 style={{ margin: '0.2rem 0 0', fontSize: '1.1rem' }}>Dedicated deposit address</h2>
        </div>
        <span className="badge badge-paper">Paper mode</span>
      </div>

      <div className="alert alert-info">{agent.liveNote}</div>

      <div className="grid-2">
        <div className="stack">
          <span className="label">Paper EVM agent</span>
          <div className="row">
            <code className="mono" style={{ wordBreak: 'break-all' }}>
              {agent.paperEvmAddress}
            </code>
            <button
              type="button"
              className="btn copy-btn"
              onClick={() => void copy(agent.paperEvmAddress, 'evm')}
            >
              {copied === 'evm' ? 'Copied' : 'Copy'}
            </button>
          </div>
          <span className="dim" style={{ fontSize: '0.8rem' }}>
            Demo address {shortAddr(agent.paperEvmAddress)} — deterministic per browser.
          </span>
        </div>
        <div className="stack">
          <span className="label">Paper Solana agent</span>
          <div className="row">
            <code className="mono" style={{ wordBreak: 'break-all' }}>
              {agent.paperSolanaAddress}
            </code>
            <button
              type="button"
              className="btn copy-btn"
              onClick={() => void copy(agent.paperSolanaAddress, 'sol')}
            >
              {copied === 'sol' ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      <div className="row" style={{ marginTop: '0.25rem' }}>
        <div className="stat">
          <span className="label">Paper balance</span>
          <span className="value">${paperBalance.toFixed(2)}</span>
        </div>
        <label className="stack" style={{ minWidth: 120 }}>
          <span className="label">Simulate fund ($)</span>
          <input
            className="input"
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </label>
        <button type="button" className="btn btn-success" onClick={() => onFundPaper(amount)}>
          Fund paper balance
        </button>
      </div>
    </section>
  );
}
