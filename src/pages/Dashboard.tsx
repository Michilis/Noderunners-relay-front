import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, AlertTriangle, Zap, Copy, Activity, Users, LogOut } from 'lucide-react';
import { useStore } from '../store/useStore';
import { apiService } from '../services/api';
import { Notification } from '../components/Notification';
import { useNotification } from '../hooks/useNotification';

export function Dashboard() {
  const navigate = useNavigate();
  const { user, setUser } = useStore();
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
      showNotification('Relay URL copied to clipboard');
    } catch (err) {
      console.error('Failed to copy:', err);
      showNotification('Failed to copy URL', 'error');
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
      return new Date(iso).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return iso;
    }
  };

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const showYearlyRenewal =
    user.isWhitelisted &&
    user.subscriptionType === 'yearly' &&
    Boolean(user.expiresAt);

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-4 md:space-y-8">
        <div className={`p-4 md:p-8 rounded-lg ${user.isWhitelisted ? 'bg-green-900/20' : 'bg-orange-900/20'}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              {user.isWhitelisted ? (
                <Shield className="h-8 md:h-12 w-8 md:w-12 text-green-500" />
              ) : (
                <AlertTriangle className="h-8 md:h-12 w-8 md:w-12 text-orange-500" />
              )}
              <h1 className="text-2xl md:text-3xl font-bold">
                {user.isWhitelisted ? 'Whitelisted' : 'Payment Required'}
              </h1>
            </div>
          </div>

          {user.isWhitelisted ? (
            <div className="space-y-4">
              <p className="text-green-400 text-base md:text-lg">
                ✓ Your account has full access to the Noderunners relay
              </p>
              <p className="text-gray-400">
                You can now use this relay in your Nostr client. Add the relay URL below
                to your client's relay list to start posting and receiving messages.
              </p>
              {showYearlyRenewal && user.expiresAt ? (
                <>
                  <p className="text-gray-300 text-base">
                    Yearly subscription active until{' '}
                    <strong className="text-white">{formatExpiry(user.expiresAt)}</strong>.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => toPayment('yearly')}
                      className="flex flex-1 items-center justify-center px-4 py-3 bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors font-semibold space-x-2"
                    >
                      <Zap className="h-5 w-5" />
                      <span>Add another year ({yearlyLabel})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toPayment('lifetime')}
                      className="flex flex-1 items-center justify-center px-4 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors font-semibold border border-gray-600 space-x-2"
                    >
                      <Zap className="h-5 w-5" />
                      <span>Upgrade to lifetime ({lifetimeLabel})</span>
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              <div className="space-y-4">
                <p className="text-orange-400 text-base md:text-lg">Lightning payment</p>
                <div className="space-y-2">
                  <p className="text-gray-400">
                    Choose yearly access ({yearlyLabel}) or lifetime access ({lifetimeLabel}). Pricing comes from the
                    relay API and funds relay infrastructure.
                  </p>
                  <p className="text-gray-400">
                    <span className="text-orange-400">21%</span> of all payments go to the{' '}
                    <a
                      href="https://tip.noderunners.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-400 hover:underline"
                    >
                      Noderunners community pot
                    </a>{' '}
                    to support the development of Bitcoin and Nostr projects.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => toPayment('yearly')}
                  className="flex flex-1 items-center justify-center px-4 md:px-6 py-3 md:py-4 bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors font-semibold space-x-2"
                >
                  <Zap className="h-5 w-5" />
                  <span>Pay for one year ({yearlyLabel})</span>
                </button>
                <button
                  type="button"
                  onClick={() => toPayment('lifetime')}
                  className="flex flex-1 items-center justify-center px-4 md:px-6 py-3 md:py-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors font-semibold border border-gray-600 space-x-2"
                >
                  <Zap className="h-5 w-5" />
                  <span>Pay for lifetime ({lifetimeLabel})</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-800 rounded-lg p-4 md:p-8">
          <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6">Connection Information</h2>
          <div>
            <p className="text-gray-400 mb-2">Relay URL</p>
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-2">
              <code className="w-full md:flex-1 block bg-gray-900 p-3 md:p-4 rounded-lg font-mono text-sm md:text-base break-all">
                wss://relay.noderunners.network
              </code>
              <button
                onClick={() => copyToClipboard('wss://relay.noderunners.network')}
                className="w-full md:w-auto px-4 py-3 md:p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-center space-x-2"
                title="Copy to clipboard"
              >
                <Copy className="h-5 w-5" />
                <span className="md:hidden">Copy URL</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-gray-800 p-4 md:p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <Activity className="h-6 md:h-8 w-6 md:w-8 text-green-500" />
              <span className="text-xs text-gray-400">Last 30 days</span>
            </div>
            <p className="text-xl md:text-2xl font-bold">{uptime || 'Loading...'}</p>
            <p className="text-gray-400">Uptime</p>
          </div>

          <div className="bg-gray-800 p-4 md:p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-6 md:h-8 w-6 md:w-8 text-blue-500" />
              <span className="text-xs text-gray-400">Registered Users</span>
            </div>
            <p className="text-xl md:text-2xl font-bold">{activeUsers?.toLocaleString() || 'Loading...'}</p>
            <p className="text-gray-400">Active Users</p>
          </div>
        </div>

        {isIframe && (
          <div className="flex justify-center">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
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
