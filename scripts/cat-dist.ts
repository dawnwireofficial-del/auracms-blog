import 'dotenv/config';
import { getSupabase } from '../server/lib/supabase';

(async () => {
  const sb = await getSupabase();
  const { data: cats } = await sb.from('categories').select('id, name').limit(100);
  const catMap: Record<string, string> = {};
  for (const c of (cats || []) as any[]) catMap[c.id] = c.name;
  const { data: prods } = await sb.from('product_reviews').select('category_id, status').limit(1000);
  const dist: Record<string, number> = {};
  let uncat = 0;
  let published = 0;
  for (const p of (prods || []) as any[]) {
    if (p.status === 'published') published++;
    const name = catMap[p.category_id] || 'UNCATEGORIZED';
    if (name === 'UNCATEGORIZED') uncat++;
    dist[name] = (dist[name] || 0) + 1;
  }
  console.log(`total=${(prods || []).length} published=${published} uncategorized=${uncat}`);
  for (const [name, count] of Object.entries(dist).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${name}: ${count}`);
  }
})();
