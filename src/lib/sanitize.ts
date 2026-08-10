export function sanitizeHtml(text: unknown): string {
  if (typeof text !== 'string') return '';
  return text
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cleanReviewHighlights(text: unknown): string {
  const out = sanitizeHtml(text);
  if (!out) return '';
  // Amazon review-widget containers captured script/style/CSS noise via textContent.
  // If the value is dominated by code markers, treat it as noise and hide the box.
  if (/window\.(?:mix_csa|uet)\b/.test(out)) return '';
  if (/\._cr-[A-Za-z0-9_-]+/.test(out) || /\.cr-insights-widget/.test(out)) return '';
  if (/style_[-A-Za-z0-9_]+/.test(out) && /\{[^}]+\}/.test(out)) return '';
  const braceCount = (out.match(/\{/g) || []).length;
  const semicolonCount = (out.match(/;/g) || []).length;
  if (braceCount > 2 || semicolonCount > 3) return '';
  const words = out.split(' ').filter(w => /^[A-Za-z]{3,}$/.test(w));
  if (words.length < 4) return '';
  return out;
}
