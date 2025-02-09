import { useState, useCallback } from 'react';

export function useNotification() {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'success' | 'error'>('success');

  const showNotification = useCallback((text: string, notificationType: 'success' | 'error' = 'success') => {
    setMessage(text);
    setType(notificationType);
    setIsVisible(true);
  }, []);

  const hideNotification = useCallback(() => {
    setIsVisible(false);
  }, []);

  return {
    isVisible,
    message,
    type,
    showNotification,
    hideNotification
  };
}