import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function check() {
  console.log('--- Checking Users ---');
  const { data: users } = await supabase.from('users').select('id, name, email');
  for (const u of (users || [])) {
    // Check if name looks like a UUID
    if (u.name && u.name.length === 36 && u.name.split('-').length === 5) {
      console.log(`[USER] ${u.email} has UUID name: ${u.name}`);
    }
  }

  console.log('--- Checking Products ---');
  const { data: products } = await supabase.from('product_reviews').select('*');
  const asins = new Set();
  
  for (const p of (products || [])) {
    let reasons = [];
    if (!p.product_image || p.product_image.trim() === '') reasons.push('Missing Image');
    
    // Check ASIN duplication from specs JSON
    let asin = p.specs?.asin;
    if (!asin && p.amazon_url) {
      const m = p.amazon_url.match(/\/dp\/([A-Z0-9]{10})/);
      if (m) asin = m[1];
    }
    
    if (asin) {
      if (asins.has(asin)) reasons.push(`Duplicate ASIN: ${asin}`);
      else asins.add(asin);
    }

    if (reasons.length > 0) {
      console.log(`[PRODUCT] ${p.slug || p.id} => ${reasons.join(', ')}`);
    }
  }
}

check();
