import type { AgentWallet } from '../types';
import { LIVE_MODE_NOTE, STORAGE_KEYS } from './constants';
import { loadJson, saveJson } from './storage';

/** Simple deterministic hex from a seed string (demo only — not a real key derivation). */
function hashToHex(seed: string, length: number): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < seed.length; i++) {
    const c = seed.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= c;
    h2 = Math.imul(h2, 0x811c9dc5);
  }
  const out: string[] = [];
  let a = h1 >>> 0;
  let b = h2 >>> 0;
  while (out.length < length) {
    a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
    b = (Math.imul(b, 22695477) + 1) >>> 0;
    const nibble = ((a ^ b) >>> 0).toString(16).padStart(8, '0');
    for (const ch of nibble) {
      if (out.length < length) out.push(ch);
    }
  }
  return out.join('');
}

/** Base58 alphabet for demo Solana-looking address */
const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function hashToBase58(seed: string, length: number): string {
  let h = 0xdeadbeef;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 2654435761);
  }
  const chars: string[] = [];
  let x = h >>> 0;
  while (chars.length < length) {
    x = (Math.imul(x, 1103515245) + 12345) >>> 0;
    chars.push(B58[x % 58]);
  }
  return chars.join('');
}

function createAgentWallet(): AgentWallet {
  const seed =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `pma-${Date.now()}-${Math.random()}`;
  const storedSeed = loadJson<string | null>(STORAGE_KEYS.agent + '_seed', null);
  const finalSeed = storedSeed || seed;
  if (!storedSeed) saveJson(STORAGE_KEYS.agent + '_seed', finalSeed);

  return {
    paperEvmAddress: '0x' + hashToHex(finalSeed + ':evm', 40),
    paperSolanaAddress: hashToBase58(finalSeed + ':sol', 44),
    liveNote: LIVE_MODE_NOTE,
  };
}

export function getOrCreateAgentWallet(): AgentWallet {
  const existing = loadJson<AgentWallet | null>(STORAGE_KEYS.agent, null);
  if (existing?.paperEvmAddress && existing?.paperSolanaAddress) {
    return { ...existing, liveNote: LIVE_MODE_NOTE };
  }
  const created = createAgentWallet();
  saveJson(STORAGE_KEYS.agent, created);
  return created;
}
