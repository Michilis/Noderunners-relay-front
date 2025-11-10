import axios from 'axios';

const LNBITS_URL = import.meta.env.VITE_LNBITS_URL;
const API_KEY = import.meta.env.VITE_LNBITS_API_KEY;

const api = axios.create({
  baseURL: LNBITS_URL,
  headers: {
    'X-Api-Key': API_KEY,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export interface CreateInvoiceParams {
  amount: number;
  memo: string;
  unit?: string;
  webhook?: string;
  internal?: boolean;
  extra?: Record<string, any>;
}

export interface Invoice {
  payment_hash: string;
  payment_request: string;
  checking_id: string;
  amount: number;
  fee: number;
  memo: string;
  time: number;
  bolt11: string;
  preimage: string;
  expiry: number;
  extra: Record<string, any>;
  webhook?: string;
  webhook_status?: number;
}

export interface PaymentStatus {
  paid: boolean;
  preimage?: string;
  details?: {
    bolt11: string;
    checking_id: string;
    pending: boolean;
    amount: number;
    fee: number;
    memo: string;
    time: number;
    payment_hash: string;
  };
}

export const lnbitsService = {
  // Create a new invoice
  async createInvoice({
    amount,
    memo,
    unit = 'sat',
    webhook = '',
    internal = false,
    extra = {},
  }: CreateInvoiceParams): Promise<Invoice> {
    try {
      // Build a V1-safe payload: only include known/supported fields when defined
      const payload: Record<string, any> = {
        out: false,
        amount,
        memo,
      };
      if (unit) payload.unit = unit;
      if (webhook) payload.webhook = webhook;
      if (typeof internal === 'boolean') payload.internal = internal;
      if (extra && Object.keys(extra).length > 0) payload.extra = extra;

      const response = await api.post('/api/v1/payments', payload);
      const data = response.data ?? {};
      // Normalize response to ensure payment_request is always populated for the UI
      const normalized: Invoice = {
        ...data,
        payment_request: data.payment_request || data.bolt11,
        bolt11: data.bolt11 || data.payment_request,
      };
      return normalized;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  },

  // Check payment status
  async checkPayment(paymentHash: string): Promise<PaymentStatus> {
    try {
      const response = await api.get(`/api/v1/payments/${paymentHash}`);
      const data = response.data || {};
      // Normalize potential V1 shapes
      const paid: boolean = (data.paid === true) || (data.status === 'paid') || (data.settled === true);
      return {
        paid,
        preimage: data.preimage,
        details: data.details,
      };
    } catch (error) {
      console.error('Error checking payment:', error);
      throw error;
    }
  },

  // Get wallet info
  async getWalletInfo() {
    try {
      const response = await api.get('/api/v1/wallet');
      return response.data;
    } catch (error) {
      console.error('Error getting wallet info:', error);
      throw error;
    }
  },

  // Get payment history
  async getPaymentHistory(limit = 10) {
    try {
      const response = await api.get('/api/v1/payments', {
        params: {
          limit,
          offset: 0,
          sortby: 'time',
          direction: 'desc',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error getting payment history:', error);
      throw error;
    }
  },

  // Get current exchange rate
  async getExchangeRate(currency: string = 'USD') {
    try {
      const response = await api.get(`/api/v1/rate/${currency.toLowerCase()}`);
      return response.data;
    } catch (error) {
      console.error('Error getting exchange rate:', error);
      throw error;
    }
  },

  // Convert fiat to sats
  async convertFiatToSats(amount: number, from: string = 'USD') {
    try {
      const response = await api.post('/api/v1/conversion', {
        from_: from.toLowerCase(),
        amount,
        to: 'sat',
      });
      return response.data;
    } catch (error) {
      console.error('Error converting fiat to sats:', error);
      throw error;
    }
  },

  // Long poll payment status
  async longPollPayment(paymentHash: string, timeout = 60000): Promise<boolean> {
    // Fallback to authenticated polling against V1 status endpoint to ensure compatibility
    const start = Date.now();
    const pollIntervalMs = 2000;
    while (Date.now() - start < timeout) {
      try {
        const status = await this.checkPayment(paymentHash);
        if (status.paid) return true;
      } catch (error) {
        // If transient error, keep polling until timeout
        if (axios.isAxiosError(error) && (error.response?.status ?? 0) >= 500) {
          // continue
        } else {
          console.error('Error polling payment:', error);
          throw error;
        }
      }
      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }
    return false;
  },
};