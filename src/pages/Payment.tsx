import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, CheckCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { apiService } from '../services/api';
import type { LightningInvoice } from '../types';
import { Notification } from '../components/Notification';
import { useNotification } from '../hooks/useNotification';
import { useTranslation } from '../i18n';
import { Button, Card, Spinner } from '../components/ui';

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
  const { t } = useTranslation();
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
              setError('expired');
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
          setError('lightning');
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
        const msg = err instanceof Error && err.message ? err.message : 'generic';
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
      showNotification(t('payment.notifyCopied'));
    } catch (err) {
      console.error('Failed to copy:', err);
      showNotification(t('payment.notifyCopyFailed'), 'error');
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
      ? t('payment.oneYearAccess')
      : resolvedPlan === 'lifetime'
        ? t('payment.lifetimeAccess')
        : '';

  const KNOWN_ERRORS: Record<string, string> = {
    expired: 'payment.errorExpired',
    lightning: 'payment.errorLightningUnavailable',
    generic: 'payment.errorGeneric',
  };
  const displayError = error ? (KNOWN_ERRORS[error] ? t(KNOWN_ERRORS[error]) : error) : null;

  if (showFetchSpinner) {
    return <Spinner page />;
  }

  if (!isDemoMode && !resolvedPlan) {
    return (
      <>
        <Card elevated className="max-w-md mx-auto p-8">
          <h1 className="font-display text-headline-lg font-semibold mb-2 text-center">{t('payment.choosePlan')}</h1>
          <p className="text-secondary font-body text-body-md text-center mb-8">
            {t('payment.choosePlanSub')}
          </p>
          <div className="space-y-4">
            <Button size="lg" onClick={() => navigateWithPlan('yearly')} className="w-full flex-col">
              <span>{t('payment.payOneYear')}</span>
              {pricingYearly != null ? (
                <span className="font-normal text-label-sm-mono opacity-90">
                  {t('payment.perYear', { price: pricingYearly.toLocaleString() })}
                </span>
              ) : null}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigateWithPlan('lifetime')}
              className="w-full flex-col"
            >
              <span>{t('payment.payLifetime')}</span>
              {pricingLifetime != null ? (
                <span className="font-normal text-label-sm-mono text-secondary">
                  {t('payment.oneTime', { price: pricingLifetime.toLocaleString() })}
                </span>
              ) : null}
            </Button>
          </div>
        </Card>
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
      <Card elevated className="max-w-md mx-auto p-8">
        <div className="text-center text-status-error font-body text-body-md mb-4">
          <p>{displayError}</p>
        </div>
        <Button onClick={() => window.location.reload()} className="w-full">
          {t('payment.tryAgain')}
        </Button>
      </Card>
    );
  }

  if (isDemoMode) {
    return (
      <>
        <Card elevated className="max-w-md mx-auto p-8">
          <h1 className="font-display text-headline-lg font-semibold mb-6 text-center">{t('payment.demoTitle')}</h1>
          <Button variant="secondary" onClick={handleDemoPayment} className="w-full">
            {t('payment.demoSimulate')}
          </Button>
        </Card>
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
        <p className="text-status-error font-body text-body-md">{t('payment.failedInvoice')}</p>
      </div>
    );
  }

  const satsLabel =
    amountSats != null ? `${amountSats.toLocaleString()} sats` : expectedSatsHint ?? '—';

  const countdown =
    expiresAtIso && Date.parse(expiresAtIso) > nowTick
      ? formatInvoiceCountdown(expiresAtIso, nowTick)
      : expiresAtIso
        ? t('payment.expired')
        : null;

  return (
    <>
      <Card elevated className="max-w-md mx-auto p-8 relative">
        {showSuccess && (
          <div className="absolute inset-0 bg-background/95 flex items-center justify-center rounded animate-fade-in z-10">
            <div className="text-center animate-success-appear">
              <CheckCircle className="h-16 w-16 text-status-success mx-auto mb-4" />
              <p className="font-display text-headline-md font-semibold text-on-surface">
                {t('payment.paymentReceived')}
              </p>
            </div>
          </div>
        )}

        <h1 className="font-display text-headline-lg font-semibold mb-6 text-center">{t('payment.paymentRequired')}</h1>

        <div className="text-center mb-6">
          <p className="font-display text-display font-bold text-primary">{satsLabel}</p>
          <p className="text-secondary font-body text-body-md">{planSubtitle}</p>
          {countdown != null ? (
            <p className="font-mono text-label-sm-mono text-status-warning mt-3">
              {t('payment.invoiceExpiresIn', { countdown })}
            </p>
          ) : null}
        </div>

        <div className="bg-white p-4 rounded mb-6">
          <QRCodeSVG value={invoice.paymentRequest} size={256} className="w-full h-auto" level="L" />
        </div>

        <div className="terminal-panel rounded mb-6">
          <div className="flex items-center">
            <div className="flex-1 overflow-x-auto whitespace-nowrap p-4">
              <code
                className="font-mono text-label-sm-mono text-terminal-fg select-all"
                onClick={() => copyToClipboard(invoice.paymentRequest)}
              >
                {invoice.paymentRequest}
              </code>
            </div>
            <button
              onClick={() => copyToClipboard(invoice.paymentRequest)}
              className="p-4 hover:bg-white/5 transition-colors border-l border-terminal-border flex items-center gap-2 text-terminal-fg"
              title="Copy invoice"
            >
              <Copy className="h-4 w-4" />
              <span className="font-mono text-label-sm-mono">{t('payment.copy')}</span>
            </button>
          </div>
        </div>

        <Button
          onClick={() => window.open(`lightning:${invoice.paymentRequest}`)}
          className="w-full"
        >
          {t('payment.openWallet')}
        </Button>
      </Card>
      <Notification
        isVisible={isVisible}
        message={message}
        type={type}
        onClose={hideNotification}
      />
    </>
  );
}
