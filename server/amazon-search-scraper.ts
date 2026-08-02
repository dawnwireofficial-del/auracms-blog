import fetch from 'node-fetch';

export interface SearchResult {
  asin: string;
  title: string;
  price: number | null;
  image: string;
  url: string;
  relevanceScore: number;
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
];

const LOCALE_MAP: Record<string, string> = {
  US: 'en-US,en;q=0.9',
  UK: 'en-GB,en;q=0.9',
  AE: 'en-AE,en;q=0.9',
  SA: 'en-SA,en;q=0.9',
  CA: 'en-CA,en;q=0.9',
  IN: 'en-IN,en;q=0.9',
  DE: 'de-DE,de;q=0.9',
  FR: 'fr-FR,fr;q=0.9',
  IT: 'it-IT,it;q=0.9',
  ES: 'es-ES,es;q=0.9',
  JP: 'ja-JP,ja;q=0.9',
  AU: 'en-AU,en;q=0.9',
  BR: 'pt-BR,pt;q=0.9',
  MX: 'es-MX,es;q=0.9',
};

export const MARKETPLACE_DOMAIN: Record<string, string> = {
  US: 'www.amazon.com',
  UK: 'www.amazon.co.uk',
  AE: 'www.amazon.ae',
  SA: 'www.amazon.sa',
  CA: 'www.amazon.ca',
  IN: 'www.amazon.in',
  DE: 'www.amazon.de',
  FR: 'www.amazon.fr',
  IT: 'www.amazon.it',
  ES: 'www.amazon.es',
  JP: 'www.amazon.co.jp',
  AU: 'www.amazon.com.au',
  BR: 'www.amazon.com.br',
  MX: 'www.amazon.com.mx',
};

function getRandomHeaders(marketplace: string = 'US'): Record<string, string> {
  const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  const locale = LOCALE_MAP[marketplace] || 'en-US,en;q=0.9';
  return {
    'User-Agent': ua,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': locale,
    'Cache-Control': 'no-cache',
    'Cookie': 'i18n-prefs=USD; lc-main=en_US',
  };
}

function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  const setA = new Set(a.map(w => w.toLowerCase().replace(/[^a-z0-9]/g, '')));
  const setB = new Set(b.map(w => w.toLowerCase().replace(/[^a-z0-9]/g, '')));
  let intersection = 0;
  setA.forEach(w => { if (setB.has(w)) intersection++; });
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

export function tryAddResult(result: SearchResult, query: string, minRelevance: number = 0.15): boolean {
  const queryWords = query.split(/\s+/).filter(w => w.length > 2);
  const titleWords = result.title.split(/\s+/).filter(w => w.length > 2);
  const score = jaccardSimilarity(queryWords, titleWords);
  result.relevanceScore = score;
  return score >= minRelevance;
}

function parsePrice(priceStr: string): number | null {
  const cleaned = priceStr.replace(/[^0-9.,]/g, '').replace(/,/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

export function extractFromAmazonSearch(html: string, query: string, minRelevance: number = 0.15): SearchResult[] {
  const results: SearchResult[] = [];
  const seenAsins = new Set<string>();

  const asinRegex = /data-asin="([A-Z0-9]{9,10})"/g;
  let match;
  while ((match = asinRegex.exec(html)) !== null) {
    const asin = match[1];
    if (seenAsins.has(asin)) continue;
    seenAsins.add(asin);

    const asinIndex = match.index;
    const block = html.slice(asinIndex, asinIndex + 16000);

    // Title: modern markup puts it in an h2 aria-label (older markup: img alt)
    let title = '';
    const h2Match = block.match(/<h2[^>]*aria-label="([^"]+)"/i);
    if (h2Match) title = h2Match[1];
    if (!title) {
      const imgMatch = block.match(/<img[^>]+class="[^"]*s-image[^"]*"[^>]*alt="([^"]+)"/i) ||
                       block.match(/<img[^>]+alt="([^"]+)"[^>]+class="[^"]*s-image[^"]*"/i);
      if (imgMatch) title = imgMatch[1];
    }
    title = title.replace(/^Sponsored Ad\s*[-–]\s*/i, '').trim() || `Amazon Product (${asin})`;

    // Image: s-image img src (prefer higher-res 2x srcset when present)
    let image = '';
    const imgTag = block.match(/<img[^>]+class="[^"]*s-image[^"]*"[^>]*>/i);
    if (imgTag) {
      const srcset = imgTag[0].match(/srcset="[^"]*(\/images\/[^"\s]+_AC_UL(?:960|800|640|480|320)[^"\s]*)"/i);
      if (srcset) image = 'https:' + srcset[1].replace(/^https?:/, '');
      if (!image) {
        const src = imgTag[0].match(/src="([^"]+)"/i);
        if (src) image = src[1];
      }
      if (image && image.startsWith('//')) image = 'https:' + image;
      if (image && !/^https?:/.test(image) && image.startsWith('/')) image = 'https://m.media-amazon.com' + image;
    }

    // Price: look for a $-prefixed value inside a color-base / offscreen span or a-price block.
    let priceRaw = '';
    const offscreen = block.match(/class="[^"]*a-offscreen[^"]*"[^>]*>([^<]+)</i);
    if (offscreen) priceRaw = offscreen[1];
    if (!priceRaw) {
      const priceBlock = block.match(/class="a-price"[^>]*>\s*<span[^>]*>([^<]+)</i);
      if (priceBlock) priceRaw = priceBlock[1];
    }
    if (!priceRaw) {
      const colored = block.match(/class="[^"]*a-color-base[^"]*">(\$[0-9][^<]*)/i);
      if (colored) priceRaw = colored[1];
    }
    if (!priceRaw) {
      const dollars = block.match(/>(\$[0-9]+(?:\.[0-9]{2})?)(?:\s*<|\s+more)/);
      if (dollars) priceRaw = dollars[1];
    }
    const price = parsePrice(priceRaw);

    const url = `https://www.amazon.com/dp/${asin}`;

    const result: SearchResult = {
      asin,
      title,
      price,
      image: image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
      url,
      relevanceScore: 0,
    };

    if (tryAddResult(result, query, minRelevance)) {
      results.push(result);
    }
  }

  return results;
}

export async function searchAmazon(
  query: string,
  marketplace: string = 'US',
  maxResults: number = 50
): Promise<SearchResult[] | null> {
  const domain = MARKETPLACE_DOMAIN[marketplace] || 'www.amazon.com';
  const searchUrl = `https://${domain}/s?k=${encodeURIComponent(query)}&ref=nb_sb_noss`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(searchUrl, {
      headers: getRandomHeaders(marketplace),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const html = await res.text();

    if (html.includes('data-asin=')) {
      const results = extractFromAmazonSearch(html, query);
      return results.slice(0, maxResults);
    }

    if (html.includes('Robot Check') || html.includes('CAPTCHA') || html.includes('api-services-support@amazon.com')) {
      return null;
    }

    return [];
  } catch {
    return null;
  }
}

export async function scrapeAmazonSearch(
  query: string,
  marketplace: string = 'US',
  maxResults: number = 50
): Promise<SearchResult[]> {
  const results = await searchAmazon(query, marketplace, maxResults);
  if (results === null) {
    throw new Error('Amazon returned a CAPTCHA or blocked the request. Try again later or switch marketplace.');
  }
  return results;
}
