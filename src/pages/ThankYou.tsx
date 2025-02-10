import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Copy, ArrowRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import confetti from 'canvas-confetti';
import { Notification } from '../components/Notification';
import { useNotification } from '../hooks/useNotification';

export function ThankYou() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useStore();
  const { isVisible, message, type, showNotification, hideNotification } = useNotification();
  const relayUrl = import.meta.env.VITE_NOSTR_RELAY_URL;
  const isIframe = searchParams.get('iframe') === '1';

  useEffect(() => {
    if (!user) {
      navigate(isIframe ? '/login?iframe=1' : '/login');
      return;
    }

    // Trigger confetti animation
    const duration = 2000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: NodeJS.Timer = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, [user, navigate, isIframe]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showNotification('Relay URL copied to clipboard');
    } catch (err) {
      console.error('Failed to copy:', err);
      showNotification('Failed to copy URL', 'error');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="mb-12">
        <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
        <h1 className="text-4xl font-bold mb-4">
          Welcome to the Noderunners Relay!
        </h1>
        <p className="text-xl text-gray-400 mb-8">
          Your payment has been received and processed successfully.
        </p>
      </div>

      <div className="bg-gray-800 rounded-lg p-8 mb-8">
        <h2 className="text-2xl font-semibold mb-6">Connect Your Nostr Client</h2>
        <p className="text-gray-400 mb-6">
          Add the following relay URL to your Nostr client to start using the Noderunners relay:
        </p>
        
        <div className="bg-gray-900 p-4 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <code className="text-orange-500 text-lg">{relayUrl}</code>
            <button
              onClick={() => copyToClipboard(relayUrl)}
              className="ml-4 p-2 hover:bg-gray-800 rounded-lg transition-colors group"
              title="Copy to clipboard"
            >
              <Copy className="h-5 w-5 text-gray-400 group-hover:text-white" />
            </button>
          </div>
        </div>

        <div className="text-left space-y-2 text-gray-400">
          <p className="flex items-center">
            <ArrowRight className="h-4 w-4 mr-2 text-orange-500" />
            Your account is now whitelisted and ready to use
          </p>
          <p className="flex items-center">
            <ArrowRight className="h-4 w-4 mr-2 text-orange-500" />
            You can start posting and receiving messages immediately
          </p>
          <p className="flex items-center">
            <ArrowRight className="h-4 w-4 mr-2 text-orange-500" />
            Access is permanent and doesn't require renewal
          </p>
        </div>
      </div>

      <button
        onClick={() => navigate(isIframe ? '/dashboard?iframe=1' : '/dashboard')}
        className="px-8 py-4 bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
      >
        Go to Dashboard
      </button>

      <Notification
        isVisible={isVisible}
        message={message}
        type={type}
        onClose={hideNotification}
      />
    </div>
  );
}