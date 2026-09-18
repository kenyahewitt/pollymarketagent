import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_SNIPER_CONFIG, STORAGE_KEYS } from '../lib/constants';
import { createInitialSniperState, runSniperTick } from '../lib/sniperEngine';
import { loadJson, saveJson } from '../lib/storage';
import type { SniperConfig, SniperState, TokenWatch } from '../types';

export function useSniper(watchlist: TokenWatch[]) {
  const [config, setConfig] = useState<SniperConfig>(() =>
    loadJson(STORAGE_KEYS.config, DEFAULT_SNIPER_CONFIG),
  );
  const [state, setState] = useState<SniperState>(() => {
    const saved = loadJson<SniperState | null>(STORAGE_KEYS.sniper, null);
    if (saved) {
      return { ...saved, active: false }; // never auto-resume
    }
    return createInitialSniperState(DEFAULT_SNIPER_CONFIG);
  });

  const stateRef = useRef(state);
  const watchRef = useRef(watchlist);
  const configRef = useRef(config);
  const ticking = useRef(false);

  stateRef.current = state;
  watchRef.current = watchlist;
  configRef.current = config;

  useEffect(() => {
    saveJson(STORAGE_KEYS.config, config);
  }, [config]);

  useEffect(() => {
    saveJson(STORAGE_KEYS.sniper, {
      ...state,
      // persist snapshots + trades; active handled on load
    });
  }, [state]);

  const tick = useCallback(async () => {
    if (ticking.current) return;
    ticking.current = true;
    try {
      const next = await runSniperTick(
        stateRef.current,
        watchRef.current,
        configRef.current,
      );
      setState(next);
    } finally {
      ticking.current = false;
    }
  }, []);

  useEffect(() => {
    if (!state.active || state.killed) return;
    void tick();
    const id = window.setInterval(() => void tick(), config.tickIntervalMs);
    return () => window.clearInterval(id);
  }, [state.active, state.killed, config.tickIntervalMs, tick]);

  const activate = useCallback(() => {
    setState((s) => ({
      ...s,
      active: true,
      killed: false,
      killReason: undefined,
      lastError: undefined,
    }));
  }, []);

  const deactivate = useCallback(() => {
    setState((s) => ({ ...s, active: false }));
  }, []);

  const kill = useCallback((reason = 'Manual kill switch') => {
    setState((s) => ({
      ...s,
      active: false,
      killed: true,
      killReason: reason,
    }));
  }, []);

  const resetSession = useCallback(() => {
    setState(createInitialSniperState(configRef.current));
  }, []);

  const updateConfig = useCallback((patch: Partial<SniperConfig>) => {
    setConfig((c) => ({ ...c, ...patch }));
  }, []);

  const fundPaper = useCallback((amount: number) => {
    setState((s) => ({
      ...s,
      paperBalanceUsd: s.paperBalanceUsd + Math.max(0, amount),
    }));
  }, []);

  return {
    state,
    config,
    activate,
    deactivate,
    kill,
    resetSession,
    updateConfig,
    fundPaper,
    forceTick: tick,
  };
}
