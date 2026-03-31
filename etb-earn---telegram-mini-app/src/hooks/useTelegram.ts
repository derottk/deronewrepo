import WebApp from '@twa-dev/sdk';
import { useEffect, useState } from 'react';

export function useTelegram() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (WebApp.initDataUnsafe.user) {
      setUser(WebApp.initDataUnsafe.user);
    }
    WebApp.ready();
    WebApp.expand();
  }, []);

  const onClose = () => {
    WebApp.close();
  };

  const onToggleButton = () => {
    if (WebApp.MainButton.isVisible) {
      WebApp.MainButton.hide();
    } else {
      WebApp.MainButton.show();
    }
  };

  const setMainButtonText = (text: string) => {
    WebApp.MainButton.setText(text);
  };

  const setMainButtonOnClick = (callback: () => void) => {
    WebApp.MainButton.onClick(callback);
  };

  const showAlert = (message: string) => {
    WebApp.showAlert(message);
  };

  const showConfirm = (message: string, callback: (ok: boolean) => void) => {
    WebApp.showConfirm(message, callback);
  };

  const hapticFeedback = (type: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') => {
    WebApp.HapticFeedback.impactOccurred(type);
  };

  return {
    onClose,
    onToggleButton,
    setMainButtonText,
    setMainButtonOnClick,
    showAlert,
    showConfirm,
    hapticFeedback,
    tg: WebApp,
    user,
    queryId: WebApp.initDataUnsafe.query_id,
    initData: WebApp.initData,
  };
}
