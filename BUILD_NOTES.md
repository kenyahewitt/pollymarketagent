# BUILD_NOTES — PollyMarketAgent

## How to run

```bash
cd /workspace/pollymarketagent
npm install
npm run build   # must succeed
npm run dev     # local UI
```

## Source files created

```
/workspace/pollymarketagent/
├── .env.example
├── .gitignore
├── BUILD_NOTES.md
├── README.md
├── index.html
├── netlify.toml
├── package.json
├── public/
│   └── favicon.svg
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── vite-env.d.ts
    ├── components/
    │   ├── AgentFundPanel.tsx
    │   ├── FlowSteps.tsx
    │   ├── Header.tsx
    │   ├── PolymarketPanel.tsx
    │   ├── SniperControls.tsx
    │   ├── TradeLog.tsx
    │   └── WatchlistPanel.tsx
    ├── hooks/
    │   ├── useSniper.ts
    │   ├── useWallet.ts
    │   └── useWatchlist.ts
    ├── lib/
    │   ├── agentWallet.ts
    │   ├── constants.ts
    │   ├── polymarket.ts
    │   ├── prices.ts
    │   ├── rateLimit.ts
    │   ├── signals.ts
    │   ├── sniperEngine.ts
    │   └── storage.ts
    ├── styles/
    │   └── global.css
    └── types/
        └── index.ts
```

## Feature checklist

- [x] Connect → Fund → Activate flow UI
- [x] No seed / private key prompts
- [x] Deterministic paper agent deposit addresses
- [x] Live mode documented as server `AGENT_PRIVATE_KEY`
- [x] Sniper buy/sell with momentum / mean-reversion
- [x] Max 20 trades / 15 minutes
- [x] Kill switch, max order, max session loss
- [x] localStorage for snapshots + trades + config + watchlist
- [x] Paper mode via DexScreener / Jupiter (+ synthetic fallback)
- [x] Pre-seed MCCAT, CCAT (4663), LOOPS
- [x] Custom CA paste (Solana / Ethereum / Base / Robinhood)
- [x] Polymarket Gamma + CLOB reads, book, fair value, prepare ticket
- [x] netlify.toml → publish `dist`
- [x] README deploy + `.env.example`

## Notes

- GitHub push is intentionally left to the parent agent.
- `tsc --noEmit` runs as part of `npm run build`.
