import { MAX_TRADES, RATE_WINDOW_MS } from './constants';

/** Enforce max 20 trades per 15 minutes. Returns remaining slots. */
export function pruneTradeTimestamps(timestamps: number[], now = Date.now()): number[] {
  const cutoff = now - RATE_WINDOW_MS;
  return timestamps.filter((t) => t >= cutoff);
}

export function canTrade(timestamps: number[], now = Date.now()): boolean {
  return pruneTradeTimestamps(timestamps, now).length < MAX_TRADES;
}

export function tradesRemaining(timestamps: number[], now = Date.now()): number {
  return Math.max(0, MAX_TRADES - pruneTradeTimestamps(timestamps, now).length);
}

export function rateLimitLabel(timestamps: number[], now = Date.now()): string {
  const used = pruneTradeTimestamps(timestamps, now).length;
  return `${used}/${MAX_TRADES} trades in last 15m`;
}
