import React, { useEffect } from 'react';
import { Check, X } from 'lucide-react';

interface NotificationProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  type?: 'success' | 'error';
}

export function Notification({ message, isVisible, onClose, type = 'success' }: NotificationProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center items-center p-4 pointer-events-none z-50">
      <div
        role="status"
        aria-live="polite"
        className={`bg-surface-container-high border rounded flex items-center space-x-3 px-4 py-3 animate-slide-up text-on-surface shadow-lg ${
          type === 'success' ? 'border-status-success/40' : 'border-status-error/40'
        }`}
      >
        {type === 'success' ? (
          <Check className="h-5 w-5 text-status-success flex-shrink-0" />
        ) : (
          <X className="h-5 w-5 text-status-error flex-shrink-0" />
        )}
        <p className="font-mono text-label-mono">{message}</p>
      </div>
    </div>
  );
}