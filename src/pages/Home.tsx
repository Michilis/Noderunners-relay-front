import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Zap, Lock, Server, Check } from 'lucide-react';
import { Notification } from '../components/Notification';
import { useNotification } from '../hooks/useNotification';
import { useRelayInfo } from '../hooks/useRelayInfo';
import { formatSoftware, formatSupportedNips } from '../services/nip11';
import { apiService } from '../services/api';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n';
import {
  Button,
  Card,
  Input,
  MetricCard,
  NipBadge,
  StatusChip,
  TerminalPanel,
} from '../components/ui';
import { NostrFeedSection } from '../components/feed/NostrFeedSection';

const RELAY_URL = import.meta.env.VITE_NOSTR_RELAY_URL ?? '';

export function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useStore();
  const { t } = useTranslation();
  const { isVisible, message, type, showNotification, hideNotification } = useNotification();
  const isIframe = searchParams.get('iframe') === '1';
  const withIframe = (path: string) => (isIframe ? `${path}?iframe=1` : path);

  const { info, loading: nipsLoading } = useRelayInfo();
  const supportedNips = formatSupportedNips(info?.supported_nips);
  const software = formatSoftware(info);

  const [uptime, setUptime] = useState<string | null>(null);
  const [yearlySats, setYearlySats] = useState<number | null>(null);
  const [lifetimeSats, setLifetimeSats] = useState<number | null>(null);
  const [npubInput, setNpubInput] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fetchUptime = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_UPTIME_KUMA_URL}/api/status-page/heartbeat/${import.meta.env.VITE_UPTIME_KUMA_ID}`,
        );
        const data = await res.json();
        const pct = ((data.uptime / data.total) * 100).toFixed(3);
        if (!cancelled) setUptime(`${pct}%`);
      } catch {
        if (!cancelled) setUptime(null);
      }
    };

    void apiService
      .getPricing()
      .then((p) => {
        if (!cancelled) {
          setYearlySats(p.yearly_sats);
          setLifetimeSats(p.lifetime_sats);
        }
      })
      .catch(() => {});

    void fetchUptime();
    return () => {
      cancelled = true;
    };
  }, []);

  const copyRelayUrl = async () => {
    try {
      await navigator.clipboard.writeText(RELAY_URL);
      showNotification(t('home.notifyCopied'));
    } catch {
      showNotification(t('home.notifyCopyFailed'), 'error');
    }
  };

  const handleNpubConnect = () => {
    const value = npubInput.trim();
    if (!value) {
      showNotification(t('home.notifyEnterNpub'), 'error');
      return;
    }
    setUser({ pubkey: value, isWhitelisted: false });
    navigate(withIframe('/dashboard'));
  };

  const yearlyLabel = yearlySats != null ? yearlySats.toLocaleString() : '…';
  const lifetimeLabel = lifetimeSats != null ? lifetimeSats.toLocaleString() : '…';

  return (
    <>
      <div className="max-w-container-max mx-auto space-y-24 md:space-y-32">
        {/* Hero */}
        <section className="flex flex-col items-center justify-center text-center space-y-6 pt-4">
          <StatusChip tone={uptime ? 'success' : 'warning'} pulse>
            {uptime ? t('home.statusOnline') : t('home.statusConnecting')}
          </StatusChip>
          <p className="font-mono text-label-mono uppercase tracking-widest text-primary">
            {t('home.heroTagline')}
          </p>
          <h1 className="font-display text-4xl md:text-[64px] md:leading-[72px] font-bold text-on-surface max-w-4xl tracking-tight">
            {t('home.heroTitle1')} <br />
            <span className="text-primary">{t('home.heroTitle2')}</span>
          </h1>
          <p className="font-body text-body-lg text-secondary max-w-2xl mx-auto">
            {t('home.heroSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <Button size="lg" className="w-full sm:w-auto" onClick={() => navigate(withIframe('/login'))}>
              {t('home.connectNow')}
            </Button>
          </div>
        </section>

        {/* Value props */}
        <section id="specs" className="grid grid-cols-1 md:grid-cols-3 gap-4 scroll-mt-24">
          <Card className="p-6 flex flex-col gap-4 hover:bg-surface-container transition-colors">
            <Zap className="h-8 w-8 text-primary" />
            <h3 className="font-display text-headline-md font-semibold text-on-surface">{t('home.featFastTitle')}</h3>
            <p className="text-secondary font-body text-body-md">
              {t('home.featFastDesc')}
            </p>
          </Card>
          <Card className="p-6 flex flex-col gap-4 hover:bg-surface-container transition-colors">
            <Lock className="h-8 w-8 text-primary" />
            <h3 className="font-display text-headline-md font-semibold text-on-surface">{t('home.featSecureTitle')}</h3>
            <p className="text-secondary font-body text-body-md">
              {t('home.featSecureDesc')}
            </p>
          </Card>
          <Card className="p-6 flex flex-col gap-4 hover:bg-surface-container transition-colors">
            <Server className="h-8 w-8 text-primary" />
            <h3 className="font-display text-headline-md font-semibold text-on-surface">{t('home.featHostedTitle')}</h3>
            <p className="text-secondary font-body text-body-md">
              {t('home.featHostedDesc')}
            </p>
          </Card>
        </section>

        {/* Relay connection + specs */}
        <section className="flex flex-col space-y-12">
          <Card elevated className="p-6 md:p-8 flex flex-col space-y-6">
            <div>
              <h2 className="font-display text-headline-lg font-semibold text-on-surface mb-2">
                {t('home.relayTitle')}
              </h2>
              <p className="text-secondary font-body text-body-md">
                {t('home.relaySubtitle')}
              </p>
            </div>

            <TerminalPanel value={RELAY_URL} onCopy={copyRelayUrl} />

            <div className="space-y-4">
              <h4 className="font-mono text-label-mono text-secondary uppercase tracking-widest">
                {t('home.supportedNips')}
              </h4>
              {supportedNips.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {supportedNips.map((nip) => (
                    <NipBadge key={nip}>{nip}</NipBadge>
                  ))}
                </div>
              ) : (
                <p className="font-mono text-label-sm-mono text-secondary">
                  {nipsLoading
                    ? t('home.fetchingRelay')
                    : t('home.relayUnavailable')}
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-surface-variant flex items-center justify-between">
              <span className="font-mono text-label-mono text-secondary">{t('home.currentUptime')}</span>
              <span className="font-mono text-label-mono text-status-success font-bold">
                {uptime ?? '—'}
              </span>
            </div>
          </Card>

          {/* Metric grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label={t('home.metricLatency')} value="<1" unit="ms" />
            <MetricCard label={t('home.metricThroughput')} value="100k+" unit="ev/s" />
            <MetricCard
              label={t('home.metricArchitecture')}
              size="md"
              value={software ?? t('home.metricArchitectureValue')}
              note={t('home.metricArchitectureNote')}
            />
            <MetricCard
              label={t('home.metricStorage')}
              size="md"
              value={t('home.metricStorageValue')}
              note={t('home.metricStorageNote')}
            />
          </div>
        </section>

        {/* Access tiers */}
        <section id="pricing" className="space-y-8 scroll-mt-24">
          <div className="text-center">
            <h2 className="font-display text-headline-lg font-semibold text-on-surface">{t('home.tiersTitle')}</h2>
            <p className="text-secondary font-body text-body-md mt-2">
              {t('home.tiersSubtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Yearly */}
            <Card className="p-8 flex flex-col items-center text-center">
              <h3 className="font-display text-headline-md font-semibold text-on-surface mb-2">
                {t('home.yearlyTitle')}
              </h3>
              <div className="flex items-baseline gap-2 mb-6 justify-center">
                <span className="font-display text-display font-bold text-primary">{yearlyLabel}</span>
                <span className="font-mono text-label-mono text-secondary uppercase">{t('home.yearlyUnit')}</span>
              </div>
              <ul className="space-y-4 mb-8 flex-grow text-left">
                {[
                  t('home.yearlyFeat1'),
                  t('home.yearlyFeat2'),
                  t('home.yearlyFeat3'),
                  t('home.yearlyFeat4'),
                ].map(
                  (feat) => (
                    <li key={feat} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="font-body text-body-md text-on-surface">{feat}</span>
                    </li>
                  ),
                )}
              </ul>
              <Button variant="outline" className="w-full" onClick={() => navigate(withIframe('/login'))}>
                {t('home.selectYearly')}
              </Button>
            </Card>

            {/* Lifetime */}
            <Card accent elevated className="p-8 flex flex-col items-center text-center relative">
              <div className="absolute top-4 right-4 px-2 py-1 bg-primary-container text-white font-mono text-label-sm-mono uppercase tracking-wider rounded">
                {t('home.recommended')}
              </div>
              <h3 className="font-display text-headline-md font-semibold text-on-surface mb-2">
                {t('home.lifetimeTitle')}
              </h3>
              <div className="flex items-baseline gap-2 mb-6 justify-center">
                <span className="font-display text-display font-bold text-primary">{lifetimeLabel}</span>
                <span className="font-mono text-label-mono text-secondary uppercase">{t('home.lifetimeUnit')}</span>
              </div>
              <ul className="space-y-4 mb-8 flex-grow text-left">
                {[
                  t('home.lifetimeFeat1'),
                  t('home.lifetimeFeat2'),
                  t('home.lifetimeFeat3'),
                  t('home.lifetimeFeat4'),
                ].map((feat) => (
                  <li key={feat} className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="font-body text-body-md text-on-surface">{feat}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full" onClick={() => navigate(withIframe('/login'))}>
                {t('home.selectLifetime')}
              </Button>
            </Card>
          </div>
        </section>

        {/* Live relay activity */}
        <NostrFeedSection />

        {/* Join the network */}
        <section>
          <Card className="p-8 md:p-12 text-center max-w-3xl mx-auto space-y-6">
            <h2 className="font-display text-headline-lg font-semibold text-on-surface">
              {t('home.joinTitle')}
            </h2>
            <p className="text-secondary font-body text-body-md max-w-xl mx-auto">
              {t('home.joinSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row max-w-lg mx-auto gap-2">
              <Input
                className="flex-grow"
                placeholder="npub1..."
                type="text"
                aria-label={t('home.verifyPay')}
                value={npubInput}
                onChange={(e) => setNpubInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNpubConnect();
                }}
              />
              <Button className="whitespace-nowrap" onClick={handleNpubConnect}>
                {t('home.verifyPay')}
              </Button>
            </div>
          </Card>
        </section>
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
