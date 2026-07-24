import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n';
import { Button, Card, Input, Spinner } from '../components/ui';

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, setUser } = useStore();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [pubkeyInput, setPubkeyInput] = useState('');
  const isIframe = searchParams.get('iframe') === '1';
  const urlPubkey = searchParams.get('npub') || searchParams.get('pubkey');

  useEffect(() => {
    // Handle URL-based login
    if (urlPubkey && !user) {
      setUser({ pubkey: urlPubkey, isWhitelisted: false });
      navigate(isIframe ? '/dashboard?iframe=1' : '/dashboard');
      return;
    }

    // Regular user redirect
    if (user) {
      navigate(isIframe ? '/dashboard?iframe=1' : '/dashboard');
    }
  }, [user, navigate, isIframe, urlPubkey, setUser]);

  const handleExtensionLogin = async () => {
    setIsLoading(true);
    try {
      let attempts = 0;
      while (!window.nostr && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!window.nostr) {
        throw new Error('Nostr provider not found after waiting');
      }

      const pubkey = await window.nostr.getPublicKey();
      if (!pubkey) {
        throw new Error('No public key found');
      }

      setUser({ pubkey, isWhitelisted: false });
      navigate(isIframe ? '/dashboard?iframe=1' : '/dashboard');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '';
      if (msg === 'Rejected by user') {
        return;
      }
      console.error('Login failed:', error);

      if (msg.includes('Nostr provider not found')) {
        alert(t('login.alertNoExtension'));
      } else if (msg.includes('No public key found')) {
        alert(t('login.alertNoPubkey'));
      } else if (msg !== 'Rejected by user') {
        alert(t('login.alertFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePubkeyLogin = async () => {
    if (!pubkeyInput.trim()) {
      alert(t('login.alertEnterKey'));
      return;
    }

    setIsLoading(true);
    try {
      setUser({ pubkey: pubkeyInput.trim(), isWhitelisted: false });
      navigate(isIframe ? '/dashboard?iframe=1' : '/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      alert(t('login.alertLoginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // If we're processing URL-based login, show loading state
  if (urlPubkey && !user) {
    return <Spinner page />;
  }

  return (
    <Card elevated className="max-w-md mx-auto p-8">
      <h1 className="font-display text-headline-lg font-semibold mb-2 text-center">{t('login.title')}</h1>

      <p className="text-secondary font-body text-body-md mb-6 text-center">
        {t('login.subtitle')}
      </p>

      <div className="space-y-4">
        <Button onClick={handleExtensionLogin} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{t('login.connecting')}</span>
            </>
          ) : (
            <>
              <Zap className="h-5 w-5" />
              <span>{t('login.signInExtension')}</span>
            </>
          )}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-surface-variant"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-2 bg-surface-container-high font-mono text-label-sm-mono text-secondary uppercase tracking-widest">
              {t('login.orEnterManually')}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <label htmlFor="pubkey" className="block font-mono text-label-mono text-secondary">
            {t('login.enterKeyLabel')}
          </label>
          <Input
            type="text"
            id="pubkey"
            value={pubkeyInput}
            onChange={(e) => setPubkeyInput(e.target.value)}
            placeholder={t('login.placeholder')}
          />
          <Button
            variant="secondary"
            onClick={handlePubkeyLogin}
            disabled={isLoading || !pubkeyInput.trim()}
            className="w-full"
          >
            {t('login.continue')}
          </Button>
        </div>
      </div>

      <p className="mt-6 font-body text-body-md text-secondary text-center hidden md:block">
        {t('login.noExtension')}{' '}
        <a
          href="https://getalby.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {t('login.getAlby')}
        </a>
      </p>
    </Card>
  );
}