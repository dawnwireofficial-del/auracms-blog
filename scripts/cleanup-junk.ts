import 'dotenv/config';
import { getSupabaseAdmin } from '../server/lib/supabase';

async function main() {
  const sb = await getSupabaseAdmin();
  const { data } = await sb.from('product_reviews').select('id, product_name, key_features, price').limit(1000);
  const rows = (data || []) as any[];
  let cleanedFeatures = 0;
  let fixedPrice = 0;
  for (const r of rows) {
    let changed = false;
    const kf = Array.isArray(r.key_features) ? r.key_features : [];
    const filtered = kf
      .filter((f: string) => !/Image Unavailable|Image not available/i.test(f))
      .map((f: string) => f.replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    if (filtered.length !== kf.length) {
      changed = true;
      cleanedFeatures++;
    }
    let price = r.price;
    if (price && Number(price) > 2000) {
      price = null;
      changed = true;
      fixedPrice++;
    }
    if (changed) {
      const payload: any = {};
      if (filtered.length !== kf.length) payload.key_features = filtered;
      if (price === null) payload.price = null;
      await sb.from('product_reviews').update(payload).eq('id', r.id);
    }
  }
  console.log('cleaned key_features rows:', cleanedFeatures, '| nulled suspicious prices (>$2000):', fixedPrice);
}
main().catch((e) => { console.error('FATAL', e); process.exit(1); });
