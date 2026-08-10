import { store } from './store';
import { toast } from './toastStore';

let installed = false;
let pendingRedirect = false;

export function handleSessionExpired(message = 'Session expired — please sign in again') {
  if (pendingRedirect) return;
  pendingRedirect = true;
  localStorage.removeItem('dawnwire_auth_token');
  store.logout();
  toast.error(message);
  setTimeout(() => {
    const target = window.location.pathname === '/admin' ? '/admin' : '/admin';
    window.history.pushState({}, '', target);
    window.dispatchEvent(new PopStateEvent('popstate'));
    pendingRedirect = false;
  }, 500);
}

// Patches window.fetch so ANY API 401 (stale/expired token) is handled
// globally instead of each component silently failing. Only /api/admin calls
// trigger session expiry — public endpoints use anon keys and can 401 for
// unrelated reasons.
export function installGlobalAuthInterceptor() {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  const originalFetch = window.fetch.bind(window);
  (window as any).fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const res = await originalFetch(input, init);
    if (res.status === 401) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url || '';
      if (url.includes('/api/admin') && !url.includes('/api/auth/login') && !url.includes('/api/auth/me')) {
        handleSessionExpired();
      }
    }
    return res;
  };
}
