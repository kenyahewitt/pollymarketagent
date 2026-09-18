import { useCallback, useEffect, useState } from 'react';
import type { WalletState } from '../types';

const initial: WalletState = {
  evmAddress: null,
  solanaAddress: null,
  chainIdHex: null,
  connecting: false,
  error: null,
};

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>(initial);

  const connectEvm = useCallback(async () => {
    setWallet((w) => ({ ...w, connecting: true, error: null }));
    try {
      if (!window.ethereum) {
        throw new Error('No EIP-1193 provider found. Install MetaMask or similar.');
      }
      const accounts = (await window.ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[];
      const chainIdHex = (await window.ethereum.request({
        method: 'eth_chainId',
      })) as string;
      setWallet((w) => ({
        ...w,
        evmAddress: accounts[0] || null,
        chainIdHex,
        connecting: false,
        error: null,
      }));
    } catch (err) {
      setWallet((w) => ({
        ...w,
        connecting: false,
        error: err instanceof Error ? err.message : 'EVM connect failed',
      }));
    }
  }, []);

  const connectSolana = useCallback(async () => {
    setWallet((w) => ({ ...w, connecting: true, error: null }));
    try {
      if (!window.solana?.isPhantom && !window.solana?.connect) {
        throw new Error('Phantom / window.solana not found.');
      }
      const resp = await window.solana!.connect();
      setWallet((w) => ({
        ...w,
        solanaAddress: resp.publicKey.toString(),
        connecting: false,
        error: null,
      }));
    } catch (err) {
      setWallet((w) => ({
        ...w,
        connecting: false,
        error: err instanceof Error ? err.message : 'Solana connect failed',
      }));
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await window.solana?.disconnect?.();
    } catch {
      /* ignore */
    }
    setWallet(initial);
  }, []);

  useEffect(() => {
    const eth = window.ethereum;
    if (!eth?.on) return;
    const onAccounts = (...args: unknown[]) => {
      const accs = args[0] as string[];
      setWallet((w) => ({ ...w, evmAddress: accs?.[0] || null }));
    };
    const onChain = (...args: unknown[]) => {
      setWallet((w) => ({ ...w, chainIdHex: String(args[0] || '') }));
    };
    eth.on('accountsChanged', onAccounts);
    eth.on('chainChanged', onChain);
    return () => {
      eth.removeListener?.('accountsChanged', onAccounts);
      eth.removeListener?.('chainChanged', onChain);
    };
  }, []);

  return { wallet, connectEvm, connectSolana, disconnect };
}
