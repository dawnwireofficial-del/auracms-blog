import React, { useEffect, useRef, useState } from 'react';
import { KnockProvider, KnockFeedProvider, NotificationIconButton, NotificationFeedPopover } from '@knocklabs/react';
import '@knocklabs/react-notification-feed/dist/index.css';

interface NotificationBellProps {
  currentUser?: { id?: string; uid?: string; email?: string } | null;
  isDarkMode: boolean;
}

function getAnonUserId(): string {
  try {
    let id = localStorage.getItem('dw_knock_anon_id');
    if (!id) {
      id = 'anon-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('dw_knock_anon_id', id);
    }
    return id;
  } catch {
    return 'anon-session';
  }
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ currentUser, isDarkMode }) => {
  const [publicKey, setPublicKey] = useState<string>('');
  const [feedId, setFeedId] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/public/knock-config')
      .then((r) => r.json())
      .then((cfg) => { if (!cancelled && cfg.enabled) { setPublicKey(cfg.publicKey); setFeedId(cfg.feedId || ''); } })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!publicKey || !feedId) return null;

  const userId = currentUser?.id || currentUser?.uid || getAnonUserId();

  return (
    <KnockProvider apiKey={publicKey} user={{ id: userId }}>
      <KnockFeedProvider feedId={feedId} colorMode={isDarkMode ? 'dark' : 'light'}>
        <NotificationIconButton
          ref={buttonRef}
          onClick={() => setIsVisible(!isVisible)}
        />
        <NotificationFeedPopover
          buttonRef={buttonRef as unknown as React.RefObject<HTMLElement | null>}
          isVisible={isVisible}
          onClose={() => setIsVisible(false)}
        />
      </KnockFeedProvider>
    </KnockProvider>
  );
};
