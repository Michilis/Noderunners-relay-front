import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import confetti from 'canvas-confetti';
import { Notification } from '../components/Notification';
import { useNotification } from '../hooks/useNotification';
import { useTranslation } from '../i18n';
import { Button, Card, TerminalPanel } from '../components/ui';

export function ThankYou() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useStore();
  const { t } = useTranslation();
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
      showNotification(t('thankYou.notifyCopied'));
    } catch (err) {
      console.error('Failed to copy:', err);
      showNotification(t('thankYou.notifyCopyFailed'), 'error');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="mb-12">
        <CheckCircle className="h-20 w-20 text-status-success mx-auto mb-6" />
        <h1 className="font-display text-4xl md:text-display font-bold mb-4">
          {t('thankYou.title')}
        </h1>
        <p className="font-body text-body-lg text-secondary mb-8">
          {t('thankYou.subtitle')}
        </p>
      </div>

      <Card elevated className="p-8 mb-8 text-left">
        <h2 className="font-display text-headline-md font-semibold mb-4 text-center">
          {t('thankYou.connectTitle')}
        </h2>
        <p className="text-secondary font-body text-body-md mb-6 text-center">
          {t('thankYou.connectSubtitle')}
        </p>

        <TerminalPanel value={relayUrl} onCopy={copyToClipboard} className="mb-6" />

        <div className="space-y-2 text-secondary font-body text-body-md">
          <p className="flex items-center">
            <ArrowRight className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
            {t('thankYou.point1')}
          </p>
          <p className="flex items-center">
            <ArrowRight className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
            {t('thankYou.point2')}
          </p>
          <p className="flex items-center">
            <ArrowRight className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
            {t('thankYou.point3')}
          </p>
        </div>
      </Card>

      <Button size="lg" onClick={() => navigate(isIframe ? '/dashboard?iframe=1' : '/dashboard')}>
        {t('thankYou.goDashboard')}
      </Button>

      <Notification
        isVisible={isVisible}
        message={message}
        type={type}
        onClose={hideNotification}
      />
    </div>
  );
}