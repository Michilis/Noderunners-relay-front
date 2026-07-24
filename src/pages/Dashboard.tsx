import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, AlertTriangle, Zap, Activity, Users, LogOut } from 'lucide-react';
import { useStore } from '../store/useStore';
import { apiService } from '../services/api';
import { Notification } from '../components/Notification';
import { useNotification } from '../hooks/useNotification';
import { useTranslation } from '../i18n';
import { Button, Card, MetricCard, Spinner, TerminalPanel } from '../components/ui';

const RELAY_URL = import.meta.env.VITE_NOSTR_RELAY_URL ?? '';

export function Dashboard() {
  const navigate = useNavigate();
  const { user, setUser } = useStore();
  const { t, lang } = useTranslation();
  const isDemoMode = import.meta.env.VITE_ENABLE_DEMO === 'true';
  const [uptime, setUptime] = useState<string | null>(null);
  const [activeUsers, setActiveUsers] = useState<number | null>(null);
  const [lifetimeSats, setLifetimeSats] = useState<number | null>(() =>
    isDemoMode ? 10000 : null
  );
  const [yearlySats, setYearlySats] = useState<number | null>(() =>
    isDemoMode ? 1000 : null
  );
  const [loading, setLoading] = useState(true);
  const apiUrl = import.meta.env.VITE_API_URL;
  const { isVisible, message, type, showNotification, hideNotification } = useNotification();
  const [searchParams] = useSearchParams();
  const isIframe = searchParams.get('iframe') === '1';

  const lifetimeLabel =
    lifetimeSats != null ? `${lifetimeSats.toLocaleString()} sats` : '…';

  const yearlyLabel =
    yearlySats != null ? `${yearlySats.toLocaleString()} sats` : '…';

  useEffect(() => {
    if (isDemoMode) {
      return;
    }
    let cancelled = false;
    void apiService
      .getPricing()
      .then((p) => {
        if (!cancelled) {
          setLifetimeSats(p.lifetime_sats);
          setYearlySats(p.yearly_sats);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLifetimeSats(null);
          setYearlySats(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isDemoMode]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const checkUserStatus = async () => {
      if (!isDemoMode) {
        try {
          const userInfo = await apiService.getUserInfo(user.pubkey);
          if (userInfo) {
            setUser({
              ...user,
              isWhitelisted: userInfo.is_whitelisted,
              npub: userInfo.npub,
              username: userInfo.username,
              subscriptionType: userInfo.subscription_type,
              expiresAt: userInfo.expires_at ?? null,
            });
          } else {
            setUser({
              ...user,
              isWhitelisted: false,
              subscriptionType: undefined,
              expiresAt: undefined,
            });
          }
        } catch (error: unknown) {
          console.error('Failed to fetch user status:', error);
          setUser({
            ...user,
            isWhitelisted: false,
            subscriptionType: undefined,
            expiresAt: undefined,
          });
        }
      }
      setLoading(false);
    };

    void checkUserStatus();
    // Intentionally depend on pubkey only so we don't re-fetch when whitelist state updates from this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync user's pubkey identity only
  }, [user?.pubkey, navigate, setUser, isDemoMode]);

  useEffect(() => {
    const fetchUptime = async () => {
      if (isDemoMode) {
        setUptime('99.99%');
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_UPTIME_KUMA_URL}/api/status-page/heartbeat/${import.meta.env.VITE_UPTIME_KUMA_ID}`
        );
        const data = await response.json();
        const uptimePercentage = ((data.uptime / data.total) * 100).toFixed(2);
        setUptime(`${uptimePercentage}%`);
      } catch (error) {
        console.error('Failed to fetch uptime:', error);
        setUptime('N/A');
      }
    };

    const fetchActiveUsers = async () => {
      if (isDemoMode) {
        setActiveUsers(421);
        return;
      }

      try {
        const base = String(apiUrl ?? '').replace(/\/$/, '');
        const response = await fetch(`${base}/.well-known/nostr.json`);
        const data = await response.json();
        setActiveUsers(data.names ? Object.keys(data.names).length : 0);
      } catch (error) {
        console.error('Failed to fetch active users:', error);
        setActiveUsers(null);
      }
    };

    fetchUptime();
    fetchActiveUsers();

    const uptimeInterval = setInterval(fetchUptime, 60000);
    const usersInterval = setInterval(fetchActiveUsers, 30000);

    return () => {
      clearInterval(uptimeInterval);
      clearInterval(usersInterval);
    };
  }, [isDemoMode, apiUrl]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showNotification(t('dashboard.notifyCopied'));
    } catch (err) {
      console.error('Failed to copy:', err);
      showNotification(t('dashboard.notifyCopyFailed'), 'error');
    }
  };

  const handleLogout = () => {
    setUser(null);
    navigate('/login');
  };

  const toPayment = (plan: 'yearly' | 'lifetime') => {
    const q = new URLSearchParams();
    q.set('plan', plan);
    if (isIframe) q.set('iframe', '1');
    navigate(`/payment?${q.toString()}`);
  };

  const formatExpiry = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(lang, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return iso;
    }
  };

  if (loading || !user) {
    return <Spinner page />;
  }

  const showYearlyRenewal =
    user.isWhitelisted &&
    user.subscriptionType === 'yearly' &&
    Boolean(user.expiresAt);

  return (
    <>
      <div className="max-w-5xl mx-auto space-y-4 md:space-y-8">
        <Card
          elevated
          className={`p-6 md:p-8 ${user.isWhitelisted ? 'border-l-4 border-l-status-success' : 'border-l-4 border-l-primary-container'}`}
        >
          <div className="flex items-center space-x-4 mb-4">
            {user.isWhitelisted ? (
              <Shield className="h-8 md:h-12 w-8 md:w-12 text-status-success" />
            ) : (
              <AlertTriangle className="h-8 md:h-12 w-8 md:w-12 text-primary" />
            )}
            <h1 className="font-display text-headline-lg font-semibold">
              {user.isWhitelisted ? t('dashboard.whitelisted') : t('dashboard.paymentRequired')}
            </h1>
          </div>

          {user.isWhitelisted ? (
            <div className="space-y-4">
              <p className="text-status-success font-body text-body-lg">
                {t('dashboard.fullAccess')}
              </p>
              <p className="text-secondary font-body text-body-md">
                {t('dashboard.useInClient')}
              </p>
              {showYearlyRenewal && user.expiresAt ? (
                <>
                  <p className="text-on-surface font-body text-body-md">
                    {t('dashboard.yearlyActiveUntil')}{' '}
                    <strong className="text-primary">{formatExpiry(user.expiresAt)}</strong>.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button className="flex-1" onClick={() => toPayment('yearly')}>
                      <Zap className="h-5 w-5" />
                      <span>{t('dashboard.addAnotherYear', { price: yearlyLabel })}</span>
                    </Button>
                    <Button variant="secondary" className="flex-1" onClick={() => toPayment('lifetime')}>
                      <Zap className="h-5 w-5" />
                      <span>{t('dashboard.upgradeLifetime', { price: lifetimeLabel })}</span>
                    </Button>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              <div className="space-y-3">
                <p className="text-primary font-body text-body-lg">{t('dashboard.lightningPayment')}</p>
                <p className="text-secondary font-body text-body-md">
                  {t('dashboard.chooseAccess', { yearly: yearlyLabel, lifetime: lifetimeLabel })}
                </p>
                <p className="text-secondary font-body text-body-md">
                  <span className="text-primary">21%</span> {t('dashboard.communityPotText1')}{' '}
                  <a
                    href="https://tip.noderunners.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {t('dashboard.communityPotLink')}
                  </a>{' '}
                  {t('dashboard.communityPotText2')}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="flex-1" onClick={() => toPayment('yearly')}>
                  <Zap className="h-5 w-5" />
                  <span>{t('dashboard.payOneYear', { price: yearlyLabel })}</span>
                </Button>
                <Button variant="secondary" className="flex-1" onClick={() => toPayment('lifetime')}>
                  <Zap className="h-5 w-5" />
                  <span>{t('dashboard.payLifetime', { price: lifetimeLabel })}</span>
                </Button>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6 md:p-8">
          <h2 className="font-display text-headline-md font-semibold mb-4 md:mb-6">
            {t('dashboard.connectionInfo')}
          </h2>
          <p className="font-mono text-label-mono text-secondary uppercase tracking-widest mb-2">
            {t('dashboard.relayUrl')}
          </p>
          <TerminalPanel value={RELAY_URL} onCopy={copyToClipboard} wrap />
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <MetricCard
            label={t('dashboard.uptime')}
            value={
              <span className="inline-flex items-center gap-2">
                <Activity className="h-6 w-6 text-status-success" />
                {uptime || '…'}
              </span>
            }
            note={t('dashboard.last30Days')}
          />
          <MetricCard
            label={t('dashboard.activeUsers')}
            value={
              <span className="inline-flex items-center gap-2">
                <Users className="h-6 w-6 text-secondary" />
                {activeUsers != null ? activeUsers.toLocaleString() : '…'}
              </span>
            }
            note={t('dashboard.registeredNpubs')}
          />
        </div>

        {isIframe && (
          <div className="flex justify-center">
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
              <span>{t('dashboard.logOut')}</span>
            </Button>
          </div>
        )}
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
