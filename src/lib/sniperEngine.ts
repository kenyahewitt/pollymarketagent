import type {
  MarketSnapshot,
  Position,
  SniperConfig,
  SniperState,
  TokenWatch,
  Trade,
} from '../types';
import { DEFAULT_SNIPER_CONFIG } from './constants';
import { fetchWatchlistPrices } from './prices';
import { canTrade, pruneTradeTimestamps } from './rateLimit';
import { computeSignal } from './signals';

function uid(): string {
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createInitialSniperState(config: SniperConfig = DEFAULT_SNIPER_CONFIG): SniperState {
  return {
    active: false,
    killed: false,
    paperBalanceUsd: config.paperStartBalanceUsd,
    sessionPnlUsd: 0,
    positions: [],
    trades: [],
    snapshots: [],
    tradeTimestamps: [],
    priceHistory: {},
  };
}

function upsertHistory(
  map: Record<string, number[]>,
  tokenId: string,
  price: number,
  lookback: number,
): Record<string, number[]> {
  const prev = map[tokenId] || [];
  const next = [...prev, price].slice(-(lookback + 2));
  return { ...map, [tokenId]: next };
}

function getPosition(positions: Position[], tokenId: string): Position | undefined {
  return positions.find((p) => p.tokenId === tokenId);
}

function applyBuy(
  state: SniperState,
  token: TokenWatch,
  price: number,
  sizeUsd: number,
  reason: string,
): SniperState {
  const qty = sizeUsd / price;
  const trade: Trade = {
    id: uid(),
    tokenId: token.id,
    symbol: token.symbol,
    chain: token.chain,
    side: 'buy',
    priceUsd: price,
    sizeUsd,
    qty,
    timestamp: Date.now(),
    mode: 'paper',
    reason,
  };

  const existing = getPosition(state.positions, token.id);
  let positions: Position[];
  if (existing) {
    const cost = existing.costBasisUsd + sizeUsd;
    const newQty = existing.qty + qty;
    positions = state.positions.map((p) =>
      p.tokenId === token.id
        ? {
            ...p,
            qty: newQty,
            costBasisUsd: cost,
            avgEntryUsd: cost / newQty,
          }
        : p,
    );
  } else {
    positions = [
      ...state.positions,
      {
        tokenId: token.id,
        symbol: token.symbol,
        chain: token.chain,
        qty,
        avgEntryUsd: price,
        costBasisUsd: sizeUsd,
      },
    ];
  }

  const timestamps = pruneTradeTimestamps([...state.tradeTimestamps, trade.timestamp]);

  return {
    ...state,
    paperBalanceUsd: state.paperBalanceUsd - sizeUsd,
    positions,
    trades: [trade, ...state.trades].slice(0, 500),
    tradeTimestamps: timestamps,
  };
}

function applySell(
  state: SniperState,
  token: TokenWatch,
  price: number,
  reason: string,
): SniperState {
  const pos = getPosition(state.positions, token.id);
  if (!pos || pos.qty <= 0) return state;

  const sizeUsd = pos.qty * price;
  const pnl = sizeUsd - pos.costBasisUsd;
  const trade: Trade = {
    id: uid(),
    tokenId: token.id,
    symbol: token.symbol,
    chain: token.chain,
    side: 'sell',
    priceUsd: price,
    sizeUsd,
    qty: pos.qty,
    timestamp: Date.now(),
    mode: 'paper',
    reason,
    pnlUsd: pnl,
  };

  const positions = state.positions.filter((p) => p.tokenId !== token.id);
  const timestamps = pruneTradeTimestamps([...state.tradeTimestamps, trade.timestamp]);

  return {
    ...state,
    paperBalanceUsd: state.paperBalanceUsd + sizeUsd,
    sessionPnlUsd: state.sessionPnlUsd + pnl,
    positions,
    trades: [trade, ...state.trades].slice(0, 500),
    tradeTimestamps: timestamps,
  };
}

export async function runSniperTick(
  state: SniperState,
  watchlist: TokenWatch[],
  config: SniperConfig,
): Promise<SniperState> {
  if (!state.active || state.killed) return state;

  // Kill switch: max session loss
  if (state.sessionPnlUsd <= -Math.abs(config.maxSessionLossUsd)) {
    return {
      ...state,
      active: false,
      killed: true,
      killReason: `Max session loss hit ($${config.maxSessionLossUsd})`,
    };
  }

  let next: SniperState = { ...state, lastError: undefined };

  try {
    const ticks = await fetchWatchlistPrices(watchlist);
    const snapshots: MarketSnapshot[] = [];
    let priceHistory = { ...next.priceHistory };

    for (const token of watchlist) {
      const tick = ticks.find((t) => t.tokenId === token.id);
      if (!tick) continue;

      priceHistory = upsertHistory(
        priceHistory,
        token.id,
        tick.priceUsd,
        config.momentumLookback,
      );
      const hist = priceHistory[token.id] || [];
      const signal = computeSignal(
        hist.slice(-config.momentumLookback),
        config.buyThresholdPct,
        config.sellThresholdPct,
      );

      snapshots.push({
        tokenId: token.id,
        symbol: token.symbol,
        chain: token.chain,
        priceUsd: tick.priceUsd,
        change24h: tick.change24h,
        liquidityUsd: tick.liquidityUsd,
        timestamp: tick.timestamp,
        signal,
      });

      if (!canTrade(next.tradeTimestamps)) {
        continue;
      }

      if (signal === 'buy') {
        const size = Math.min(config.maxOrderUsd, next.paperBalanceUsd);
        if (size >= 1) {
          next = applyBuy(
            { ...next, priceHistory },
            token,
            tick.priceUsd,
            size,
            `Mean-reversion buy (hist return ≤ ${config.buyThresholdPct}%)`,
          );
          priceHistory = next.priceHistory;
        }
      } else if (signal === 'sell') {
        const pos = getPosition(next.positions, token.id);
        if (pos && pos.qty > 0) {
          next = applySell(
            { ...next, priceHistory },
            token,
            tick.priceUsd,
            `Momentum take-profit (hist return ≥ ${config.sellThresholdPct}%)`,
          );
          priceHistory = next.priceHistory;
        }
      }
    }

    // Re-check loss after fills
    if (next.sessionPnlUsd <= -Math.abs(config.maxSessionLossUsd)) {
      return {
        ...next,
        priceHistory,
        snapshots: [...snapshots, ...next.snapshots].slice(0, 300),
        active: false,
        killed: true,
        killReason: `Max session loss hit ($${config.maxSessionLossUsd})`,
        lastTickAt: Date.now(),
      };
    }

    return {
      ...next,
      priceHistory,
      snapshots: [...snapshots, ...next.snapshots].slice(0, 300),
      lastTickAt: Date.now(),
    };
  } catch (err) {
    return {
      ...next,
      lastError: err instanceof Error ? err.message : 'Tick failed',
      lastTickAt: Date.now(),
    };
  }
}
