#!/usr/bin/env npx tsx
/**
 * One-time backfill: rebuild every product's affiliate_url / amazon_url as a
 * canonical ALWAYS-tagged Amazon link (/dp/<ASIN>?tag=<partner-tag>) so every
 * historical row earns commission. Idempotent — already-tagged canonical rows
 * are skipped.
 */
import { createClient } from '@supabase/supabase-js';

const SB_URL = process.env.SUPABASE_URL || '';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const AMAZON_HOST = /amazon\.|amzn\.to/i;

function normalizeAsin(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const m = String(raw).match(/[A-Z0-9]{10}/i);
  if (!m) return null;
  const asin = m[0].toUpperCase();
  return /^B[0-9A-Z]{9}$/.test(asin) ? asin : null;
}

function extractAsinFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/\/dp\/([A-Z0-9]{10})/i) || url.match(/\/gp\/product\/([A-Z0-9]{10})/i);
  return normalizeAsin(m ? m[1] : null);
}

const TAG = process.env.AMAZON_PARTNER_TAG || 'dawnwire-20';

function ensureTagged(url: string | null | undefined, asinHint?: string | null): string | null {
  if (!url || !AMAZON_HOST.test(url)) return null;
  const asin = normalizeAsin(asinHint || '') || extractAsinFromUrl(url);
  if (asin) return `https://www.amazon.com/dp/${asin}?tag=${TAG}`;
  try {
    const u = new URL(String(url));
    u.searchParams.set('tag', TAG);
    return u.toString();
  } catch {
    return null;
  }
}

async function main() {
  const sb = createClient(SB_URL, SB_KEY);
  let from = 0;
  const step = 500;
  let scanned = 0, updatedAff = 0, updatedAmz = 0, skipped = 0;

  for (;;) {
    const { data, error } = await sb
      .from('product_reviews')
      .select('id, asin, specs, affiliate_url, amazon_url')
      .range(from, from + step - 1);
    if (error) { console.error('fetch error:', error.message); break; }
    if (!data || data.length === 0) break;

    for (const p of data) {
      scanned++;
      const asinHint = p.asin || p.specs?.asin || null;
      const patch: Record<string, string> = {};

      const aff = ensureTagged(p.affiliate_url, asinHint);
      if (aff && aff !== p.affiliate_url) { patch.affiliate_url = aff; updatedAff++; }

      const amz = ensureTagged(p.amazon_url, asinHint);
      if (amz && amz !== p.amazon_url) { patch.amazon_url = amz; updatedAmz++; }

      // affiliate_url missing but amazon_url exists → mirror the tagged link
      if (!patch.affiliate_url && !p.affiliate_url && p.amazon_url && amz) {
        patch.affiliate_url = amz; updatedAff++;
      }

      if (Object.keys(patch).length > 0) {
        const { error: uErr } = await sb.from('product_reviews').update(patch).eq('id', p.id);
        if (uErr) console.error(`update ${p.id}:`, uErr.message);
      } else {
        skipped++;
      }
    }
    from += step;
    if (data.length < step) break;
  }

  console.log(`scanned=${scanned} affiliate_tagged=${updatedAff} amazon_tagged=${updatedAmz} unchanged=${skipped}`);
}

main().catch(console.error);
