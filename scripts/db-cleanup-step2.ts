import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '';
if (!supabaseUrl || !supabaseKey) { console.error('Missing SUPABASE_URL or key'); process.exit(1); }
const sb = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

async function main() {
  const { data: categories } = await sb.from('categories').select('*').eq('status', 'active');
  console.log(`Found ${categories?.length || 0} active categories`);
  for (const c of categories || []) console.log(`  ${c.name} (${c.slug}) [${c.id}]`);

  const { data: products } = await sb.from('product_reviews').select('*').order('created_at', { ascending: false });
  console.log(`\nFound ${products?.length || 0} products`);
  let matched = 0;
  let unmatched: string[] = [];
  for (const p of products || []) {
    if (!p.best_for) { unmatched.push(`${(p.product_name||'').substring(0,50)} (no best_for)`); continue; }
    const bf = p.best_for.toLowerCase();
    const cat = categories?.find((c: any) =>
      c.name?.toLowerCase() === bf || c.slug?.toLowerCase() === bf.replace(/[\s&]+/g, '-')
    );
    if (cat && p.category_id !== cat.id) {
      await sb.from('product_reviews').update({ category_id: cat.id, updated_at: new Date().toISOString() }).eq('id', p.id);
      matched++;
      console.log(`  ${(p.product_name||'').substring(0,50)} -> ${cat.name}`);
    } else if (!cat) {
      unmatched.push(`${(p.product_name||'').substring(0,50)} (best_for="${p.best_for}" — no matching category)`);
    }
  }
  console.log(`\n--- ${matched} products matched to categories ---`);
  if (unmatched.length) { console.log('Unmatched:'); for (const u of unmatched) console.log(`  ${u}`); }
}

main().catch(e => { console.error(e); process.exit(1); });
