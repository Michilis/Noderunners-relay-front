import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Flame, Zap, Shield, Globe, Server, Code, Cpu, Copy } from 'lucide-react';
import { Notification } from '../components/Notification';
import { useNotification } from '../hooks/useNotification';

export function Home() {
  const { isVisible, message, type, showNotification, hideNotification } = useNotification();
  const [searchParams] = useSearchParams();
  const isIframe = searchParams.get('iframe') === '1';

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showNotification('Relay URL copied to clipboard');
    } catch (err) {
      console.error('Failed to copy:', err);
      showNotification('Failed to copy URL', 'error');
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Welcome to Noderunners Relay</h1>
          <p className="text-xl text-gray-400 mb-8">
            A high-performance Nostr relay built by Bitcoiners, for Bitcoiners
          </p>
          <Link
            to={isIframe ? '/login?iframe=1' : '/login'}
            className="inline-block px-8 py-4 bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors font-semibold text-lg"
          >
            Get Started
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-gray-800 p-6 rounded-lg">
            <Zap className="h-8 w-8 text-orange-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
            <p className="text-gray-400">
              Built with performance in mind, ensuring your messages are delivered instantly
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <Shield className="h-8 w-8 text-orange-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Secure</h3>
            <p className="text-gray-400">
              Your data is protected with state-of-the-art encryption and security measures
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <Globe className="h-8 w-8 text-orange-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Hosted by Azzamo</h3>
            <p className="text-gray-400">
              Reliable infrastructure with 24/7 monitoring and maintenance
            </p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-8 mb-16">
          <h2 className="text-2xl font-bold mb-6">Relay Information</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-gray-900 p-4 rounded-lg">
                <p className="text-gray-400 mb-2">Relay URL</p>
                <div className="flex items-center justify-between">
                  <code className="text-white break-all">wss://relay.noderunners.network</code>
                  <button
                    onClick={() => copyToClipboard('wss://relay.noderunners.network')}
                    className="ml-4 p-2 hover:bg-gray-800 rounded transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="bg-gray-900 p-4 rounded-lg">
                <p className="text-gray-400 mb-1">Software</p>
                <p className="text-white">{import.meta.env.VITE_RELAY_SOFTWARE}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Technical Specifications</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Server className="h-5 w-5 mr-2 text-orange-500" />
                Supported NIPs
              </h3>
              <div className="bg-gray-900 p-4 rounded-lg">
                <div className="grid grid-cols-4 gap-2">
                  {import.meta.env.VITE_SUPPORTED_NIPS.split(',').map(nip => (
                    <span key={nip} className="bg-gray-800 px-3 py-1 rounded text-center">
                      {nip}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Cpu className="h-5 w-5 mr-2 text-orange-500" />
                Features
              </h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center">
                  <Code className="h-4 w-4 mr-2 text-orange-500" />
                  High-performance strfry backend
                </li>
                <li className="flex items-center">
                  <Code className="h-4 w-4 mr-2 text-orange-500" />
                  Paid relay with Lightning Network
                </li>
                <li className="flex items-center">
                  <Code className="h-4 w-4 mr-2 text-orange-500" />
                  Advanced spam protection
                </li>
                <li className="flex items-center">
                  <Code className="h-4 w-4 mr-2 text-orange-500" />
                  24/7 monitoring and maintenance
                </li>
              </ul>
            </div>
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