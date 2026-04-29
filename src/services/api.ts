const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export interface ApiUserResponse {
  pubkey: string;
  npub: string;
  is_whitelisted: boolean;
  username?: string;
  expires_at?: string | null;
  expired_at?: string;
  subscription_type?: string;
  in_grace?: boolean;
  reserved_username?: string;
}

export interface PricingResponse {
  yearly_sats: number;
  lifetime_sats: number;
  lightning_enabled: boolean;
}

export interface CreateInvoiceResponse {
  payment_hash: string;
  payment_request: string;
  amount_sats: number;
  expires_at: string;
  username: string;
  is_renewal: boolean;
}

export type InvoiceStatusKind = 'pending' | 'paid' | 'expired';

export interface InvoiceStatusResponse {
  payment_hash: string;
  status: InvoiceStatusKind;
  username: string;
}

export interface ApiErrorBody {
  error: string;
  detail: string;
}

async function parseJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export const apiService = {
  /** GET /v1/users/{pubkey} — pubkey may be hex or npub */
  async getUserInfo(pubkey: string): Promise<ApiUserResponse | null> {
    if (!API_URL) {
      console.error('VITE_API_URL is not set');
      return null;
    }
    try {
      const encoded = encodeURIComponent(pubkey.trim());
      const response = await fetch(`${API_URL}/v1/users/${encoded}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        console.error('getUserInfo failed', response.status);
        return null;
      }

      return (await response.json()) as ApiUserResponse;
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  },

  async getPricing(): Promise<PricingResponse> {
    if (!API_URL) {
      throw new Error('VITE_API_URL is not set');
    }
    const response = await fetch(`${API_URL}/v1/pricing`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      const body = (await parseJsonSafe(response)) as ApiErrorBody | null;
      throw new Error(body?.detail ?? `pricing failed (${response.status})`);
    }
    return (await response.json()) as PricingResponse;
  },

  /** POST /v1/invoices — subscription handled server-side (LNbits inside API) */
  async createInvoice(body: {
    username?: string;
    pubkey: string;
    subscription_type: 'lifetime' | 'yearly';
    years?: number;
  }): Promise<CreateInvoiceResponse> {
    if (!API_URL) {
      throw new Error('VITE_API_URL is not set');
    }
    const payload: Record<string, unknown> = {
      pubkey: body.pubkey.trim(),
      subscription_type: body.subscription_type,
    };
    if (body.username?.trim()) {
      payload.username = body.username.trim();
    }
    if (body.subscription_type === 'yearly') {
      payload.years = body.years && body.years > 0 ? body.years : 1;
    }

    const response = await fetch(`${API_URL}/v1/invoices`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await parseJsonSafe(response);
    if (!response.ok) {
      const err = data as ApiErrorBody | null;
      const msg = err?.detail || err?.error || `invoice create failed (${response.status})`;
      throw new Error(msg);
    }
    const o = data as Record<string, unknown>;
    const rawAmt = o.amount_sats;
    const amountParsed =
      typeof rawAmt === 'number'
        ? rawAmt
        : typeof rawAmt === 'string'
          ? Number.parseInt(rawAmt, 10)
          : NaN;
    if (!Number.isFinite(amountParsed)) {
      console.error('createInvoice: unexpected payload', data);
      throw new Error('invalid invoice response from API');
    }
    return { ...(data as Record<string, unknown>), amount_sats: amountParsed } as CreateInvoiceResponse;
  },

  /** GET /v1/invoices/{payment_hash} */
  async getInvoiceStatus(paymentHash: string): Promise<InvoiceStatusResponse> {
    if (!API_URL) {
      throw new Error('VITE_API_URL is not set');
    }
    const encoded = encodeURIComponent(paymentHash.trim());
    const response = await fetch(`${API_URL}/v1/invoices/${encoded}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    const data = await parseJsonSafe(response);
    if (!response.ok) {
      const err = data as ApiErrorBody | null;
      const msg = err?.detail || err?.error || `invoice status failed (${response.status})`;
      throw new Error(msg);
    }
    return data as InvoiceStatusResponse;
  },
};
