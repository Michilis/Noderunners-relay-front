export interface NostrUser {
  pubkey: string;
  isWhitelisted: boolean;
  npub?: string;
  username?: string;
  /** From GET /v1/users when registered */
  subscriptionType?: 'yearly' | 'lifetime' | string;
  /** ISO date string when applicable */
  expiresAt?: string | null;
}

export interface LightningInvoice {
  paymentRequest: string;
  qrCode: string;
  paymentHash: string;
}