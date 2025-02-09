import axios from 'axios';

const LNBITS_URL = import.meta.env.VITE_LNBITS_URL;
const API_KEY = import.meta.env.VITE_LNBITS_API_KEY;

const api = axios.create({
  baseURL: LNBITS_URL,
  headers: {
    'X-Api-Key': API_KEY,
    'Content-Type': 'application/json',
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
      const response = await api.post('/api/v1/payments', {
        out: false,
        amount,
        memo,
        unit,
        webhook,
        internal,
        extra,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  },

  // Check payment status
  async checkPayment(paymentHash: string): Promise<PaymentStatus> {
    try {
      const response = await api.get(`/api/v1/payments/${paymentHash}`);
      return {
        paid: response.data.paid,
        preimage: response.data.preimage,
        details: response.data.details,
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
    try {
      const response = await api.get(`/public/v1/payment/${paymentHash}`, {
        timeout,
      });
      return response.data.paid;
    } catch (error) {
      if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
        return false; // Timeout reached
      }
      console.error('Error polling payment:', error);
      throw error;
    }
  },
};