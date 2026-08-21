#!/usr/bin/env npx tsx
/**
 * Fix Affiliate Tags Script
 * 
 * Finds all products with missing or wrong affiliate tags
 * and updates them to use dawnwire-20.
 */

import { createClient } from '@supabase/supabase-js';

const SB_URL = process.env.SUPABASE_URL || '';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!SB_URL || !SB_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  process.exit(1);
}

const sb = createClient(SB_URL, SB_KEY);
const CORRECT_TAG = 'dawnwire-20';

async function main() {
  console.log('=== Fixing Affiliate Tags ===\n');

  // Fetch all published products
  const products: any[] = [];
  for (let offset = 0; offset < 2000; offset += 200) {
    const { data } = await sb.from('product_reviews')
      .select('id, slug, product_name, affiliate_url')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(offset, offset + 199);
    if (!data || data.length === 0) break;
    products.push(...data);
    if (data.length < 200) break;
  }

  console.log(`Total products: ${products.length}\n`);

  // Find products needing fixes
  const needsFix = products.filter(p => {
    const url = p.affiliate_url || '';
    if (!url) return false;
    const tagMatch = url.match(/tag=([^&]+)/);
    return !tagMatch || tagMatch[1] !== CORRECT_TAG;
  });

  console.log(`Products needing tag fix: ${needsFix.length}\n`);

  if (needsFix.length === 0) {
    console.log('All products already have correct tags!');
    return;
  }

  // Fix each product
  let fixed = 0;
  let errors = 0;

  for (const product of needsFix) {
    try {
      const url = product.affiliate_url || '';
      let newUrl = url;

      if (url.includes('tag=')) {
        // Replace existing tag
        newUrl = url.replace(/tag=[^&]+/, `tag=${CORRECT_TAG}`);
      } else if (url.includes('?')) {
        // Add tag to existing query string
        newUrl = `${url}&tag=${CORRECT_TAG}`;
      } else {
        // Add tag as query parameter
        newUrl = `${url}?tag=${CORRECT_TAG}`;
      }

      const { error } = await sb.from('product_reviews')
        .update({ affiliate_url: newUrl })
        .eq('id', product.id);

      if (error) {
        console.error(`  ❌ ${product.product_name?.substring(0, 50)}: ${error.message}`);
        errors++;
      } else {
        fixed++;
        if (fixed % 20 === 0) console.log(`  Fixed ${fixed}/${needsFix.length}...`);
      }
    } catch (e: any) {
      console.error(`  ❌ ${product.product_name?.substring(0, 50)}: ${e.message}`);
      errors++;
    }
  }

  console.log(`\n=== Results ===`);
  console.log(`  Fixed: ${fixed}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Total: ${needsFix.length}`);

  // Verify
  console.log('\n=== Verification ===');
  const { data: verify } = await sb.from('product_reviews')
    .select('id, affiliate_url')
    .eq('status', 'published')
    .limit(1000);

  const verified = (verify || []).filter(p => {
    const url = p.affiliate_url || '';
    const tagMatch = url.match(/tag=([^&]+)/);
    return tagMatch && tagMatch[1] === CORRECT_TAG;
  });

  console.log(`  Products with correct tag: ${verified.length}`);
  console.log(`  Products total: ${(verify || []).length}`);
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
