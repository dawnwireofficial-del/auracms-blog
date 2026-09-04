declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

type EventParams = Record<string, string | number | boolean | undefined>;

export function trackEvent(action: string, category: string, label?: string, value?: number) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
      });
    }
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('trackCustom', action, { category, label, value });
    }
  } catch (e) { console.error(e) }
}

// sendBeacon with a plain string body sends Content-Type: text/plain, which
// express.json() never parses (req.body stays {}). Always wrap in a Blob so
// the payload actually arrives.
function beacon(url: string, data: unknown) {
  try {
    navigator.sendBeacon?.(url, new Blob([JSON.stringify(data)], { type: 'application/json' }));
  } catch (e) { console.error(e) }
}

export function trackAffiliateClick(linkSlug: string, linkTitle: string) {
  trackEvent('affiliate_click', 'affiliate', linkTitle);
  beacon('/api/public/track/affiliate', { slug: linkSlug, title: linkTitle });
}

export function trackConversion(action: string, value?: number) {
  trackEvent('conversion', 'conversion', action, value);
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'conversion', {
        send_to: action,
        value: value,
        currency: 'USD',
      });
    }
  } catch (e) { console.error(e) }
}

export function trackPageView(path: string, title: string, opts?: { productSlug?: string }) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', { page_path: path, page_title: title });
    }
    // Beacon to own analytics
    if (typeof window !== 'undefined') {
      const sessionId = sessionStorage.getItem('dw_session') || (() => {
        const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substring(2);
        sessionStorage.setItem('dw_session', id);
        return id;
      })();
      beacon('/api/public/track/page-view', {
        path,
        referrer: document.referrer || '',
        userAgent: navigator.userAgent,
        sessionId,
        productSlug: opts?.productSlug || undefined,
      });
    }
  } catch (e) { console.error(e) }
}
