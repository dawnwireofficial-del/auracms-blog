import { createHash, createHmac } from 'crypto';

export interface AmazonCredentials {
  accessKey: string;
  secretKey: string;
  partnerTag: string;
  marketplace: string;
}

export interface AmazonApiConfig {
  credentials: AmazonCredentials;
  region: string;
  endpoint: string;
}

export interface AmazonProductData {
  asin: string;
  title?: string;
  brand?: string;
  mainImage?: string;
  additionalImages?: string[];
  price?: number;
  currency?: string;
  referencePrice?: number;
  savingAmount?: number;
  discountPercent?: number;
  availability?: string;
  isAvailable: boolean;
  isDeal: boolean;
  dealPrice?: number;
  dealEndTime?: string;
  isPrimeDeal: boolean;
  isPrimeExclusive: boolean;
  features?: string[];
  category?: string;
  productUrl?: string;
  affiliateUrl?: string;
  variations?: AmazonVariation[];
  variationSummary?: { variationCount: number; lowestPrice?: number; highestPrice?: number };
}

export interface AmazonVariation {
  asin: string;
  title?: string;
  price?: number;
  availability?: string;
  isAvailable: boolean;
  image?: string;
  dimensions?: Record<string, string>;
}

const RESOURCES = [
  'Images.Primary.Large',
  'Images.Variants.Large',
  'ItemInfo.Title',
  'ItemInfo.ByLineInfo',
  'ItemInfo.Features',
  'ItemInfo.Classifications',
  'ItemInfo.ProductInfo',
  'ItemInfo.ManufactureInfo',
  'Offers.Listings.Price',
  'Offers.Listings.Availability',
  'Offers.Listings.SavingBasis',
  'Offers.Listings.DealPrice',
  'Offers.Listings.IsPrimeExclusive',
  'Offers.Listings.PromotionalPrice',
  'Offers.Summaries',
  'VariationSummary',
  'ParentASIN',
];

function sha256(data: string): string {
  return createHash('sha256').update(data, 'utf8').digest('hex');
}

function hmacSha256(key: Buffer, data: string): Buffer {
  return createHmac('sha256', key).update(data, 'utf8').digest();
}

function getSignatureKey(key: string, dateStamp: string, region: string, service: string): Buffer {
  const kDate = hmacSha256(Buffer.from(`AWS4${key}`, 'utf8'), dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  return hmacSha256(kService, 'aws4_request');
}

async function signedRequest(
  config: AmazonApiConfig,
  operation: string,
  payload: Record<string, any>
): Promise<any> {
  const { accessKey, secretKey } = config.credentials;
  const region = config.region;
  const service = 'ProductAdvertisingAPI';
  const host = config.endpoint;
  const path = '/paapi5/' + operation.toLowerCase();
  const method = 'POST';

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]/g, '').substring(0, 17) + 'Z';
  const dateStamp = amzDate.substring(0, 8);

  const body = JSON.stringify(payload);
  const bodyHash = sha256(body);

  const canonicalUri = path;
  const canonicalQuerystring = '';
  const canonicalHeaders =
    `content-encoding:amz-1.0\n` +
    `content-type:application/json; charset=utf-8\n` +
    `host:${host}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:com.amazon.paapi5.${operation}Api.${operation}\n`;
  const signedHeaders = 'content-encoding;content-type;host;x-amz-date;x-amz-target';

  const canonicalRequest =
    `${method}\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${bodyHash}`;

  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign =
    `${algorithm}\n${amzDate}\n${credentialScope}\n${sha256(canonicalRequest)}`;

  const signingKey = getSignatureKey(secretKey, dateStamp, region, service);
  const signature = hmacSha256(signingKey, stringToSign).toString('hex');

  const authorizationHeader =
    `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const url = `https://${host}${path}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Encoding': 'amz-1.0',
      'Content-Type': 'application/json; charset=utf-8',
      'X-Amz-Date': amzDate,
      'X-Amz-Target': `com.amazon.paapi5.${operation}Api.${operation}`,
      'Authorization': authorizationHeader,
    },
    body,
    signal: controller.signal,
  });
  clearTimeout(timeoutId);

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    let errorMessage = `PA-API ${response.status}`;
    let errorCode: string | undefined;
    try {
      const err = JSON.parse(errorBody);
      errorMessage = err.Errors?.[0]?.Message || err.Errors?.[0]?.Code || errorBody;
      errorCode = err.Errors?.[0]?.Code;
    } catch {}
    throw Object.assign(new Error(errorMessage), { status: response.status, code: errorCode, body: errorBody });
  }

  return response.json();
}

