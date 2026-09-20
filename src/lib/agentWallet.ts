import type { AgentWallet } from '../types';
import { LIVE_AGENT_DEPOSITS, LIVE_MODE_NOTE, STORAGE_KEYS } from './constants';
import { loadJson, saveJson } from './storage';

function createAgentWallet(): AgentWallet {
  return {
    paperEvmAddress: LIVE_AGENT_DEPOSITS.evm,
    paperSolanaAddress: LIVE_AGENT_DEPOSITS.solana,
    liveNote: LIVE_MODE_NOTE + ' Deposit only to the addresses shown. Agent keys are not in the browser.',
  };
}

export function getOrCreateAgentWallet(): AgentWallet {
  const existing = loadJson<AgentWallet | null>(STORAGE_KEYS.agent, null);
  if (existing?.paperEvmAddress && existing?.paperSolanaAddress) {
    return {
      paperEvmAddress: LIVE_AGENT_DEPOSITS.evm,
      paperSolanaAddress: LIVE_AGENT_DEPOSITS.solana,
      liveNote: LIVE_MODE_NOTE + ' Deposit only to the addresses shown. Agent keys are not in the browser.',
    };
  }
  const created = createAgentWallet();
  saveJson(STORAGE_KEYS.agent, created);
  return created;
}
