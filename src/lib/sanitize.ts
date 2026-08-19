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

/** Detect Amazon histogram / widget noise text. */
export function isNoiseText(text: string): boolean {
  if (!text) return false;
  if (/window\.(?:mix_csa|uet)\b/.test(text)) return true;
  if (/\._cr-[A-Za-z0-9_-]+/.test(text) || /\.cr-insights-widget/.test(text)) return true;
  if (/style_[-A-Za-z0-9_]+/.test(text) && /\{[^}]+\}/.test(text)) return true;
  const braceCount = (text.match(/\{/g) || []).length;
  const semicolonCount = (text.match(/;/g) || []).length;
  if (braceCount > 2 || semicolonCount > 3) return true;
  // Amazon star histogram: repeated "star" words with percentages
  if (/\d star\b.*\d star\b/.test(text) && /\d+%/.test(text)) return true;
  if (/\bstars?\b.*\bstar\b.*\bstar\b/.test(text) && text.split('star').length > 5) return true;
  if (/Customer reviews?\d/.test(text)) return true;
  if (/out of 5 stars/.test(text) && /global ratings/.test(text)) return true;
  if (/Visit the Store \|/.test(text)) return true;
  if (/This is a modal window/.test(text)) return true;
  if (/elseif_np|functionP/.test(text)) return true;
  return false;
}

/** Clean a review_summary string: strip noise, return only real review text. */
export function cleanReviewSummary(text: unknown): string {
  const out = sanitizeHtml(text);
  if (!out) return '';
  if (isNoiseText(out)) return '';
  return out;
}

export function cleanReviewHighlights(text: unknown): string {
  const out = sanitizeHtml(text);
  if (!out) return '';
  if (isNoiseText(out)) return '';
  const words = out.split(' ').filter(w => /^[A-Za-z]{3,}$/.test(w));
  if (words.length < 4) return '';
  return out;
}

/** Clean a detail_bullets key: strip RTL marks, newlines, colons, collapse whitespace. */
export function cleanSpecKey(key: string): string {
  return key
    .replace(/[\u200E\u200F\u202A-\u202D]/g, '')
    .replace(/[:：]/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
