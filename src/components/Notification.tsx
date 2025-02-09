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
      <div className="bg-gray-800 text-white rounded-lg shadow-lg flex items-center space-x-3 px-4 py-3 animate-slide-up">
        {type === 'success' ? (
          <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
        ) : (
          <X className="h-5 w-5 text-red-500 flex-shrink-0" />
        )}
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
}