import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, CheckCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { apiService } from '../services/api';
import type { LightningInvoice } from '../types';
import { Notification } from '../components/Notification';
import { useNotification } from '../hooks/useNotification';

const POLL_MS = 2000;

export type Plan = 'yearly' | 'lifetime';

function formatInvoiceCountdown(expiresAtIso: string, nowMs: number): string {
  const end = new Date(expiresAtIso).getTime();
  const ms = Math.max(0, end - nowMs);
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function Payment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planParam = searchParams.get('plan');
  const resolvedPlan: Plan | null =
    planParam === 'yearly' || planParam === 'lifetime' ? planParam : null;

  const { user } = useStore();
  const isDemoMode = import.meta.env.VITE_ENABLE_DEMO === 'true';
  const [invoice, setInvoice] = useState<LightningInvoice | null>(null);
  const [amountSats, setAmountSats] = useState<number | null>(null);
  const [expiresAtIso, setExpiresAtIso] = useState<string | null>(null);
  const [pricingYearly, setPricingYearly] = useState<number | null>(null);
  const [pricingLifetime, setPricingLifetime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isVisible, message, type, showNotification, hideNotification } = useNotification();
  const [showSuccess, setShowSuccess] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const isIframe = searchParams.get('iframe') === '1';
  const pollingRef = useRef(false);

  const handlePaymentSuccess = useCallback(() => {
    setShowSuccess(true);
    setTimeout(() => {
      navigate(isIframe ? '/thank-you?iframe=1' : '/thank-you');
    }, 1500);
  }, [navigate, isIframe]);

  useEffect(() => {
    if (!expiresAtIso) return;
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [expiresAtIso]);

  useEffect(() => {
    if (isDemoMode || resolvedPlan) return;
    let cancelled = false;
    void apiService
      .getPricing()
      .then((p) => {
        if (!cancelled) {
          setPricingYearly(p.yearly_sats);
          setPricingLifetime(p.lifetime_sats);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isDemoMode, resolvedPlan]);

  /** Auth redirect — separate from invoice fetch so unrelated store updates don't cancel invoice loading. */
  useEffect(() => {
    if (!user) {
      navigate(isIframe ? '/login?iframe=1' : '/login');
      return;
    }
    // Active subscribers may still open /payment?plan=… for renewal or lifetime upgrade.
    if (user.isWhitelisted && !resolvedPlan) {
      navigate(isIframe ? '/dashboard?iframe=1' : '/dashboard');
    }
  }, [user, navigate, isIframe, resolvedPlan]);

  const pubkey = user?.pubkey;

  useEffect(() => {
    if (!pubkey || isDemoMode || !resolvedPlan) {
      return;
    }

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const poll = (paymentHash: string) => {
      intervalId = window.setInterval(() => {
        void (async () => {
          if (pollingRef.current) return;
          pollingRef.current = true;
          try {
            const st = await apiService.getInvoiceStatus(paymentHash);
            if (cancelled) return;
            if (st.status === 'paid') {
              if (intervalId) {
                clearInterval(intervalId);
                intervalId = undefined;
              }
              handlePaymentSuccess();
            }
            if (st.status === 'expired') {
              setError('This invoice has expired. Reload to generate a new one.');
              if (intervalId) {
                clearInterval(intervalId);
                intervalId = undefined;
              }
            }
          } catch (err) {
            console.error('Error checking payment status:', err);
          } finally {
            pollingRef.current = false;
          }
        })();
      }, POLL_MS);
    };

    const run = async () => {
      try {
        const pricing = await apiService.getPricing();
        if (cancelled) return;

        if (!pricing.lightning_enabled) {
          setError('Lightning payments are temporarily unavailable. Please try again later.');
          return;
        }

        setPricingYearly(pricing.yearly_sats);
        setPricingLifetime(pricing.lifetime_sats);

        const response = await apiService.createInvoice({
          pubkey,
          subscription_type: resolvedPlan === 'yearly' ? 'yearly' : 'lifetime',
          years: resolvedPlan === 'yearly' ? 1 : undefined,
        });
        if (cancelled) return;

        setAmountSats(response.amount_sats);
        setExpiresAtIso(response.expires_at);
        setInvoice({
          paymentRequest: response.payment_request,
          qrCode: response.payment_request,
          paymentHash: response.payment_hash,
        });
        poll(response.payment_hash);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to generate invoice:', err);
        const msg = err instanceof Error ? err.message : 'Failed to generate invoice.';
        setError(msg);
      }
    };

    void run();

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [pubkey, isDemoMode, resolvedPlan, handlePaymentSuccess]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showNotification('Lightning invoice copied to clipboard');
    } catch (err) {
      console.error('Failed to copy:', err);
      showNotification('Failed to copy invoice', 'error');
    }
  };

  const handleDemoPayment = () => {
    handlePaymentSuccess();
  };

  if (!user) {
    return null;
  }

  const showFetchSpinner =
    !isDemoMode && !!resolvedPlan && !invoice && !error;

  const navigateWithPlan = (p: Plan) => {
    setError(null);
    const q = new URLSearchParams();
    q.set('plan', p);
    if (isIframe) q.set('iframe', '1');
    navigate(`/payment?${q.toString()}`);
  };

  const expectedSatsHint =
    resolvedPlan === 'yearly'
      ? pricingYearly != null
        ? `${pricingYearly.toLocaleString()} sats`
        : null
      : pricingLifetime != null
        ? `${pricingLifetime.toLocaleString()} sats`
        : null;

  const planSubtitle =
    resolvedPlan === 'yearly'
      ? 'One year of relay access'
      : resolvedPlan === 'lifetime'
        ? 'Lifetime relay access'
        : '';

  if (showFetchSpinner) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isDemoMode && !resolvedPlan) {
    return (
      <>
        <div className="max-w-md mx-auto bg-gray-800 rounded-lg p-8">
          <h1 className="text-2xl font-bold mb-2 text-center">Choose a plan</h1>
          <p className="text-gray-400 text-center mb-8">
            Pick yearly access or pay once for lifetime access.
          </p>
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => navigateWithPlan('yearly')}
              className="w-full px-6 py-4 bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors font-semibold text-lg"
            >
              Pay for one year
              {pricingYearly != null ? (
                <span className="block text-sm font-normal text-orange-100 mt-1">
                  {pricingYearly.toLocaleString()} sats / year
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => navigateWithPlan('lifetime')}
              className="w-full px-6 py-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors font-semibold text-lg border border-gray-600"
            >
              Pay for lifetime
              {pricingLifetime != null ? (
                <span className="block text-sm font-normal text-gray-300 mt-1">
                  {pricingLifetime.toLocaleString()} sats one-time
                </span>
              ) : null}
            </button>
          </div>
        </div>
        <Notification
          isVisible={isVisible}
          message={message}
          type={type}
          onClose={hideNotification}
        />
      </>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto bg-gray-800 rounded-lg p-8">
        <div className="text-center text-red-500 mb-4">
          <p>{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="w-full px-6 py-3 bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (isDemoMode) {
    return (
      <>
        <div className="max-w-md mx-auto bg-gray-800 rounded-lg p-8">
          <h1 className="text-2xl font-bold mb-6 text-center">Payment (demo)</h1>
          <button
            onClick={handleDemoPayment}
            className="w-full px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors font-semibold text-gray-300"
          >
            Demo: Simulate Payment
          </button>
        </div>
        <Notification
          isVisible={isVisible}
          message={message}
          type={type}
          onClose={hideNotification}
        />
      </>
    );
  }

  if (!invoice || !resolvedPlan) {
    return (
      <div className="text-center">
        <p className="text-red-500">Failed to generate invoice. Please try again.</p>
      </div>
    );
  }

  const satsLabel =
    amountSats != null ? `${amountSats.toLocaleString()} sats` : expectedSatsHint ?? '—';

  const countdown =
    expiresAtIso && Date.parse(expiresAtIso) > nowTick
      ? formatInvoiceCountdown(expiresAtIso, nowTick)
      : expiresAtIso
        ? 'Expired'
        : null;

  return (
    <>
      <div className="max-w-md mx-auto bg-gray-800 rounded-lg p-8 relative">
        {showSuccess && (
          <div className="absolute inset-0 bg-gray-900/95 flex items-center justify-center rounded-lg animate-fade-in z-10">
            <div className="text-center animate-success-appear">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-xl font-semibold text-white">Payment Received!</p>
            </div>
          </div>
        )}

        <h1 className="text-2xl font-bold mb-6 text-center">Payment Required</h1>

        <div className="text-center mb-6">
          <p className="text-3xl font-bold text-orange-500">{satsLabel}</p>
          <p className="text-gray-400">{planSubtitle}</p>
          {countdown != null ? (
            <p className="text-sm text-amber-400/90 mt-3 font-mono">
              Invoice expires in {countdown}
            </p>
          ) : null}
        </div>

        <div className="bg-white p-4 rounded-lg mb-6">
          <QRCodeSVG
            value={invoice.paymentRequest}
            size={256}
            className="w-full h-auto"
            level="L"
          />
        </div>

        <div className="bg-gray-900 rounded-lg mb-6">
          <div className="flex items-center">
            <div className="flex-1 overflow-x-auto whitespace-nowrap p-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
              <code className="font-mono text-sm text-white select-all" onClick={() => copyToClipboard(invoice.paymentRequest)}>
                {invoice.paymentRequest}
              </code>
            </div>
            <button
              onClick={() => copyToClipboard(invoice.paymentRequest)}
              className="p-4 hover:bg-gray-800 transition-colors border-l border-gray-800 flex items-center gap-2"
              title="Copy invoice"
            >
              <Copy className="h-4 w-4" />
              <span className="text-sm">Copy</span>
            </button>
          </div>
        </div>

        <button
          onClick={() => window.open(`lightning:${invoice.paymentRequest}`)}
          className="w-full px-6 py-3 bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors font-semibold mb-4"
        >
          Open in Wallet
        </button>
      </div>
      <Notification
        isVisible={isVisible}
        message={message}
        type={type}
        onClose={hideNotification}
      />
    </>
  );
}
