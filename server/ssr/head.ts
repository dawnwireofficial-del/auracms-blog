// Per-page <head> tag injection for SSR pages.
// The SPA shell (dist/index.html) ships with homepage-only title/description/
// canonical/OG tags. Without this, every SSR page (product, category, post)
// tells Google its canonical URL is the homepage — a critical indexing bug.

export interface SsrHead {
  title: string;
  description: string;
  canonical: string;
  ogType?: string;
  ogImage?: string;
}

export interface SsrResult {
  head: SsrHead;
  body: string;
}

function escapeAttr(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function truncateText(s: unknown, max: number): string {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return t.slice(0, Math.max(0, max - 1)).replace(/\s+\S*$/, '') + '…';
}

/**
 * Rewrites the static shell's head tags with per-page values. Uses replacer
 * functions (not string replacements) so `$` sequences in titles/prices are
 * never interpreted as capture-group patterns. Tags that cannot be matched
 * are left untouched.
 */
export function applyHeadTags(html: string, head: SsrHead): string {
  const title = escapeAttr(truncateText(head.title, 180));
  const desc = escapeAttr(truncateText(head.description, 300));
  const canonical = escapeAttr(head.canonical);
  const ogType = escapeAttr(head.ogType || 'website');
  let out = html;

  out = out.replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${title}</title>`);
  out = out.replace(/<link rel="canonical" href="[^"]*"\s*\/?>/i, () => `<link rel="canonical" href="${canonical}" />`);
  out = out.replace(/<link rel="alternate" href="[^"]*"([^>]*hrefLang="en")\s*\/?>/i, (_m, attrs) => `<link rel="alternate" href="${canonical}"${attrs} />`);
  out = out.replace(/<link rel="alternate" href="[^"]*"([^>]*hrefLang="x-default")\s*\/?>/i, (_m, attrs) => `<link rel="alternate" href="${canonical}"${attrs} />`);
  out = out.replace(/<meta name="description" content="[^"]*"\s*\/?>/i, () => `<meta name="description" content="${desc}" />`);
  out = out.replace(/<meta property="og:title" content="[^"]*"\s*\/?>/i, () => `<meta property="og:title" content="${title}" />`);
  out = out.replace(/<meta property="og:description" content="[^"]*"\s*\/?>/i, () => `<meta property="og:description" content="${desc}" />`);
  out = out.replace(/<meta property="og:url" content="[^"]*"\s*\/?>/i, () => `<meta property="og:url" content="${canonical}" />`);
  out = out.replace(/<meta property="og:type" content="[^"]*"\s*\/?>/i, () => `<meta property="og:type" content="${ogType}" />`);
  if (head.ogImage) {
    const ogImg = escapeAttr(head.ogImage);
    out = out.replace(/<meta property="og:image" content="[^"]*"\s*\/?>/i, () => `<meta property="og:image" content="${ogImg}" />`);
    out = out.replace(/<meta name="twitter:image" content="[^"]*"\s*\/?>/i, () => `<meta name="twitter:image" content="${ogImg}" />`);
  }
  out = out.replace(/<meta name="twitter:title" content="[^"]*"\s*\/?>/i, () => `<meta name="twitter:title" content="${title}" />`);
  out = out.replace(/<meta name="twitter:description" content="[^"]*"\s*\/?>/i, () => `<meta name="twitter:description" content="${desc}" />`);

  return out;
}
