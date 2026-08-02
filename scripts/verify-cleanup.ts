import 'dotenv/config';
import { getSupabaseAdmin } from '../server/lib/supabase';

async function main() {
  const sb = await getSupabaseAdmin();
  const { data } = await sb
    .from('product_reviews')
    .select('product_name, price, key_features')
    .eq('product_name', 'Quick Fix Peptides Eye Cream')
    .maybeSingle();
  console.log('Quick Fix:', JSON.stringify(data).slice(0, 400));
  const { data: missing } = await sb.from('product_reviews').select('id').eq('status', 'published').is('seo_title', null);
  console.log('missing seo_title:', (missing || []).length);
}
main();
