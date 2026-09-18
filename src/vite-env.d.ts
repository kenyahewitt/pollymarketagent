/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
  readonly VITE_DOMAIN?: string;
  readonly VITE_DEXSCREENER_API?: string;
  readonly VITE_JUPITER_PRICE_API?: string;
  readonly VITE_GAMMA_API?: string;
  readonly VITE_CLOB_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  ethereum?: {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    on?: (event: string, handler: (...args: unknown[]) => void) => void;
    removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
    isMetaMask?: boolean;
  };
  solana?: {
    isPhantom?: boolean;
    connect: () => Promise<{ publicKey: { toString: () => string } }>;
    disconnect: () => Promise<void>;
    publicKey?: { toString: () => string } | null;
    on?: (event: string, handler: (...args: unknown[]) => void) => void;
  };
}
