/**
 * Helper utility for formatting Amazon affiliate URLs, injecting tag parameters,
 * tracking affiliate click analytics, and executing clean redirection.
 */

export interface AffiliateRedirectOptions {
  url: string;
  affiliateTag?: string;
  productId?: string;
  productName?: string;
  source?: string;
}

export function formatAmazonAffiliateUrl(rawUrl: string, defaultTag: string = 'dawnwire-20'): string {
  if (!rawUrl) return 'https://www.amazon.com';

  try {
    const urlObj = new URL(rawUrl);
    // Ensure tag is present
    if (!urlObj.searchParams.has('tag')) {
      urlObj.searchParams.set('tag', defaultTag);
    }
    return urlObj.toString();
  } catch {
    // If URL is relative or invalid, try prefixing with amazon domain
    if (rawUrl.includes('amazon.')) {
      const separator = rawUrl.includes('?') ? '&' : '?';
      return rawUrl.includes('tag=') ? rawUrl : `${rawUrl}${separator}tag=${defaultTag}`;
    }
    return rawUrl;
  }
}

export function trackAndRedirectAffiliate(options: AffiliateRedirectOptions): void {
  const { url, affiliateTag = 'dawnwire-20', productId, productName, source = 'buy_button' } = options;
  const finalUrl = formatAmazonAffiliateUrl(url, affiliateTag);

  // Send click analytics beacon / fetch in background (non-blocking)
  try {
    if (productId || productName) {
      fetch('/api/public/affiliate/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          productName,
          affiliateTag,
          targetUrl: finalUrl,
          source,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {});
    }
  } catch {}

  // Open in new tab securely
  window.open(finalUrl, '_blank', 'noopener,noreferrer');
}
