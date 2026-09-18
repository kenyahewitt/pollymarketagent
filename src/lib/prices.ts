import { DEXSCREENER_API, JUPITER_PRICE_API } from './constants';
import type { ChainId, PriceTick, TokenWatch } from '../types';

interface DexPair {
  chainId?: string;
  priceUsd?: string;
  priceChange?: { h24?: number };
  liquidity?: { usd?: number };
  baseToken?: { address?: string; symbol?: string };
}

function chainToDexScreener(chain: ChainId): string {
  switch (chain) {
    case 'solana':
      return 'solana';
    case 'ethereum':
      return 'ethereum';
    case 'base':
      return 'base';
    case 'robinhood':
      return 'ethereum';
    default:
      return 'ethereum';
  }
}

async function fetchDexScreenerToken(address: string): Promise<DexPair | null> {
  const url = `${DEXSCREENER_API}/latest/dex/tokens/${address}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as { pairs?: DexPair[] };
  const pairs = data.pairs || [];
  if (!pairs.length) return null;
  pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
  return pairs[0];
}

async function fetchDexScreenerPair(chain: ChainId, address: string): Promise<DexPair | null> {
  const dexChain = chainToDexScreener(chain);
  try {
    const pair = await fetchDexScreenerToken(address);
    if (pair) return pair;
    const searchUrl = `${DEXSCREENER_API}/latest/dex/search?q=${encodeURIComponent(address)}`;
    const res = await fetch(searchUrl);
    if (!res.ok) return null;
    const data = (await res.json()) as { pairs?: DexPair[] };
    const matches = (data.pairs || []).filter(
      (p) =>
        p.baseToken?.address?.toLowerCase() === address.toLowerCase() ||
        p.chainId === dexChain,
    );
    matches.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
    return matches[0] || null;
  } catch {
    return null;
  }
}

async function fetchJupiterPrice(mint: string): Promise<number | null> {
  try {
    const url = `${JUPITER_PRICE_API}?ids=${encodeURIComponent(mint)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      data?: Record<string, { price?: number }>;
    };
    const price = data.data?.[mint]?.price;
    return typeof price === 'number' ? price : null;
  } catch {
    return null;
  }
}

/** Synthetic fallback so paper mode always has a tradable price feed. */
function syntheticPrice(token: TokenWatch, now = Date.now()): number {
  const seed =
    token.address.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 1000;
  const base = 0.0001 + (seed / 1000) * 0.05;
  const wave = Math.sin(now / 40000 + seed) * 0.08;
  const noise = Math.sin(now / 7000 + seed * 1.7) * 0.03;
  return Math.max(1e-9, base * (1 + wave + noise));
}

export async function fetchTokenPrice(token: TokenWatch): Promise<PriceTick> {
  const now = Date.now();
  let priceUsd: number | null = null;
  let change24h: number | undefined;
  let liquidityUsd: number | undefined;

  try {
    if (token.chain === 'solana') {
      const jup = await fetchJupiterPrice(token.address);
      if (jup && jup > 0) priceUsd = jup;
    }

    const pair = await fetchDexScreenerPair(token.chain, token.address);
    if (pair?.priceUsd) {
      const p = parseFloat(pair.priceUsd);
      if (!Number.isNaN(p) && p > 0) {
        priceUsd = priceUsd ? (priceUsd + p) / 2 : p;
      }
      if (typeof pair.priceChange?.h24 === 'number') change24h = pair.priceChange.h24;
      if (typeof pair.liquidity?.usd === 'number') liquidityUsd = pair.liquidity.usd;
    }
  } catch {
    // fall through to synthetic
  }

  if (!priceUsd || priceUsd <= 0) {
    priceUsd = syntheticPrice(token, now);
    change24h = Math.sin(now / 60000) * 5;
  }

  return {
    tokenId: token.id,
    priceUsd,
    timestamp: now,
    change24h,
    liquidityUsd,
  };
}

export async function fetchWatchlistPrices(
  tokens: TokenWatch[],
): Promise<PriceTick[]> {
  const results = await Promise.all(
    tokens.map(async (t) => {
      try {
        return await fetchTokenPrice(t);
      } catch {
        return {
          tokenId: t.id,
          priceUsd: syntheticPrice(t),
          timestamp: Date.now(),
        } satisfies PriceTick;
      }
    }),
  );
  return results;
}
