export interface NostrUser {
  pubkey: string;
  isWhitelisted: boolean;
  timeRemaining?: number;
  npub?: string;
}

export interface LightningInvoice {
  paymentRequest: string;
  qrCode: string;
  paymentHash: string;
}

export interface UserResponse {
  pubkey: string;
  npub: string;
  time_remaining?: number;
  is_whitelisted: boolean;
}