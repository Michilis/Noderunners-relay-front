import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, CheckCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { lnbitsService } from '../services/lnbits';
import { apiService } from '../services/api';
import type { LightningInvoice } from '../types';
import { Notification } from '../components/Notification';
import { useNotification } from '../hooks/useNotification';

export function Payment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, setUser } = useStore();
  const [invoice, setInvoice] = useState<LightningInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isDemoMode = import.meta.env.VITE_ENABLE_DEMO === 'true';
  const { isVisible, message, type, showNotification, hideNotification } = useNotification();
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const isIframe = searchParams.get('iframe') === '1';

  useEffect(() => {
    if (!user) {
      navigate(isIframe ? '/login?iframe=1' : '/login');
      return;
    }

    if (user.isWhitelisted) {
      navigate(isIframe ? '/dashboard?iframe=1' : '/dashboard');
      return;
    }

    const generateInvoice = async () => {
      try {
        const response = await lnbitsService.createInvoice({
          amount: 10000,
          memo: `${import.meta.env.VITE_PAYMENT_MEMO || "Noderunners Relay Access"} - ${user.pubkey}`,
          webhook: import.meta.env.VITE_WEBHOOK_URL,
          extra: {
            pubkey: user.pubkey,
            type: 'relay_access'
          }
        });

        setInvoice({
          paymentRequest: response.payment_request,
          qrCode: response.payment_request,
          paymentHash: response.payment_hash
        });

        pollPaymentStatus(response.payment_hash);
      } catch (err) {
        console.error('Failed to generate invoice:', err);
        setError('Failed to generate invoice. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    generateInvoice();
  }, [user, navigate, isIframe]);

  const handlePaymentSuccess = async () => {
    setShowSuccess(true);
    setTimeout(() => {
      navigate(isIframe ? '/thank-you?iframe=1' : '/thank-you');
    }, 1500);
    return true;
  };

  const pollPaymentStatus = async (paymentHash: string) => {
    const checkPayment = async () => {
      if (checkingPayment) return false;
      
      setCheckingPayment(true);
      try {
        const status = await lnbitsService.checkPayment(paymentHash);
        if (status.paid) {
          return handlePaymentSuccess();
        }
        return false;
      } catch (error) {
        console.error('Error checking payment status:', error);
        return false;
      } finally {
        setCheckingPayment(false);
      }
    };

    const interval = setInterval(async () => {
      const paid = await checkPayment();
      if (paid) {
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showNotification('Lightning invoice copied to clipboard');
    } catch (err) {
      console.error('Failed to copy:', err);
      showNotification('Failed to copy invoice', 'error');
    }
  };

  const handleDemoPayment = () => {
    handlePaymentSuccess();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto bg-gray-800 rounded-lg p-8">
        <div className="text-center text-red-500 mb-4">
          <p>{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="w-full px-6 py-3 bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center">
        <p className="text-red-500">Failed to generate invoice. Please try again.</p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-md mx-auto bg-gray-800 rounded-lg p-8 relative">
        {showSuccess && (
          <div className="absolute inset-0 bg-gray-900/95 flex items-center justify-center rounded-lg animate-fade-in z-10">
            <div className="text-center animate-success-appear">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-xl font-semibold text-white">Payment Received!</p>
            </div>
          </div>
        )}

        <h1 className="text-2xl font-bold mb-6 text-center">Payment Required</h1>
        
        <div className="text-center mb-6">
          <p className="text-3xl font-bold text-orange-500">10,000 sats</p>
          <p className="text-gray-400">One-time payment for relay access</p>
        </div>

        <div className="bg-white p-4 rounded-lg mb-6">
          <QRCodeSVG
            value={invoice.paymentRequest}
            size={256}
            className="w-full h-auto"
            level="L"
          />
        </div>

        <div className="bg-gray-900 rounded-lg mb-6">
          <div className="flex items-center">
            <div className="flex-1 overflow-x-auto whitespace-nowrap p-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
              <code className="font-mono text-sm text-white select-all" onClick={() => copyToClipboard(invoice.paymentRequest)}>
                {invoice.paymentRequest}
              </code>
            </div>
            <button
              onClick={() => copyToClipboard(invoice.paymentRequest)}
              className="p-4 hover:bg-gray-800 transition-colors border-l border-gray-800 flex items-center gap-2"
              title="Copy invoice"
            >
              <Copy className="h-4 w-4" />
              <span className="text-sm">Copy</span>
            </button>
          </div>
        </div>

        <button
          onClick={() => window.open(`lightning:${invoice.paymentRequest}`)}
          className="w-full px-6 py-3 bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors font-semibold mb-4"
        >
          Open in Wallet
        </button>

        {isDemoMode && (
          <button
            onClick={handleDemoPayment}
            className="w-full px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors font-semibold text-gray-300"
          >
            Demo: Simulate Payment
          </button>
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