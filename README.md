# PollyMarketAgent

Multi-mode trading agent for **pollymarketagent.store**:

1. **PRIMARY — EVM + Solana Sniper** — Connect wallet → fund dedicated agent wallet → activate auto sniper (paper/simulate by default).
2. **SECONDARY — Polymarket** — Gamma + CLOB public reads, order book, explainable fair-value heuristic, prepare-ticket (no unattended signing).

## Quick start

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
npm run preview
```

## Security model

- The UI **never** asks for seed phrases or private keys.
- Paper mode generates a **deterministic demo agent deposit address** client-side (localStorage-backed seed).
- Live mode (future / server) signs with **`AGENT_PRIVATE_KEY`** from server environment only — never `VITE_*`.
- Hard rate limit: **max 20 trades per 15 minutes** (enforced in `src/lib/rateLimit.ts` + sniper engine).
- Kill switch, max order size, max session loss.

## Paper prices

Sniper paper mode fetches public prices from:

- DexScreener (`https://api.dexscreener.com`)
- Jupiter price API (`https://api.jup.ag/price/v2`) for Solana

If APIs fail or a chain (e.g. Robinhood 4663) is sparse, a deterministic synthetic series keeps the paper loop runnable.

## Pre-seed watchlist

| Symbol | Chain | Address |
|--------|-------|---------|
| MCCAT | Solana | `C2WtD354XEvS9gzpJDLqzqkADq7wUtmJg1UzUdmL5a21` |
| CCAT | Robinhood 4663 | `0x78fA081f53ef51cf95d2cF6960c9bf19d05cBc9f` |
| LOOPS | Solana | `7pXbrpmkZuixoqLEWJF5gZ1fwKSwvwkLmiuMHQ7eDTDS` |

Paste additional CAs for Solana, Ethereum, Base, or Robinhood 4663.

## Polymarket

- Markets: `https://gamma-api.polymarket.com`
- Book: `https://clob.polymarket.com`
- Prepare ticket only — no automatic signing.

## Deploy on Netlify + custom domain

1. Push this repo (or connect the folder) to Netlify.
2. Build command: `npm run build` · Publish directory: `dist` (see `netlify.toml`).
3. Domain: add **pollymarketagent.store** in Netlify → Domain management → Add custom domain → follow DNS (apex + `www` if desired).
4. Copy `.env.example` → set any `VITE_*` overrides in Netlify env (optional). Server-only secrets like `AGENT_PRIVATE_KEY` must **not** use the `VITE_` prefix.

SPA fallback is configured via `[[redirects]]` → `/index.html`.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | `tsc --noEmit` + Vite production build |
| `npm run preview` | Preview `dist` locally |

## Stack

Vite · React 18 · TypeScript · plain CSS (dark fintech UI) · thin EIP-1193 / Phantom connectors.
