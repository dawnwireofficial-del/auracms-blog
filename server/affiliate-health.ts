import { getSupabaseAdmin } from './lib/supabase';

export type AffiliateStatus = 'pending' | 'system_generated' | 'healthy' | 'fixable' | 'broken' | 'unavailable';

export const AMAZON_DOMAINS = [
  'amazon.com', 'amazon.co.uk', 'amazon.ae', 'amazon.sa', 'amazon.ca', 'amazon.in',
  'amazon.de', 'amazon.fr', 'amazon.it', 'amazon.es', 'amazon.co.jp', 'amazon.com.au',
  'amazon.com.br', 'amazon.com.mx', 'amazon.nl', 'amazon.se', 'amazon.pl', 'amazon.com.tr',
  'amazon.sg', 'amazon.com.hk', 'amzn.to',
];

export function getAffiliateTag(): string {
  return process.env.AMAZON_PARTNER_TAG || 'dawnwire-20';
}

export function normalizeAsin(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const m = String(raw).match(/[A-Z0-9]{10}/i);
  if (!m) return null;
  const asin = m[0].toUpperCase();
  if (!/^B[0-9A-Z]{9}$/.test(asin)) return null;
  return asin;
}

export function isAmazonDomain(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return AMAZON_DOMAINS.some((d) => host === d || host.endsWith('.' + d));
  } catch {
    return false;
  }
}

export function hasAffiliateTag(url: string | null | undefined, tag: string): boolean {
  if (!url) return false;
  return new RegExp(`[?&]tag=${encodeURIComponent(tag)}(&|$)`).test(url) ||
    new RegExp(`[?&]tag=${tag}(&|$)`).test(url);
}

// Manual affiliate links are copied from Amazon Associates SiteStripe. They
// carry site-stripe params (linkCode / ref_ / ref=) or a product-slug path
// ("/Vaseline-.../dp/B0..."). System-generated "/dp/ASIN?tag=dawnwire-20"
// URLs have none of those. Only manual ones are considered authorized.
export function isManualAffiliateLink(url: string | null | undefined): boolean {
  if (!url) return false;
  if (/linkCode=/.test(url)) return true;
  if (/[?&]ref=/.test(url) || /[?&]ref_=/.test(url)) return true;
  if (/\/[A-Za-z0-9][A-Za-z0-9-]{1,80}\/dp\/([A-Z0-9]{10})/i.test(url)) return true;
  return false;
}

export function extractAsinFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/\/dp\/([A-Z0-9]{10})/i) || url.match(/\/gp\/product\/([A-Z0-9]{10})/i);
  return normalizeAsin(m ? m[1] : null);
}

export function cleanPublicUrl(affiliateUrl: string | null | undefined): string | null {
  if (!affiliateUrl) return null;
  if (!isAmazonDomain(affiliateUrl)) return affiliateUrl;
  try {
    const u = new URL(affiliateUrl);
    ['tag', 'linkCode', 'linkId', 'ref', 'psc', 'crid', 'keywords', 'sprefix', 'sp_csd', 'th', 'hvadid', 'hvpos', 'hvnetw', 'hvrand', 'hvpone', 'hvptwo', 'hvqmt', 'hvdev', 'hvdvcmdl', 'hvlocint', 'hvlocphy', 'hvtargid', 'camp', 'creative', 'creativeASIN'].forEach((k) => u.searchParams.delete(k));
    return u.toString();
  } catch {
    return affiliateUrl;
  }
}

export function generateAffiliateUrl(asin: string): string {
  return `https://www.amazon.com/dp/${asin}?tag=${encodeURIComponent(getAffiliateTag())}`;
}

