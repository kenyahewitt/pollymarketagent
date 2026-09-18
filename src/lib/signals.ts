import type { Signal } from '../types';

/**
 * Simple momentum / mean-reversion hybrid:
 * - Buy when recent return is below buyThreshold (oversold / mean-reversion entry)
 * - Sell when recent return is above sellThreshold (momentum take-profit)
 * - Else hold
 */
export function computeSignal(
  history: number[],
  buyThresholdPct: number,
  sellThresholdPct: number,
): Signal {
  if (history.length < 3) return 'hold';
  const latest = history[history.length - 1];
  const lookback = history[0];
  if (!lookback || lookback <= 0 || !latest) return 'hold';
  const pct = ((latest - lookback) / lookback) * 100;
  if (pct <= buyThresholdPct) return 'buy';
  if (pct >= sellThresholdPct) return 'sell';
  return 'hold';
}

export function formatPct(n: number | undefined | null): string {
  if (n === undefined || n === null || Number.isNaN(n)) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

export function formatUsd(n: number, digits = 4): string {
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1) return `$${n.toFixed(2)}`;
  if (Math.abs(n) >= 0.0001) return `$${n.toFixed(digits)}`;
  return `$${n.toExponential(2)}`;
}

export function shortAddr(addr: string, left = 6, right = 4): string {
  if (!addr || addr.length < left + right + 1) return addr;
  return `${addr.slice(0, left)}…${addr.slice(-right)}`;
}
