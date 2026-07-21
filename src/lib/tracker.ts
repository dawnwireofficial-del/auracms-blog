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

export function trackAffiliateClick(linkSlug: string, linkTitle: string) {
  trackEvent('affiliate_click', 'affiliate', linkTitle);
  try {
    navigator.sendBeacon?.('/api/public/track/affiliate', JSON.stringify({ slug: linkSlug, title: linkTitle }));
  } catch (e) { console.error(e) }
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

export function trackPageView(path: string, title: string) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', { page_path: path, page_title: title });
    }
    // Beacon to own analytics
    if (typeof window !== 'undefined' && navigator.sendBeacon) {
      const sessionId = sessionStorage.getItem('dw_session') || (() => {
        const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substring(2);
        sessionStorage.setItem('dw_session', id);
        return id;
      })();
      navigator.sendBeacon('/api/public/track/page-view', JSON.stringify({
        path,
        referrer: document.referrer || '',
        userAgent: navigator.userAgent,
        sessionId,
      }));
    }
  } catch (e) { console.error(e) }
}