export function evaluateLink(product: any): { status: AffiliateStatus; asin: string | null; note?: string } {
  const tag = getAffiliateTag();
  const specs = (product.specs && typeof product.specs === 'object') ? product.specs : {};
  const asin = normalizeAsin(product.asin) ||
    normalizeAsin(specs.asin) ||
    extractAsinFromUrl(product.amazon_url) ||
    extractAsinFromUrl(product.affiliate_url);

  const affiliateUrl: string | null = product.affiliate_url || null;
  const amazonUrl: string | null = product.amazon_url || null;

  if (!asin && !affiliateUrl && !amazonUrl) {
    return { status: 'broken', asin: null, note: 'No ASIN and no URL' };
  }

  // Manually pasted affiliate URL with our tag => the ideal state
  if (affiliateUrl && isAmazonDomain(affiliateUrl) && isManualAffiliateLink(affiliateUrl) && hasAffiliateTag(affiliateUrl, tag)) {
    return { status: 'healthy', asin, note: 'Manual affiliate link with correct tag' };
  }

  // Manually pasted affiliate URL but untagged/wrong tag => needs a paste
  if (affiliateUrl && isAmazonDomain(affiliateUrl) && isManualAffiliateLink(affiliateUrl)) {
    return { status: 'fixable', asin, note: affiliateUrl.includes('tag=') ? 'Manual link has a different tag' : 'Manual link missing affiliate tag' };
  }

  // Affiliate URL present but not a manual paste (system-generated or bare)
  if (affiliateUrl && isAmazonDomain(affiliateUrl)) {
    return { status: 'system_generated', asin, note: 'Link looks system-generated; paste your own affiliate link' };
  }

  // ASIN available => link can be generated from it
  if (asin) {
    return { status: 'system_generated', asin, note: 'No manual affiliate link; ASIN available' };
  }

  // Only a clean amazon_url (no tag), no ASIN
  if (amazonUrl && isAmazonDomain(amazonUrl)) {
    return { status: 'fixable', asin: null, note: 'Only public Amazon URL; ASIN missing' };
  }

  return { status: 'broken', asin: null, note: 'Invalid or non-Amazon affiliate URL' };
}

// Report-only audit: recomputes health for every product and upserts affiliate_health.
// It NEVER rewrites product_reviews data.
export async function runAudit(opts: { checkedBy?: string; products?: any[] } = {}): Promise<{ checked: number; counts: Record<string, number>; lastAudit: string }> {
  const sb = await getSupabaseAdmin();
  const products = opts.products || (await (await import('./seo-engine')).getProductReviews());
  const counts: Record<string, number> = { pending: 0, system_generated: 0, healthy: 0, fixable: 0, broken: 0, unavailable: 0 };
  const checkedBy = opts.checkedBy || 'scheduler';
  const now = new Date().toISOString();

  for (const product of products) {
    const evalResult = evaluateLink(product);
    counts[evalResult.status] = (counts[evalResult.status] || 0) + 1;
    try {
      await sb.from('affiliate_health').upsert(
        {
          product_id: product.id,
          asin: evalResult.asin,
          affiliate_tag: getAffiliateTag(),
          validation_status: evalResult.status,
          last_checked_at: now,
          last_error: evalResult.note || null,
          checked_by: checkedBy,
          updated_at: now,
        },
        { onConflict: 'product_id' }
      );
    } catch (e: any) {
      console.warn(`[AffiliateHealth] upsert failed for ${product.id}:`, e?.message);
    }
  }

  return { checked: products.length, counts, lastAudit: now };
}

// Auto-draft: flips product_reviews.status='draft' for every product whose
// affiliate link is NOT manually authorized (healthy), until the user pastes a link.
export async function markDraftUntilLinked(products?: any[]): Promise<{ flipped: number; skipped: number }> {
  const sb = await getSupabaseAdmin();
  const { getPublishedProductReviews } = await import('./seo-engine');
  const all = products || (await getPublishedProductReviews());
  let flipped = 0;
  let skipped = 0;

  for (const product of all) {
    const { status } = evaluateLink(product);
    const isManualOk = status === 'healthy';
    if (isManualOk) { skipped++; continue; }
    try {
      const { error } = await sb.from('product_reviews').update({ status: 'draft' }).eq('id', product.id);
      if (!error) flipped++;
      else skipped++;
    } catch { skipped++; }
  }
  return { flipped, skipped };
}
