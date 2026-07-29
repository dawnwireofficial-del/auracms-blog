export function safeText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '';
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return '';
}

export function safeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter(v => typeof v === 'string');
  if (typeof value === 'string') return value ? [value] : [];
  return [];
}

export function formatPrice(value: unknown): string {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? `$${value.toFixed(2)}` : '';
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('$')) return trimmed;
    const n = parseFloat(trimmed);
    return isNaN(n) ? trimmed : `$${n.toFixed(2)}`;
  }
  return '';
}

export function safeSpecValue(value: unknown): { display: string; isLong: boolean } {
  if (value === null || value === undefined) return { display: '', isLong: false };
  if (typeof value === 'string') {
    const t = value.trim();
    return { display: t, isLong: t.length > 80 };
  }
  if (typeof value === 'number') {
    return { display: Number.isFinite(value) ? String(value) : '', isLong: false };
  }
  if (typeof value === 'boolean') return { display: value ? 'Yes' : 'No', isLong: false };
  if (Array.isArray(value)) {
    const items = value.filter(v => typeof v === 'string');
    return { display: items.join(', '), isLong: items.some(i => i.length > 60) };
  }
  return { display: '', isLong: false };
}

export function proxyImageUrl(url: unknown): string {
  if (typeof url !== 'string' || !url) return '';
  return url;
}

export function isValidImageUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function normalizeImages(images: unknown): string[] {
  if (Array.isArray(images)) {
    return images
      .map(img => {
        if (typeof img === 'string') return img;
        if (img && typeof img === 'object' && 'url' in img) return (img as any).url;
        if (img && typeof img === 'object' && 'src' in img) return (img as any).src;
        return null;
      })
      .filter((url): url is string => url !== null && isValidImageUrl(url))
      .filter((url, i, arr) => arr.indexOf(url) === i)
      .slice(0, 20);
  }
  if (typeof images === 'string') {
    const url = images.trim();
    return isValidImageUrl(url) ? [url] : [];
  }
  return [];
}
