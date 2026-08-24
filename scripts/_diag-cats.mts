import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const { data: cats } = await sb.from('categories').select('id,name,slug');
const catMap = new Map((cats||[]).map(c => [c.id, c.slug]));
const { data: prods } = await sb.from('product_reviews').select('id,product_name,category_id,status').eq('status','published');
const counts = new Map(); const uncategorized = [];
for (const p of prods||[]) {
  const slug = p.category_id ? (catMap.get(p.category_id) || '??orphan') : null;
  if (!slug) { uncategorized.push(p.product_name.slice(0,50)); continue; }
  counts.set(slug, (counts.get(slug)||0)+1);
}
console.log(`published=${(prods||[]).length} uncategorized=${uncategorized.length}`);
console.log('--- per-category counts ---');
for (const [k,v] of [...counts.entries()].sort((a,b)=>b[1]-a[1])) console.log(`${String(v).padStart(4)}  ${k}`);
