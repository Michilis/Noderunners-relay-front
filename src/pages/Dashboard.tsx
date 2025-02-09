import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertTriangle, Zap, Copy, Activity, Users } from 'lucide-react';
import { useStore } from '../store/useStore';
import { apiService } from '../services/api';
import { Notification } from '../components/Notification';
import { useNotification } from '../hooks/useNotification';

export function Dashboard() {
  const navigate = useNavigate();
  const { user, setUser } = useStore();
  const [uptime, setUptime] = useState<string | null>(null);
  const [activeUsers, setActiveUsers] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const isDemoMode = import.meta.env.VITE_ENABLE_DEMO === 'true';
  const apiUrl = import.meta.env.VITE_API_URL;
  const { isVisible, message, type, showNotification, hideNotification } = useNotification();

  // Check user authentication and fetch status once
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const checkUserStatus = async () => {
      if (!isDemoMode) {
        try {
          const userInfo = await apiService.getUserInfo(user.pubkey);
          setUser({
            ...user,
            isWhitelisted: userInfo.is_whitelisted,
            timeRemaining: userInfo.time_remaining,
            npub: userInfo.npub,
          });
        } catch (error: any) {
          // If user is not found (404) or any other error, assume not whitelisted
          if (error.response?.status === 404 || error) {
            setUser({
              ...user,
              isWhitelisted: false,
            });
          }
          console.error('Failed to fetch user status:', error);
        }
      }
      setLoading(false);
    };

    checkUserStatus();
  }, [user?.pubkey, navigate, setUser, isDemoMode]); // Only run on mount and when these dependencies change

  // Fetch uptime and active users
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
        const response = await fetch(`${apiUrl}/.well-known/nostr.json`);
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

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-4 md:space-y-8">
        {/* Status Banner */}
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
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              <div className="space-y-4">
                <p className="text-orange-400 text-base md:text-lg">
                  One-time Payment Required
                </p>
                <div className="space-y-2">
                  <p className="text-gray-400">
                    To use the Noderunners relay, you need to make a one-time payment of
                    10,000 sats. This payment helps maintain the relay's infrastructure
                    and ensures high-quality service.
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
                    </a>
                    {' '}to support the development of Bitcoin and Nostr projects.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/payment')}
                className="flex items-center justify-center w-full px-4 md:px-6 py-3 md:py-4 bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors font-semibold space-x-2"
              >
                <Zap className="h-5 w-5" />
                <span>Pay 10,000 sats for Access</span>
              </button>
            </div>
          )}
        </div>

        {/* Connection Information */}
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

        {/* Stats Overview */}
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