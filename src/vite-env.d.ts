/// <reference types="vite/client" />

interface Window {
  nostr: {
    getPublicKey: () => Promise<string>;
    signEvent: (event: Record<string, unknown>) => Promise<Record<string, unknown>>;
    getRelays: () => Promise<{ [url: string]: { read: boolean; write: boolean; } }>;
    nip04: {
      encrypt: (pubkey: string, plaintext: string) => Promise<string>;
      decrypt: (pubkey: string, ciphertext: string) => Promise<string>;
    };
  };
}