function parsePrice(offer: any): number | undefined {
  if (offer?.Price?.Amount != null) return Number(offer.Price.Amount);
  if (offer?.Price?.Price?.Amount != null) return Number(offer.Price.Price.Amount);
  return undefined;
}

function parseCurrency(offer: any): string | undefined {
  return offer?.Price?.Currency || offer?.Price?.Price?.Currency || undefined;
}

function parseSavingBasis(offer: any): { amount?: number; percentage?: number } {
  const basis = offer?.SavingBasis;
  if (!basis) return {};
  const savingAmount = basis.Amount != null ? Number(basis.Amount) : undefined;
  const savingPercent = basis.Percentage != null ? Number(basis.Percentage) : undefined;
  return { amount: savingAmount, percentage: savingPercent };
}

function parseAvailability(offer: any): { type: string; isAvailable: boolean } {
  const type = offer?.Availability?.Type || offer?.Availability?.Message || 'Unknown';
  const isAvailable = type !== 'OutOfStock' && type !== 'Currently unavailable' && !type.toLowerCase().includes('out');
  return { type, isAvailable };
}

function parseVariations(item: any): AmazonVariation[] {
  const variations: AmazonVariation[] = [];
  const variants = item?.Images?.Variants || [];
  const variationOffers = item?.Offers?.Listings?.filter((l: any) => l?.IsVariationListing) || [];

  const variationMap = new Map<string, { image?: string; price?: number; availability?: string; isAvailable: boolean }>();

  for (const v of variants) {
    if (v?.VariantASIN) {
      const existing = variationMap.get(v.VariantASIN) || { isAvailable: true };
      existing.image = v.Large?.URL || existing.image;
      variationMap.set(v.VariantASIN, existing);
    }
  }

  for (const offer of variationOffers) {
    if (offer?.ASIN) {
      const existing = variationMap.get(offer.ASIN) || { isAvailable: true };
      existing.price = parsePrice(offer);
      const avail = parseAvailability(offer);
      existing.availability = avail.type;
      existing.isAvailable = avail.isAvailable;
      variationMap.set(offer.ASIN, existing);
    }
  }

  for (const [asin, data] of variationMap) {
    variations.push({
      asin,
      price: data.price,
      availability: data.availability,
      isAvailable: data.isAvailable,
      image: data.image,
    });
  }

  return variations;
}

export function parseAmazonResponse(data: any, partnerTag: string, marketplaceDomain: string): AmazonProductData[] {
  const results: AmazonProductData[] = [];
  const itemsResult = data?.ItemsResult || {};
  const items = itemsResult?.Items || [];

  for (const item of items) {
    const asin = item?.ASIN || '';
    const info = item?.ItemInfo || {};
    const offers = item?.Offers || {};
    const images = item?.Images || {};
    const vs = item?.VariationSummary || {};

    const title = info?.Title?.DisplayValue || '';
    const brand = info?.ByLineInfo?.Brand?.DisplayValue || '';
    const features = info?.Features?.DisplayValues || [];

    const primaryImage = images?.Primary?.Large?.URL;
    const variantImages = (images?.Variants || []).map((v: any) => v?.Large?.URL).filter(Boolean);
    const additionalImages = variantImages.filter((url: string) => url !== primaryImage);

    const classification = info?.Classifications || {};
    const category = classification?.ProductGroup || classification?.Binding || '';

    const firstOffer = offers?.Listings?.[0];
    const summaries = offers?.Summaries?.[0];

    const price = parsePrice(firstOffer) || (summaries?.LowestPrice?.Amount != null ? Number(summaries.LowestPrice.Amount) : undefined);
    const currency = parseCurrency(firstOffer) || summaries?.LowestPrice?.Currency || 'USD';

    const savingBasis = parseSavingBasis(firstOffer);
    const referencePrice = savingBasis.amount != null ? price != null ? price + savingBasis.amount : savingBasis.amount : undefined;
    const discountPercent = savingBasis.percentage;

    const availability = parseAvailability(firstOffer);
    const dealPrice = firstOffer?.DealPrice?.Amount != null ? Number(firstOffer.DealPrice.Amount) : undefined;
    const isDeal = firstOffer?.DealPrice?.Amount != null || firstOffer?.PromotionalPrice?.Amount != null;
    const isPrimeExclusive = firstOffer?.IsPrimeExclusive === true;
    const isPrimeDeal = isDeal && isPrimeExclusive;
    const dealEndTime = firstOffer?.DealPrice?.SavingBasis?.['@timestamp'] || undefined;

    const productUrl = `https://${marketplaceDomain}/dp/${asin}`;
    const affiliateUrl = productUrl.includes('?')
      ? `${productUrl}&tag=${partnerTag}`
      : `${productUrl}?tag=${partnerTag}`;

    const variations = parseVariations(item);

    let variationCount = 0;
    if (vs?.VariationCount != null) variationCount = Number(vs.VariationCount);
    const lowestPrice = vs?.LowestPrice?.Amount != null ? Number(vs.LowestPrice.Amount) : undefined;
    const highestPrice = vs?.HighestPrice?.Amount != null ? Number(vs.HighestPrice.Amount) : undefined;

    results.push({
      asin,
      title,
      brand,
      mainImage: primaryImage,
      additionalImages,
      price,
      currency,
      referencePrice,
      savingAmount: savingBasis.amount,
      discountPercent,
      availability: availability.type,
      isAvailable: availability.isAvailable,
      isDeal,
      dealPrice,
      dealEndTime,
      isPrimeDeal,
      isPrimeExclusive,
      features,
      category,
      productUrl,
      affiliateUrl,
      variations: variations.length > 0 ? variations : undefined,
      variationSummary: variationCount > 0 ? { variationCount, lowestPrice, highestPrice } : undefined,
    });
  }

  return results;
}

