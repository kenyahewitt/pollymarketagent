export type ChainId = 'solana' | 'ethereum' | 'base' | 'robinhood';

export interface TokenWatch {
  id: string;
  symbol: string;
  name: string;
  address: string;
  chain: ChainId;
  seed?: boolean;
}

export interface PriceTick {
  tokenId: string;
  priceUsd: number;
  timestamp: number;
  change24h?: number;
  liquidityUsd?: number;
}

export interface MarketSnapshot {
  tokenId: string;
  symbol: string;
  chain: ChainId;
  priceUsd: number;
  change24h?: number;
  liquidityUsd?: number;
  timestamp: number;
  signal: Signal;
}

export type Signal = 'buy' | 'sell' | 'hold';

export type TradeSide = 'buy' | 'sell';

export interface Trade {
  id: string;
  tokenId: string;
  symbol: string;
  chain: ChainId;
  side: TradeSide;
  priceUsd: number;
  sizeUsd: number;
  qty: number;
  timestamp: number;
  mode: 'paper' | 'live';
  reason: string;
  pnlUsd?: number;
}

export interface Position {
  tokenId: string;
  symbol: string;
  chain: ChainId;
  qty: number;
  avgEntryUsd: number;
  costBasisUsd: number;
}

export interface SniperConfig {
  maxOrderUsd: number;
  maxSessionLossUsd: number;
  tickIntervalMs: number;
  momentumLookback: number;
  buyThresholdPct: number;
  sellThresholdPct: number;
  paperStartBalanceUsd: number;
}

export interface SniperState {
  active: boolean;
  killed: boolean;
  killReason?: string;
  paperBalanceUsd: number;
  sessionPnlUsd: number;
  positions: Position[];
  trades: Trade[];
  snapshots: MarketSnapshot[];
  tradeTimestamps: number[];
  priceHistory: Record<string, number[]>;
  lastError?: string;
  lastTickAt?: number;
}

export interface WalletState {
  evmAddress: string | null;
  solanaAddress: string | null;
  chainIdHex: string | null;
  connecting: boolean;
  error: string | null;
}

export interface AgentWallet {
  /** Deterministic demo deposit address for paper mode (client-side). */
  paperEvmAddress: string;
  paperSolanaAddress: string;
  /** Live mode uses server env AGENT_PRIVATE_KEY — never exposed to UI. */
  liveNote: string;
}

export interface PolymarketMarket {
  id: string;
  question: string;
  slug?: string;
  conditionId?: string;
  outcomes?: string[];
  outcomePrices?: number[];
  volume?: number;
  liquidity?: number;
  endDate?: string;
  active?: boolean;
  clobTokenIds?: string[];
}

export interface OrderBookLevel {
  price: string;
  size: string;
}

export interface OrderBook {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  asset_id?: string;
  timestamp?: string;
}

export interface FairValueResult {
  fairYes: number;
  fairNo: number;
  midYes: number | null;
  edgeYes: number | null;
  explanation: string;
}

export interface PreparedTicket {
  marketId: string;
  question: string;
  side: 'YES' | 'NO';
  limitPrice: number;
  sizeUsd: number;
  fairValue: number;
  edge: number;
  explanation: string;
  preparedAt: number;
  note: string;
}
