import type { ChainId, SniperConfig, TokenWatch } from '../types';

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'PollyMarketAgent';
export const DOMAIN = import.meta.env.VITE_DOMAIN || 'pollymarketagent.store';

export const DEXSCREENER_API =
  import.meta.env.VITE_DEXSCREENER_API || 'https://api.dexscreener.com';
export const JUPITER_PRICE_API =
  import.meta.env.VITE_JUPITER_PRICE_API || 'https://api.jup.ag/price/v2';
export const GAMMA_API =
  import.meta.env.VITE_GAMMA_API || 'https://gamma-api.polymarket.com';
export const CLOB_API =
  import.meta.env.VITE_CLOB_API || 'https://clob.polymarket.com';

/** Hard rate limit: max 20 trades per 15 minutes */
export const MAX_TRADES = 20;
export const RATE_WINDOW_MS = 15 * 60 * 1000;

export const CHAIN_LABELS: Record<ChainId, string> = {
  solana: 'Solana',
  ethereum: 'Ethereum',
  base: 'Base',
  robinhood: 'Robinhood 4663',
};

export const CHAIN_IDS: Record<ChainId, number | 'solana'> = {
  solana: 'solana',
  ethereum: 1,
  base: 8453,
  robinhood: 4663,
};

export const PRESEED_WATCHLIST: TokenWatch[] = [
  {
    id: 'sol-mccat',
    symbol: 'MCCAT',
    name: 'Solana MCCAT',
    address: 'C2WtD354XEvS9gzpJDLqzqkADq7wUtmJg1UzUdmL5a21',
    chain: 'solana',
    seed: true,
  },
  {
    id: 'rh-ccat',
    symbol: 'CCAT',
    name: 'Robinhood Chain CCAT',
    address: '0x78fA081f53ef51cf95d2cF6960c9bf19d05cBc9f',
    chain: 'robinhood',
    seed: true,
  },
  {
    id: 'sol-loops',
    symbol: 'LOOPS',
    name: 'Solana LOOPS',
    address: '7pXbrpmkZuixoqLEWJF5gZ1fwKSwvwkLmiuMHQ7eDTDS',
    chain: 'solana',
    seed: true,
  },
];

export const DEFAULT_SNIPER_CONFIG: SniperConfig = {
  maxOrderUsd: 50,
  maxSessionLossUsd: 200,
  tickIntervalMs: 8000,
  momentumLookback: 8,
  buyThresholdPct: -2.5,
  sellThresholdPct: 3.5,
  paperStartBalanceUsd: 1000,
};

export const STORAGE_KEYS = {
  watchlist: 'pma_watchlist_v1',
  sniper: 'pma_sniper_v1',
  config: 'pma_config_v1',
  agent: 'pma_agent_v1',
} as const;

export const LIVE_MODE_NOTE =
  'Live mode signs with a server-held AGENT_PRIVATE_KEY (never asked in the UI). Paper mode uses a deterministic demo agent address generated client-side.';
