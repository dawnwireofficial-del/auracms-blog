// Build the cloak redirect URL for a product CTA. Outbound traffic goes ONLY
// through /api/public/go/product/:slug so the server can enforce manual-only
// affiliate links (never ASIN-generated). placement/src is used for click analytics.
export function cloakHref(slug?: string | null, placement?: string, src?: string): string {
  if (!slug) return '';
  const params = new URLSearchParams();
  if (placement) params.set('placement', placement);
  if (src) params.set('src', src);
  const qs = params.toString();
  return `/api/public/go/product/${encodeURIComponent(slug)}${qs ? `?${qs}` : ''}`;
}
