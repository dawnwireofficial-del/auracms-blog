import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_toy-BSdhpLKpoHIzaQDevg_bqKOOW94';
if (!supabaseUrl || !supabaseKey) { console.error('Missing SUPABASE_URL or service key'); process.exit(1); }
const sb = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

function sanitizeReviewSummary(text: string | null | undefined): string | null {
  if (!text) return null;
  return text
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[.#]\w[^;{]*\{[^}]*\}/g, '')
    .replace(/@\w+[^{]*\{[^}]*\}/g, '')
    .replace(/@\w+[^;{]*;/g, '')
    .replace(/\b(function|var|let|const)\s+\w+\s*\(?[^)]*\)?\s*\{?[^}]*\}?/g, '')
    .replace(/[a-z-]+\s*:\s*[^;{]+[;{]/gi, '')
    .replace(/[{}[\]()]/g, '')
    .replace(/\.po-\w+/g, '').replace(/#po-\w+/g, '')
    .replace(/logTechTermAssistMetric[\s\S]*?(?=\s|$)/g, '')
    .replace(/csa\([^)]*\)[^;]*;/g, '')
    .replace(/\s+/g, ' ').trim() || null;
}

async function main() {
  console.log('Fetching all product reviews...');
  const { data: products, error } = await sb.from('product_reviews').select('*').order('created_at', { ascending: false }).limit(1000);
  if (error) { console.error('Error:', error); return; }
  console.log(`Found ${products!.length} products`);

  const { data: categories } = await sb.from('categories').select('*').eq('status', 'active');
  console.log(`Found ${categories?.length || 0} active categories`);

  let out: string[] = [];
  let sanitized = 0, bestForSet = 0, categorySet = 0, duplicatesRemoved = 0;

  // 1. Sanitize + infer best_for
  for (const p of products!) {
    const updates: Record<string, any> = {};

    // Sanitize review_summary
    if (p.review_summary) {
      const clean = sanitizeReviewSummary(p.review_summary);
      if (clean !== p.review_summary) {
        updates.review_summary = clean;
        sanitized++;
        out.push(`  cleaned review_summary for "${(p.product_name||'').substring(0,50)}"`);
      }
    }

    // Infer best_for
    if (!p.best_for) {
      let inferred = '';
      const dept = (p.specs?.details?.department || '').toLowerCase();
      const pn = (p.product_name || '').toLowerCase();
      if (dept) {
        if (dept.includes('baby')) inferred = 'Baby Care';
        else if (dept.includes('fitness') || dept.includes('sport') || dept.includes('exercise')) inferred = 'Fitness';
        else if (dept.includes('gaming') || dept.includes('video game') || dept.includes('electronics')) inferred = 'Gaming';
        else if (dept.includes('home') || dept.includes('kitchen') || dept.includes('household')) inferred = 'Home & Kitchen';
        else if (dept.includes('beauty') || dept.includes('skin care') || dept.includes('cosmetic') || dept.includes('personal care')) inferred = 'Beauty & Personal Care';
        else if (dept.includes('office') || dept.includes('computer') || dept.includes('electronics')) inferred = 'Office & Tech';
        else if (dept.includes('toy') || dept.includes('game')) inferred = 'Toys & Games';
        else if (dept.includes('sport')) inferred = 'Sports & Outdoors';
      }
      if (!inferred) {
        if (pn.includes('baby') || pn.includes('nursery') || pn.includes('diaper') || pn.includes('stroller') || pn.includes('booster seat') || pn.includes('car seat')) inferred = 'Baby Care';
        else if (pn.includes('fitness') || pn.includes('weighted vest') || pn.includes('jump rope') || pn.includes('exercise') || pn.includes('workout') || pn.includes('gym')) inferred = 'Fitness';
        else if (pn.includes('gaming') || pn.includes('headset') || pn.includes('mouse') || pn.includes('keyboard')) inferred = 'Gaming';
        else if (pn.includes('camera') || pn.includes('monitor') || pn.includes('tech') || pn.includes('smart')) inferred = 'Tech';
        else if (pn.includes('chair') || pn.includes('desk') || pn.includes('furniture') || pn.includes('lamp') || pn.includes('mount') || pn.includes('tv mount')) inferred = 'Home & Kitchen';
        else if (pn.includes('eye') || pn.includes('skin') || pn.includes('collagen') || pn.includes('patch') || pn.includes('beauty')) inferred = 'Beauty & Personal Care';
        else if (pn.includes('wipe') || pn.includes('clean') || pn.includes('paper towel')) inferred = 'Home & Kitchen';
      }
      if (inferred) {
        updates.best_for = inferred;
        bestForSet++;
        out.push(`  set best_for="${inferred}" for "${(p.product_name||'').substring(0,50)}"`);
      }
    }

    if (Object.keys(updates).length > 0) {
      await sb.from('product_reviews').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', p.id);
    }
  }
  for (const line of out) console.log(line);

  // 2. Re-fetch products and assign category_id
  out = [];
  const { data: updatedProducts } = await sb.from('product_reviews').select('*').order('created_at', { ascending: false }).limit(1000);
  for (const p of updatedProducts || []) {
    if (!p.best_for) continue;
    const bf = p.best_for.toLowerCase();
    const cat = categories?.find((c: any) =>
      c.name?.toLowerCase() === bf || c.slug?.toLowerCase() === bf.replace(/[\s&]+/g, '-')
    );
    if (cat && p.category_id !== cat.id) {
      await sb.from('product_reviews').update({ category_id: cat.id, updated_at: new Date().toISOString() }).eq('id', p.id);
      categorySet++;
      out.push(`  set category="${cat.name}" for "${(p.product_name||'').substring(0,50)}"`);
    }
  }
  for (const line of out) console.log(line);

  // 3. Create missing categories
  const existingCatNames = new Set((categories || []).map((c: any) => c.name?.toLowerCase()));
  const needed = ['Fitness', 'Baby Care', 'Gaming', 'Home & Kitchen', 'Beauty & Personal Care', 'Tech', 'Office & Tech', 'Sports & Outdoors', 'Toys & Games'];
  for (const name of needed) {
    if (!existingCatNames.has(name.toLowerCase())) {
      const slug = name.toLowerCase().replace(/[\s&]+/g, '-').replace(/[^a-z0-9-]/g, '');
      await sb.from('categories').insert({ name, slug, description: `Products in the ${name} category`, status: 'active' });
      console.log(`  created category: "${name}" (${slug})`);
    }
  }

  // 4. Handle duplicates
  out = [];
  const nameGroups: Record<string, any[]> = {};
  for (const p of products!) {
    const key = (p.product_name || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
    if (key && key.length > 5) {
      if (!nameGroups[key]) nameGroups[key] = [];
      nameGroups[key].push(p);
    }
  }
  for (const items of Object.values(nameGroups)) {
    if (items.length < 2) continue;
    out.push(`duplicate: "${items[0].product_name?.substring(0,60)}" (${items.length} records)`);
    items.sort((a, b) => {
      if (a.status === 'published' && b.status !== 'published') return -1;
      if (b.status === 'published' && a.status !== 'published') return 1;
      if (a.slug?.endsWith('-1')) return 1;
      if (b.slug?.endsWith('-1')) return -1;
      return ((b.updated_at||'')).localeCompare((a.updated_at||''));
    });
    const keep = items[0];
    for (const r of items.slice(1)) {
      if (r.status === 'draft' || r.slug?.endsWith('-1')) {
        await sb.from('product_reviews').delete().eq('id', r.id);
        duplicatesRemoved++;
        out.push(`  removed: "${r.product_name?.substring(0,50)}" (${r.slug})`);
      } else {
        out.push(`  manual review: "${keep.product_name?.substring(0,50)}" vs "${r.product_name?.substring(0,50)}"`);
      }
    }
  }
  for (const line of out) console.log(line);

  console.log('\n=== Summary ===');
  console.log(`  review_summary cleaned: ${sanitized}`);
  console.log(`  best_for inferred: ${bestForSet}`);
  console.log(`  category_id set: ${categorySet}`);
  console.log(`  duplicates removed: ${duplicatesRemoved}`);
}

main().catch(e => { console.error(e); process.exit(1); });