export async function getItemsByAsin(
  config: AmazonApiConfig,
  asins: string[]
): Promise<AmazonProductData[]> {
  if (asins.length === 0) return [];

  const batchSize = 10;
  const results: AmazonProductData[] = [];

  for (let i = 0; i < asins.length; i += batchSize) {
    const batch = asins.slice(i, i + batchSize);
    const payload = {
      ItemIds: batch,
      Resources: RESOURCES,
      PartnerTag: config.credentials.partnerTag,
      PartnerType: 'Associates',
      Marketplace: config.credentials.marketplace,
    };

    const data = await signedRequest(config, 'GetItems', payload);
    const parsed = parseAmazonResponse(data, config.credentials.partnerTag, config.endpoint);
    results.push(...parsed);
  }

  return results;
}

export async function searchItems(
  config: AmazonApiConfig,
  keywords: string,
  maxResults = 10
): Promise<AmazonProductData[]> {
  const payload = {
    Keywords: keywords,
    Resources: RESOURCES,
    PartnerTag: config.credentials.partnerTag,
    PartnerType: 'Associates',
    Marketplace: config.credentials.marketplace,
    ItemCount: Math.min(maxResults, 10),
  };

  const data = await signedRequest(config, 'SearchItems', payload);
  return parseAmazonResponse(data, config.credentials.partnerTag, config.endpoint);
}

export function getMarketplaceDomain(marketplaceCode: string): string {
  const domains: Record<string, string> = {
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
    NL: 'www.amazon.nl',
    SE: 'www.amazon.se',
    PL: 'www.amazon.pl',
    TR: 'www.amazon.com.tr',
    SG: 'www.amazon.sg',
    HK: 'www.amazon.com.hk',
  };
  return domains[marketplaceCode] || 'www.amazon.com';
}

export function getMarketplaceFromDomain(domain: string): string {
  const domainMap: Record<string, string> = {
    'www.amazon.com': 'US',
    'www.amazon.co.uk': 'UK',
    'www.amazon.ae': 'AE',
    'www.amazon.sa': 'SA',
    'www.amazon.ca': 'CA',
    'www.amazon.in': 'IN',
    'www.amazon.de': 'DE',
    'www.amazon.fr': 'FR',
    'www.amazon.it': 'IT',
    'www.amazon.es': 'ES',
    'www.amazon.co.jp': 'JP',
    'www.amazon.com.au': 'AU',
    'www.amazon.com.br': 'BR',
    'www.amazon.com.mx': 'MX',
    'www.amazon.nl': 'NL',
    'www.amazon.se': 'SE',
    'www.amazon.pl': 'PL',
    'www.amazon.com.tr': 'TR',
    'www.amazon.sg': 'SG',
    'www.amazon.com.hk': 'HK',
  };
  return domainMap[domain] || 'US';
}

export function extractAsinFromUrl(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/i,
    /\/gp\/product\/([A-Z0-9]{10})/i,
    /\/exec\/obidos\/asin\/([A-Z0-9]{10})/i,
    /\/o\/ASIN\/([A-Z0-9]{10})/i,
    /\/([A-Z0-9]{10})(?:\/|\?|$)/i,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1].toUpperCase();
  }
  return null;
}

export function extractPartnerTagFromUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/[?&]tag=([^&]+)/i);
  return match ? decodeURIComponent(match[1]) : null;
}

export function extractMarketplaceFromUrl(url: string): string | null {
  if (!url) return null;
  try {
    const hostname = new URL(url).hostname;
    return getMarketplaceFromDomain(hostname);
  } catch {}
  return null;
}
