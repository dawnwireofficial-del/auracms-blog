import 'dotenv/config';
import { getSupabaseAdmin } from '../server/lib/supabase';
import { autoProcessProduct } from '../server/auto-import';

async function main() {
  const sb = await getSupabaseAdmin();
  const limit = Number(process.argv[2]) || 100;
  const { data } = await sb
    .from('product_reviews')
    .select('id, product_name, seo_title, seo_description')
    .eq('status', 'published')
    .is('seo_title', null)
    .limit(limit);
  const rows = (data || []) as any[];
  console.log(`Products missing seo_title: ${rows.length} (processing up to ${limit})`);
  let ok = 0, fail = 0;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    try {
      const res = await autoProcessProduct(r.id);
      const changes = res?.changes || res || [];
      ok++;
      console.log(`[${i + 1}/${rows.length}] OK ${r.product_name.slice(0, 55)} -> ${JSON.stringify(changes).slice(0, 80)}`);
    } catch (e: any) {
      fail++;
      console.log(`[${i + 1}/${rows.length}] ERR ${r.product_name.slice(0, 55)}: ${e.message}`);
    }
    await new Promise((s) => setTimeout(s, 1500));
  }
  console.log(`\nDONE ok=${ok} fail=${fail}`);
}
main().catch((e) => { console.error('FATAL', e); process.exit(1); });
