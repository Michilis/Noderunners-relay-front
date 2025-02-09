import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Zap } from 'lucide-react';
import { useStore } from '../store/useStore';

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, setUser } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [pubkeyInput, setPubkeyInput] = useState('');
  const isIframe = searchParams.get('iframe') === '1';

  useEffect(() => {
    if (user) {
      navigate(isIframe ? '/dashboard?iframe=1' : '/dashboard');
    }
  }, [user, navigate, isIframe]);

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
    } catch (error: any) {
      if (error.message === 'Rejected by user') {
        return;
      }
      console.error('Login failed:', error);
      
      if (error.message.includes('Nostr provider not found')) {
        alert('No Nostr extension detected. Please install Alby or another Nostr extension and try again.');
      } else if (error.message.includes('No public key found')) {
        alert('Could not access your Nostr public key. Please make sure you\'re logged into your Nostr extension.');
      } else if (error.message !== 'Rejected by user') {
        alert('Failed to connect. Please make sure you have a Nostr extension installed and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePubkeyLogin = async () => {
    if (!pubkeyInput.trim()) {
      alert('Please enter a public key or npub');
      return;
    }

    setIsLoading(true);
    try {
      setUser({ pubkey: pubkeyInput.trim(), isWhitelisted: false });
      navigate(isIframe ? '/dashboard?iframe=1' : '/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      alert('Failed to login with the provided public key. Please check the format and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-800 rounded-lg p-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Connect with Nostr</h1>
      
      <p className="text-gray-400 mb-6">
        To access the Noderunners relay, connect using your Nostr account.
        You can use a Nostr extension or enter your public key manually.
      </p>

      <div className="space-y-4">
        <button
          onClick={handleExtensionLogin}
          disabled={isLoading}
          className={`w-full px-6 py-3 bg-orange-500 rounded-lg font-semibold flex items-center justify-center space-x-2
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-600'} transition-colors`}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <Zap className="h-5 w-5" />
              <span>Sign in with Extension</span>
            </>
          )}
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-800 text-gray-400">Or enter manually</span>
          </div>
        </div>

        <div className="space-y-3">
          <label htmlFor="pubkey" className="block text-sm font-medium text-gray-300">
            Enter your Nostr public key or npub
          </label>
          <input
            type="text"
            id="pubkey"
            value={pubkeyInput}
            onChange={(e) => setPubkeyInput(e.target.value)}
            placeholder="npub1... or hex public key"
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-500"
          />
          <button
            onClick={handlePubkeyLogin}
            disabled={isLoading || !pubkeyInput.trim()}
            className={`w-full px-6 py-3 bg-gray-700 rounded-lg font-semibold
              ${isLoading || !pubkeyInput.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600'} 
              transition-colors`}
          >
            Continue
          </button>
        </div>
      </div>

      <p className="mt-4 text-sm text-gray-400 text-center hidden md:block">
        Don't have a Nostr extension?{' '}
        <a
          href="https://getalby.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-orange-500 hover:underline"
        >
          Get Alby
        </a>
      </p>
    </div>
  );
}