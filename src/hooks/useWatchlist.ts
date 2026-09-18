import { useCallback, useEffect, useState } from 'react';
import { PRESEED_WATCHLIST, STORAGE_KEYS } from '../lib/constants';
import { loadJson, saveJson } from '../lib/storage';
import type { ChainId, TokenWatch } from '../types';

function mergeSeed(saved: TokenWatch[] | null): TokenWatch[] {
  if (!saved?.length) return [...PRESEED_WATCHLIST];
  const byAddr = new Map(saved.map((t) => [t.address.toLowerCase(), t]));
  for (const seed of PRESEED_WATCHLIST) {
    if (!byAddr.has(seed.address.toLowerCase())) {
      byAddr.set(seed.address.toLowerCase(), seed);
    }
  }
  return Array.from(byAddr.values());
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<TokenWatch[]>(() =>
    mergeSeed(loadJson(STORAGE_KEYS.watchlist, null)),
  );

  useEffect(() => {
    saveJson(STORAGE_KEYS.watchlist, watchlist);
  }, [watchlist]);

  const addToken = useCallback((address: string, chain: ChainId, symbol?: string) => {
    const trimmed = address.trim();
    if (!trimmed) return { ok: false as const, error: 'Empty address' };
    setWatchlist((list) => {
      if (list.some((t) => t.address.toLowerCase() === trimmed.toLowerCase())) {
        return list;
      }
      const token: TokenWatch = {
        id: `custom-${trimmed.slice(0, 8).toLowerCase()}`,
        symbol: (symbol || trimmed.slice(0, 4)).toUpperCase(),
        name: symbol || 'Custom token',
        address: trimmed,
        chain,
      };
      return [...list, token];
    });
    return { ok: true as const };
  }, []);

  const removeToken = useCallback((id: string) => {
    setWatchlist((list) => list.filter((t) => t.id !== id || t.seed));
  }, []);

  return { watchlist, addToken, removeToken };
}
