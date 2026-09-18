import { CLOB_API, GAMMA_API } from './constants';
import type {
  FairValueResult,
  OrderBook,
  PolymarketMarket,
  PreparedTicket,
} from '../types';

interface GammaMarketRaw {
  id?: string;
  question?: string;
  slug?: string;
  conditionId?: string;
  outcomes?: string;
  outcomePrices?: string;
  volume?: string | number;
  liquidity?: string | number;
  endDate?: string;
  active?: boolean;
  closed?: boolean;
  clobTokenIds?: string;
}

function parseJsonArray(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

function parsePrices(raw: string | undefined): number[] {
  return parseJsonArray(raw).map((x) => {
    const n = parseFloat(x);
    return Number.isFinite(n) ? n : 0;
  });
}

function mapMarket(m: GammaMarketRaw): PolymarketMarket {
  return {
    id: String(m.id || m.conditionId || ''),
    question: m.question || 'Untitled market',
    slug: m.slug,
    conditionId: m.conditionId,
    outcomes: parseJsonArray(m.outcomes),
    outcomePrices: parsePrices(m.outcomePrices),
    volume: typeof m.volume === 'string' ? parseFloat(m.volume) : m.volume,
    liquidity: typeof m.liquidity === 'string' ? parseFloat(m.liquidity) : m.liquidity,
    endDate: m.endDate,
    active: m.active !== false && m.closed !== true,
    clobTokenIds: parseJsonArray(m.clobTokenIds),
  };
}

export async function fetchGammaMarkets(limit = 24): Promise<PolymarketMarket[]> {
  const url = `${GAMMA_API}/markets?limit=${limit}&active=true&closed=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Gamma API ${res.status}`);
  const data = (await res.json()) as GammaMarketRaw[];
  return (Array.isArray(data) ? data : []).map(mapMarket).filter((m) => m.id);
}

export async function fetchOrderBook(tokenId: string): Promise<OrderBook> {
  const url = `${CLOB_API}/book?token_id=${encodeURIComponent(tokenId)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CLOB book ${res.status}`);
  const data = (await res.json()) as OrderBook;
  return {
    bids: data.bids || [],
    asks: data.asks || [],
    asset_id: data.asset_id,
    timestamp: data.timestamp,
  };
}

/**
 * Explainable fair-value heuristic (NOT a prediction model):
 * Blend market mid with a mild mean-reversion toward 0.5 and liquidity-adjusted uncertainty.
 */
export function computeFairValue(
  market: PolymarketMarket,
  book?: OrderBook | null,
): FairValueResult {
  const yesPrice = market.outcomePrices?.[0];
  let midYes: number | null =
    typeof yesPrice === 'number' && yesPrice > 0 ? yesPrice : null;

  if (book?.bids?.length && book?.asks?.length) {
    const bestBid = parseFloat(book.bids[0].price);
    const bestAsk = parseFloat(book.asks[0].price);
    if (Number.isFinite(bestBid) && Number.isFinite(bestAsk)) {
      midYes = (bestBid + bestAsk) / 2;
    }
  }

  if (midYes === null) {
    return {
      fairYes: 0.5,
      fairNo: 0.5,
      midYes: null,
      edgeYes: null,
      explanation:
        'No mid price available — defaulting fair value to 0.50 (maximum uncertainty).',
    };
  }

  const liq = market.liquidity || 0;
  // Pull slightly toward 0.5 when liquidity is thin (mean-reversion prior)
  const priorWeight = liq > 50_000 ? 0.05 : liq > 10_000 ? 0.12 : 0.22;
  const fairYes = midYes * (1 - priorWeight) + 0.5 * priorWeight;
  const fairNo = 1 - fairYes;
  const edgeYes = midYes - fairYes;

  const explanation = [
    `Market mid YES ≈ ${midYes.toFixed(3)}.`,
    `Liquidity $${Math.round(liq).toLocaleString()} → prior weight toward 0.50 = ${(priorWeight * 100).toFixed(0)}%.`,
    `Fair YES = mid×${(1 - priorWeight).toFixed(2)} + 0.50×${priorWeight.toFixed(2)} = ${fairYes.toFixed(3)}.`,
    edgeYes > 0.01
      ? `YES looks rich vs fair (edge ${edgeYes.toFixed(3)}) — favor NO ticket if trading.`
      : edgeYes < -0.01
        ? `YES looks cheap vs fair (edge ${edgeYes.toFixed(3)}) — favor YES ticket if trading.`
        : 'Mid ≈ fair — no clear edge.',
  ].join(' ');

  return { fairYes, fairNo, midYes, edgeYes, explanation };
}

export function prepareTicket(
  market: PolymarketMarket,
  side: 'YES' | 'NO',
  sizeUsd: number,
  fair: FairValueResult,
): PreparedTicket {
  const fairValue = side === 'YES' ? fair.fairYes : fair.fairNo;
  const mid =
    side === 'YES'
      ? fair.midYes
      : fair.midYes !== null
        ? 1 - fair.midYes
        : null;
  const limitPrice = mid !== null ? Number(mid.toFixed(3)) : Number(fairValue.toFixed(3));
  const edge =
    mid !== null && fair.edgeYes !== null
      ? side === 'YES'
        ? -fair.edgeYes
        : fair.edgeYes
      : 0;

  return {
    marketId: market.id,
    question: market.question,
    side,
    limitPrice,
    sizeUsd,
    fairValue,
    edge,
    explanation: fair.explanation,
    preparedAt: Date.now(),
    note: 'Prepared ticket only — no unattended signing. Review and sign manually in your Polymarket wallet if you choose to trade.',
  };
}
